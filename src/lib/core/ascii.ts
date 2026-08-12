import { base64ToBytes } from './base64';
import { sniffMimeFromBase64 } from './mime';
import type { ImageDecoder } from './types';

/** 默认字符渐变表：左侧深、右侧浅 */
export const DEFAULT_RAMP = '@%#*+=-:. ';

export interface AsciiOptions {
  /** 目标字符列数（宽度） */
  cols: number;
  /** 字符渐变表，默认 DEFAULT_RAMP */
  ramp?: string;
  /** 反色 */
  invert?: boolean;
  /** 字符单元高宽比（等宽字体字符高≈2×宽，默认 0.5） */
  charAspect?: number;
  /** 采样方式 */
  sampling?: 'box' | 'nearest';
}

/**
 * 计算像素亮度（Rec.601 加权）。
 */
export function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * 由渐变表构建字符数组，支持反色（用 spread 兼容 emoji 代理对）。
 */
export function buildRamp(ramp: string, invert: boolean): readonly string[] {
  const chars = [...ramp];
  return invert ? chars.reverse() : chars;
}

/**
 * 亮度（0–255）映射到渐变字符：0 → 首字符（最深），255 → 末字符（最浅）。
 */
export function mapLuminance(l: number, ramp: readonly string[]): string {
  if (ramp.length === 0) {
    return ' ';
  }
  const index = Math.min(ramp.length - 1, Math.floor((l / 256) * ramp.length));
  return ramp[index] ?? ' ';
}

/**
 * 计算目标字符行数（按字符纵横比换算）。
 */
export function computeAsciiRows(srcW: number, srcH: number, opts: AsciiOptions): number {
  const { cols, charAspect = 0.5 } = opts;
  if (srcW <= 0 || cols <= 0) {
    return 1;
  }
  return Math.max(1, Math.round(cols * (srcH / srcW) * charAspect));
}

/**
 * 把 RGBA 像素缓冲转换为 ASCII 字符画。
 * box 采样为 O(源像素) 的区域平均；nearest 取单元格中心像素。
 */
export function pixelsToAscii(
  pixels: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  opts: AsciiOptions
): string {
  const { cols, ramp = DEFAULT_RAMP, invert = false, charAspect = 0.5, sampling = 'box' } = opts;
  if (cols <= 0 || srcW <= 0 || srcH <= 0 || pixels.length < 4) {
    return '';
  }
  const rampChars = buildRamp(ramp, invert);
  const rows = computeAsciiRows(srcW, srcH, { cols, charAspect });
  const grid = buildLuminanceGrid(pixels, srcW, srcH, cols, rows, sampling);
  return gridToAscii(grid, cols, rows, rampChars);
}

function buildLuminanceGrid(
  pixels: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  cols: number,
  rows: number,
  sampling: 'box' | 'nearest'
): Float64Array {
  const grid = new Float64Array(cols * rows);

  if (sampling === 'nearest') {
    for (let row = 0; row < rows; row += 1) {
      const centerY = Math.min(srcH - 1, Math.floor((row + 0.5) * (srcH / rows)));
      for (let col = 0; col < cols; col += 1) {
        const centerX = Math.min(srcW - 1, Math.floor((col + 0.5) * (srcW / cols)));
        const idx = (centerY * srcW + centerX) * 4;
        grid[row * cols + col] = luminance(
          pixels[idx] ?? 0,
          pixels[idx + 1] ?? 0,
          pixels[idx + 2] ?? 0
        );
      }
    }
    return grid;
  }

  // box：把每个源像素累加进其所在单元格，再求平均（整体 O(源像素)）
  const sums = new Float64Array(cols * rows * 3);
  const counts = new Int32Array(cols * rows);
  for (let y = 0; y < srcH; y += 1) {
    const gridY = Math.min(rows - 1, Math.floor((y * rows) / srcH));
    for (let x = 0; x < srcW; x += 1) {
      const gridX = Math.min(cols - 1, Math.floor((x * cols) / srcW));
      const srcIdx = (y * srcW + x) * 4;
      const cell = (gridY * cols + gridX) * 3;
      sums[cell] = (sums[cell] ?? 0) + (pixels[srcIdx] ?? 0);
      sums[cell + 1] = (sums[cell + 1] ?? 0) + (pixels[srcIdx + 1] ?? 0);
      sums[cell + 2] = (sums[cell + 2] ?? 0) + (pixels[srcIdx + 2] ?? 0);
      counts[gridY * cols + gridX] = (counts[gridY * cols + gridX] ?? 0) + 1;
    }
  }
  for (let cell = 0; cell < cols * rows; cell += 1) {
    const n = counts[cell] ?? 0;
    if (n > 0) {
      const base = cell * 3;
      grid[cell] = luminance(
        (sums[base] ?? 0) / n,
        (sums[base + 1] ?? 0) / n,
        (sums[base + 2] ?? 0) / n
      );
    } else {
      grid[cell] = 255; // 无像素落入的单元格（如透明边缘）视为白
    }
  }
  return grid;
}

function gridToAscii(
  grid: Float64Array,
  cols: number,
  rows: number,
  ramp: readonly string[]
): string {
  const lines: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    let line = '';
    for (let col = 0; col < cols; col += 1) {
      line += mapLuminance(grid[row * cols + col] ?? 0, ramp);
    }
    lines.push(line);
  }
  return lines.join('\n');
}

/**
 * 解码方向 ASCII 编排：base64 → 字节 → 图片解码 → 字符画。
 */
export async function asciiFromBase64(
  base64Data: string,
  decoder: ImageDecoder,
  opts: AsciiOptions
): Promise<string> {
  const mime = sniffMimeFromBase64(base64Data);
  const bytes = base64ToBytes(base64Data);
  const decoded = await decoder.decode(bytes, mime);
  return pixelsToAscii(decoded.pixels, decoded.width, decoded.height, opts);
}
