import { bytesToBase64 } from '@/lib/core/base64';

/**
 * 触发浏览器下载 Blob / 字节数据。
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadBytes(bytes: Uint8Array, mime: string, filename: string): void {
  downloadBlob(new Blob([bytes as unknown as BlobPart], { type: mime }), filename);
}

/**
 * 保存图片：B站 App 内优先通过 Toy SDK 保存到系统相册，
 * 其他环境（桌面 / 手机浏览器，即 `isSupport('saveImageToAlbum')` 为 false）
 * 或相册保存失败时，回退为标准浏览器下载。
 */
export async function saveImageBytes(
  bytes: Uint8Array,
  mime: string,
  filename: string
): Promise<void> {
  if (typeof window.toy !== 'undefined' && (await window.toy.isSupport('saveImageToAlbum'))) {
    try {
      await window.toy.saveImageToAlbum({
        base64Data: bytesToBase64(bytes),
        hintMsg: '保存到系统相册需要相册权限',
      });
      return;
    } catch {
      // 相册保存失败（如图片 base64 超过 2M、权限被拒等）时回退浏览器下载
    }
  }
  downloadBytes(bytes, mime, filename);
}
