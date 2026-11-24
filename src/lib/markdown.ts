/**
 * Shared Markdown-to-HTML parser for blog articles and live preview.
 * Fully supports tables, headings with IDs, images, quotes, lists, bold, italics, and paragraphs.
 */
export function renderMarkdown(md: string): string {
  if (!md) return '';

  // 1. Normalize line endings (CRLF -> LF, CR -> LF)
  let html = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Process markdown tables
  // Matches any block of lines that start and end with | (optionally surrounded by whitespace)
  html = html.replace(/(?:^[ \t]*\|.+?\|[ \t]*(?:\n|$))+/gm, (tableMatch) => {
    const rawLines = tableMatch.trim().split('\n');
    const rows = rawLines.map((r) => r.trim()).filter((r) => r.startsWith('|') && r.endsWith('|'));
    if (rows.length < 2) return tableMatch;

    let tableHtml = '\n\n<div class="table-wrapper"><table>';
    let isHeader = true;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Check if delimiter row e.g. | :--- | :---: | ---: | or |---|---|
      if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(row) || row.includes('---')) {
        isHeader = false;
        continue;
      }

      const rawCols = row.split('|');
      // row starts and ends with |, so index 0 and index (length-1) are empty strings
      const cols = rawCols.slice(1, -1);

      tableHtml += '<tr>';
      cols.forEach((col) => {
        const text = col.trim();
        if (isHeader) {
          tableHtml += `<th>${text}</th>`;
        } else {
          tableHtml += `<td>${text}</td>`;
        }
      });
      tableHtml += '</tr>';
    }
    tableHtml += '</table></div>\n\n';
    return tableHtml;
  });

  // 3. Headings with IDs
  html = html.replace(/^### (.*$)/gim, (_, text) => {
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    return `<h3 id="${id}">${text}</h3>`;
  });

  html = html.replace(/^## (.*$)/gim, (_, text) => {
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    return `<h2 id="${id}">${text}</h2>`;
  });

  // 4. Images
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<figure class="article-figure"><img src="$2" alt="$1" loading="lazy" /><figcaption>$1</figcaption></figure>'
  );

  // 5. Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 6. Blockquotes / Callout boxes
  html = html.replace(/^\> (.*$)/gim, '<blockquote class="article-quote">$1</blockquote>');

  // 7. Unordered lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');
  // Clean double ul tags
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // 8. Horizontal rules
  html = html.replace(/^---$/gim, '<hr class="article-divider" />');

  // 9. Paragraphs
  const blocks = html.split(/\n\s*\n/);
  html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<div') ||
        trimmed.startsWith('<table') ||
        trimmed.startsWith('<figure') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<hr')
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return html;
}
