import { describe, it, expect } from "vitest";
import { readStoredResultCompatibility } from "./health-store";
import * as fs from "fs";
import * as path from "path";

describe("Frontend Compatibility & Isolation Tests", () => {
  it("should parse legacy results containing mlRisk safely and preserve V1 risks", () => {
    const rawLegacyResult = {
      overallScore: 45,
      overallRisk: "Moderate",
      bmi: 26.2,
      risk: {
        diabetes: 18,
        heartDisease: 10,
        hypertension: 25,
      },
      mlRisk: {
        mlRiskCategory: "moderate",
        confidence: 85,
        supportingFactors: ["High BMI", "Sedentary"],
        modelVersion: "ml-risk-v1",
        explanation: "This is an experimental V2 explanation that should be ignored.",
      },
    };

    const parsed = readStoredResultCompatibility(rawLegacyResult);

    expect(parsed).not.toBeNull();
    expect(parsed!.overallScore).toBe(45);
    expect(parsed!.overallRisk).toBe("Moderate");
    expect(parsed!.bmi).toBe(26.2);

    // Verify clinical V1 risk inputs are fully preserved
    expect(parsed!.risk.diabetes).toBe(18);
    expect(parsed!.risk.heartDisease).toBe(10);
    expect(parsed!.risk.hypertension).toBe(25);
  });

  it("should verify that the dashboard component does not reference or render ML risk sections", () => {
    const dashboardPath = path.resolve(__dirname, "../routes/_app.dashboard.lazy.tsx");
    const content = fs.readFileSync(dashboardPath, "utf-8");

    // Assert that the dashboard UI does not try to render an ML risk card or lookup mlRisk properties
    expect(content).not.toContain("result.mlRisk");
    expect(content).not.toContain("mlRiskCategory");
    expect(content).not.toContain("mlDisclaimer");
  });
});
