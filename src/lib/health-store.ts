import { useEffect, useState, useCallback } from "react";
import type { HealthResult } from "./health.functions";
import type { Lang } from "./i18n";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export const KEY_RESULT = "hg.result.v1";
export const KEY_PROFILE = "hg.profile.v1";
export const KEY_HISTORY = "hg.history.v1";
export const KEY_LANG = "hg.lang.v1";

export function getScopedKey(
  baseKey: string,
  uid: string | null = auth.currentUser?.uid || null,
): string {
  if (baseKey === KEY_LANG) return baseKey;
  if (!uid) return `${baseKey}:guest`;
  return `${baseKey}:${uid}`;
}

const authListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  onAuthStateChanged(auth, (user) => {
    window.dispatchEvent(new CustomEvent("hg:store", { detail: { key: "all" } }));
    authListeners.forEach((lis) => lis());
  });
}

export type Profile = {
  age: number;
  gender: "male" | "female" | "other";
  heightCm: number;
  weightKg: number;
  smoking: "never" | "former" | "current";
  exercise: "none" | "light" | "moderate" | "active";
  familyHistory: string;
  symptoms: string;
  schemaVersion?: number;
  engineVersion?: string;
};

export type StoredResult = HealthResult & {
  bmi: number;
  schemaVersion?: number;
  engineVersion?: string;
};

export type HistoryEntry = {
  date: string;
  overallScore: number;
  bmi: number;
  weightKg: number;
  risks: { diabetes: number; heartDisease: number; hypertension: number };
  schemaVersion?: number;
  engineVersion?: string;
};

export function readProfileCompatibility(raw: any): Profile | null {
  if (!raw) return null;
  return {
    ...raw,
    schemaVersion: raw.schemaVersion ?? 1,
    engineVersion: raw.engineVersion ?? "legacy",
  };
}

export function readStoredResultCompatibility(raw: any): StoredResult | null {
  if (!raw) return null;
  const { mlRisk, modelConfidence, modelVersion, experimentalResult, supportingFactors, ...rest } =
    raw;
  return {
    ...rest,
    schemaVersion: raw.schemaVersion ?? 1,
    engineVersion: raw.engineVersion ?? "legacy",
  };
}

export function readHistoryEntryCompatibility(raw: any): HistoryEntry {
  return {
    ...raw,
    schemaVersion: raw.schemaVersion ?? 1,
    engineVersion: raw.engineVersion ?? "legacy",
  };
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (key.startsWith(KEY_PROFILE)) {
      return readProfileCompatibility(parsed) as unknown as T;
    }
    if (key.startsWith(KEY_RESULT)) {
      return readStoredResultCompatibility(parsed) as unknown as T;
    }
    if (key.startsWith(KEY_HISTORY) && Array.isArray(parsed)) {
      return parsed.map(readHistoryEntryCompatibility) as unknown as T;
    }

    return parsed as T;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("hg:store", { detail: { key } }));
  } catch (err) {
    console.warn("localStorage write failed:", err);
  }
}

function useStored<T>(baseKey: string): [T | null, (value: T | null) => void] {
  const [uid, setUid] = useState<string | null>(() => auth.currentUser?.uid || null);

  useEffect(() => {
    const onAuth = () => {
      setUid(auth.currentUser?.uid || null);
    };
    authListeners.add(onAuth);
    return () => {
      authListeners.delete(onAuth);
    };
  }, []);

  const scopedKey = getScopedKey(baseKey, uid);
  const [val, setVal] = useState<T | null>(() => read<T>(scopedKey));

  useEffect(() => {
    setVal(read<T>(scopedKey));
  }, [scopedKey]);

  useEffect(() => {
    const sync = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key?: string } | undefined;
      if (!detail || detail.key === scopedKey || detail.key === "all") {
        setVal(read<T>(scopedKey));
      }
    };
    window.addEventListener("hg:store", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("hg:store", sync);
      window.removeEventListener("storage", sync);
    };
  }, [scopedKey]);

  const setter = useCallback(
    (v: T | null) => {
      write(scopedKey, v);
      setVal(v);
    },
    [scopedKey],
  );

  return [val, setter];
}

