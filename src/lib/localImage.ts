/**
 * ============================================================
 * [Data Utility] Local Image Validation + Resize
 * ============================================================
 *
 * 역할:
 * - Career detail과 Memo editor에 추가되는 로컬 이미지를 WebP data URL로 변환한다.
 * - 원본 크기/파일 형식을 검사하고 긴 변을 제한해 local/cloud JSON snapshot이
 *   불필요하게 커지는 것을 줄인다.
 *
 * 연결:
 * - Consumers: CareerWidget 계열, MemoWidget
 * - Persistence: 변환 결과는 각 Widget data 안에 포함되어 useLocalStorage와
 *   CloudSync snapshot 경로로 저장된다.
 *
 * Figma Mapping:
 * - 이 파일은 UI를 만들지 않으며 Image Attachment/Gallery Component의
 *   업로드 전 data pipeline만 담당한다.
 * ============================================================
 */
export type LocalImageOptions = {
  /** 사용자가 선택할 수 있는 원본 파일의 최대 byte 수. */
  maxInputBytes: number;
  /** resize 후 가로/세로 중 긴 변의 최대 pixel 수. */
  maxEdge: number;
  /** WebP encoding 품질. 생략 시 prepareLocalImageDataUrl의 기본값을 사용한다. */
  quality?: number;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("사진 파일을 읽지 못했어."));
    reader.readAsDataURL(file);
  });

const loadImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("사진 형식을 열 수 없어."));
    image.src = source;
  });

/* Local snapshot image preparation:
   Career와 Memo가 같은 검증/resize 경로를 사용하도록 저장 직전 처리를 한곳에서 담당한다. */
export const prepareLocalImageDataUrl = async (
  file: File,
  options: LocalImageOptions
) => {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name}: 이미지 파일만 추가할 수 있어.`);
  }

  if (file.size > options.maxInputBytes) {
    const maxMegabytes = Math.round(options.maxInputBytes / (1024 * 1024));
    throw new Error(`${file.name}: 원본은 ${maxMegabytes}MB 이하만 추가할 수 있어.`);
  }

  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const scale = Math.min(
    1,
    options.maxEdge / Math.max(image.naturalWidth, image.naturalHeight)
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("브라우저에서 사진 변환을 시작하지 못했어.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/webp", options.quality ?? 0.8);
};
