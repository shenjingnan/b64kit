import { useMemo } from 'react';
import { downloadBlob } from '@/lib/browser/download';
import type { DecodeResult } from '@/lib/core/base64';
import { buildImageXml } from '@/lib/core/xml';

import { CodeBlock } from '../CodeBlock';

interface XmlOutputPanelProps {
  result: DecodeResult;
}

export function XmlOutputPanel({ result }: XmlOutputPanelProps) {
  const xml = useMemo(() => buildImageXml(result.mime, result.base64Data), [result]);

  return (
    <CodeBlock
      text={xml}
      label="XML"
      onDownload={() => {
        downloadBlob(new Blob([xml], { type: 'application/xml;charset=utf-8' }), 'image.xml');
      }}
      downloadLabel="下载 XML"
    />
  );
}
