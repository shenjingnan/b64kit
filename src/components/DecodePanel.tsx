import { AlertCircle, FileCode2, Paintbrush } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Base64Input } from '@/components/Base64Input';
import { AsciiOutputPanel } from '@/components/output/AsciiOutputPanel';
import { ImgOutputPanel } from '@/components/output/ImgOutputPanel';
import { TextOutputPanel } from '@/components/output/TextOutputPanel';
import { XmlOutputPanel } from '@/components/output/XmlOutputPanel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { decodeBase64 } from '@/lib/core/base64';
import { cn } from '@/lib/utils';

type DecodeState =
  | { kind: 'empty' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; result: ReturnType<typeof decodeBase64> };

export function DecodePanel() {
  const [input, setInput] = useState('');
  const [showXml, setShowXml] = useState(false);
  const [showAscii, setShowAscii] = useState(false);

  const state = useMemo<DecodeState>(() => {
    if (input.trim().length === 0) {
      return { kind: 'empty' };
    }
    try {
      return { kind: 'ok', result: decodeBase64(input) };
    } catch (error) {
      return { kind: 'error', message: error instanceof Error ? error.message : String(error) };
    }
  }, [input]);

  const mime = state.kind === 'ok' ? state.result.mime : '';
  const isImage = mime.startsWith('image/');
  const isText = mime.startsWith('text/');

  const toggleButton = (active: boolean) =>
    cn(
      'gap-1.5',
      active
        ? 'border-primary bg-primary/10 text-primary hover:bg-primary/15'
        : 'text-muted-foreground'
    );

  return (
    <div className="grid gap-4">
      <Base64Input
        value={input}
        onChange={(value) => {
          setInput(value);
          setShowXml(false);
          setShowAscii(false);
        }}
      />

      {state.kind === 'empty' && (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          粘贴 base64 后自动识别：图片直接展示，XML / 文本直接输出
        </div>
      )}

      {state.kind === 'error' && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>解码失败</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state.kind === 'ok' && isImage && (
        <div className="grid gap-3">
          <ImgOutputPanel result={state.result} />
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toggleButton(showXml)}
              onClick={() => setShowXml((v) => !v)}
            >
              <FileCode2 />
              {showXml ? '收起 XML' : '查看 XML'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toggleButton(showAscii)}
              onClick={() => setShowAscii((v) => !v)}
            >
              <Paintbrush />
              {showAscii ? '收起 ASCII' : '查看 ASCII'}
            </Button>
          </div>
          {showXml && <XmlOutputPanel result={state.result} />}
          {showAscii && <AsciiOutputPanel result={state.result} />}
        </div>
      )}

      {state.kind === 'ok' && !isImage && isText && <TextOutputPanel result={state.result} />}
      {state.kind === 'ok' && !isImage && !isText && <XmlOutputPanel result={state.result} />}
    </div>
  );
}
