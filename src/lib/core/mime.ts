/**
 * 从图片文件头（魔数）嗅探 MIME 类型。
 */

/** 文本型 XML / SVG 检测窗口（需覆盖 <?xml?> 声明 + 根标签） */
const SNIFF_TEXT_BYTES = 256;
/** sniffMimeFromBase64 解码的前缀字符数 */
const SNIFF_CHARS = 256;

/**
 * 从字节数组嗅探 MIME 类型，未知返回 application/octet-stream。
 */
export function sniffMime(bytes: Uint8Array): string {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // GIF: GIF87a / GIF89a（"GIF8" 4 字节即可区分两种变体）
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return 'image/gif';
  }

  // WebP: "RIFF" @0 + "WEBP" @8
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  // BMP: "BM"
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return 'image/bmp';
  }

  // ICO: 00 00 01 00
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x00 &&
    bytes[1] === 0x00 &&
    bytes[2] === 0x01 &&
    bytes[3] === 0x00
  ) {
    return 'image/x-icon';
  }

  // 文本型 SVG / XML
  if (bytes.length >= 4) {
    const prefix = new TextDecoder('utf-8', { fatal: false })
      .decode(bytes.subarray(0, Math.min(bytes.length, SNIFF_TEXT_BYTES)))
      .trimStart();
    // SVG 可能带 <?xml?> 声明后再出现 <svg>
    if (prefix.startsWith('<svg') || (prefix.startsWith('<?xml') && prefix.includes('<svg'))) {
      return 'image/svg+xml';
    }
    if (prefix.startsWith('<?xml') || prefix.startsWith('<!DOCTYPE') || /^<[a-zA-Z]/.test(prefix)) {
      return 'application/xml';
    }
  }

  // 无已知魔数时：可读文本（ASCII 艺术、普通文本等）按 text/plain 处理
  if (looksLikeText(bytes)) {
    return 'text/plain';
  }

  return 'application/octet-stream';
}

/**
 * 粗略判断字节内容是否像可读文本：控制字符占比低、以可打印 ASCII / 空白为主。
 */
function looksLikeText(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, 512);
  if (sample.length === 0) {
    return false;
  }
  let safe = 0;
  for (const b of sample) {
    // 空白与可打印 ASCII
    if (b === 0x09 || b === 0x0a || b === 0x0d || (b >= 0x20 && b <= 0x7e)) {
      safe += 1;
      // 高字节视为 UTF-8 文本（中文等）
    } else if (b >= 0x80) {
      safe += 1;
    }
  }
  return safe / sample.length >= 0.9;
}

/** MIME 类型 → 文件扩展名（不含点） */
export function mimeExtension(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    case 'image/bmp':
      return 'bmp';
    case 'image/x-icon':
      return 'ico';
    case 'image/svg+xml':
      return 'svg';
    default:
      return 'bin';
  }
}

/**
 * 从 base64 字符串嗅探 MIME 类型。只解码前缀字节，避免整体解码大字符串。
 */
export function sniffMimeFromBase64(base64: string): string {
  const cleaned = base64.replace(/\s+/g, '');
  const head = cleaned.slice(0, SNIFF_CHARS);
  try {
    const normalized = head.replace(/-/g, '+').replace(/_/g, '/');
    let padded = normalized;
    while (padded.length % 4 !== 0) {
      padded += '=';
    }
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return sniffMime(bytes);
  } catch {
    return 'application/octet-stream';
  }
}
