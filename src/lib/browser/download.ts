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
