import { HealthModuleResult } from "./schemas-v2";
import { StoredResult } from "./health-store";

export function adaptV2ToLegacy(v2Results: HealthModuleResult[], bmi: number): StoredResult {
  const diabetesModule = v2Results.find(
    (r) => r.moduleId === "diabetes" || r.moduleId === "diabetes-screening",
  );
  const cvModule = v2Results.find((r) => r.moduleId === "cardiovascular");
  const hyperModule = v2Results.find((r) => r.moduleId === "hypertension");

  const getRiskScore = (result?: HealthModuleResult): number | undefined => {
    if (!result) return undefined;
    if (result.status === "completed" && typeof result.score === "number") {
      return result.score;
    }
    return undefined;
  };

  const diabetesRisk = getRiskScore(diabetesModule);
  const heartRisk = getRiskScore(cvModule);
  const hyperRisk = getRiskScore(hyperModule);

  const getExplanation = (result?: HealthModuleResult): string => {
    if (!result) return "Module data is currently unavailable.";
    if (result.status === "model-unavailable" || result.status === "unavailable")
      return "V2 Module currently unavailable.";
    if (result.status === "insufficient-information" || result.status === "insufficient-data")
      return "Insufficient data to calculate risk.";
    if (result.status === "failed") return "Evaluation module failed.";
    return result.topContributors && result.topContributors.length > 0
      ? `Main signals: ${result.topContributors.map((c) => `${c.name} (${c.impactValue > 0 ? "+" : ""}${c.impactValue})`).join(", ")}.`
      : "Evaluation complete.";
  };

  const diabetesRationale = getExplanation(diabetesModule);
  const heartRationale = getExplanation(cvModule);
  const hyperRationale = getExplanation(hyperModule);

  const validRisks = [diabetesRisk, heartRisk, hyperRisk].filter(
    (s): s is number => typeof s === "number",
  );

  const overallScore =
    validRisks.length > 0 ? Math.round(Math.max(...validRisks) * 0.8) : undefined;
  const overallRisk =
    overallScore === undefined
      ? "Unavailable"
      : overallScore < 33
        ? "Low"
        : overallScore < 66
          ? "Moderate"
          : "High";

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

  return {
    overallScore: overallScore ?? 0,
    overallRisk: overallRisk as any,
    bmi,
    risk: {
      diabetes: diabetesRisk as any,
      heartDisease: heartRisk as any,
      hypertension: hyperRisk as any,
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
    schemaVersion: 2,
    engineVersion: "v2-adapter",
  };
}
