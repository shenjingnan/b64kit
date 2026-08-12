import { describe, expect, it } from 'vitest';

import {
  base64ToBytes,
  base64ToText,
  buildDataUri,
  bytesToBase64,
  decodeBase64,
  isValidBase64,
  parseDataUri,
  textToBase64,
} from '@/lib/core/base64';

/** 1×1 红色 PNG 的 base64（常见测试向量） */
const RED_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('bytesToBase64 / base64ToBytes', () => {
  it('should roundtrip ASCII bytes', () => {
    const bytes = new TextEncoder().encode('hello');
    expect(bytesToBase64(bytes)).toBe('aGVsbG8=');
    expect(base64ToBytes('aGVsbG8=')).toEqual(bytes);
  });

  it('should roundtrip arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });

  it('should handle empty input', () => {
    expect(bytesToBase64(new Uint8Array())).toBe('');
    expect(base64ToBytes('')).toEqual(new Uint8Array());
  });

  it('should encode large buffers without stack overflow', () => {
    const size = 0x8000 + 137;
    const bytes = new Uint8Array(size).map((_, i) => i % 256);
    const decoded = base64ToBytes(bytesToBase64(bytes));
    expect(decoded).toEqual(bytes);
  });

  it('should accept missing padding', () => {
    expect(base64ToBytes('QQ')).toEqual(new TextEncoder().encode('A'));
  });

  it('should accept URL-safe variants', () => {
    const bytes = new Uint8Array([0xfb, 0xef, 0xbe]);
    expect(base64ToBytes('++--')).toEqual(bytes);
  });

  it('should reject invalid base64', () => {
    expect(() => base64ToBytes('%%%')).toThrow(TypeError);
    expect(() => base64ToBytes('abcde')).toThrow(TypeError);
    expect(() => base64ToBytes('a=b')).toThrow(TypeError);
  });
});

describe('textToBase64 / base64ToText', () => {
  it('should roundtrip plain text', () => {
    expect(textToBase64('hello world')).toBe('aGVsbG8gd29ybGQ=');
    expect(base64ToText(textToBase64('hello world'))).toBe('hello world');
  });

  it('should roundtrip Chinese text (UTF-8 safe)', () => {
    expect(base64ToText(textToBase64('世界你好'))).toBe('世界你好');
  });

  it('should roundtrip emoji', () => {
    expect(base64ToText(textToBase64('🎉🚀'))).toBe('🎉🚀');
  });

  it('should reject invalid UTF-8 when decoding text', () => {
    const raw = new Uint8Array([0xff, 0xfe, 0xfd]);
    expect(() => base64ToText(bytesToBase64(raw))).toThrow();
  });
});

describe('isValidBase64', () => {
  it('should accept valid base64', () => {
    expect(isValidBase64('aGVsbG8=')).toBe(true);
    expect(isValidBase64('aGVsbG8')).toBe(true);
    expect(isValidBase64('+/_-')).toBe(true);
    expect(isValidBase64('  aGVs\nbG8=  ')).toBe(true);
  });

  it('should reject invalid base64', () => {
    expect(isValidBase64('')).toBe(false);
    expect(isValidBase64('aGVsbG8!')).toBe(false);
    expect(isValidBase64('a')).toBe(false);
    expect(isValidBase64('abc===')).toBe(false);
  });
});

describe('parseDataUri / buildDataUri', () => {
  it('should parse base64 data URI', () => {
    const parsed = parseDataUri(`data:image/png;base64,${RED_PNG}`);
    expect(parsed).toEqual({ mime: 'image/png', isBase64: true, data: RED_PNG });
  });

  it('should parse text data URI without mime', () => {
    const parsed = parseDataUri('data:,hello');
    expect(parsed).toEqual({ mime: 'text/plain', isBase64: false, data: 'hello' });
  });

  it('should return null for non-data URI', () => {
    expect(parseDataUri('hello')).toBeNull();
    expect(parseDataUri('data:')).toBeNull();
  });

  it('should build data URI', () => {
    expect(buildDataUri('image/png', RED_PNG)).toBe(`data:image/png;base64,${RED_PNG}`);
  });
});

describe('decodeBase64', () => {
  it('should decode raw base64 and sniff PNG', () => {
    const result = decodeBase64(RED_PNG);
    expect(result.mime).toBe('image/png');
    expect(result.base64Data).toBe(RED_PNG);
    expect(result.dataUri).toBe(`data:image/png;base64,${RED_PNG}`);
    expect(result.bytes[0]).toBe(0x89);
  });

  it('should tolerate whitespace and newlines in raw base64', () => {
    const withBreaks =
      RED_PNG.slice(0, 20) + '\n' + RED_PNG.slice(20, 40) + '\r\n' + RED_PNG.slice(40);
    expect(decodeBase64(withBreaks).bytes).toEqual(decodeBase64(RED_PNG).bytes);
  });

  it('should decode data URI input', () => {
    const result = decodeBase64(`data:image/png;base64,${RED_PNG}`);
    expect(result.mime).toBe('image/png');
    expect(result.base64Data).toBe(RED_PNG);
  });

  it('should extract src from img tag input', () => {
    const result = decodeBase64(`<img src="data:image/png;base64,${RED_PNG}" alt="x">`);
    expect(result.mime).toBe('image/png');
    expect(result.base64Data).toBe(RED_PNG);
  });

  it('should handle non-base64 data URI as text', () => {
    const result = decodeBase64('data:text/plain,hello');
    expect(result.mime).toBe('text/plain');
    expect(base64ToText(result.base64Data)).toBe('hello');
  });

  it('should throw on empty input', () => {
    expect(() => decodeBase64('   ')).toThrow('输入为空');
  });

  it('should throw on invalid base64', () => {
    expect(() => decodeBase64('这不是base64!!!')).toThrow(TypeError);
  });
});
