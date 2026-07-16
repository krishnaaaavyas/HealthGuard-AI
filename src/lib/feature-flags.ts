/**
 * Typed Feature Flags Utility for HealthGuard AI (Frontend)
 */

export interface FeatureFlags {
  enableHealthEngineV2: boolean;
}

/**
 * Parses and returns active feature flags.
 * Non-boolean, missing, or invalid values safely fallback to false.
 */
export const getFeatureFlags = (): FeatureFlags => {
  const v2Flag = import.meta.env.VITE_ENABLE_HEALTH_ENGINE_V2;
  const enableHealthEngineV2 = v2Flag === "true";

  return {
    enableHealthEngineV2,
  };
};

/**
 * Check if a specific feature flag is active.
 */
export const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  return getFeatureFlags()[flag];
};
