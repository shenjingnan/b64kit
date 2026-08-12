// @vitest-environment happy-dom
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CodeBlock } from '@/components/CodeBlock';
import { render } from '@/test/render';

describe('CodeBlock', () => {
  it('should render text content when no label or children provided', () => {
    render(<CodeBlock text="hello code" />);
    expect(screen.getByText('hello code')).toBeInTheDocument();
  });

  it('should render label and children over raw text', () => {
    render(
      <CodeBlock text="raw text" label="标题">
        自定义内容
      </CodeBlock>
    );
    expect(screen.getByText('标题')).toBeInTheDocument();
    expect(screen.getByText('自定义内容')).toBeInTheDocument();
    expect(screen.queryByText('raw text')).not.toBeInTheDocument();
  });
});
