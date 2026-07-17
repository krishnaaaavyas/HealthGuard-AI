import { HealthContext, HealthModuleResult, TestRecommendation } from "./schemas-v2.js";
import { RiskService } from "../services/risk.service.js";

export interface HealthModule {
  moduleId: string;
  version: string;
  status: "available" | "disabled" | "unavailable";
  requiredInputs: string[];
  optionalInputs: string[];
  supportedLabCodes: string[];
  isEligible(context: HealthContext): boolean;
  evaluate(context: HealthContext): Promise<HealthModuleResult>;
  explain(result: HealthModuleResult): string;
  recommendTests(context: HealthContext): TestRecommendation[];
}

export const diseaseModuleRegistry: Record<string, HealthModule> = {
  diabetes: {
    moduleId: "diabetes",
    version: "2.0.0",
    status: "unavailable",
    requiredInputs: ["age", "gender"],
    optionalInputs: ["heightCm", "weightKg", "fastingBloodSugar"],
    supportedLabCodes: ["HbA1c"],
    isEligible: (context: HealthContext) => {
      return Boolean(context.assessment && context.assessment.age && context.assessment.gender);
    },
    evaluate: async (context: HealthContext): Promise<HealthModuleResult> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";

      try {
        const response = await fetch(`${fastApiUrl}/v1/modules/diabetes/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(context),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`FastAPI returned status ${response.status}`);
        }

        const data = await response.json();
        return data as HealthModuleResult;
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn(
          "FastAPI diabetes evaluation failed or timed out. Falling back to V1 legacy clinical calculator. Error:",
          err.message || String(err),
        );

        // Execute Legacy Fallback
        const assessment = context.assessment;
        const legacyProfile: any = {
          age: assessment.age,
          gender: assessment.gender,
          heightCm: assessment.heightCm,
          weightKg: assessment.weightKg,
          smoking: assessment.smoking,
          exercise: assessment.exercise,
          familyHistory: assessment.familyHistory,
          symptoms: assessment.symptoms,
          alcohol: assessment.alcohol,
          sleepHours: assessment.sleepHours,
          systolicBP: assessment.systolicBP,
          diastolicBP: assessment.diastolicBP,
          heartRate: assessment.heartRate,
          fastingBloodSugar: assessment.fastingBloodSugar || 90,
        };

        const bmi =
          assessment.heightCm > 0 ? assessment.weightKg / (assessment.heightCm / 100) ** 2 : 22;
        const legacyResult = RiskService.calculateDiabetesRisk(legacyProfile, bmi);

        let riskTier: "lower" | "moderate" | "elevated" = "lower";
        if (legacyResult.level === "Moderate") riskTier = "moderate";
        if (legacyResult.level === "High") riskTier = "elevated";

        return {
          moduleId: "diabetes",
          moduleVersion: "1.0.0-legacy",
          resultType: "risk-tier",
          status: "unavailable",
          score: legacyResult.risk,
          riskTier,
          evidenceCompleteness: 0.5,
          confidenceLevel: "preliminary",
          experimentalModelUsed: false,
          topContributors: legacyResult.factors.map((f) => ({
            factorId: f.name.toLowerCase().includes("bmi") ? "bmi" : "demographics",
            name: f.name,
            impactValue: f.impact,
            description: f.name,
          })),
          protectiveFactors: [],
          missingInputs: ["bloodSugarHbA1c"],
          recommendedActions: ["Follow basic clinical nutrition advice and monitor progress."],
          recommendedTests: [],
          safetyFlags: [],
        };
      }
    },
    explain: (result: HealthModuleResult) => {
      return `Diabetes Risk evaluated using engine version ${result.moduleVersion}. Status: ${result.status}`;
    },
    recommendTests: (_context: HealthContext) => {
      return [];
    },
  },

  hypertension: createPlaceholderModule(
    "hypertension",
    ["age", "gender", "systolicBP", "diastolicBP"],
    [],
    [],
  ),
  cardiovascular: createPlaceholderModule(
    "cardiovascular",
    ["age", "gender", "systolicBP", "fastingBloodSugar"],
    ["smoking"],
    ["totalCholesterol", "hdlCholesterol", "ldlCholesterol", "triglycerides"],
  ),
  kidney: createPlaceholderModule("kidney", ["age", "gender"], [], []),
  anaemia: createPlaceholderModule("anaemia", ["age", "gender"], [], []),
  thyroid: createPlaceholderModule("thyroid", ["age", "gender"], [], ["thyroidTSH"]),
};

function createPlaceholderModule(
  moduleId: string,
  requiredInputs: string[] = ["age", "gender"],
  optionalInputs: string[] = [],
  supportedLabCodes: string[] = [],
): HealthModule {
  return {
    moduleId,
    version: "2.0.0",
    status: "unavailable",
    requiredInputs,
    optionalInputs,
    supportedLabCodes,
    isEligible: (context: HealthContext) => {
      return Boolean(context.assessment && context.assessment.age && context.assessment.gender);
    },
    evaluate: async (context: HealthContext): Promise<HealthModuleResult> => {
      return {
        moduleId,
        moduleVersion: "2.0.0",
        resultType: moduleId === "cardiovascular" ? "risk-score" : "risk-tier",
        status: "unavailable",
        evidenceCompleteness: 0,
        confidenceLevel: "insufficient",
        topContributors: [],
        protectiveFactors: [],
        missingInputs: requiredInputs.filter((input) => !(input in context.assessment)),
        recommendedActions: [],
        recommendedTests: [],
        safetyFlags: [],
      };
    },
    explain: (result: HealthModuleResult) => {
      return `Module ${result.moduleId} (v${result.moduleVersion}) is currently unavailable.`;
    },
    recommendTests: (_context: HealthContext) => {
      return [];
    },
  };
}
export default diseaseModuleRegistry;
