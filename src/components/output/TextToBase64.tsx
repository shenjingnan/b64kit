import { useMemo, useState } from 'react';

import { CodeBlock } from '@/components/CodeBlock';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { textToBase64 } from '@/lib/core/base64';

export function TextToBase64() {
  const [text, setText] = useState('');

  const base64 = useMemo(() => (text.length > 0 ? textToBase64(text) : ''), [text]);

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="text-input">文本输入</Label>
        <Textarea
          id="text-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="输入要编码的文本…"
          className="min-h-28 max-h-48 overflow-y-auto"
        />
        <div className="text-xs text-muted-foreground">
          {text.length.toLocaleString()} 字符 · UTF-8 编码
        </div>
      </div>
      <CodeBlock
        text={base64}
        label={base64.length > 0 ? `UTF-8 base64 · ${base64.length} 字符` : 'UTF-8 base64'}
      />
    </div>
  );
}
