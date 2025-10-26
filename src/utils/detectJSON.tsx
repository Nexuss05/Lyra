import { CodeBlock } from "@/components/CodeBlock";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Detect se una stringa è JSON valido E strutturato (non inline)
 */
function isValidJSON(str: string): boolean {
  try {
    const parsed = JSON.parse(str);
    // Deve essere un oggetto o array, non un valore primitivo
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}

/**
 * Verifica se un blocco sembra veramente JSON strutturato
 * (non solo testo con parentesi graffe)
 */
function looksLikeJSON(lines: string[]): boolean {
  if (lines.length < 2) return false; // JSON strutturato ha almeno 2 righe
  
  const trimmedLines = lines.map(l => l.trim());
  const firstLine = trimmedLines[0];
  
  // Deve iniziare con { o [
  if (!firstLine.startsWith('{') && !firstLine.startsWith('[')) return false;
  
  // Deve contenere almeno una coppia chiave:valore o elemento array
  const hasKeyValue = trimmedLines.some(line => 
    line.includes(':') || line.match(/^"[^"]*"[,\s]*$/)
  );
  
  return hasKeyValue;
}

/**
 * Auto-detect JSON blocks nel contenuto e wrappali in CodeBlock
 * Usa un approccio più conservativo per evitare false positives
 */
export function detectAndWrapJSON(content: string): { type: 'json' | 'text'; content: string }[] {
  const parts: { type: 'json' | 'text'; content: string }[] = [];
  
  const lines = content.split('\n');
  let inJSONBlock = false;
  let jsonBuffer = '';
  let jsonLines: string[] = [];
  let textBuffer = '';
  let braceCount = 0;
  let bracketCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Inizio possibile blocco JSON
    if (!inJSONBlock && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
      // Salva il testo accumulato
      if (textBuffer.trim()) {
        parts.push({ type: 'text', content: textBuffer.trim() });
        textBuffer = '';
      }
      
      inJSONBlock = true;
      jsonBuffer = line + '\n';
      jsonLines = [line];
      braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      bracketCount = (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length;
      
      // Check se si chiude sulla stessa linea
      if (braceCount === 0 && bracketCount === 0) {
        const trimmedJSON = jsonBuffer.trim();
        if (isValidJSON(trimmedJSON) && looksLikeJSON(jsonLines)) {
          try {
            const formatted = JSON.stringify(JSON.parse(trimmedJSON), null, 2);
            parts.push({ type: 'json', content: formatted });
          } catch {
            parts.push({ type: 'json', content: trimmedJSON });
          }
        } else {
          // Non è JSON strutturato, trattalo come testo
          textBuffer += jsonBuffer;
        }
        inJSONBlock = false;
        jsonBuffer = '';
        jsonLines = [];
      }
    } else if (inJSONBlock) {
      // Continua a costruire il blocco JSON
      jsonBuffer += line + '\n';
      jsonLines.push(line);
      braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      bracketCount += (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length;
      
      // Check se il blocco JSON è completo
      if (braceCount === 0 && bracketCount === 0) {
        const trimmedJSON = jsonBuffer.trim();
        if (isValidJSON(trimmedJSON) && looksLikeJSON(jsonLines)) {
          try {
            const formatted = JSON.stringify(JSON.parse(trimmedJSON), null, 2);
            parts.push({ type: 'json', content: formatted });
          } catch {
            parts.push({ type: 'json', content: trimmedJSON });
          }
        } else {
          // Non è JSON strutturato, trattalo come testo
          textBuffer += jsonBuffer;
        }
        inJSONBlock = false;
        jsonBuffer = '';
        jsonLines = [];
      }
    } else {
      // Testo normale
      textBuffer += line + '\n';
    }
  }
  
  // Aggiungi eventuali buffer rimanenti
  if (jsonBuffer.trim()) {
    const trimmedJSON = jsonBuffer.trim();
    if (isValidJSON(trimmedJSON) && looksLikeJSON(jsonLines)) {
      try {
        const formatted = JSON.stringify(JSON.parse(trimmedJSON), null, 2);
        parts.push({ type: 'json', content: formatted });
      } catch {
        parts.push({ type: 'json', content: trimmedJSON });
      }
    } else {
      textBuffer += jsonBuffer;
    }
  }
  
  if (textBuffer.trim()) {
    parts.push({ type: 'text', content: textBuffer.trim() });
  }
  
  // Se non sono stati trovati JSON, ritorna tutto come testo
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }
  
  return parts;
}

/**
 * Render content con auto-detection di JSON
 */
export function renderContentWithJSON(
  content: string,
  mdComponents: any
) {
  const parts = detectAndWrapJSON(content);
  
  return parts.map((part, index) => {
    if (part.type === 'json') {
      return <CodeBlock key={index} className="language-json">{part.content}</CodeBlock>;
    } else {
      return (
        <ReactMarkdown key={index} remarkPlugins={[remarkGfm]} components={mdComponents}>
          {part.content}
        </ReactMarkdown>
      );
    }
  });
}
