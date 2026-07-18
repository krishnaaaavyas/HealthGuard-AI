import { z } from "zod";

export const LabObservationSchema = z.object({
  code: z.string().min(1),
  value: z
    .number()
    .finite()
    .refine((val) => val >= 0, { message: "Biomarker values must be positive" }),
  unit: z.string().min(1),
  observedAt: z.string().datetime(),
  isVerified: z.boolean().default(false),
  verifiedBy: z.string().optional(),
});

export const RiskContributorSchema = z.object({
  factorId: z.string(),
  name: z.string(),
  impactValue: z.number(),
  description: z.string(),
});

export const TestRecommendationSchema = z.object({
  testCode: z.string(),
  testName: z.string(),
  priority: z.enum(["routine", "urgent", "critical"]),
  rationale: z.string(),
});

export const SafetyFlagSchema = z.object({
  flagType: z.enum(["red-flag", "contraindication", "data-anomaly"]),
  moduleId: z.string(),
  message: z.string(),
  clinicalActionRequired: z.boolean().default(false),
});

export const HealthModuleResultSchema = z.object({
  moduleId: z.string(),
  moduleVersion: z.string(),
  resultType: z.enum([
    "screening-signal",
    "measured-status",
    "lab-pattern",
    "screening-awareness",
    "context-only",
    // Retain backward-compatible parsing:
    "risk-score",
    "risk-tier",
    "screening-eligibility",
    "referral-priority",
  ]),
  status: z.enum([
    "completed",
    "insufficient-information",
    "outside-intended-population",
    "conflicting-evidence",
    "measurement-requires-verification",
    "model-unavailable",
    "failed",
    // Retain backward-compatible parsing:
    "insufficient-data",
    "unavailable",
  ]),
  score: z.number().min(0).max(100).optional(),
  riskTier: z.enum(["lower", "moderate", "elevated"]).optional(),
  evidenceCompleteness: z.number().min(0).max(1),
  confidenceLevel: z.enum([
    "insufficient",
    "preliminary",
    "moderately-supported",
    "strongly-supported",
  ]),
  topContributors: z.array(RiskContributorSchema),
  protectiveFactors: z.array(RiskContributorSchema),
  missingInputs: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  recommendedTests: z.array(TestRecommendationSchema),
  safetyFlags: z.array(SafetyFlagSchema),
  experimentalModelUsed: z.boolean().optional(),

  // New V2 fields:
  source: z.enum(["research-model", "clinical-rule", "verified-lab", "regional-dataset"]).optional(),
  evidenceSupport: z.enum(["insufficient", "preliminary", "supported"]).optional(),
  reasonCodes: z.array(z.string()).optional(),
  usedEvidence: z.array(z.string()).optional(),
  missingEvidence: z.array(z.string()).optional(),
  limitations: z.array(z.string()).optional(),
  nextSteps: z.array(z.string()).optional(),
});

export const RegionalContextSchema = z.object({
  language: z.enum(["en", "hi", "gu"]),
  preferredDietaryType: z.enum(["vegetarian", "non-vegetarian", "vegan"]),
  stateOrRegionCode: z.string().max(10).default("IN"),
  customRegionalRules: z.array(z.string()).default([]),
  schemaVersion: z.string().default("2.0.0"),
});

export const HealthContextSchema = z.object({
  userId: z.string(),
  assessment: z.object({
    age: z.number().min(1).max(120),
    gender: z.enum(["male", "female", "other"]),
    heightCm: z.number().min(50).max(260),
    weightKg: z.number().min(10).max(400),
    smoking: z.enum(["never", "former", "current"]),
    exercise: z.enum(["none", "light", "moderate", "active"]),
    familyHistory: z.string().max(500).default(""),
    symptoms: z.string().max(1000).default(""),
    alcohol: z.enum(["never", "occasional", "heavy"]).default("never"),
    sleepHours: z.number().min(2).max(18).default(7),
    systolicBP: z.number().min(70).max(220).optional(),
    diastolicBP: z.number().min(40).max(130).optional(),
    heartRate: z.number().min(30).max(200).optional(),
    fastingBloodSugar: z.number().min(50).max(400).optional(),
    schemaVersion: z.string().default("2.0.0"),
  }),
  labObservations: z.array(LabObservationSchema).default([]),
  regionalContext: RegionalContextSchema,
  schemaVersion: z.string().default("2.0.0"),
});

export type LabObservation = z.infer<typeof LabObservationSchema>;
export type RiskContributor = z.infer<typeof RiskContributorSchema>;
export type TestRecommendation = z.infer<typeof TestRecommendationSchema>;
export type SafetyFlag = z.infer<typeof SafetyFlagSchema>;
export type HealthModuleResult = z.infer<typeof HealthModuleResultSchema>;
export type RegionalContext = z.infer<typeof RegionalContextSchema>;
export type HealthContext = z.infer<typeof HealthContextSchema>;
