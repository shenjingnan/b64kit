import { describe, expect, it } from 'vitest';

import { buildImageXml, escapeXml } from '@/lib/core/xml';

describe('buildImageXml', () => {
  it('should build image xml with mime and base64 data', () => {
    const xml = buildImageXml('image/png', 'iVBORw0KGgo=');
    expect(xml).toBe('<image><mime>image/png</mime><data>iVBORw0KGgo=</data></image>');
  });

  it('should escape mime type', () => {
    const xml = buildImageXml('image/<x>&"\'', 'abc');
    expect(xml).toBe(
      '<image><mime>image/&lt;x&gt;&amp;&quot;&apos;</mime><data>abc</data></image>'
    );
  });
});

describe('escapeXml', () => {
  it('should escape all five XML entities', () => {
    expect(escapeXml(`<a b="c">&'</a>`)).toBe('&lt;a b=&quot;c&quot;&gt;&amp;&apos;&lt;/a&gt;');
  });
});
