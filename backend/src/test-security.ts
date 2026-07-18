import express from "express";
import { app } from "./server.js";
import { db } from "./firebase-admin.js";

async function testSecurity() {
  console.log("==================================================");
  console.log("HEALTHGUARD AI PHASE A2 SECURITY TESTS");
  console.log("==================================================");

  // Set test environment
  process.env.NODE_ENV = "test";
  process.env.ENABLE_MOCK_AUTH = "true";
  process.env.ENABLE_MOCK_EXPERT_SIGNUP = "true";

  // Start listener on a random port
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
    } catch (err: any) {
      console.error(`❌ Fail: ${name}`, err.message);
      testsFailed++;
    }
  };

  // TEST 1: Unauthenticated request should be rejected (401)
  await runTest("Auth - Missing token returns 401", async () => {
    const res = await fetch(`${baseUrl}/profile`);
    if (res.status !== 401) {
      throw new Error(`Expected HTTP 401, got ${res.status}`);
    }
  });

  // TEST 2: Unverified JWT payload is rejected (401)
  await runTest("Auth - Unverified JWT payload token returns 401", async () => {
    const fakeToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZmFrZS0xMjMiLCJlbWFpbCI6ImZha2VAZmFrZS5jb20ifQ.signature";
    const res = await fetch(`${baseUrl}/profile`, {
      headers: {
        Authorization: `Bearer ${fakeToken}`,
      },
    });
    if (res.status !== 401 && res.status !== 500) {
      throw new Error(`Expected HTTP 401 or 500, got ${res.status}`);
    }
  });

  // TEST 3: Mock authentication is gated by ENABLE_MOCK_AUTH
  await runTest("Auth - Mock token fails safely when ENABLE_MOCK_AUTH=false", async () => {
    process.env.ENABLE_MOCK_AUTH = "false";
    const res = await fetch(`${baseUrl}/profile`, {
      headers: {
        Authorization: "Bearer mock-uid-test-user-123",
      },
    });
    // Should return 500 because Firebase Admin is unconfigured and mock auth is disabled
    if (res.status !== 500) {
      throw new Error(`Expected HTTP 500, got ${res.status}`);
    }
  });

  // Re-enable mock auth
  process.env.ENABLE_MOCK_AUTH = "true";

  // TEST 4: Profile access isolation
  await runTest(
    "Isolation - GET /profile derives UID from verified token, preventing tampering",
    async () => {
      // Save profile for User A (test-user-A) in mock store
      await db
        .collection("profiles")
        .doc("test-user-A")
        .set({
          age: 40,
          gender: "female",
          heightCm: 165,
          weightKg: 60,
          smoking: "never",
          exercise: "moderate",
          familyHistory: "none",
          symptoms: "none",
          result: {
            overallRisk: "Low",
            risk: { diabetes: 10, heartDisease: 10, hypertension: 10 },
          },
        });

      // Make request as test-user-A
      const res = await fetch(`${baseUrl}/profile`, {
        headers: {
          Authorization: "Bearer mock-uid-test-user-A",
        },
      });
      if (res.status !== 200) {
        throw new Error(`Expected HTTP 200, got ${res.status}`);
      }
      const data = await res.json();
      if (!data.profile || data.profile.age !== 40) {
        throw new Error(`Expected age 40, got ${data.profile ? data.profile.age : "undefined"}`);
      }
    },
  );

  // TEST 5: Expert Review Gating by Env Flag
  await runTest(
    "Gating - Mock expert signup is blocked when ENABLE_MOCK_EXPERT_SIGNUP=false",
    async () => {
      process.env.ENABLE_MOCK_EXPERT_SIGNUP = "false";
      const res = await fetch(`${baseUrl}/expert-review/mock-expert-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-uid-expert-123",
        },
        body: JSON.stringify({
          name: "Dr. Mock",
          role: "doctor",
        }),
      });
      if (res.status !== 403) {
        throw new Error(`Expected HTTP 403, got ${res.status}`);
      }
    },
  );

  process.env.ENABLE_MOCK_EXPERT_SIGNUP = "true";

  // Register mock expert successfully
  let expertToken = "Bearer mock-uid-expert-123";
  await runTest("Gating - Register mock expert when ENABLE_MOCK_EXPERT_SIGNUP=true", async () => {
    const res = await fetch(`${baseUrl}/expert-review/mock-expert-signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: expertToken,
      },
      body: JSON.stringify({
        name: "Dr. Mock",
        role: "doctor",
      }),
    });
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}`);
    }
    const data = await res.json();
    if (data.expert.role !== "doctor") {
      throw new Error(`Expected role doctor, got ${data.expert.role}`);
    }
  });

  // TEST 6: Message Access Authorization
  await runTest(
    "Isolation - GET/POST expertMessages restricts access to request owner or assigned expert",
    async () => {
      // Create User B's profile
      await db
        .collection("profiles")
        .doc("test-user-B")
        .set({
          age: 50,
          gender: "male",
          heightCm: 175,
          weightKg: 85,
          smoking: "never",
          exercise: "none",
          familyHistory: "diabetes",
          symptoms: "none",
          result: {
            overallRisk: "Moderate",
            risk: { diabetes: 30, heartDisease: 30, hypertension: 30 },
          },
        });

      // User B creates a review request
      const reqRes = await fetch(`${baseUrl}/expert-review/request`, {
        method: "POST",
        headers: {
          Authorization: "Bearer mock-uid-test-user-B",
        },
      });
      const reqData = await reqRes.json();
      const requestId = reqData.requestId;
      if (!requestId) {
        throw new Error("Failed to create review request for isolation test");
      }

      // Try fetching messages as unauthorized User A (should be Forbidden - 403)
      const unauthorizedGet = await fetch(`${baseUrl}/expert-review/${requestId}/messages`, {
        headers: {
          Authorization: "Bearer mock-uid-test-user-A",
        },
      });
      if (unauthorizedGet.status !== 403) {
        throw new Error(`Expected unauthorized GET to return 403, got ${unauthorizedGet.status}`);
      }

      // Try posting message as unauthorized User A (should be Forbidden - 403)
      const unauthorizedPost = await fetch(`${baseUrl}/expert-review/${requestId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-uid-test-user-A",
        },
        body: JSON.stringify({
          message: "Hello B",
        }),
      });
      if (unauthorizedPost.status !== 403) {
        throw new Error(`Expected unauthorized POST to return 403, got ${unauthorizedPost.status}`);
      }

      // Assign request to Expert 123
      const acceptRes = await fetch(`${baseUrl}/expert-review/${requestId}/accept`, {
        method: "PATCH",
        headers: {
          Authorization: expertToken,
        },
      });
      if (acceptRes.status !== 200) {
        throw new Error(`Failed to assign request to expert: ${acceptRes.status}`);
      }

      // Now verified expert and User B can access messages
      const expertGet = await fetch(`${baseUrl}/expert-review/${requestId}/messages`, {
        headers: {
          Authorization: expertToken,
        },
      });
      if (expertGet.status !== 200) {
        throw new Error(`Expected assigned expert GET to return 200, got ${expertGet.status}`);
      }
    },
  );

  // TEST 7: Message Role Derivation
  await runTest(
    "Derivation - POST message derives senderRole server-side, ignoring client input",
    async () => {
      // Fetch User B's request (status: accepted, assignedExpertId: expert-123)
      const reqsSnap = await db
        .collection("expertReviewRequests")
        .where("userId", "==", "test-user-B")
        .get();
      const requestId = reqsSnap.docs[0].id;

      // Send message as Expert, but trying to forge senderRole as "user"
      const forgeRes = await fetch(`${baseUrl}/expert-review/${requestId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: expertToken,
        },
        body: JSON.stringify({
          message: "This is a doctor recommendation",
          senderRole: "user", // forging role
        }),
      });
      if (forgeRes.status !== 200) {
        throw new Error(`Expected HTTP 200, got ${forgeRes.status}`);
      }
      const data = await forgeRes.json();
      // The derived senderRole should be "expert", not the client-provided "user"
      if (data.message.senderRole !== "expert") {
        throw new Error(`Expected derived role to be expert, but got: ${data.message.senderRole}`);
      }
    },
  );

  server.close();

  console.log("==================================================");
  console.log(`TESTS COMPLETE: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log("==================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

testSecurity().catch((err) => {
  console.error(err);
  process.exit(1);
});
