/**
 * ============================================================
 * [Settings Data Tool] Backup, Import, and Reset
 * ============================================================
 *
 * 화면 역할:
 * - src/components/settings/SettingsModal.tsx의 Backup/Reset section action을 제공한다.
 *
 * 데이터 연결:
 * - Snapshot format/prefix: src/lib/glassdayStorage.ts
 * - Backup 파일은 cloud snapshot과 같은 versioned JSON 구조를 사용한다.
 * - import 후 bulk storage event가 발생해 열린 Widget도 즉시 갱신된다.
 *
 * 수정 영향:
 * - reset filter는 실제 localStorage key 이름에 의존한다.
 * - 새 persistence key를 추가할 때 cloud 포함 여부와 backup/reset 범위를 함께 확인한다.
 * ============================================================
 */
import {
  applyGlassdayStorageSnapshot,
  batchGlassdayStorageChanges,
  createGlassdayStorageSnapshot,
  getGlassdayLocalStorageKeys,
  GLASSDAY_STORAGE_SNAPSHOT_VERSION,
  type GlassdayStorageSnapshot,
} from "../lib/glassdayStorage";

type GlassdayBackup = GlassdayStorageSnapshot;

export const createGlassdayBackup = (): GlassdayBackup =>
  createGlassdayStorageSnapshot();

export const downloadGlassdayBackup = () => {
  const backup = createGlassdayBackup();

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  const date = new Date().toISOString().slice(0, 10);

  a.href = url;
  a.download = `glassday-backup-${date}.json`;

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
};

/** Validate the entire envelope before touching storage. Legacy versions 1-3 use
 * the same string map; glassdayStorage.ts still enforces its content allowlist.
 * 한국어: 잘못된 파일은 일부만 덮어쓰지 않고, 쓰기 전에 전체 구조를 먼저 확인한다.
 */
export const parseGlassdayBackup = (text: string): GlassdayBackup => {
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("This is not a valid Glassday backup file.");
  }
  const candidate = parsed as Partial<GlassdayBackup>;
  if (
    candidate.app !== "Glassday" || !Number.isInteger(candidate.version) ||
    candidate.version < 1 || candidate.version > GLASSDAY_STORAGE_SNAPSHOT_VERSION ||
    typeof candidate.exportedAt !== "string" || !Number.isFinite(Date.parse(candidate.exportedAt)) ||
    !candidate.data || typeof candidate.data !== "object" || Array.isArray(candidate.data) ||
    !Object.entries(candidate.data).every(([key, value]) =>
      key.startsWith("glassday.") && typeof value === "string")
  ) throw new Error("Unsupported or damaged Glassday backup file.");
  return candidate as GlassdayBackup;
};

export const importGlassdayBackupFile = async (
  file: File,
  confirmOverwrite: () => boolean = () => true
) => {
  const parsed = parseGlassdayBackup(await file.text());
  if (!confirmOverwrite()) return false;
  applyGlassdayStorageSnapshot(parsed);
  return true;
};

export const resetGlassdayData = () => {
  getGlassdayLocalStorageKeys().forEach((key) => {
    localStorage.removeItem(key);
  });
};

export const resetGlassdaySection = (section: string) => {
  // SettingsModal passes memo/study/journal/calendar; only that namespace changes.
  // 한국어: contains 검색으로 다른 위젯의 키까지 삭제하지 않도록 접두사를 일치시킨다.
  batchGlassdayStorageChanges(() => {
    getGlassdayLocalStorageKeys().forEach((key) => {
      if (key.startsWith(`glassday.${section.toLowerCase()}.`)) localStorage.removeItem(key);
    });
  });
};

export const resetGlassdayLayout = () => {
  // useDashboardTabs owns these two keys and restores defaults on removal.
  // 한국어: 화면 모드·테마·글꼴·위젯 내용은 유지하고 탭과 배치만 초기화한다.
  batchGlassdayStorageChanges(() => {
    localStorage.removeItem("glassday.dashboard.tabs.v1");
    localStorage.removeItem("glassday.dashboard.activeTab.v1");
  });
};
