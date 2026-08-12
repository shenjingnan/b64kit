import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type Direction = 'decode' | 'encode';

interface DirectionTabsProps {
  value: Direction;
  onChange: (direction: Direction) => void;
}

export function DirectionTabs({ value, onChange }: DirectionTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Direction)}>
      <TabsList className="h-auto! min-h-10 w-full">
        <TabsTrigger
          value="decode"
          className="flex-1 px-3 py-1 whitespace-normal text-center leading-snug text-pretty"
        >
          base64 → IMG / XML / ASCII
        </TabsTrigger>
        <TabsTrigger
          value="encode"
          className="flex-1 px-3 py-1 whitespace-normal text-center leading-snug text-pretty"
        >
          IMG / XML / ASCII → base64
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
