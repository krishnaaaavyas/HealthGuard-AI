import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider, isConfigured, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { startMeasure, endMeasure } from "@/lib/timing";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
import { useProfile, useHealthResult, useHistory } from "@/lib/health-store";
import { toast } from "sonner";

interface FirebaseError {
  code?: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  syncing: boolean;
  hasCompletedAssessment: boolean | null;
  setHasCompletedAssessment: React.Dispatch<React.SetStateAction<boolean | null>>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string, photoUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState<boolean | null>(null);
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSyncedThisSession = useRef<string | null>(null);
  const syncPromiseRef = useRef<Promise<void> | null>(null);

  // Read local stores so we can watch them reactively
  const [profile] = useProfile();
  const [result] = useHealthResult();
  const [history] = useHistory();

  // 1. Listen to Auth changes
  useEffect(() => {
    if (!isConfigured) {
      const storedMock = localStorage.getItem("hg.mock-user.v1");
      if (storedMock) {
        try {
          setUser(JSON.parse(storedMock));
          const completed = localStorage.getItem("hg.result.v1");
          setHasCompletedAssessment(!!completed);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    startMeasure("Firebase Auth Resolution");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth loading start");
      setUser(firebaseUser);
      setLoading(false); // Resolve loading immediately!
      endMeasure("Firebase Auth Resolution");

      if (firebaseUser && isConfigured) {
        // Prevent duplicate background sync runs for same user session
        if (hasSyncedThisSession.current === firebaseUser.uid) {
          console.log("Sync already completed for this session.");
          return;
        }

        if (syncPromiseRef.current) {
          console.log("Sync already in progress.");
          return;
        }

        const runSync = async () => {
          setSyncing(true);
          isSyncingRef.current = true;
          startMeasure("Background Profile Sync");

          const uid = firebaseUser.uid;
          const isOffline = !navigator.onLine;
          let firestoreSuccess = false;

          // A. Standalone, fire-and-forget lastLoginAt update
          if (!isOffline) {
            const userDocRef = doc(db, "users", uid);
            setDoc(userDocRef, { lastLoginAt: serverTimestamp() }, { merge: true }).catch((err) => {
              console.error("[Firestore] Failed fire-and-forget lastLoginAt write:", err);
            });
          }

          // B. Fetch/create Firestore user document safely
          try {
            if (isOffline) throw new Error("offline");
            const userDocRef = doc(db, "users", uid);

            // 2s timeout race to prevent hangs on flaky connections
            const userDocSnap = await Promise.race([
              getDoc(userDocRef),
              new Promise<any>((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
            ]);

            if (!userDocSnap.exists()) {
              const initialDoc = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || null,
                hasCompletedAssessment: false,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
              };
              await setDoc(userDocRef, initialDoc);
              setHasCompletedAssessment(false);
            } else {
              const userData = userDocSnap.data();
              setHasCompletedAssessment(!!userData?.hasCompletedAssessment);
            }
            firestoreSuccess = true;
          } catch (dbErr) {
            console.warn("[Firestore] Error reading user doc in background:", dbErr);
            // Fallback: check local storage
            try {
              const localProfile = localStorage.getItem("hg.profile.v1");
              setHasCompletedAssessment(!!localProfile);
            } catch {
              setHasCompletedAssessment(false);
            }
          }

          // C. Fetch profile, result, and history from Express backend with timeout
          if (firestoreSuccess && !isOffline) {
            try {
              const idToken = await firebaseUser.getIdToken();
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s Express sync timeout

              startMeasure("Express Profile Fetch");
              const response = await fetch(`${API_URL}/api/profile`, {
                headers: {
                  Authorization: `Bearer ${idToken}`,
                },
                signal: controller.signal,
              });
              clearTimeout(timeoutId);
              endMeasure("Express Profile Fetch");

              if (!response.ok) {
                throw new Error(`Profile request failed with status: ${response.status}`);
              }

              const data = await response.json();

              if (data.profile) {
                // Sync to LocalStorage (writes will trigger custom hg:store event)
                localStorage.setItem("hg.profile.v1", JSON.stringify(data.profile));
                if (data.result) {
                  localStorage.setItem("hg.result.v1", JSON.stringify(data.result));
                } else {
                  localStorage.removeItem("hg.result.v1");
                }
                if (data.history) {
                  localStorage.setItem("hg.history.v1", JSON.stringify(data.history));
                } else {
                  localStorage.removeItem("hg.history.v1");
                }
                // Notify hooks
                window.dispatchEvent(new CustomEvent("hg:store"));
              } else {
                // Backend has no profile: sync current localStorage to backend
                const localProfile = localStorage.getItem("hg.profile.v1");
                const localResult = localStorage.getItem("hg.result.v1");
                const localHistory = localStorage.getItem("hg.history.v1");

                if (localProfile) {
                  const body = {
                    ...JSON.parse(localProfile),
                    result: localResult ? JSON.parse(localResult) : null,
                    history: localHistory ? JSON.parse(localHistory) : [],
                  };

                  await fetch(`${API_URL}/api/profile`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify(body),
                  });
                }
              }
              hasSyncedThisSession.current = uid;
            } catch (error) {
              console.error("[Auth Context] Express sync failed:", error);
              toast.error("Could not synchronize cloud record. Operating in offline mode.");
            }
          }

          setSyncing(false);
          isSyncingRef.current = false;
          syncPromiseRef.current = null;
          endMeasure("Background Profile Sync");
        };

        syncPromiseRef.current = runSync();
      } else {
        setHasCompletedAssessment(null);
        setSyncing(false);
        isSyncingRef.current = false;
        hasSyncedThisSession.current = null;
        syncPromiseRef.current = null;
        console.log("Auth loading end");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 2. Reactively sync any local changes to backend
  useEffect(() => {
    if (!user || loading || syncing || isSyncingRef.current || !isConfigured) return;

    const syncToBackend = async () => {
      if (!navigator.onLine) {
        console.warn("Offline - skipping backend sync write");
        return;
      }
      try {
        const idToken =
          typeof user.getIdToken === "function"
            ? await user.getIdToken()
            : auth.currentUser
              ? await auth.currentUser.getIdToken()
              : "mock-token";

        // We only write to backend if we have a profile to sync
        if (profile) {
          const body = {
            ...profile,
            result: result || null,
            history: history || [],
          };

          const postResponse = await fetch(`${API_URL}/api/profile`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(body),
          });

          if (!postResponse.ok) {
            const errBody = await postResponse.json().catch(() => ({}));
            console.error("Failed writing changes to backend:", errBody);
          }
        }
      } catch (error: unknown) {
        console.error("Failed to sync changes with backend:", error);
      }
    };

    // Debounce slightly to prevent double writes on immediate successive calls
    const timer = setTimeout(syncToBackend, 500);
    return () => clearTimeout(timer);
  }, [user, profile, result, history, loading, syncing]);

  // Auth Methods
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      if (!isConfigured) {
        const mockUser: any = {
          uid: "guest-user-123",
          email: "google-guest@healthguard-ai.mock",
          displayName: "Google Guest",
          photoURL: null,
          providerData: [],
          getIdToken: async () => "mock-uid-guest-user-123",
        };
        localStorage.setItem("hg.mock-user.v1", JSON.stringify(mockUser));
        setUser(mockUser);
        const completed = localStorage.getItem("hg.result.v1");
        setHasCompletedAssessment(!!completed);
        toast.success("Successfully signed in with Google (Mock Dev Mode)");
        return;
      }
      await signInWithPopup(auth, googleProvider);
      toast.success("Successfully signed in with Google");
    } catch (error: unknown) {
      console.error("Patient sync failed:", error);
      toast.error("Unable to sync patient record.");
      const e = error as FirebaseError;
      if (e.code !== "auth/popup-closed-by-user") {
        toast.error(e.message || "Google sign-in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      if (!isConfigured) {
        const mockUser: any = {
          uid: "guest-user-123",
          email,
          displayName: "Mock Patient",
          photoURL: null,
          providerData: [],
          getIdToken: async () => "mock-uid-guest-user-123",
        };
        localStorage.setItem("hg.mock-user.v1", JSON.stringify(mockUser));
        setUser(mockUser);
        const completed = localStorage.getItem("hg.result.v1");
        setHasCompletedAssessment(!!completed);
        toast.success("Successfully signed in (Mock Dev Mode)");
        return;
      }
      await signInWithEmailAndPassword(auth, email, pass);
      toast.success("Successfully signed in");
    } catch (error: unknown) {
      console.error("Patient sync failed:", error);
      toast.error("Unable to sync patient record.");
      const e = error as FirebaseError;
      if (
        e.code === "auth/invalid-credential" ||
        e.code === "auth/user-not-found" ||
        e.code === "auth/wrong-password"
      ) {
        toast.error("Invalid email or password.");
      } else {
        toast.error(e.message || "Failed to sign in. Check your credentials.");
      }
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      setLoading(true);
      if (!isConfigured) {
        const mockUser: any = {
          uid: "guest-user-123",
          email,
          displayName: name,
          photoURL: null,
          providerData: [],
          getIdToken: async () => "mock-uid-guest-user-123",
        };
        localStorage.setItem("hg.mock-user.v1", JSON.stringify(mockUser));
        setUser(mockUser);
        setHasCompletedAssessment(false);
        toast.success("Account created successfully (Mock Dev Mode)");
        return;
      }
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(credential.user, { displayName: name });

      // Update local state copy of User to trigger displayName
      setUser({ ...credential.user, displayName: name });

      // Create/update Firestore user document immediately to prevent race condition write of displayName as null
      if (isConfigured) {
        const userDocRef = doc(db, "users", credential.user.uid);
        await setDoc(
          userDocRef,
          {
            uid: credential.user.uid,
            email: credential.user.email,
            displayName: name,
            hasCompletedAssessment: false,
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
        setHasCompletedAssessment(false);
      }

      // Create Initial backend profile if we have one
      if (isConfigured) {
        const idToken = await credential.user.getIdToken();
        const localProfile = localStorage.getItem("hg.profile.v1");
        const localResult = localStorage.getItem("hg.result.v1");
        const localHistory = localStorage.getItem("hg.history.v1");

        if (localProfile) {
          try {
            const body = {
              ...JSON.parse(localProfile),
              result: localResult ? JSON.parse(localResult) : null,
              history: localHistory ? JSON.parse(localHistory) : [],
            };
            await fetch(`${API_URL}/api/profile`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify(body),
            });
          } catch (err) {
            console.error("Failed to sync initial profile on sign up:", err);
          }
        }
      }

      toast.success("Account created successfully");
    } catch (error: unknown) {
      console.error("Patient sync failed:", error);
      toast.error("Unable to sync patient record.");
      const e = error as FirebaseError;
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (error: unknown) {
      console.error("Patient sync failed:", error);
      toast.error("Unable to sync patient record.");
      const e = error as FirebaseError;
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      if (!isConfigured) {
        localStorage.removeItem("hg.mock-user.v1");
        setUser(null);
        setHasCompletedAssessment(null);
        localStorage.removeItem("hg.profile.v1");
        localStorage.removeItem("hg.result.v1");
        localStorage.removeItem("hg.history.v1");
        window.dispatchEvent(new CustomEvent("hg:store"));
        toast.success("Successfully signed out (Mock Dev Mode)");
        return;
      }
      await signOut(auth);
      // Clear local storage and state for clinical assessment privacy
      localStorage.removeItem("hg.profile.v1");
      localStorage.removeItem("hg.result.v1");
      localStorage.removeItem("hg.history.v1");
      window.dispatchEvent(new CustomEvent("hg:store"));
      toast.success("Successfully signed out");
    } catch (error: unknown) {
      console.error("Patient sync failed:", error);
      toast.error("Unable to sync patient record.");
      const e = error as FirebaseError;
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (name: string, photoUrl: string) => {
    if (!user) return;
    try {
      setLoading(true);
      await updateProfile(user, { displayName: name, photoURL: photoUrl });
      setUser({ ...user, displayName: name, photoURL: photoUrl });

      // Note: User profile displayName and photoURL are verified/updated via Firebase Auth ID Token.
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      console.error("Patient sync failed:", error);
      toast.error("Unable to sync patient record.");
      const e = error as FirebaseError;
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        syncing,
        hasCompletedAssessment,
        setHasCompletedAssessment,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        resetPassword,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
