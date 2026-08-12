import { Download } from 'lucide-react';
import type { ReactNode } from 'react';

import { CopyButton } from '@/components/CopyButton';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  text: string;
  label?: string;
  children?: ReactNode;
  /** 提供时显示下载按钮 */
  onDownload?: () => void;
  downloadLabel?: string;
}

/** 等宽代码展示块，右上角带复制 / 可选下载按钮 */
export function CodeBlock({ text, label, children, onDownload, downloadLabel }: CodeBlockProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{label ?? ''}</span>
        <div className="flex items-center gap-1.5">
          {onDownload !== undefined && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onDownload}
              aria-label={downloadLabel ?? '下载'}
            >
              <Download />
            </Button>
          )}
          <CopyButton text={text} />
        </div>
      </div>
      <pre className="max-h-80 overflow-auto p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
        {children ?? text}
      </pre>
    </div>
  );
}
