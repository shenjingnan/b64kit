import { cn } from '@/lib/utils';

import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';

export const RAMP_PRESETS = [
  { label: '标准', value: '@%#*+=-:. ' },
  {
    label: '细密',
    // cspell:disable-next-line -- 标准 ASCII art 字符渐变表
    value: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'.  ',
  },
  { label: '简练', value: '@O#*+=-:. ' },
  { label: '反色', value: ' .:-=+*#%@' },
];

interface AsciiSettingsPanelProps {
  cols: number;
  onColsChange: (value: number) => void;
  ramp: string;
  onRampChange: (value: string) => void;
  invert: boolean;
  onInvertChange: (value: boolean) => void;
}

export function AsciiSettingsPanel({
  cols,
  onColsChange,
  ramp,
  onRampChange,
  invert,
  onInvertChange,
}: AsciiSettingsPanelProps) {
  return (
    <div className="grid gap-4 rounded-lg border p-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="ascii-cols">宽度（列数）</Label>
          <span className="text-xs text-muted-foreground">{cols}</span>
        </div>
        <Slider
          id="ascii-cols"
          value={[cols]}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? (value[0] ?? 100) : value;
            onColsChange(next);
          }}
          min={20}
          max={200}
          step={5}
        />
      </div>

      <div className="grid gap-2">
        <Label>字符渐变</Label>
        <div className="flex flex-wrap gap-1.5">
          {RAMP_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onRampChange(preset.value)}
              className={cn(
                'rounded-md border px-2.5 py-1 font-mono text-xs transition-colors',
                ramp === preset.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input text-muted-foreground hover:bg-muted'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="ascii-invert">反色</Label>
        <Switch
          id="ascii-invert"
          checked={invert}
          onCheckedChange={(checked) => onInvertChange(checked)}
        />
      </div>
    </div>
  );
}
