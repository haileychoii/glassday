/**
 * Tauri desktop window helpers.
 *
 * EN: The browser build never calls these methods. Tauri uses the same
 * shared dashboard, but can keep its native window above other applications.
 * KO: 웹 빌드에서는 호출하지 않고, Tauri에서만 네이티브 창 고정 상태를
 * 읽고 변경한다. 위젯 데이터와 창 UI 설정을 분리하기 위한 작은 경계다.
 */
import { getCurrentWindow } from "@tauri-apps/api/window";

export const getTauriWindowPinned = async (): Promise<boolean> => {
  return getCurrentWindow().isAlwaysOnTop();
};

export const setTauriWindowPinned = async (
  pinned: boolean
): Promise<void> => {
  await getCurrentWindow().setAlwaysOnTop(pinned);
};
