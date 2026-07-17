import express from "express";
import { db } from "./firebase-admin.js";
import { AIService } from "./services/ai.service.js";

process.env.NODE_ENV = "test";
const { app } = await import("./server.js");

async function runInvarianceTests() {
  console.log("==================================================");
  console.log("HEALTHGUARD AI V1 INVARIANCE & ISOLATION TESTS");
  console.log("==================================================");

  // 1. Setup interceptor for Gemini API prompts
  let lastInterceptedPrompt = "";
  const originalCallGemini = (AIService as any).callGemini;
  const originalGetApiKey = (AIService as any).getApiKey;

  (AIService as any).getApiKey = () => "mock-gemini-api-key";
  (AIService as any).callGemini = async function (prompt: string, schema?: any, timeout?: number) {
    lastInterceptedPrompt = prompt;
    // Return mock response that conforms to schema
    return JSON.stringify({
      risk: {
        diabetes: 12,
        heartDisease: 18,
        hypertension: 24,
      },
      rationale: {
        diabetes: "Mocked diabetes advice.",
        heartDisease: "Mocked heart advice.",
        hypertension: "Mocked hypertension advice.",
      },
      dietPlan: "Mocked regional diet recommendation.",
      exercisePlan: "Mocked fitness routine.",
      preventionTips: "Mocked clinical prevention tips.",
    });
  };

  // 2. Start Express app on a dynamic port
  process.env.NODE_ENV = "test";
  const server = app.listen(0);
  const address: any = server.address();
  const port = address.port;
  const baseUrl = `http://localhost:${port}/api`;

  let testsPassed = 0;
  let testsFailed = 0;

  const runTest = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`✅ Pass: ${name}`);
      testsPassed++;
    } catch (err) {
      console.error(`❌ Fail: ${name}`, err);
      testsFailed++;
    }
  };

  const testUid = "invariance-test-user-999";
  const authHeader = `Bearer mock-uid-${testUid}`;

  const validProfileData = {
    age: 38,
    gender: "female",
    heightCm: 165,
    weightKg: 58,
    smoking: "never",
    exercise: "active",
    familyHistory: "Cardiovascular history in father.",
    symptoms: "None",
    alcohol: "never",
    diseases: "None",
    language: "en",
  };

  try {
    // TEST 1: POST /api/profile does not save or return mlRisk
    await runTest("POST /api/profile returns no ML fields", async () => {
      const res = await fetch(`${baseUrl}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(validProfileData),
      });

      if (res.status !== 200) {
        throw new Error(`Expected HTTP 200, got ${res.status}`);
      }

      const body: any = await res.json();
      if (!body.success) {
        throw new Error(`Profile save failed: ${JSON.stringify(body)}`);
      }

      // Check saved document in Mock Firestore
      const docSnap = await db.collection("profiles").doc(testUid).get();
      const savedData = docSnap.data();

      if (savedData.result.mlRisk !== undefined) {
        throw new Error(`Saved profile contains mlRisk: ${JSON.stringify(savedData.result)}`);
      }
      if (body.result && body.result.mlRisk !== undefined) {
        throw new Error(`Response payload contains mlRisk: ${JSON.stringify(body)}`);
      }
    });

    // TEST 2: GET /api/dashboard/bootstrap does not return mlRisk
    await runTest("GET /api/dashboard/bootstrap returns no ML fields", async () => {
      const res = await fetch(`${baseUrl}/dashboard/bootstrap`, {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });

      if (res.status !== 200) {
        throw new Error(`Expected HTTP 200, got ${res.status}`);
      }

      const body: any = await res.json();
      if (!body.success) {
        throw new Error(`Bootstrap failed: ${JSON.stringify(body)}`);
      }

      if (body.result && body.result.mlRisk !== undefined) {
        throw new Error(`Bootstrap result contains mlRisk: ${JSON.stringify(body.result)}`);
      }
    });

    // TEST 3: POST /api/risk/calculate does not return mlRisk
    await runTest("POST /api/risk/calculate returns no ML fields", async () => {
      const res = await fetch(`${baseUrl}/risk/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(validProfileData),
      });

      if (res.status !== 200) {
        throw new Error(`Expected HTTP 200, got ${res.status}`);
      }

      const body: any = await res.json();
      if (!body.success) {
        throw new Error(`Calculation failed: ${JSON.stringify(body)}`);
      }

      if (body.analysis && (body.analysis.mlRisk !== undefined || body.analysis.mlRisk !== null)) {
        // Assert that the returned analysis doesn't leak mlRisk
        if (body.analysis.mlRisk !== null && body.analysis.mlRisk !== undefined) {
          throw new Error(`Calculate analysis contains mlRisk: ${JSON.stringify(body.analysis)}`);
        }
      }
    });

    // TEST 4: POST /api/risk/advice intercepts Gemini prompt & returns no ML fields
    await runTest("POST /api/risk/advice excludes ML inputs from prompt", async () => {
      lastInterceptedPrompt = "";
      const res = await fetch(`${baseUrl}/risk/advice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(validProfileData),
      });

      if (res.status !== 200) {
        throw new Error(`Expected HTTP 200, got ${res.status}`);
      }

      const body: any = await res.json();
      if (!body.success) {
        throw new Error(`Advice failed: ${JSON.stringify(body)}`);
      }

      // Assert prompt formatting
      if (lastInterceptedPrompt.includes("Machine Learning Risk Classification")) {
        throw new Error("Prompt contained disallowed phrase 'Machine Learning Risk Classification'");
      }
      if (lastInterceptedPrompt.includes("ML Risk Category")) {
        throw new Error("Prompt contained disallowed phrase 'ML Risk Category'");
      }
      if (lastInterceptedPrompt.includes("Model Confidence")) {
        throw new Error("Prompt contained disallowed phrase 'Model Confidence'");
      }
      if (lastInterceptedPrompt.includes("Model Version")) {
        throw new Error("Prompt contained disallowed phrase 'Model Version'");
      }

      // Verify V1 structures remain in prompt
      if (!lastInterceptedPrompt.includes("Type 2 Diabetes Risk:")) {
        throw new Error("Prompt is missing Type 2 Diabetes clinical input");
      }
      if (!lastInterceptedPrompt.includes("Heart Disease/CVD Risk:")) {
        throw new Error("Prompt is missing Cardiovascular clinical input");
      }
    });

    // TEST 5: Backward compatibility - ignores existing mlRisk in database
    await runTest("Backward compatibility - bootstrap ignores existing mlRisk fields", async () => {
      const legacyUid = "legacy-user-111";
      const legacyAuthHeader = `Bearer mock-uid-${legacyUid}`;

      // Write mock record with legacy mlRisk direct into Mock Firestore
      await db.collection("profiles").doc(legacyUid).set({
        age: 40,
        gender: "male",
        heightCm: 170,
        weightKg: 70,
        smoking: "never",
        exercise: "moderate",
        familyHistory: "",
        symptoms: "",
        result: {
          overallScore: 30,
          overallRisk: "Moderate",
          risk: { diabetes: 20, heartDisease: 25, hypertension: 30 },
          rationale: "Leg rationales",
          dietPlan: "",
          exercisePlan: "",
          preventionTips: "",
          mlRisk: {
            mlRiskCategory: "moderate",
            confidence: 90,
            modelVersion: "ml-risk-v1",
            explanation: "Legacy text.",
          },
        },
      });

      // Call bootstrap endpoint
      const res = await fetch(`${baseUrl}/dashboard/bootstrap`, {
        method: "GET",
        headers: {
          Authorization: legacyAuthHeader,
        },
      });

      const body: any = await res.json();
      if (!body.success) {
        throw new Error(`Bootstrap fetch failed for legacy user: ${JSON.stringify(body)}`);
      }

      // Assert that mlRisk is not returned to the bootstrap response
      if (body.result && body.result.mlRisk !== undefined && body.result.mlRisk !== null) {
        throw new Error(`Exposed legacy mlRisk back to client: ${JSON.stringify(body.result.mlRisk)}`);
      }
    });

  } finally {
    // Restore original methods
    (AIService as any).callGemini = originalCallGemini;
    (AIService as any).getApiKey = originalGetApiKey;
    server.close();
  }

  console.log("==================================================");
  console.log(`TESTS COMPLETE: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log("==================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runInvarianceTests();
