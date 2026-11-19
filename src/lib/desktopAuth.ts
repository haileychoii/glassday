/**
 * Desktop OAuth return address shared by CloudSyncContext.tsx and the Tauri
 * deep-link scheme in src-tauri/tauri.conf.json. / 인증 후 웹사이트가 아닌 설치된
 * Glassday로 돌아오기 위한 주소다. Supabase Auth Redirect URLs에도 추가해야 한다.
 */
export const DESKTOP_AUTH_CALLBACK_URL = "glassday-desktop://auth/callback";

export type DesktopAuthCallback =
  | { code: string; error?: never }
  | { error: string; code?: never };

/** Accept only our exact callback; other custom-protocol links are ignored.
 * 앱이 받은 임의의 링크를 로그인 코드로 처리하지 않도록 경로까지 검사한다. */
export const readDesktopAuthCallback = (
  rawUrl: string
): DesktopAuthCallback | null => {
  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== "glassday-desktop:" ||
      url.hostname !== "auth" ||
      url.pathname !== "/callback" ||
      url.username ||
      url.password
    ) {
      return null;
    }

    const fragment = new URLSearchParams(url.hash.slice(1));
    const error =
      url.searchParams.get("error_description") ||
      fragment.get("error_description") ||
      url.searchParams.get("error") ||
      fragment.get("error");
    if (error) return { error };

    const code = url.searchParams.get("code");
    return code ? { code } : { error: "No sign-in code was returned." };
  } catch {
    return null;
  }
};
