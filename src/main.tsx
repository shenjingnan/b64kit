import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './components/App';
import { installToySdkStub } from './dev/toy-sdk-stub';
import './index.css';

// 本地开发预览：无 B站环境时注入 Toy SDK 桩，便于调试关注引导
if (import.meta.env.DEV) {
  installToySdkStub();
}

const container = document.getElementById('root');
if (container === null) {
  throw new Error('未找到 #root 挂载点');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
