/**
 * ============================================================
 * [Data Flow] Supabase Authentication + Cloud Snapshot Sync
 * ============================================================
 *
 * 화면 역할:
 * - src/components/settings/SettingsModal.tsx의 로그인, 로그아웃,
 *   수동 동기화 상태와 action을 제공한다.
 * - 직접 UI를 렌더링하지 않고 App 전체를 감싸는 data provider다.
 *
 * 연결 관계:
 * - Parent: src/App.tsx
 * - Client: src/lib/supabase.ts
 * - Snapshot policy: src/lib/glassdayStorage.ts
 * - Supabase table: user_storage_snapshots (user_id당 한 row)
 *
 * 저장 원칙:
 * - Memo, Study, Money, Calendar, Career 등 durable user content만 cloud에 저장한다.
 * - Wide/Laptop mode, active tab, Grid layout, theme 같은 현재 브라우저의 UI shell은
 *   cloud 복원에서 제외해 로그인 후 예전 화면으로 되돌아가는 것을 방지한다.
 * - 원격 snapshot 적용 후 GLASSDAY_STORAGE_EVENT를 보내 각 useLocalStorage consumer를
 *   같은 탭 안에서도 다시 렌더링한다.
 *
 * 수정 영향:
 * - 인증 redirect나 snapshot 우선순위를 바꾸면 App의 layout mode 복원과
 *   모든 저장형 Widget에 영향을 줄 수 있다.
 * ============================================================
 */
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
  getGlassdayLocalUpdatedAt,
  getGlassdaySnapshotMeaningfulScore,
  getGlassdaySnapshotTimestamp,
  isCompatibleGlassdayStorageSnapshot,
  patchLocalStorageEvents,
  type GlassdayStorageSnapshot,
} from "../lib/glassdayStorage";
import {
  DASHBOARD_LAYOUT_MODE_KEY,
  DASHBOARD_PENDING_AUTH_LAYOUT_MODE_KEY,
} from "../constants/dashboardStorage";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type SyncStatus =
  | "disabled"
  | "idle"
  | "authenticating"
  | "syncing"
  | "synced"
  | "error";

type CloudSyncContextValue = {
  /** Vite 환경 변수로 Supabase client를 만들 수 있는지 나타낸다. */
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
const PREFER_LOCAL_AFTER_AUTH_STORAGE_KEY =
  "glassday.sync.preferLocalOnNextAuth.v1";
const CloudSyncContext = createContext<CloudSyncContextValue | null>(null);

/* OAuth 왕복 전 현재 Wide/Laptop mode를 URL과 임시 key에 보존한다. */
const readCurrentLayoutModeForAuth = () => {
  const params = new URLSearchParams(window.location.search);
  const urlMode = params.get("layout");

  if (urlMode === "laptop" || urlMode === "wide") {
    return urlMode;
  }

  const savedMode = window.localStorage.getItem(DASHBOARD_LAYOUT_MODE_KEY);

  return savedMode === "wide" || savedMode === "laptop" ? savedMode : "laptop";
};

const getAuthRedirectUrl = () => {
  const url = new URL(window.location.href);
  const layoutMode = readCurrentLayoutModeForAuth();

  url.hash = "";
  url.searchParams.set("layout", layoutMode);
  window.localStorage.setItem(DASHBOARD_PENDING_AUTH_LAYOUT_MODE_KEY, layoutMode);

  return url.toString();
};

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

    /* Snapshot에는 glassdayStorage가 허용한 사용자 데이터만 포함된다. */
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

    if (data?.payload && isCompatibleGlassdayStorageSnapshot(data.payload)) {
      /*
       * Conflict rule:
       * 인증 직전의 로컬 데이터가 더 새롭고 의미 있는 경우 cloud를 덮어쓴다.
       * 그 외에는 remote snapshot을 적용하되 UI shell state는 유지한다.
       */
      const remoteSnapshot = data.payload as GlassdayStorageSnapshot;
      const localSnapshot = createGlassdayStorageSnapshot();
      const localUpdatedAt = getGlassdayLocalUpdatedAt();
      const preferLocalAfterAuth =
        window.localStorage.getItem(PREFER_LOCAL_AFTER_AUTH_STORAGE_KEY) ===
        "true";
      const remoteTimestamp =
        getGlassdaySnapshotTimestamp(remoteSnapshot) ||
        Date.parse(data.updated_at ?? "");
      const localTimestamp = Date.parse(localUpdatedAt ?? "");
      const localScore = getGlassdaySnapshotMeaningfulScore(localSnapshot);
      const remoteScore = getGlassdaySnapshotMeaningfulScore(remoteSnapshot);

      if (
        preferLocalAfterAuth &&
        localScore > 0 &&
        localTimestamp > 0 &&
        localTimestamp >= remoteTimestamp &&
        localScore >= remoteScore
      ) {
        window.localStorage.removeItem(PREFER_LOCAL_AFTER_AUTH_STORAGE_KEY);
        setSyncState(
          "syncing",
          "Keeping this browser's newer dashboard and updating cloud save..."
        );
        await uploadSnapshot();
        return;
      }

      window.localStorage.removeItem(PREFER_LOCAL_AFTER_AUTH_STORAGE_KEY);

      suppressUploadRef.current = true;
      const applyResult = applyGlassdayStorageSnapshot(remoteSnapshot);
      setLastSyncedAt(data.updated_at ?? null);

      const releaseUploadSuppression = () => {
        suppressUploadRef.current = false;
      };

      if (applyResult.skippedIncompatibleDashboardState) {
        window.setTimeout(() => {
          releaseUploadSuppression();
          void uploadSnapshot();
        }, 1200);

        setSyncState(
          "syncing",
          "Loaded your saved data and kept the current dashboard layout."
        );
        return;
      }

      window.setTimeout(releaseUploadSuppression, 1200);

      setSyncState("synced", "Loaded your saved dashboard.");
      return;
    }

    if (data?.payload) {
      setSyncState(
        "syncing",
        "Updating your cloud snapshot to the latest dashboard format..."
      );
    }

    await uploadSnapshot();
  }, [session, setSyncState, uploadSnapshot]);

  const syncNow = useCallback(async () => {
    await uploadSnapshot();
  }, [uploadSnapshot]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return;

    setSyncState("authenticating");
    window.localStorage.setItem(PREFER_LOCAL_AFTER_AUTH_STORAGE_KEY, "true");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl(),
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
      window.localStorage.setItem(PREFER_LOCAL_AFTER_AUTH_STORAGE_KEY, "true");

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
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
      window.localStorage.setItem(PREFER_LOCAL_AFTER_AUTH_STORAGE_KEY, "true");

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
      window.localStorage.setItem(PREFER_LOCAL_AFTER_AUTH_STORAGE_KEY, "true");

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
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
        redirectTo: getAuthRedirectUrl(),
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
    window.localStorage.removeItem(PREFER_LOCAL_AFTER_AUTH_STORAGE_KEY);
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
