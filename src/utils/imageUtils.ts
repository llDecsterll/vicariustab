const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const MAX_DIMENSION = 2400;
const JPEG_QUALITY = 0.88;
const DIRECT_UPLOAD_LIMIT = 800 * 1024;

export type PreparePhotoError = 'NOT_IMAGE' | 'TOO_LARGE' | 'CANVAS' | 'LOAD_FAILED';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('LOAD_FAILED'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('LOAD_FAILED'));
    };
    img.src = url;
  });
}

/** Prepare equipment photo: accept large files, store as optimized data URL for lightbox viewing. */
export async function prepareEquipmentPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('NOT_IMAGE' satisfies PreparePhotoError);
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('TOO_LARGE' satisfies PreparePhotoError);
  }

  if (file.size <= DIRECT_UPLOAD_LIMIT) {
    const img = await loadImageElement(file);
    if (img.naturalWidth <= MAX_DIMENSION && img.naturalHeight <= MAX_DIMENSION) {
      return readFileAsDataUrl(file);
    }
  }

  const img = await loadImageElement(file);
  const { naturalWidth: width, naturalHeight: height } = img;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('CANVAS' satisfies PreparePhotoError);
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);

  const usePng = file.type === 'image/png';
  return usePng
    ? canvas.toDataURL('image/png')
    : canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}
