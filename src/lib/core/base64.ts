import { sniffMimeFromBase64 } from './mime';

/** 分批拼接时的块大小，避免 String.fromCharCode(...大数组) 调用栈溢出 */
const CHUNK_SIZE = 0x8000;

/**
 * Uint8Array 转标准 base64 字符串。
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}

/**
 * UTF-8 文本转 base64 字符串。
 */
export function textToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

/**
 * 判断字符串是否为合法的 base64（容忍换行空白与 URL-safe 变体，容忍缺失 padding）。
 */
export function isValidBase64(input: string): boolean {
  const cleaned = input.replace(/\s+/g, '');
  if (cleaned.length === 0) {
    return false;
  }
  if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(cleaned)) {
    return false;
  }
  const mod = cleaned.length % 4;
  // mod === 1 的 base64 长度不可能合法
  return mod === 0 || mod === 2 || mod === 3;
}

/**
 * base64 字符串转 Uint8Array。
 * @throws {TypeError} 非法 base64 时抛出
 */
export function base64ToBytes(input: string): Uint8Array {
  const cleaned = input.replace(/\s+/g, '');
  if (cleaned.length === 0) {
    return new Uint8Array();
  }
  if (!isValidBase64(cleaned)) {
    throw new TypeError('非法 base64 字符串');
  }
  const normalized = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  let padded = normalized;
  while (padded.length % 4 !== 0) {
    padded += '=';
  }
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * base64 字符串解码为 UTF-8 文本。
 * @throws {TypeError} 非法 base64 或解码结果不是合法 UTF-8 时抛出
 */
export function base64ToText(input: string): string {
  const bytes = base64ToBytes(input);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/**
 * 解析 data URI，例如 data:image/png;base64,xxxx
 */
export interface ParsedDataUri {
  mime: string;
  isBase64: boolean;
  data: string;
}

export function parseDataUri(uri: string): ParsedDataUri | null {
  if (!uri.startsWith('data:')) {
    return null;
  }
  const commaIndex = uri.indexOf(',');
  if (commaIndex === -1) {
    return null;
  }
  const meta = uri.slice(5, commaIndex);
  const data = uri.slice(commaIndex + 1);
  const parts = meta.split(';');
  const isBase64 = parts.includes('base64');
  const mimePart = parts[0] ?? '';
  const mime = mimePart.length > 0 && mimePart.includes('/') ? mimePart : 'text/plain';
  return { mime, isBase64, data };
}

/**
 * 构造 data URI：data:<mime>;base64,<data>
 */
export function buildDataUri(mime: string, base64Data: string): string {
  return `data:${mime};base64,${base64Data}`;
}

/** 解码方向的结果 */
export interface DecodeResult {
  /** 解码出的原始字节 */
  bytes: Uint8Array;
  /** 嗅探或声明出的 MIME 类型 */
  mime: string;
  /** 完整 data URI（用于 <img> 预览） */
  dataUri: string;
  /** 不含 data URI 前缀的 base64 数据段 */
  base64Data: string;
}

const IMG_SRC_RE = /<img[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i;

/**
 * 解码方向的统一入口：把用户输入归一化为字节 + MIME + data URI。
 * 支持三种输入形态：原始 base64 文本、data URI、<img src="..."> 标签。
 * @throws {Error} 输入为空或无法解析时抛出
 */
export function decodeBase64(input: string): DecodeResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new Error('输入为空');
  }

  let target = trimmed;
  if (!target.startsWith('data:')) {
    const match = trimmed.match(IMG_SRC_RE);
    if (match !== null) {
      const src = match[1] ?? match[2];
      if (src === undefined || src === '') {
        throw new Error('无法从 <img> 标签中提取 src');
      }
      target = src;
    }
  }

  if (target.startsWith('data:')) {
    const parsed = parseDataUri(target);
    if (parsed === null) {
      throw new Error('无法解析 data URI');
    }
    if (!parsed.isBase64) {
      const bytes = new TextEncoder().encode(parsed.data);
      const base64Data = bytesToBase64(bytes);
      return {
        bytes,
        mime: parsed.mime,
        dataUri: buildDataUri(parsed.mime, base64Data),
        base64Data,
      };
    }
    const base64Data = parsed.data;
    const bytes = base64ToBytes(base64Data);
    return { bytes, mime: parsed.mime, dataUri: buildDataUri(parsed.mime, base64Data), base64Data };
  }

  const base64Data = target.replace(/\s+/g, '');
  const bytes = base64ToBytes(base64Data);
  const mime = sniffMimeFromBase64(base64Data);
  return { bytes, mime, dataUri: buildDataUri(mime, base64Data), base64Data };
}
