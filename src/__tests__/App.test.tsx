// @vitest-environment happy-dom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '@/components/App';
import { textToBase64 } from '@/lib/core/base64';
import { render } from '@/test/render';

// happy-dom 没有真实 canvas，注入 fake 图片解码器
vi.mock('@/lib/browser/decodeImage', () => ({
  createBrowserImageDecoder: () => ({
    decode: async () => ({
      width: 2,
      height: 1,
      pixels: new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]),
    }),
  }),
}));

const RED_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('App 解码流程', () => {
  it('粘贴示例 base64 后渲染 IMG 预览', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByLabelText('Base64 输入');
    await user.type(textarea, RED_PNG);

    const preview = await screen.findByRole('img', { name: '预览图' });
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveAttribute('src', `data:image/png;base64,${RED_PNG}`);
  });

  it('图片解码后可查看 XML 结构', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByLabelText('Base64 输入');
    await user.type(textarea, RED_PNG);
    await screen.findByRole('img', { name: '预览图' });

    await user.click(screen.getByRole('button', { name: '查看 XML' }));
    expect(await screen.findByText(/<image><mime>image\/png<\/mime>/)).toBeInTheDocument();
  });

  it('粘贴无类型定义的 ASCII 文本 base64 时直接展示文本', async () => {
    const user = userEvent.setup();
    render(<App />);

    // 无 data URI 前缀、无图片/XML 魔数 → 按 text/plain 展示
    const art =
      "  / \\  _ __  _ __| |__ (_) ___  _ __\n / _ \\ | '_ \\| '__| '_ \\| |/ _ \\| '_ \\";
    const b64 = textToBase64(art);
    const textarea = screen.getByLabelText('Base64 输入');
    await user.type(textarea, b64);

    expect(await screen.findByText('文本 / ASCII')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: '预览图' })).not.toBeInTheDocument();
  });

  it('粘贴 XML base64 时直接展示 XML，不显示图片预览', async () => {
    const user = userEvent.setup();
    render(<App />);

    const xml = '<?xml version="1.0"?><image><mime>image/png</mime><data>abc</data></image>';
    const xmlDataUri = `data:application/xml;base64,${textToBase64(xml)}`;
    const textarea = screen.getByLabelText('Base64 输入');
    await user.type(textarea, xmlDataUri);

    expect(await screen.findByText(/<image><mime>application\/xml<\/mime>/)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: '预览图' })).not.toBeInTheDocument();
  });

  it('输入非法 base64 时展示错误提示', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByLabelText('Base64 输入');
    await user.type(textarea, '这不是base64!!!');

    expect(await screen.findByText('解码失败')).toBeInTheDocument();
  });

  it('图片解码后可查看 ASCII 字符画', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByLabelText('Base64 输入');
    await user.type(textarea, RED_PNG);
    await screen.findByRole('img', { name: '预览图' });

    await user.click(screen.getByRole('button', { name: '查看 ASCII' }));

    const pre = await screen.findByTestId('ascii-pre');
    await waitFor(() => expect(pre.textContent ?? '').toContain('@'));
  });
});
