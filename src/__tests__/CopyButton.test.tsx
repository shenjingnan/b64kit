// @vitest-environment happy-dom
import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CopyButton } from '@/components/CopyButton';
import { render } from '@/test/render';

describe('CopyButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should copy text via clipboard API and show feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<CopyButton text="hello" />);
    fireEvent.click(screen.getByRole('button', { name: '复制' }));

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(await screen.findByText('已复制')).toBeInTheDocument();
  });

  it('should fall back when clipboard API is unavailable', () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    document.execCommand = vi.fn().mockReturnValue(true) as typeof document.execCommand;

    render(<CopyButton text="world" />);
    fireEvent.click(screen.getByRole('button', { name: '复制' }));

    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });
});
