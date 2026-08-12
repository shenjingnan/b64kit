import { Download, ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { downloadBytes } from '@/lib/browser/download';
import type { DecodeResult } from '@/lib/core/base64';
import { mimeExtension } from '@/lib/core/mime';

interface ImgOutputPanelProps {
  result: DecodeResult;
}

/** IMG 页签：展示解码后的图片预览与基本信息，支持下载原图 */
export function ImgOutputPanel({ result }: ImgOutputPanelProps) {
  function handleDownload() {
    const ext = mimeExtension(result.mime);
    downloadBytes(result.bytes, result.mime, `decoded.${ext}`);
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="size-4" />
          <span>
            MIME：{result.mime} · {result.bytes.length.toLocaleString()} 字节
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
          <Download />
          下载图片
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border bg-muted/30">
        <img src={result.dataUri} alt="预览图" className="h-auto w-full object-contain" />
      </div>
    </div>
  );
}
