import { describe, expect, it } from 'vitest';

import {
  asciiFromBase64,
  buildRamp,
  computeAsciiRows,
  DEFAULT_RAMP,
  luminance,
  mapLuminance,
  pixelsToAscii,
} from '@/lib/core/ascii';
import { bytesToBase64 } from '@/lib/core/base64';
import type { ImageDecoder } from '@/lib/core/types';

/** 2×1 像素：左黑右白（RGBA） */
const BLACK_WHITE = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
const ALL_BLACK = new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 255]);
const ALL_WHITE = new Uint8ClampedArray([255, 255, 255, 255, 255, 255, 255, 255]);

function makePixels(
  width: number,
  height: number,
  color: [number, number, number]
): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    pixels[i * 4] = color[0];
    pixels[i * 4 + 1] = color[1];
    pixels[i * 4 + 2] = color[2];
    pixels[i * 4 + 3] = 255;
  }
  return pixels;
}

describe('luminance', () => {
  it('should compute Rec.601 luminance', () => {
    expect(luminance(0, 0, 0)).toBe(0);
    expect(luminance(255, 255, 255)).toBe(255);
    expect(luminance(255, 0, 0)).toBeCloseTo(76.245, 3);
  });
});

describe('buildRamp', () => {
  it('should preserve ramp order by default', () => {
    const ramp = buildRamp(DEFAULT_RAMP, false);
    expect(ramp[0]).toBe('@');
    expect(ramp[ramp.length - 1]).toBe(' ');
  });

  it('should reverse ramp when inverted', () => {
    const ramp = buildRamp(DEFAULT_RAMP, true);
    expect(ramp[0]).toBe(' ');
    expect(ramp[ramp.length - 1]).toBe('@');
  });

  it('should handle emoji (surrogate pairs) in ramp', () => {
    const ramp = buildRamp('☀🌙', false);
    expect(ramp).toEqual(['☀', '🌙']);
  });
});

describe('mapLuminance', () => {
  const ramp = [...DEFAULT_RAMP];

  it('should map 0 luminance to darkest char', () => {
    expect(mapLuminance(0, ramp)).toBe('@');
  });

  it('should map 255 luminance to lightest char', () => {
    expect(mapLuminance(255, ramp)).toBe(' ');
  });

  it('should map mid luminance to middle char', () => {
    expect(mapLuminance(128, ramp)).toBe('=');
  });

  it('should return space for empty ramp', () => {
    expect(mapLuminance(128, [])).toBe(' ');
  });
});

describe('computeAsciiRows', () => {
  it('should account for character aspect ratio', () => {
    expect(computeAsciiRows(200, 200, { cols: 100 })).toBe(50);
  });

  it('should scale rows by image aspect', () => {
    expect(computeAsciiRows(400, 200, { cols: 100 })).toBe(25);
  });

  it('should not go below one row', () => {
    expect(computeAsciiRows(200, 200, { cols: 1 })).toBe(1);
  });

  it('should return 1 for invalid input', () => {
    expect(computeAsciiRows(0, 200, { cols: 100 })).toBe(1);
  });
});

describe('pixelsToAscii', () => {
  it('should render black pixels as darkest char', () => {
    expect(pixelsToAscii(ALL_BLACK, 2, 1, { cols: 2 })).toBe('@@');
  });

  it('should render white pixels as lightest char', () => {
    expect(pixelsToAscii(ALL_WHITE, 2, 1, { cols: 2 })).toBe('  ');
  });

  it('should render black and white halves distinctly', () => {
    expect(pixelsToAscii(BLACK_WHITE, 2, 1, { cols: 2 })).toBe('@ ');
  });

  it('should invert colors', () => {
    expect(pixelsToAscii(ALL_BLACK, 2, 1, { cols: 2, invert: true })).toBe('  ');
  });

  it('should support custom ramp', () => {
    expect(pixelsToAscii(ALL_WHITE, 1, 1, { cols: 1, ramp: ' .' })).toBe('.');
    expect(pixelsToAscii(ALL_BLACK, 1, 1, { cols: 1, ramp: ' .' })).toBe(' ');
  });

  it('should produce correct number of rows', () => {
    const twoByTwo = makePixels(2, 2, [100, 100, 100]);
    const text = pixelsToAscii(twoByTwo, 2, 2, { cols: 2 });
    expect(text.split('\n')).toHaveLength(1);
  });

  it('should support nearest sampling', () => {
    expect(pixelsToAscii(BLACK_WHITE, 2, 1, { cols: 2, sampling: 'nearest' })).toBe('@ ');
  });

  it('should return empty string for invalid input', () => {
    expect(pixelsToAscii(new Uint8ClampedArray(), 0, 0, { cols: 2 })).toBe('');
  });

  it('should average a mixed 2x1 cell into a mid char', () => {
    const halfBlackHalfWhite = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
    // 2 源像素合并到 1 个单元格：平均亮度 127.5 → 渐变表 index 4 = '+'
    expect(pixelsToAscii(halfBlackHalfWhite, 2, 1, { cols: 1 })).toBe('+');
  });
});

describe('asciiFromBase64', () => {
  it('should orchestrate decode via injected decoder', async () => {
    const fakeDecoder: ImageDecoder = {
      decode: async () => ({ width: 2, height: 1, pixels: BLACK_WHITE }),
    };
    const base64 = bytesToBase64(new Uint8Array(BLACK_WHITE));
    const text = await asciiFromBase64(base64, fakeDecoder, { cols: 2 });
    expect(text).toBe('@ ');
  });
});
