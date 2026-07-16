import { HealthModuleResult } from "./schemas-v2";
import { StoredResult } from "./health-store";

export function adaptV2ToLegacy(v2Results: HealthModuleResult[], bmi: number): StoredResult {
  const diabetesModule = v2Results.find((r) => r.moduleId === "diabetes");
  const cvModule = v2Results.find((r) => r.moduleId === "cardiovascular");
  const hyperModule = v2Results.find((r) => r.moduleId === "hypertension");

  const getRiskScore = (result?: HealthModuleResult): number => {
    if (!result) return 15;
    if (result.status === "completed" && typeof result.score === "number") {
      return result.score;
    }
    if (result.riskTier === "elevated") return 75;
    if (result.riskTier === "moderate") return 45;
    return 15;
  };

  const diabetesRisk = getRiskScore(diabetesModule);
  const heartRisk = getRiskScore(cvModule);
  const hyperRisk = getRiskScore(hyperModule);

  const getExplanation = (result?: HealthModuleResult): string => {
    if (!result) return "Module data is currently unavailable.";
    if (result.status === "unavailable") return "V2 Module currently unavailable.";
    if (result.status === "insufficient-data") return "Insufficient data to calculate risk.";
    if (result.status === "failed") return "Evaluation module failed.";
    return result.topContributors && result.topContributors.length > 0
      ? `Main signals: ${result.topContributors.map((c) => `${c.name} (${c.impactValue > 0 ? "+" : ""}${c.impactValue})`).join(", ")}.`
      : "Evaluation complete.";
  };

  const diabetesRationale = getExplanation(diabetesModule);
  const heartRationale = getExplanation(cvModule);
  const hyperRationale = getExplanation(hyperModule);

  const maxRisk = Math.max(diabetesRisk, heartRisk, hyperRisk);
  const overallScore = Math.round(maxRisk * 0.8);
  const overallRisk = overallScore < 33 ? "Low" : overallScore < 66 ? "Moderate" : "High";

  const allContributors = v2Results.flatMap((r) => r.topContributors || []);
  const factors = allContributors.map((c) => ({
    name: c.name,
    impact: c.impactValue,
  }));

  const recommendedActions = v2Results.flatMap((r) => r.recommendedActions || []);
  const actionPriorities = recommendedActions.map((action, idx) => ({
    action,
    estimatedImpact: Math.max(10 - idx * 2, 2),
  }));

  const topContributorsText = allContributors.slice(0, 3).map((c) => c.description || c.name);
  const mlRisk = {
    mlRiskCategory: overallRisk.toLowerCase(),
    modelVersion: "ml-risk-v2-adapter",
    confidence: 0.95,
    explanation: `V2 adapter evaluation complete. Overall risk profile categorized as ${overallRisk.toLowerCase()} based on modular evidence integration.`,
    supportingFactors:
      topContributorsText.length > 0
        ? topContributorsText
        : ["Baseline physiological inputs within normal bounds."],
  };

  return {
    overallScore,
    overallRisk,
    bmi,
    risk: {
      diabetes: diabetesRisk,
      heartDisease: heartRisk,
      hypertension: hyperRisk,
    },
    rationale: {
      diabetes: diabetesRationale,
      heartDisease: heartRationale,
      hypertension: hyperRationale,
    },
    dietPlan: "Custom diet guidance will be generated once V2 recommendation engines are active.",
    exercisePlan:
      "Specific exercise routine guidelines will be populated dynamically from V2 engines.",
    preventionTips:
      recommendedActions.length > 0
        ? recommendedActions.join("\n")
        : "Follow general wellness guidelines, limit simple sugars, maintain physical activity, and track daily metrics.",
    factors,
    actionPriorities,
    mlRisk,
    schemaVersion: 2,
    engineVersion: "v2-adapter",
  };
}
