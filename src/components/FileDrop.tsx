import { UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { type EncodedFile, EncodeResultPanel } from './output/EncodeResultPanel';

interface FileDropProps {
  onFile?: (file: EncodedFile) => void;
}

export function FileDrop({ onFile }: FileDropProps) {
  const [file, setFile] = useState<EncodedFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: Iterable<File>) {
    const list = Array.from(files);
    const first = list[0];
    if (first === undefined) {
      return;
    }
    try {
      const bytes = new Uint8Array(await first.arrayBuffer());
      const encoded: EncodedFile = {
        name: first.name,
        size: first.size,
        mime: first.type,
        bytes,
      };
      setFile(encoded);
      setError(null);
      onFile?.(encoded);
    } catch {
      setError('无法读取该文件');
    }
  }

  return (
    <div className="grid gap-4">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          'grid cursor-pointer place-items-center gap-2 rounded-lg border-2 border-dashed p-10 text-center outline-none transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          dragging ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/50'
        )}
      >
        <UploadCloud className="size-8 text-muted-foreground" />
        <div className="text-sm font-medium">点击选择或拖拽文件到此处</div>
        <div className="text-xs text-muted-foreground">支持图片 / XML 等任意文件</div>
        <input
          ref={inputRef}
          type="file"
          aria-label="选择文件"
          className="sr-only"
          onChange={(event) => void handleFiles(event.target.files ?? [])}
        />
      </label>

      {error !== null && <div className="text-sm text-destructive">{error}</div>}

      {file !== null && (
        <EncodeResultPanel
          encoded={file}
          onReset={() => {
            setFile(null);
            setError(null);
          }}
        />
      )}
    </div>
  );
}
