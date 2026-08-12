/**
 * 解码后的位图数据（RGBA 像素矩阵）。
 */
export interface DecodedImage {
  width: number;
  height: number;
  /** 每像素 4 字节 RGBA，长度 = width * height * 4 */
  pixels: Uint8ClampedArray;
}

/**
 * 图片解码能力接口。核心逻辑只依赖此接口，浏览器实现或测试 fake 均可注入。
 */
export interface ImageDecoder {
  decode(data: Uint8Array, mime: string): Promise<DecodedImage>;
}
