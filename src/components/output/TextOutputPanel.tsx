import { Download } from 'lucide-react';
import { useMemo } from 'react';

import { CopyButton } from '@/components/CopyButton';
import { Button } from '@/components/ui/button';
import { downloadBlob } from '@/lib/browser/download';
import type { DecodeResult } from '@/lib/core/base64';
import { base64ToText } from '@/lib/core/base64';

interface TextOutputPanelProps {
  result: DecodeResult;
}

/** 文本 / ASCII 输出：等宽不换行展示解码后的文本，可复制下载 */
export function TextOutputPanel({ result }: TextOutputPanelProps) {
  const text = useMemo(() => {
    try {
      return base64ToText(result.base64Data);
    } catch {
      return '';
    }
  }, [result.base64Data]);

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-xs text-muted-foreground">文本 / ASCII</span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'decoded.txt')
            }
          >
            <Download />
            下载
          </Button>
          <CopyButton text={text} label="复制文本" />
        </div>
      </div>
      <pre className="max-h-96 overflow-auto p-3 font-mono text-xs leading-tight whitespace-pre">
        {text}
      </pre>
    </div>
  );
}
