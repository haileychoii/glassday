export type LocalImageOptions = {
  maxInputBytes: number;
  maxEdge: number;
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

/* Local snapshot image preparation
   Career and Memo both persist inside Glassday JSON snapshots. This helper
   validates and resizes camera originals before they enter local/cloud state.
   Career와 Memo가 같은 용량 기준을 쓰도록 저장 직전 이미지 처리를 한곳에서 담당합니다. */
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
