/**
 * 生成内嵌 base64 图片数据的通用 XML 包装。
 */

/** XML 文本与属性转义 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 生成 <image><mime>…</mime><data>…</data></image> 结构。
 * base64 数据段仅包含 A-Za-z0-9+/=，无需 XML 转义。
 */
export function buildImageXml(mime: string, base64Data: string): string {
  return `<image><mime>${escapeXml(mime)}</mime><data>${base64Data}</data></image>`;
}
