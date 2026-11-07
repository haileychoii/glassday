/**
 * ============================================================
 * [Diary] Local media store / 사진 파일 저장소
 * ============================================================
 *
 * 연결 / Connections:
 * - Metadata owner: src/hooks/useDiaryDocument.ts
 * - UI consumer: src/components/diary/DiaryItem.tsx
 * - Browser storage: IndexedDB database `glassday-media-v1`
 *
 * localImage.ts is optimized for a few Career attachments encoded into JSON.
 * Diary pages can contain many photos, so this file stores Blob bytes outside
 * localStorage and returns only a stable assetId to the document metadata.
 */

const MEDIA_DB_NAME = "glassday-media-v1";
const MEDIA_DB_VERSION = 1;
const MEDIA_STORE_NAME = "assets";

type DiaryMediaRecord = {
  id: string;
  blob: Blob;
  name: string;
  mimeType: string;
  createdAt: number;
};

const createAssetId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `asset-${crypto.randomUUID()}`;
  }

  return `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const openMediaDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(MEDIA_DB_NAME, MEDIA_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(MEDIA_STORE_NAME)) {
        database.createObjectStore(MEDIA_STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open media store"));
  });
};

const runMediaRequest = <T>(
  mode: IDBTransactionMode,
  execute: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  return openMediaDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(MEDIA_STORE_NAME, mode);
        const request = execute(transaction.objectStore(MEDIA_STORE_NAME));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Media store request failed"));
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => reject(transaction.error ?? new Error("Media transaction failed"));
      })
  );
};

/** Store one original image Blob and return the id saved in DiaryItem.assetId. */
export const saveDiaryAsset = async (file: File): Promise<string> => {
  const id = createAssetId();
  const record: DiaryMediaRecord = {
    id,
    blob: file,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    createdAt: Date.now(),
  };

  await runMediaRequest("readwrite", (store) => store.put(record));
  return id;
};

/** Load one image Blob. The UI creates and revokes its own object URL. */
export const getDiaryAsset = async (assetId: string): Promise<Blob | null> => {
  const record = await runMediaRequest<DiaryMediaRecord | undefined>(
    "readonly",
    (store) => store.get(assetId)
  );

  return record?.blob ?? null;
};

/** Delete is intentionally explicit; removing a placed item does not silently
 * delete a shared asset that another page may still reference. */
export const deleteDiaryAsset = async (assetId: string): Promise<void> => {
  await runMediaRequest("readwrite", (store) => store.delete(assetId));
};
