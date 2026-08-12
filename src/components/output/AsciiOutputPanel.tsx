import { AlertCircle, Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { CopyButton } from '@/components/CopyButton';
import { AsciiSettingsPanel } from '@/components/output/AsciiSettingsPanel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { createBrowserImageDecoder } from '@/lib/browser/decodeImage';
import { downloadBlob } from '@/lib/browser/download';
import { asciiFromBase64, DEFAULT_RAMP } from '@/lib/core/ascii';
import type { DecodeResult } from '@/lib/core/base64';

interface AsciiOutputPanelProps {
  result: DecodeResult;
}

export function AsciiOutputPanel({ result }: AsciiOutputPanelProps) {
  const decoder = useMemo(() => createBrowserImageDecoder(), []);
  const [cols, setCols] = useState(100);
  const [ramp, setRamp] = useState(DEFAULT_RAMP);
  const [invert, setInvert] = useState(false);
  const [ascii, setAscii] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAscii('');
    setError(null);

    const timer = setTimeout(async () => {
      setGenerating(true);
      try {
        const text = await asciiFromBase64(result.base64Data, decoder, { cols, ramp, invert });
        if (!cancelled) {
          setAscii(text);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setGenerating(false);
        }
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [result.base64Data, decoder, cols, ramp, invert]);

  function download() {
    downloadBlob(new Blob([ascii], { type: 'text/plain;charset=utf-8' }), 'ascii-art.txt');
  }

  return (
    <div className="grid gap-3">
      <AsciiSettingsPanel
        cols={cols}
        onColsChange={setCols}
        ramp={ramp}
        onRampChange={setRamp}
        invert={invert}
        onInvertChange={setInvert}
      />

      {error !== null && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>ASCII 生成失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b px-3 py-1.5">
          <span className="text-xs text-muted-foreground">
            {generating ? '生成中…' : 'ASCII 字符画'}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={download}
              disabled={ascii.length === 0}
            >
              <Download />
              下载
            </Button>
            <CopyButton text={ascii} label="复制字符画" />
          </div>
        </div>
        <pre
          data-testid="ascii-pre"
          className="max-h-96 overflow-auto p-3 font-mono text-xs leading-tight whitespace-pre"
        >
          {ascii}
        </pre>
      </div>
    </div>
  );
}
