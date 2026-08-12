import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type Direction = 'decode' | 'encode';

interface DirectionTabsProps {
  value: Direction;
  onChange: (direction: Direction) => void;
}

export function DirectionTabs({ value, onChange }: DirectionTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Direction)}>
      <TabsList className="h-10! w-full">
        <TabsTrigger value="decode" className="flex-1 px-4">
          base64 → IMG / XML / ASCII
        </TabsTrigger>
        <TabsTrigger value="encode" className="flex-1 px-4">
          IMG / XML / ASCII → base64
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
