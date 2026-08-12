import { render as renderRtl } from '@testing-library/react';
import type { ReactElement } from 'react';

/** 统一的渲染入口，便于后续扩展全局 Provider */
export function render(ui: ReactElement) {
  return renderRtl(ui);
}
