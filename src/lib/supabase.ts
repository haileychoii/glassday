/**
 * ============================================================
 * [Infrastructure] Supabase Browser Client
 * ============================================================
 *
 * 역할:
 * - VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY가 있을 때만 browser client를 만든다.
 * - 인증 session은 브라우저에 유지되며 OAuth callback URL도 자동 감지한다.
 *
 * 연결:
 * - Consumer: src/context/CloudSyncContext.tsx
 * - UI: src/components/settings/SettingsModal.tsx가 Context를 통해 상태를 표시한다.
 * - 실제 table/query와 snapshot 정책은 이 파일이 아니라 CloudSyncContext와
 *   src/lib/glassdayStorage.ts에 있다.
 *
 * 보안 경계:
 * - browser에는 public anon key만 사용한다. service role/secret key를 넣지 않는다.
 * ============================================================
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
