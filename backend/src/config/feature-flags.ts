/**
 * Typed Feature Flags Utility for HealthGuard AI (Backend)
 */

export interface BackendFeatureFlags {
  healthEngineV2Enabled: boolean;
}

/**
 * Parses and returns active backend feature flags.
 * Non-boolean, missing, or invalid values safely fallback to false.
 */
export const getBackendFeatureFlags = (): BackendFeatureFlags => {
  const v2Flag = process.env.HEALTH_ENGINE_V2_ENABLED;
  const healthEngineV2Enabled = v2Flag === "true";

  return {
    healthEngineV2Enabled,
  };
};

/**
 * Check if a specific backend feature flag is active.
 */
export const isBackendFeatureEnabled = (flag: keyof BackendFeatureFlags): boolean => {
  return getBackendFeatureFlags()[flag];
};
