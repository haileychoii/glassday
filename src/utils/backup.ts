type GlassdayBackup = {
  app: "Glassday";
  version: 1;
  exportedAt: string;
  data: Record<string, string>;
};

const GLASSDAY_PREFIX = "glassday.";

export const getGlassdayLocalStorageKeys = () => {
  return Object.keys(localStorage).filter((key) =>
    key.startsWith(GLASSDAY_PREFIX)
  );
};

export const createGlassdayBackup = (): GlassdayBackup => {
  const data: Record<string, string> = {};

  getGlassdayLocalStorageKeys().forEach((key) => {
    const value = localStorage.getItem(key);

    if (value !== null) {
      data[key] = value;
    }
  });

  return {
    app: "Glassday",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
};

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

  Object.entries(parsed.data).forEach(([key, value]) => {
    if (key.startsWith(GLASSDAY_PREFIX)) {
      localStorage.setItem(key, value);
    }
  });
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