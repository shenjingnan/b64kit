// @vitest-environment happy-dom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/components/App';
import { base64ToBytes } from '@/lib/core/base64';
import { render } from '@/test/render';

const RED_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/** 模拟 B站 App 环境：isSupport('saveImageToAlbum') 返回 true 的 Toy SDK。 */
function stubToySaveToAlbum(opts: { supported?: boolean; saveError?: unknown } = {}) {
  const { supported = true, saveError } = opts;
  const toy = {
    isSupport: vi.fn(),
    saveImageToAlbum: vi.fn(),
  };
  window.toy = toy as unknown as ToySDK.Toy;
  vi.mocked(toy.isSupport).mockResolvedValue(supported);
  if (saveError !== undefined) {
    vi.mocked(toy.saveImageToAlbum).mockRejectedValue(saveError);
  } else {
    vi.mocked(toy.saveImageToAlbum).mockResolvedValue({ localPath: '/mock/local.jpg' });
  }
  return toy;
}

describe('下载功能', () => {
  afterEach(() => {
    window.toy = undefined as unknown as ToySDK.Toy;
    vi.restoreAllMocks();
  });

  function stubObjectUrl() {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock');
    const revokeObjectURL = vi.fn((_url: string) => {});
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
    return { createObjectURL, revokeObjectURL };
  }

  it('IMG 页签下载解码后的图片字节', async () => {
    const user = userEvent.setup();
    const { createObjectURL } = stubObjectUrl();
    render(<App />);

    const textarea = screen.getByLabelText('Base64 输入');
    await user.type(textarea, RED_PNG);
    await screen.findByRole('img', { name: '预览图' });

    await user.click(screen.getByRole('button', { name: '下载图片' }));

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob | undefined;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.type).toBe('image/png');
    expect(blob?.size).toBe(base64ToBytes(RED_PNG).length);
  });

  it('XML 页签下载 XML 文件', async () => {
    const user = userEvent.setup();
    const { createObjectURL } = stubObjectUrl();
    render(<App />);

    const textarea = screen.getByLabelText('Base64 输入');
    await user.type(textarea, RED_PNG);
    await screen.findByRole('img', { name: '预览图' });

    await user.click(screen.getByRole('button', { name: '查看 XML' }));
    await user.click(await screen.findByRole('button', { name: '下载 XML' }));

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob | undefined;
    expect(blob?.type).toBe('application/xml;charset=utf-8');
    expect(await blob?.text()).toContain('<image><mime>image/png</mime>');
  });

  it('B站 App 环境保存图片时调用 toy.saveImageToAlbum，不触发浏览器下载', async () => {
    const toy = stubToySaveToAlbum();
    const { createObjectURL } = stubObjectUrl();
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByLabelText('Base64 输入');
    await user.type(textarea, RED_PNG);
    await screen.findByRole('img', { name: '预览图' });

    await user.click(screen.getByRole('button', { name: '下载图片' }));

    await waitFor(() => expect(toy.saveImageToAlbum).toHaveBeenCalled());
    expect(toy.saveImageToAlbum).toHaveBeenCalledWith({
      base64Data: RED_PNG,
      hintMsg: '保存到系统相册需要相册权限',
    });
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('不支持 saveImageToAlbum 时回退为浏览器下载', async () => {
    stubToySaveToAlbum({ supported: false });
    const { createObjectURL } = stubObjectUrl();
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByLabelText('Base64 输入');
    await user.type(textarea, RED_PNG);
    await screen.findByRole('img', { name: '预览图' });

    await user.click(screen.getByRole('button', { name: '下载图片' }));

    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
  });

  it('saveImageToAlbum 失败时回退为浏览器下载', async () => {
    stubToySaveToAlbum({ supported: true, saveError: new Error('[ToySDK] save failed') });
    const { createObjectURL } = stubObjectUrl();
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByLabelText('Base64 输入');
    await user.type(textarea, RED_PNG);
    await screen.findByRole('img', { name: '预览图' });

    await user.click(screen.getByRole('button', { name: '下载图片' }));

    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
  });
});
