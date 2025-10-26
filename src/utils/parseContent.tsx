interface ParsedContent {
  type: "text";
  content: string;
}

/**
 * Parse content per convertire <details><summary> in heading markdown
 * E convertire linee che iniziano con **testo** in heading
 */
export function parseDetailsContent(content: string): ParsedContent[] {
  const parts: ParsedContent[] = [];
  
  // 1. Converti tag HTML in markdown
  let processedContent = content
    // <strong>testo</strong> -> **testo**
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    // <b>testo</b> -> **testo**
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    // <em>testo</em> -> *testo*
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    // <i>testo</i> -> *testo*
    .replace(/<i>(.*?)<\/i>/gi, '*$1*');
  
  // 2. Converti <details><summary>...</summary>...</details> in ## heading + contenuto
  processedContent = processedContent.replace(
    /<details>\s*<summary>(.*?)<\/summary>\s*(.*?)<\/details>/gs,
    (_, summary, detailContent) => {
      return `\n## ${summary.trim()}\n\n${detailContent.trim()}\n`;
    }
  );
  
  // 3. Converti linee che iniziano con **testo** (strong) in heading h3
  // Pattern: all'inizio di una linea (o dopo newline), **testo**, poi newline
  processedContent = processedContent.replace(
    /^(\*\*([^*]+)\*\*)$/gm,
    (_, _fullMatch, text) => {
      return `### ${text.trim()}`;
    }
  );
  
  // Ritorna tutto come testo (sarà processato da Markdown)
  parts.push({ type: "text", content: processedContent });
  
  return parts;
}

/**
 * Render parsed content
 */
export function renderParsedContent(
  parts: ParsedContent[],
  MarkdownComponent: React.ComponentType<{ children: string }>
) {
  return parts.map((part, index) => (
    <MarkdownComponent key={index}>{part.content}</MarkdownComponent>
  ));
}
