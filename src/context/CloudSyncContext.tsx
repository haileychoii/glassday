/* eslint-disable react-refresh/only-export-components */
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
  getGlassdaySnapshotTimestamp,
  isCompatibleGlassdayStorageSnapshot,
  markGlassdayLocalSyncedAt,
  patchLocalStorageEvents,
  type GlassdayStorageSnapshot,
} from "../lib/glassdayStorage";
import {
  DASHBOARD_LAYOUT_MODE_KEY,
  DASHBOARD_PENDING_AUTH_LAYOUT_MODE_KEY,
} from "../constants/dashboardStorage";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { isTauri } from "@tauri-apps/api/core";

import type { DashboardLayoutMode } from "../types/workspace";

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
const REMOTE_REFRESH_INTERVAL_MS = 30_000;
const CloudSyncContext = createContext<CloudSyncContextValue | null>(null);

/*
 * OAuth redirect용 layout 처리.
 *
 * WEB:
 * - 기존 Wide/Laptop 상태를 그대로 보존한다.
 *
 * TAURI:
 * - Window 자체가 Laptop App이므로 layout 선택 상태를 복원하지 않는다.
 * - 항상 laptop으로 고정한다.
 * - 과거 Web에서 저장된 "wide" 값이 Tauri에 침범하지 못하게 한다.
 */
const readCurrentLayoutModeForAuth = (): DashboardLayoutMode => {
  if (isTauri()) {
    return "laptop";
  }

  const params = new URLSearchParams(window.location.search);
  const urlMode = params.get("layout");

  if (urlMode === "laptop" || urlMode === "wide") {
    return urlMode;
  }

  const savedMode = window.localStorage.getItem(DASHBOARD_LAYOUT_MODE_KEY);

  return savedMode === "wide" || savedMode === "laptop"
    ? savedMode
    : "laptop";
};

