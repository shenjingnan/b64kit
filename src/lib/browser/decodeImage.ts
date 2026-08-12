import type { DecodedImage, ImageDecoder } from '@/lib/core/types';

/**
 * 浏览器图片解码器：createImageBitmap 优先，Safari 等环境降级到 Image + canvas。
 */
export function createBrowserImageDecoder(): ImageDecoder {
  return {
    async decode(data: Uint8Array, mime: string): Promise<DecodedImage> {
      const blob = new Blob([data as unknown as BlobPart], { type: mime });
      const bitmap = await decodeToBitmap(blob);
      const width = bitmap.width;
      const height = bitmap.height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx === null) {
        throw new Error('无法获取 2D 绘图上下文');
      }
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, width, height);
      if ('close' in bitmap) {
        bitmap.close();
      }
      return { width, height, pixels: imageData.data };
    },
  };
}

type DecodedSource = ImageBitmap | HTMLImageElement;

async function decodeToBitmap(blob: Blob): Promise<DecodedSource> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob);
    } catch {
      // 某些格式（如 SVG）不支持 createImageBitmap，降级到 Image
    }
  }
  return decodeViaImage(blob);
}

function decodeViaImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片解码失败'));
    };
    img.src = url;
  });
}
