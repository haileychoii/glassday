import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import {
  applyGlassdayStorageSnapshot,
  createGlassdayStorageSnapshot,
  GLASSDAY_STORAGE_EVENT,
  patchLocalStorageEvents,
  type GlassdayStorageSnapshot,
} from "../lib/glassdayStorage";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type SyncStatus =
  | "disabled"
  | "idle"
  | "authenticating"
  | "syncing"
  | "synced"
  | "error";

type CloudSyncContextValue = {
  isConfigured: boolean;
  session: Session | null;
  user: User | null;
  syncStatus: SyncStatus;
  syncMessage: string;
  lastSyncedAt: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
};

const STORAGE_TABLE = "user_storage_snapshots";
const CloudSyncContext = createContext<CloudSyncContextValue | null>(null);

const toSyncMessage = (status: SyncStatus, fallback?: string) => {
  if (fallback) return fallback;

  switch (status) {
    case "disabled":
      return "Supabase env is not connected yet.";
    case "authenticating":
      return "Signing in...";
    case "syncing":
      return "Syncing your dashboard...";
    case "synced":
      return "Cloud sync is active.";
    case "error":
      return "Sync failed.";
    default:
      return "Sign in to keep this dashboard across devices.";
  }
};

export const CloudSyncProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    isSupabaseConfigured ? "idle" : "disabled"
  );
  const [syncMessage, setSyncMessage] = useState(
    toSyncMessage(isSupabaseConfigured ? "idle" : "disabled")
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const suppressUploadRef = useRef(false);
  const syncTimeoutRef = useRef<number | null>(null);
  const hasHydratedRemoteRef = useRef(false);

  const setSyncState = useCallback(
    (status: SyncStatus, message?: string) => {
      setSyncStatus(status);
      setSyncMessage(toSyncMessage(status, message));
    },
    []
  );

  const uploadSnapshot = useCallback(async () => {
    if (!supabase || !session?.user) return;

    setSyncState("syncing");

    const snapshot = createGlassdayStorageSnapshot();

    const { error } = await supabase.from(STORAGE_TABLE).upsert(
      {
        user_id: session.user.id,
        payload: snapshot,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      console.error(error);
      setSyncState("error", error.message);
      return;
    }

    setLastSyncedAt(snapshot.exportedAt);
    setSyncState("synced");
  }, [session, setSyncState]);

  const hydrateFromRemote = useCallback(async () => {
    if (!supabase || !session?.user || hasHydratedRemoteRef.current) return;

    hasHydratedRemoteRef.current = true;
    setSyncState("syncing", "Loading your saved dashboard...");

    const { data, error } = await supabase
      .from(STORAGE_TABLE)
      .select("payload, updated_at")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setSyncState("error", error.message);
      return;
    }

    if (data?.payload) {
      suppressUploadRef.current = true;
      applyGlassdayStorageSnapshot(data.payload as GlassdayStorageSnapshot);
      setLastSyncedAt(data.updated_at ?? null);

      window.setTimeout(() => {
        suppressUploadRef.current = false;
      }, 1200);

      setSyncState("synced", "Loaded your saved dashboard.");
      return;
    }

    await uploadSnapshot();
  }, [session, setSyncState, uploadSnapshot]);

  const syncNow = useCallback(async () => {
    await uploadSnapshot();
  }, [uploadSnapshot]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return;

    setSyncState("authenticating");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error(error);
      setSyncState("error", error.message);
    }
  }, [setSyncState]);

  const signInWithMagicLink = useCallback(
    async (email: string) => {
      if (!supabase) return;

      setSyncState("authenticating");

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error(error);
        setSyncState("error", error.message);
        return;
      }

      setSyncState("idle", `Magic link sent to ${email}.`);
    },
    [setSyncState]
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return;

      setSyncState("authenticating");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error(error);
        setSyncState("error", error.message);
        return;
      }

      setSyncState("synced", "Signed in successfully.");
    },
    [setSyncState]
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return;

      setSyncState("authenticating");

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error(error);
        setSyncState("error", error.message);
        return;
      }

      setSyncState(
        "idle",
        `Account created for ${email}. Check your email if confirmation is enabled.`
      );
    },
    [setSyncState]
  );

  const sendPasswordReset = useCallback(
    async (email: string) => {
      if (!supabase) return;

      setSyncState("authenticating");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) {
        console.error(error);
        setSyncState("error", error.message);
        return;
      }

      setSyncState("idle", `Password reset email sent to ${email}.`);
    },
    [setSyncState]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error);
      setSyncState("error", error.message);
      return;
    }

    hasHydratedRemoteRef.current = false;
    setLastSyncedAt(null);
    setSyncState("idle");
  }, [setSyncState]);

  useEffect(() => {
    patchLocalStorageEvents();
  }, []);

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error(error);
        setSyncState("error", error.message);
        return;
      }

      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      hasHydratedRemoteRef.current = false;
      setSession(nextSession);

      if (!nextSession) {
        setLastSyncedAt(null);
        setSyncState("idle");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSyncState]);

  useEffect(() => {
    if (!session?.user || !supabase) return;

    void hydrateFromRemote();
  }, [hydrateFromRemote, session]);

  useEffect(() => {
    if (!session?.user || !supabase) return;

    const handleStorageChange = () => {
      if (suppressUploadRef.current) return;

      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = window.setTimeout(() => {
        void uploadSnapshot();
      }, 900);
    };

    window.addEventListener(GLASSDAY_STORAGE_EVENT, handleStorageChange);

    return () => {
      window.removeEventListener(GLASSDAY_STORAGE_EVENT, handleStorageChange);

      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [session, uploadSnapshot]);

  const value = useMemo<CloudSyncContextValue>(
    () => ({
      isConfigured: isSupabaseConfigured,
      session,
      user: session?.user ?? null,
      syncStatus,
      syncMessage,
      lastSyncedAt,
      signInWithGoogle,
      signInWithMagicLink,
      signInWithPassword,
      signUpWithPassword,
      sendPasswordReset,
      signOut,
      syncNow,
    }),
    [
      lastSyncedAt,
      session,
      signInWithGoogle,
      signInWithMagicLink,
      signInWithPassword,
      signUpWithPassword,
      sendPasswordReset,
      signOut,
      syncMessage,
      syncNow,
      syncStatus,
    ]
  );

  return (
    <CloudSyncContext.Provider value={value}>
      {children}
    </CloudSyncContext.Provider>
  );
};

export const useCloudSync = () => {
  const context = useContext(CloudSyncContext);

  if (!context) {
    throw new Error("useCloudSync must be used inside CloudSyncProvider");
  }

  return context;
};
