import { z } from "zod";

// V2 Health Assessment Schema (extending demo physiological parameters)
export const HealthAssessmentV2Schema = z.object({
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
  systolicBP: z.number().min(70).max(220).default(120),
  diastolicBP: z.number().min(40).max(130).default(80),
  heartRate: z.number().min(30).max(200).default(72),
  fastingBloodSugar: z.number().min(50).max(400).default(90),
  schemaVersion: z.string().default("2.0"),
});

// V2 Laboratory Reports & Biomarkers Schema
export const LabReportV2Schema = z.object({
  reportId: z.string(),
  uploadDate: z.string().datetime(),
  bloodSugarHbA1c: z.number().min(3).max(18).optional(),
  totalCholesterol: z.number().min(80).max(500).optional(),
  hdlCholesterol: z.number().min(10).max(120).optional(),
  ldlCholesterol: z.number().min(30).max(300).optional(),
  triglycerides: z.number().min(30).max(1000).optional(),
  vitaminD3: z.number().min(5).max(150).optional(),
  vitaminB12: z.number().min(50).max(2000).optional(),
  thyroidTSH: z.number().min(0.01).max(50).optional(),
  isVerified: z.boolean().default(false),
  verifiedBy: z.string().optional(),
  schemaVersion: z.string().default("2.0"),
});

// V2 Recommendations Schema (Diet, Exercise, Action plan)
export const RecommendationV2Schema = z.object({
  assessmentId: z.string(),
  riskCategory: z.enum(["low", "moderate", "high"]),
  diseaseSpecificRisks: z.object({
    diabetesRiskPercent: z.number().min(0).max(100),
    heartDiseaseRiskPercent: z.number().min(0).max(100),
    hypertensionRiskPercent: z.number().min(0).max(100),
  }),
  dietPlanRegional: z.object({
    cuisinePreference: z.string(),
    dailyMeals: z.array(z.string()),
    keyExclusions: z.array(z.string()),
  }),
  fitnessRoutine: z.object({
    exercises: z.array(z.string()),
    frequencyWeekly: z.number().min(1).max(7),
    durationMinutesPerSession: z.number().min(10).max(180),
  }),
  clinicalReferralNeeded: z.boolean().default(false),
  physicianGuidanceNotes: z.string().max(2000).default(""),
  schemaVersion: z.string().default("2.0"),
});

// V2 Regional Context Schema
export const RegionalContextV2Schema = z.object({
  language: z.enum(["en", "hi", "gu"]),
  preferredDietaryType: z.enum(["vegetarian", "non-vegetarian", "vegan"]),
  stateOrRegionCode: z.string().max(10).default("IN"),
  customRegionalRules: z.array(z.string()).default([]),
  schemaVersion: z.string().default("2.0"),
});

export type HealthAssessmentV2 = z.infer<typeof HealthAssessmentV2Schema>;
export type LabReportV2 = z.infer<typeof LabReportV2Schema>;
export type RecommendationV2 = z.infer<typeof RecommendationV2Schema>;
export type RegionalContextV2 = z.infer<typeof RegionalContextV2Schema>;