const getAuthRedirectUrl = () => {
  const url = new URL(window.location.href);

  url.hash = "";

  /*
   * =========================================================
   * TAURI
   * =========================================================
   *
   * Desktop App에서는 OAuth 전후 모두 laptop으로 고정.
   * Web Preview의 Wide/Laptop 복원 로직을 사용하지 않는다.
   */
  if (isTauri()) {
    url.searchParams.set("layout", "laptop");

    window.localStorage.setItem(
      DASHBOARD_LAYOUT_MODE_KEY,
      "laptop"
    );

    window.localStorage.setItem(
      DASHBOARD_PENDING_AUTH_LAYOUT_MODE_KEY,
      "laptop"
    );

    return url.toString();
  }

  /*
   * =========================================================
   * WEB / VERCEL
   * =========================================================
   *
   * 기존 동작 그대로.
   */
  const layoutMode = readCurrentLayoutModeForAuth();

  url.searchParams.set("layout", layoutMode);

  window.localStorage.setItem(
    DASHBOARD_PENDING_AUTH_LAYOUT_MODE_KEY,
    layoutMode
  );

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
  /* 한 user의 최초 hydrate와 background refresh가 겹치지 않도록 분리한다.
     user id를 저장하면 TOKEN_REFRESHED 같은 반복 auth event가 remote 데이터를
     매번 다시 적용하는 문제도 피할 수 있다. */
  const hydratedUserIdRef = useRef<string | null>(null);
  const syncInFlightRef = useRef(false);

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

    const updatedAt = new Date().toISOString();
    const { error } = await supabase.from(STORAGE_TABLE).upsert(
      {
        user_id: session.user.id,
        payload: snapshot,
        updated_at: updatedAt,
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

    /* markGlassdayLocalSyncedAt도 storage event를 발생시키므로 이 동기 호출 동안
       upload listener를 억제해 self-triggered upload loop를 막는다. */
    suppressUploadRef.current = true;
    markGlassdayLocalSyncedAt(updatedAt);
    suppressUploadRef.current = false;
    setLastSyncedAt(updatedAt);
    setSyncState("synced");
  }, [session, setSyncState]);

  const synchronizeWithRemote = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!supabase || !session?.user || syncInFlightRef.current) return;

      const userId = session.user.id;

      if (mode === "initial" && hydratedUserIdRef.current === userId) {
        return;
      }

      syncInFlightRef.current = true;

      if (mode === "initial") {
        setSyncState("syncing", "Loading your saved dashboard...");
      }

      try {
        const { data, error } = await supabase
          .from(STORAGE_TABLE)
          .select("payload, updated_at")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error(error);
          setSyncState("error", error.message);
          return;
        }

        if (data?.payload && isCompatibleGlassdayStorageSnapshot(data.payload)) {
          const remoteSnapshot = data.payload as GlassdayStorageSnapshot;
          const remoteSyncedAt = data.updated_at ?? remoteSnapshot.exportedAt;
          const remoteTimestamp = Math.max(
            getGlassdaySnapshotTimestamp(remoteSnapshot),
            Date.parse(remoteSyncedAt)
          );
          const localTimestamp = Date.parse(getGlassdayLocalUpdatedAt() ?? "");

          /* Conflict Policy
           * - 새 기기의 최초 로그인: remote snapshot이 Source of Truth다.
           * - 로그인 이후 refresh: 더 최근 timestamp만 반대편으로 전달한다.
           * 로그인 버튼을 누른 사실만으로 local 우선 플래그를 만들지 않으므로,
           * 새 컴퓨터의 기본값이 기존 cloud 데이터를 덮어쓰지 않는다. */
          const shouldApplyRemote =
            mode === "initial" ||
            !Number.isFinite(localTimestamp) ||
            remoteTimestamp > localTimestamp;
          const shouldUploadLocal =
            mode === "refresh" &&
            Number.isFinite(localTimestamp) &&
            localTimestamp > remoteTimestamp;

          if (shouldUploadLocal) {
            setSyncState(
              "syncing",
              "Uploading newer changes from this device..."
            );
            await uploadSnapshot();
            hydratedUserIdRef.current = userId;
            return;
          }

          if (shouldApplyRemote) {
            suppressUploadRef.current = true;
            const applyResult = applyGlassdayStorageSnapshot(
              remoteSnapshot,
              remoteSyncedAt
            );
            setLastSyncedAt(remoteSyncedAt);

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
              hydratedUserIdRef.current = userId;
              return;
            }

            window.setTimeout(releaseUploadSuppression, 1200);
            setSyncState("synced", "Loaded newer dashboard data from cloud.");
            hydratedUserIdRef.current = userId;
            return;
          }

          setLastSyncedAt(remoteSyncedAt);
          setSyncState("synced", "This device is up to date.");
          hydratedUserIdRef.current = userId;
          return;
        }

        if (data?.payload) {
          setSyncState(
            "syncing",
            "Updating your cloud snapshot to the latest dashboard format..."
          );
        }

        /* 첫 cloud row가 없거나 호환되지 않을 때만 현재 기기의 durable data로 생성한다. */
        await uploadSnapshot();
        hydratedUserIdRef.current = userId;
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [session, setSyncState, uploadSnapshot]
  );

  const syncNow = useCallback(async () => {
    await synchronizeWithRemote("refresh");
  }, [synchronizeWithRemote]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return;

    setSyncState("authenticating");

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

    hydratedUserIdRef.current = null;
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
      if (hydratedUserIdRef.current !== nextSession?.user.id) {
        hydratedUserIdRef.current = null;
      }
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

    const initialSyncId = window.setTimeout(() => {
      void synchronizeWithRemote("initial");
    }, 0);

    return () => window.clearTimeout(initialSyncId);
  }, [session, synchronizeWithRemote]);

  useEffect(() => {
    if (!session?.user || !supabase) return;

    /* Cross-device Refresh
       Realtime publication 설정에 의존하지 않고, 사용자가 다른 컴퓨터에서 돌아오거나
       탭이 다시 보일 때 최신 row를 비교한다. 열린 상태에서도 30초마다 확인하되
       실제 적용/업로드는 updated_at이 달라진 경우에만 수행한다. */
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        void synchronizeWithRemote("refresh");
      }
    };

    const handleVisibilityChange = () => {
      refreshIfVisible();
    };

    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(
      refreshIfVisible,
      REMOTE_REFRESH_INTERVAL_MS
    );

    return () => {
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [session, synchronizeWithRemote]);

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
