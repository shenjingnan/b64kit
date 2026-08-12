import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Base64InputProps {
  value: string;
  onChange: (value: string) => void;
}

export function Base64Input({ value, onChange }: Base64InputProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="base64-input">Base64 输入</Label>
      <Textarea
        id="base64-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={'粘贴 base64、data URI 或 <img src="..."> 标签…'}
        className="min-h-32 max-h-48 overflow-y-auto font-mono text-xs"
      />
      <div className="text-xs text-muted-foreground">
        {value.length.toLocaleString()} 字符 · 输入后自动转换
      </div>
    </div>
  );
}
