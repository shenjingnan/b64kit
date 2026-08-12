import { ArrowDownUp } from 'lucide-react';
import { useState } from 'react';

import { DecodePanel } from '@/components/DecodePanel';
import { type Direction, DirectionTabs } from '@/components/DirectionTabs';
import { EncodePanel } from '@/components/EncodePanel';
import { FollowCta } from '@/components/FollowCta';

export function App() {
  const [direction, setDirection] = useState<Direction>('decode');

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="size-5 text-primary" />
          <h1 className="text-xl font-bold">b64kit</h1>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            v{__APP_VERSION__}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Base64 图片工具箱：base64 ⇄ IMG / XML / ASCII
        </p>
      </header>

      <DirectionTabs value={direction} onChange={setDirection} />

      <FollowCta />

      {direction === 'decode' ? <DecodePanel /> : <EncodePanel />}

      <footer className="mt-auto pt-4 text-center text-xs text-muted-foreground">
        纯本地处理 · 图片与数据不会上传到任何服务器
      </footer>
    </div>
  );
}