export function useHealthResult() {
  return useStored<StoredResult>(KEY_RESULT);
}
export function useProfile() {
  return useStored<Profile>(KEY_PROFILE);
}
export function useHistory(): [HistoryEntry[], (entries: HistoryEntry[]) => void] {
  const [list, setList] = useStored<HistoryEntry[]>(KEY_HISTORY);
  return [list ?? [], setList];
}
export function useLangPref(): [Lang, (l: Lang) => void] {
  const [val, setVal] = useStored<Lang>(KEY_LANG);
  return [val ?? "en", (l) => setVal(l)];
}

export function pushHistory(entry: HistoryEntry) {
  const key = getScopedKey(KEY_HISTORY);
  const cur = read<HistoryEntry[]>(key) ?? [];
  write(key, [...cur, entry]);
}

export function hydrateHealthStore(data: {
  profile?: Profile | null;
  result?: StoredResult | null;
  history?: HistoryEntry[] | null;
}) {
  if (typeof window === "undefined") return;
  const uid = auth.currentUser?.uid || null;
  try {
    if (data.profile !== undefined) {
      const key = getScopedKey(KEY_PROFILE, uid);
      if (data.profile === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(data.profile));
    }
    if (data.result !== undefined) {
      const key = getScopedKey(KEY_RESULT, uid);
      if (data.result === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(data.result));
    }
    if (data.history !== undefined) {
      const key = getScopedKey(KEY_HISTORY, uid);
      if (data.history === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(data.history));
    }
    window.dispatchEvent(new CustomEvent("hg:store", { detail: { key: "all" } }));
  } catch (err) {
    console.warn("hydrateHealthStore failed:", err);
  }
}

export function migrateLegacyData(uid: string) {
  if (typeof window === "undefined" || !uid) return;

  // 1. Process hg.pending-sync.v1 (which has an explicit owner UID)
  try {
    const rawPending = window.localStorage.getItem("hg.pending-sync.v1");
    if (rawPending) {
      const pending = JSON.parse(rawPending);
      if (pending && pending.uid) {
        if (pending.uid === uid) {
          const scopedKey = `hg.pending-sync.v1:${uid}`;
          window.localStorage.setItem(scopedKey, rawPending);
          const verified = window.localStorage.getItem(scopedKey);
          if (verified === rawPending) {
            window.localStorage.removeItem("hg.pending-sync.v1");
            console.log(`[Migration] Successfully migrated hg.pending-sync.v1 to ${scopedKey}`);
          }
        } else {
          console.warn(
            `[Migration] Ignoring legacy pending-sync belonging to another UID: ${pending.uid}`,
          );
        }
      } else {
        const quarantineKey = `quarantine.hg.pending-sync.v1:${Date.now()}`;
        window.localStorage.setItem(quarantineKey, rawPending);
        window.localStorage.removeItem("hg.pending-sync.v1");
        console.warn(`[Migration] Quarantine: legacy pending-sync had absent ownership.`);
      }
    }
  } catch (err: any) {
    console.error("[Migration] Error migrating legacy pending-sync:", err.message);
  }

  // 2. Process other legacy keys (which have absent ownership)
  const legacyKeys = ["hg.profile.v1", "hg.result.v1", "hg.history.v1", "hg.last-synced-hash.v1"];
  for (const key of legacyKeys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        let ownerUid: string | null = null;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            ownerUid = parsed.uid || parsed.userId || null;
          }
        } catch (e) {
          // Ignore JSON parsing errors for compatibility checks
        }

        if (ownerUid) {
          if (ownerUid === uid) {
            const scopedKey = `${key}:${uid}`;
            window.localStorage.setItem(scopedKey, raw);
            const verified = window.localStorage.getItem(scopedKey);
            if (verified === raw) {
              window.localStorage.removeItem(key);
              console.log(`[Migration] Successfully migrated ${key} to ${scopedKey}`);
            }
          } else {
            console.warn(
              `[Migration] Ignoring legacy ${key} belonging to another UID: ${ownerUid}`,
            );
          }
        } else {
          const quarantineKey = `quarantine.${key}:${Date.now()}`;
          window.localStorage.setItem(quarantineKey, raw);
          window.localStorage.removeItem(key);
          console.warn(`[Migration] Quarantine: legacy ${key} has absent ownership.`);
        }
      }
    } catch (err: any) {
      console.error(`[Migration] Error migrating legacy key ${key}:`, err.message);
    }
  }
}
