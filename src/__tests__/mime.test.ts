import { describe, expect, it } from 'vitest';

import { bytesToBase64 } from '@/lib/core/base64';
import { mimeExtension, sniffMime, sniffMimeFromBase64 } from '@/lib/core/mime';

function toBytes(hex: number[]): Uint8Array {
  return new Uint8Array(hex);
}

describe('sniffMime (字节签名)', () => {
  it('should detect PNG', () => {
    expect(sniffMime(toBytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]))).toBe(
      'image/png'
    );
  });

  it('should detect JPEG', () => {
    expect(sniffMime(toBytes([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]))).toBe('image/jpeg');
  });

  it('should detect GIF', () => {
    expect(sniffMime(new TextEncoder().encode('GIF89a...'))).toBe('image/gif');
  });

  it('should detect WebP', () => {
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x00,
    ]);
    expect(sniffMime(webp)).toBe('image/webp');
  });

  it('should detect BMP', () => {
    expect(sniffMime(new TextEncoder().encode('BM....'))).toBe('image/bmp');
  });

  it('should detect ICO', () => {
    expect(sniffMime(toBytes([0x00, 0x00, 0x01, 0x00, 0x01, 0x00]))).toBe('image/x-icon');
  });

  it('should detect SVG text', () => {
    expect(sniffMime(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">'))).toBe(
      'image/svg+xml'
    );
  });

  it('should detect SVG even with XML declaration', () => {
    expect(
      sniffMime(
        new TextEncoder().encode('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg">')
      )
    ).toBe('image/svg+xml');
  });

  it('should detect generic XML with root tag', () => {
    expect(sniffMime(new TextEncoder().encode('<image><mime>image/png</mime></image>'))).toBe(
      'application/xml'
    );
  });

  it('should detect XML with declaration', () => {
    expect(sniffMime(new TextEncoder().encode('<?xml version="1.0"?><root/>'))).toBe(
      'application/xml'
    );
  });

  it('should detect ASCII art text as text/plain', () => {
    const art = '    _    ____   ___ ___ ___      _         _        _';
    expect(sniffMime(new TextEncoder().encode(art))).toBe('text/plain');
  });

  it('should return octet-stream for binary bytes with control chars', () => {
    expect(sniffMime(toBytes([0x01, 0x02, 0x03, 0x04]))).toBe('application/octet-stream');
    expect(sniffMime(new Uint8Array())).toBe('application/octet-stream');
  });
});

describe('sniffMimeFromBase64 (base64 前缀)', () => {
  it('should detect PNG from common prefix', () => {
    expect(sniffMimeFromBase64('iVBORw0KGgo')).toBe('image/png');
  });

  it('should detect JPEG from common prefix', () => {
    expect(sniffMimeFromBase64('/9j/')).toBe('image/jpeg');
  });

  it('should detect GIF from common prefix', () => {
    expect(sniffMimeFromBase64('R0lGOD')).toBe('image/gif');
  });

  it('should detect SVG from common prefix', () => {
    expect(sniffMimeFromBase64('PHN2Zw==')).toBe('image/svg+xml');
  });

  it('should detect WebP from full signature prefix', () => {
    const webpPrefix = bytesToBase64(
      new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])
    );
    expect(sniffMimeFromBase64(webpPrefix)).toBe('image/webp');
  });

  it('should detect XML from base64 prefix', () => {
    const xmlB64 = bytesToBase64(new TextEncoder().encode('<?xml version="1.0"?><image>'));
    expect(sniffMimeFromBase64(xmlB64)).toBe('application/xml');
  });

  it('should detect plain text from base64 prefix', () => {
    const b64 = bytesToBase64(new TextEncoder().encode('hello world'));
    expect(sniffMimeFromBase64(b64)).toBe('text/plain');
  });

  it('should return octet-stream for invalid head', () => {
    expect(sniffMimeFromBase64('!!!not base64!!!')).toBe('application/octet-stream');
  });
});

describe('mimeExtension', () => {
  it('should map known image mime types to extensions', () => {
    expect(mimeExtension('image/png')).toBe('png');
    expect(mimeExtension('image/jpeg')).toBe('jpg');
    expect(mimeExtension('image/gif')).toBe('gif');
    expect(mimeExtension('image/webp')).toBe('webp');
    expect(mimeExtension('image/bmp')).toBe('bmp');
    expect(mimeExtension('image/x-icon')).toBe('ico');
    expect(mimeExtension('image/svg+xml')).toBe('svg');
  });

  it('should fall back to bin for unknown mime', () => {
    expect(mimeExtension('application/octet-stream')).toBe('bin');
  });
});
