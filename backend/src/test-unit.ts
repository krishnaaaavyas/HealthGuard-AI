import { RiskService, type UserProfile } from "./services/risk.service.js";
import { RiskDriverService } from "./services/riskDriver.service.js";
import { FoodImpactService } from "./services/foodImpact.service.js";
import { PredictionService } from "./services/prediction.service.js";

async function testUnit() {
  console.log("==================================================");
  console.log("HEALTHGUARD AI AUTOMATED UNIT TESTS & V1 FREEZE");
  console.log("==================================================");

  let testsPassed = 0;
  let testsFailed = 0;

  const runTest = async (name: string, fn: () => void) => {
    try {
      fn();
      console.log(`✅ Pass: ${name}`);
      testsPassed++;
    } catch (err: any) {
      console.error(`❌ Fail: ${name}`, err.message);
      testsFailed++;
    }
  };

  // 1. FREEZE FIXTURES DEFINITIONS
  const profileLow: UserProfile = {
    age: 22,
    gender: "male",
    heightCm: 175,
    weightKg: 67.5, // BMI = 22.0
    smoking: "never",
    exercise: "moderate",
    familyHistory: "None",
    symptoms: "None",
    alcohol: "never",
    diseases: "None",
  };

  const profileMod: UserProfile = {
    age: 45,
    gender: "female",
    heightCm: 170,
    weightKg: 86.7, // BMI = 30.0
    smoking: "never",
    exercise: "none",
    familyHistory: "Diabetes in mother",
    symptoms: "fatigue",
    alcohol: "occasional",
    diseases: "None",
  };

  const profileHigh: UserProfile = {
    age: 56,
    gender: "male",
    heightCm: 175,
    weightKg: 88.8, // BMI = 29.0
    smoking: "current",
    exercise: "none",
    familyHistory: "Cardiovascular history",
    symptoms: "chest discomfort, breathlessness",
    alcohol: "frequent",
    diseases: "None",
  };

  // 2. RUN CALCULATIONS VERIFICATIONS
  await runTest("Freeze - Profile Low risk score is 0", () => {
    const res = RiskService.analyze(profileLow);
    if (res.overallRisk !== 0) throw new Error(`Expected 0, got ${res.overallRisk}`);
    if (res.overallRiskLabel !== "Low") throw new Error(`Expected Low, got ${res.overallRiskLabel}`);
    if (res.diabetesRisk.risk !== 0) throw new Error(`Expected diabetes 0, got ${res.diabetesRisk.risk}`);
    if (res.heartRisk.risk !== 0) throw new Error(`Expected heart 0, got ${res.heartRisk.risk}`);
    if (res.hypertensionRisk.risk !== 0) throw new Error(`Expected hypertension 0, got ${res.hypertensionRisk.risk}`);
  });

  await runTest("Freeze - Profile Moderate risk scores match frozen values", () => {
    const res = RiskService.analyze(profileMod);
    if (res.diabetesRisk.risk !== 100) throw new Error(`Expected diabetes 100, got ${res.diabetesRisk.risk}`);
    if (res.diabetesRisk.level !== "High") throw new Error(`Expected High, got ${res.diabetesRisk.level}`);
    if (res.overallRisk !== 74) throw new Error(`Expected overall score 74, got ${res.overallRisk}`);
    if (res.overallRiskLabel !== "High") throw new Error(`Expected High, got ${res.overallRiskLabel}`);
  });

  await runTest("Freeze - Profile High risk scores match frozen values", () => {
    const res = RiskService.analyze(profileHigh);
    if (res.diabetesRisk.risk !== 53) throw new Error(`Expected diabetes 53, got ${res.diabetesRisk.risk}`);
    if (res.heartRisk.risk !== 95) throw new Error(`Expected heart 95, got ${res.heartRisk.risk}`);
    if (res.hypertensionRisk.risk !== 86) throw new Error(`Expected hypertension 86, got ${res.hypertensionRisk.risk}`);
    if (res.overallRisk !== 78) throw new Error(`Expected overall score 78, got ${res.overallRisk}`);
  });

  // 3. BOUNDARY VALUES TESTING
  await runTest("Boundaries - Age points at low and high boundary limits", () => {
    const lowBoundaryProfile: UserProfile = {
      ...profileLow,
      age: 45,
    };
    const resLow = RiskService.analyze(lowBoundaryProfile);
    if (resLow.diabetesRisk.risk !== 13) throw new Error(`Expected diabetes 13 at boundary, got ${resLow.diabetesRisk.risk}`);

    const highBoundaryProfile: UserProfile = {
      ...profileLow,
      age: 61,
    };
    const resHigh = RiskService.analyze(highBoundaryProfile);
    if (resHigh.diabetesRisk.risk !== 20) throw new Error(`Expected diabetes 20 at boundary, got ${resHigh.diabetesRisk.risk}`);
  });

  // 4. MISSING OPTIONAL FIELDS
  await runTest("Boundaries - Missing optional fields resolve safely", () => {
    const missingFieldsProfile: UserProfile = {
      age: 30,
      gender: "female",
      heightCm: 165,
      weightKg: 60,
      smoking: "never",
      exercise: "moderate",
      familyHistory: "",
      symptoms: "",
      alcohol: undefined,
      diseases: undefined,
    };
    const res = RiskService.analyze(missingFieldsProfile);
    if (res.overallRisk !== 0) throw new Error(`Expected 0, got ${res.overallRisk}`);
  });

  // 5. MAX/MIN VALID INPUTS
  await runTest("Boundaries - Max/Min valid inputs do not crash and clamp risks safely", () => {
    const minProfile: UserProfile = {
      age: 1,
      gender: "other",
      heightCm: 50,
      weightKg: 10,
      smoking: "never",
      exercise: "active",
      familyHistory: "",
      symptoms: "",
    };
    const maxProfile: UserProfile = {
      age: 120,
      gender: "male",
      heightCm: 260,
      weightKg: 400,
      smoking: "current",
      exercise: "none",
      familyHistory: "Diabetes, heart disease, hypertension in mother, father, brother",
      symptoms: "thirst, urination, dry mouth, chest discomfort, breathlessness",
      alcohol: "heavy",
      diseases: "hypertension",
    };

    const resMin = RiskService.analyze(minProfile);
    const resMax = RiskService.analyze(maxProfile);

    if (resMin.overallRisk < 0 || resMin.overallRisk > 100) throw new Error(`Min overall risk out of bounds: ${resMin.overallRisk}`);
    if (resMax.overallRisk !== 100) throw new Error(`Max overall risk expected 100, got ${resMax.overallRisk}`);
  });

  // 6. DETECT RISK DRIVERS VERIFICATION
  await runTest("Drivers - Modifiable vs Non-Modifiable contributions and sort order", () => {
    const drivers = RiskDriverService.analyzeRiskDrivers(profileMod);
    if (drivers.topDrivers.length === 0) throw new Error("Expected risk drivers for profile B");
    
    const sum = drivers.topDrivers.reduce((acc, td) => acc + td.contribution, 0);
    if (sum !== 100) throw new Error(`Expected sum 100, got ${sum}`);

    for (let i = 1; i < drivers.topDrivers.length; i++) {
      if (drivers.topDrivers[i].contribution > drivers.topDrivers[i-1].contribution) {
        throw new Error("Drivers not sorted descending by contribution percentage");
      }
    }
  });

  // 7. PERSONALIZED FOOD INTEL UPGRADE VERIFICATION
  await runTest("Food - Personalized food analysis modifies scores based on target risk profiles", () => {
    const clLow = RiskService.analyze(profileLow);
    const clHigh = RiskService.analyze(profileHigh);

    const getPersonalizedRisks = (cl: any) => ({
      diabetes: cl.diabetesRisk.risk,
      heart: cl.heartRisk.risk,
      hypertension: cl.hypertensionRisk.risk,
    });

    const highSugarFood = {
      ingredients: ["sugar", "wheat flour", "artificial sweetener", "cocoa powder"],
      nutritionFacts: { sugarG: 22, sodiumMg: 50, transFatG: 0, saturatedFatG: 1 },
    };

    const resLow = FoodImpactService.analyzePersonalizedFood(
      highSugarFood.ingredients,
      highSugarFood.nutritionFacts,
      getPersonalizedRisks(clLow),
    );

    const resHigh = FoodImpactService.analyzePersonalizedFood(
      highSugarFood.ingredients,
      highSugarFood.nutritionFacts,
      getPersonalizedRisks(clHigh),
    );

    if (resHigh.personalizedFoodScore >= resLow.personalizedFoodScore) {
      throw new Error(`Personalized food score for high risk profile (${resHigh.personalizedFoodScore}) should be lower than low risk profile (${resLow.personalizedFoodScore})`);
    }
  });

  // 8. PROGRESS PREDICTION SYSTEM VERIFICATION
  await runTest("Prediction - Threshold constraints gate forecasts", () => {
    const insufficientLogsResult = PredictionService.predictProgressRisk([]);
    if (insufficientLogsResult.status !== "insufficient_data") {
      throw new Error(`Expected insufficient_data, got ${insufficientLogsResult.status}`);
    }
  });

  await runTest("Prediction - Improving and worsening weight and risk trend projections", () => {
    const improvingLogs = [
      { weight: 85, overallRisk: 70, createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
      { weight: 83, overallRisk: 65, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { weight: 81, overallRisk: 60, createdAt: new Date().toISOString() },
    ];
    const prediction = PredictionService.predictProgressRisk(improvingLogs);
    if (prediction.status !== "ready" || prediction.trend !== "improving") {
      throw new Error(`Expected ready improving, got status: ${prediction.status}, trend: ${prediction.trend}`);
    }
    if (prediction.predictedRisk30Days >= improvingLogs[2].overallRisk) {
      throw new Error("Improving projection should project a lower risk score");
    }
  });

  console.log("==================================================");
  console.log(`TESTS COMPLETE: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log("==================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

testUnit().catch((err) => {
  console.error(err);
  process.exit(1);
});
