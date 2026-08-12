// @vitest-environment happy-dom
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from '@/components/App';
import { base64ToBytes, bytesToBase64 } from '@/lib/core/base64';
import { render } from '@/test/render';

const RED_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function gotoEncode(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(screen.getByRole('tab', { name: 'IMG / XML / ASCII → base64' }));
}

describe('编码方向', () => {
  it('上传图片后生成 raw base64 与 data URI', async () => {
    const user = userEvent.setup();
    await gotoEncode(user);

    const file = new File([base64ToBytes(RED_PNG) as unknown as BlobPart], 'red.png', {
      type: 'image/png',
    });
    await user.upload(screen.getByLabelText('选择文件'), file);

    expect(
      await screen.findByText(new RegExp(`^data:image/png;base64,${RED_PNG.slice(0, 24)}`))
    ).toBeInTheDocument();
    expect(screen.getByText(/red\.png/)).toBeInTheDocument();
  });

  it('清除按钮重置已编码文件', async () => {
    const user = userEvent.setup();
    await gotoEncode(user);

    const file = new File([base64ToBytes(RED_PNG) as unknown as BlobPart], 'red.png', {
      type: 'image/png',
    });
    await user.upload(screen.getByLabelText('选择文件'), file);
    expect(await screen.findByText(/red\.png/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '清除文件' }));
    expect(screen.queryByText(/red\.png/)).not.toBeInTheDocument();
  });

  it('上传 XML 文件生成 application/xml 的 data URI', async () => {
    const user = userEvent.setup();
    await gotoEncode(user);

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><image><mime>image/png</mime><data>abc</data></image>';
    const file = new File([xml], 'image.xml', { type: 'application/xml' });
    await user.upload(screen.getByLabelText('选择文件'), file);

    const expectedB64 = bytesToBase64(new TextEncoder().encode(xml));
    expect(
      await screen.findByText(
        new RegExp(`^data:application/xml;base64,${expectedB64.slice(0, 24)}`)
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/image\.xml/)).toBeInTheDocument();
  });

  it('文本转 base64 支持 UTF-8 中文', async () => {
    const user = userEvent.setup();
    await gotoEncode(user);

    await user.click(screen.getByRole('tab', { name: '文本 → base64' }));
    const textarea = screen.getByLabelText('文本输入');
    await user.type(textarea, '你好');

    expect(await screen.findByText('5L2g5aW9')).toBeInTheDocument();
  });
});
