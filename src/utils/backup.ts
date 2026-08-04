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
  createGlassdayStorageSnapshot,
  getGlassdayLocalStorageKeys,
  GLASSDAY_STORAGE_PREFIX,
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

export const importGlassdayBackupFile = async (file: File) => {
  const text = await file.text();
  const parsed = JSON.parse(text) as GlassdayBackup;

  if (parsed.app !== "Glassday" || !parsed.data) {
    throw new Error("This is not a valid Glassday backup file.");
  }

  applyGlassdayStorageSnapshot(parsed);
};

export const resetGlassdayData = () => {
  getGlassdayLocalStorageKeys().forEach((key) => {
    localStorage.removeItem(key);
  });
};

export const resetGlassdaySection = (section: string) => {
  getGlassdayLocalStorageKeys().forEach((key) => {
    const lowerKey = key.toLowerCase();

    if (lowerKey.includes(section.toLowerCase())) {
      localStorage.removeItem(key);
    }
  });
};

export const resetGlassdayLayout = () => {
  getGlassdayLocalStorageKeys().forEach((key) => {
    const lowerKey = key.toLowerCase();

    if (
      lowerKey.includes("layout") ||
      lowerKey.includes("grid") ||
      lowerKey.includes("dashboard")
    ) {
      localStorage.removeItem(key);
    }
  });
};
