import { useState } from 'react';

import { FileDrop } from '@/components/FileDrop';
import { TextToBase64 } from '@/components/output/TextToBase64';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type EncodeTab = 'image' | 'text';

export function EncodePanel() {
  const [tab, setTab] = useState<EncodeTab>('image');

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as EncodeTab)}>
      <TabsList>
        <TabsTrigger value="image">图片/文件 → base64</TabsTrigger>
        <TabsTrigger value="text">文本 → base64</TabsTrigger>
      </TabsList>
      <TabsContent value="image">
        <FileDrop />
      </TabsContent>
      <TabsContent value="text">
        <TextToBase64 />
      </TabsContent>
    </Tabs>
  );
}
