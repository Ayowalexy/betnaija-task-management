import type { ReactNode } from 'react';

// Minimal inline markdown for comment/chat composers: bold, italic, inline code, and
// "- " bullet lines. Matches exactly what the Bold/Italic/List/Code toolbar buttons insert
// (CommentThread.tsx, UtilityRequestCommentThread.tsx) — nothing more.
const INLINE_PATTERN = /\*\*(.+?)\*\*|_(.+?)_|`(.+?)`/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const [, bold, italic, code] = match;
    if (bold !== undefined) nodes.push(<strong key={`${keyPrefix}-${i++}`}>{bold}</strong>);
    else if (italic !== undefined) nodes.push(<em key={`${keyPrefix}-${i++}`}>{italic}</em>);
    else if (code !== undefined) nodes.push(<code key={`${keyPrefix}-${i++}`}>{code}</code>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/** Renders bold/italic/code inline formatting and "- " bullet lines from plain text content. */
export function renderMarkdown(text: string): ReactNode {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let listItems: ReactNode[] = [];

  function flushList() {
    if (listItems.length === 0) return;
    blocks.push(<ul key={`list-${blocks.length}`}>{listItems}</ul>);
    listItems = [];
  }

  lines.forEach((line, idx) => {
    if (line.startsWith('- ')) {
      listItems.push(<li key={`li-${idx}`}>{renderInline(line.slice(2), `li-${idx}`)}</li>);
      return;
    }
    flushList();
    blocks.push(
      <span key={`line-${idx}`}>
        {renderInline(line, `line-${idx}`)}
        {idx < lines.length - 1 && <br />}
      </span>,
    );
  });
  flushList();

  return blocks;
}
