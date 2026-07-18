import { auth, db, isConfigured } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { getScopedKey } from "./health-store";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface PendingSync {
  uid: string;
  payload: any;
  hash: string;
  attempts: number;
}

// Fast synchronous 64-bit hash function to avoid Node crypto dependencies in the browser
function cyrb53(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

let isSyncing = false;
let syncTimeout: NodeJS.Timeout | null = null;

export const profileSyncService = {
  /**
   * Queue profile updates locally and schedule background synchronization
   */
  queueProfileSync(profile: any, result: any, history: any) {
    const uid = auth.currentUser?.uid || "";

    // Assemble complete payload
    const payload = {
      ...profile,
      result,
      history,
    };

    const currentHash = cyrb53(JSON.stringify(payload));
    const lastSyncedHash = localStorage.getItem(getScopedKey("hg.last-synced-hash.v1", uid));

    // Deduplicate: if snapshot is unchanged from last successful sync, skip upload
    if (currentHash === lastSyncedHash) {
      console.log("[ProfileSync] Payload matches last synced hash. Skipping sync upload.");
      return;
    }

    const pending: PendingSync = {
      uid,
      payload,
      hash: currentHash,
      attempts: 0,
    };

    // Store in LocalStorage to prevent loss on refresh or close
    localStorage.setItem(getScopedKey("hg.pending-sync.v1", uid), JSON.stringify(pending));
    console.log("[ProfileSync] Queued profile change for background sync.");

    // Debounce the background sync to aggregate multiple updates within 2 seconds
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    syncTimeout = setTimeout(() => {
      this.triggerSync();
    }, 2000);
  },

  /**
   * Trigger the synchronization pipeline
   */
  async triggerSync() {
    if (isSyncing) return;

    const initiatingUid = auth.currentUser?.uid;
    if (!initiatingUid) {
      console.log("[ProfileSync] No authenticated user found. Waiting for login.");
      return;
    }

    const pendingSyncKey = getScopedKey("hg.pending-sync.v1", initiatingUid);
    const rawPending = localStorage.getItem(pendingSyncKey);
    if (!rawPending) return;

    const pending: PendingSync = JSON.parse(rawPending);

    // Mismatched user check
    if (pending.uid !== initiatingUid) {
      console.warn("[ProfileSync] Mismatching pending-sync UID detected. Aborting sync.");
      return;
    }

    // If client is offline, wait for navigator recovery
    if (!navigator.onLine) {
      console.log("[ProfileSync] Offline. Synchronization deferred until connectivity returns.");
      return;
    }

    const checkState = () => {
      return auth.currentUser && auth.currentUser.uid === initiatingUid;
    };

    isSyncing = true;
    console.log("[ProfileSync] Starting background sync process...");

    try {
      const idToken = await auth.currentUser.getIdToken();

      if (!checkState()) return;

      // 1. Sync profile and results with Express backend
      const backendResp = await fetch(`${API_URL}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(pending.payload),
      });

      if (!backendResp.ok) {
        throw new Error(`Backend sync failed: ${backendResp.statusText}`);
      }
      console.log("[ProfileSync] Backend Express synchronization successful.");

      if (!checkState()) return;

      // 2. Sync assessment completion state with Firestore users collection
      if (isConfigured) {
        const userRef = doc(db, "users", initiatingUid);
        const userSnap = await getDoc(userRef);
        const exists = userSnap.exists();
        const userData = exists ? userSnap.data() : null;

        const updateData: Record<string, any> = {
          uid: initiatingUid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || null,
          hasCompletedAssessment: true,
          lastAssessmentUpdatedAt: serverTimestamp(),
        };

        if (!userData || !userData.assessmentCompletedAt) {
          updateData.assessmentCompletedAt = serverTimestamp();
        }

        if (!checkState()) return;

        await setDoc(userRef, updateData, { merge: true });
        console.log("[ProfileSync] Firestore user synchronization successful.");
      }

      if (!checkState()) return;

      // 3. Trigger asynchronous AI advice generation in the background (non-blocking for standard profile sync)
      fetch(`${API_URL}/api/risk/advice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(pending.payload),
      })
        .then((resp) => {
          if (resp.ok) return resp.json();
        })
        .then((data) => {
          if (!checkState()) return;
          if (data && data.success && data.advice) {
            const resultKey = getScopedKey("hg.result.v1", initiatingUid);
            const currentResult = localStorage.getItem(resultKey);
            if (currentResult) {
              const parsed = JSON.parse(currentResult);
              parsed.rationale = data.advice.rationale;
              parsed.dietPlan = data.advice.dietPlan;
              parsed.exercisePlan = data.advice.exercisePlan;
              parsed.preventionTips = data.advice.preventionTips;
              parsed.isAiEnriched = true;
              localStorage.setItem(resultKey, JSON.stringify(parsed));
              window.dispatchEvent(new CustomEvent("hg:store"));
              console.log("[ProfileSync] AI recommendations generated & merged successfully.");
            }
          }
        })
        .catch((err) => {
          console.warn("[ProfileSync] Non-fatal background AI advice generation failure:", err);
        });

      if (!checkState()) return;

      // Clear successful sync from queue
      localStorage.removeItem(pendingSyncKey);
      localStorage.setItem(getScopedKey("hg.last-synced-hash.v1", initiatingUid), pending.hash);
      isSyncing = false;
      console.log("[ProfileSync] Synchronization completed successfully.");
    } catch (err) {
      console.error("[ProfileSync] Sync attempt failed:", err);
      isSyncing = false;

      if (!checkState()) return;

      pending.attempts += 1;
      localStorage.setItem(pendingSyncKey, JSON.stringify(pending));

      // Calculate exponential backoff (e.g. 5s, 10s, 20s, up to 60s max)
      const backoffMs = Math.min(5000 * Math.pow(2, pending.attempts - 1), 60000);
      console.log(`[ProfileSync] Retrying synchronization in ${backoffMs}ms...`);

      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        this.triggerSync();
      }, backoffMs);
    }
  },
};

// Register offline recovery listener to trigger sync automatically when connectivity returns
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[ProfileSync] Internet connection detected. Triggering recovery sync.");
    profileSyncService.triggerSync();
  });

  // Register initial trigger when application loads
  window.addEventListener("load", () => {
    profileSyncService.triggerSync();
  });
}
