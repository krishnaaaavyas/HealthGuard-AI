import { auth, db, isConfigured } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

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
    const lastSyncedHash = localStorage.getItem("hg.last-synced-hash.v1");

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
    localStorage.setItem("hg.pending-sync.v1", JSON.stringify(pending));
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

    const rawPending = localStorage.getItem("hg.pending-sync.v1");
    if (!rawPending) return;

    const pending: PendingSync = JSON.parse(rawPending);

    // If client is offline, wait for navigator recovery
    if (!navigator.onLine) {
      console.log("[ProfileSync] Offline. Synchronization deferred until connectivity returns.");
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      console.log("[ProfileSync] No authenticated user found. Waiting for login.");
      return;
    }

    // Resolve user mismatch if uid was empty when queued
    if (pending.uid !== uid) {
      pending.uid = uid;
      localStorage.setItem("hg.pending-sync.v1", JSON.stringify(pending));
    }

    isSyncing = true;
    console.log("[ProfileSync] Starting background sync process...");

    try {
      const idToken = await auth.currentUser.getIdToken();

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

      // 2. Sync assessment completion state with Firestore users collection
      if (isConfigured) {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        const exists = userSnap.exists();
        const userData = exists ? userSnap.data() : null;

        const updateData: Record<string, any> = {
          uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || null,
          hasCompletedAssessment: true,
          lastAssessmentUpdatedAt: serverTimestamp(),
        };

        if (!userData || !userData.assessmentCompletedAt) {
          updateData.assessmentCompletedAt = serverTimestamp();
        }

        await setDoc(userRef, updateData, { merge: true });
        console.log("[ProfileSync] Firestore user synchronization successful.");
      }

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
          if (data && data.success && data.advice) {
            const currentResult = localStorage.getItem("hg.result.v1");
            if (currentResult) {
              const parsed = JSON.parse(currentResult);
              parsed.rationale = data.advice.rationale;
              parsed.dietPlan = data.advice.dietPlan;
              parsed.exercisePlan = data.advice.exercisePlan;
              parsed.preventionTips = data.advice.preventionTips;
              parsed.isAiEnriched = true;
              localStorage.setItem("hg.result.v1", JSON.stringify(parsed));
              window.dispatchEvent(new CustomEvent("hg:store"));
              console.log("[ProfileSync] AI recommendations generated & merged successfully.");
            }
          }
        })
        .catch((err) => {
          console.warn("[ProfileSync] Non-fatal background AI advice generation failure:", err);
        });

      // Clear successful sync from queue
      localStorage.removeItem("hg.pending-sync.v1");
      localStorage.setItem("hg.last-synced-hash.v1", pending.hash);
      isSyncing = false;
      console.log("[ProfileSync] Synchronization completed successfully.");
    } catch (err) {
      console.error("[ProfileSync] Sync attempt failed:", err);
      isSyncing = false;
      pending.attempts += 1;
      localStorage.setItem("hg.pending-sync.v1", JSON.stringify(pending));

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
