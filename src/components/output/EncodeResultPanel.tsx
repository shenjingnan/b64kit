import { FileIcon, X } from 'lucide-react';
import { useMemo } from 'react';

import { CodeBlock } from '@/components/CodeBlock';
import { Button } from '@/components/ui/button';
import { buildDataUri, bytesToBase64 } from '@/lib/core/base64';
import { sniffMime } from '@/lib/core/mime';

export interface EncodedFile {
  name: string;
  size: number;
  /** 文件声明的 MIME 类型（可能为空） */
  mime: string;
  bytes: Uint8Array;
}

interface EncodeResultPanelProps {
  encoded: EncodedFile;
  onReset?: () => void;
}

export function EncodeResultPanel({ encoded, onReset }: EncodeResultPanelProps) {
  const { name, size, mime, bytes } = encoded;

  const result = useMemo(() => {
    const sniffed = sniffMime(bytes);
    const detectedMime =
      sniffed !== 'application/octet-stream' ? sniffed : mime || 'application/octet-stream';
    const dataUri = buildDataUri(detectedMime, bytesToBase64(bytes));
    return {
      detectedMime,
      dataUri,
      isImage: detectedMime.startsWith('image/'),
    };
  }, [bytes, mime]);

  const sizeText = size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`;

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        {result.isImage ? (
          <img
            src={result.dataUri}
            alt={`${name} 缩略图`}
            className="size-16 rounded-lg border object-contain"
          />
        ) : (
          <div className="grid size-16 shrink-0 place-items-center rounded-lg border bg-muted/30">
            <FileIcon className="size-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{name}</div>
          <div className="text-xs text-muted-foreground">
            {result.detectedMime} · {sizeText}
          </div>
        </div>
        {onReset !== undefined && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onReset}
            aria-label="清除文件"
          >
            <X />
          </Button>
        )}
      </div>
      <CodeBlock
        text={result.dataUri}
        label={`Data URI · ${result.dataUri.length.toLocaleString()} 字符`}
      />
    </div>
  );
}
