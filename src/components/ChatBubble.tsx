import { cn } from "@/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Bot, Loader2 } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { parseDetailsContent, renderParsedContent } from "@/utils/parseContent";

interface ImageData {
  url?: string;
  data?: string;
  mimeType?: string;
}

interface ChatBubbleProps {
  type: "human" | "ai";
  content: string;
  agent?: string;
  className?: string;
  isGenerating?: boolean;
  images?: ImageData[];
}

// Markdown components for AI responses
const mdComponents = {
  h1: ({ children, ...props }: any) => (
    <h1 className="text-xl font-bold mt-3 mb-2" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-lg font-semibold mt-2 mb-1.5" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-base font-semibold mt-2 mb-1" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: any) => (
    <p className="mb-2 leading-relaxed" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc pl-5 mb-2 space-y-1" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal pl-5 mb-2 space-y-1" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="leading-relaxed" {...props}>{children}</li>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    const codeString = String(children).replace(/\n$/, "");
    
    // Inline code (backtick singolo)
    if (inline) {
      return (
        <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }
    
    // Code block (triple backtick) - usa CodeBlock component
    return <CodeBlock className={className}>{codeString}</CodeBlock>;
  },
  pre: ({ children }: any) => {
    // Pre viene gestito da CodeBlock, quindi passa direttamente i children
    return <>{children}</>;
  },
  a: ({ children, href, ...props }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
      {...props}
    >
      {children}
    </a>
  ),
};

export function ChatBubble({ type, content, agent, className, isGenerating = false, images }: ChatBubbleProps) {
  const isUser = type === "human";

  return (
    <div
      className={cn(
        "flex gap-3 items-start max-w-4xl",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto",
        className
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 relative",
          isUser ? "bg-primary" : "bg-muted",
          // Neomorphic shadow - top highlight + dark/soft shadow (small)
          "shadow-[inset_0_1px_2px_#ffffff50,0_2px_4px_#00000030,0_4px_8px_#00000015]"
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white relative z-10" />
        ) : (
          <Bot className="w-5 h-5 text-foreground relative z-10" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "px-5 py-4 rounded-3xl max-w-2xl",
          isUser
            ? "bg-[var(--chat-user-bg)] text-[var(--chat-user-fg)] rounded-tr-md"
            : "bg-[var(--chat-ai-bg)] text-[var(--chat-ai-fg)] rounded-tl-md",
          // User messages: elevated with highlight, AI messages: inset carved
          isUser 
            ? "shadow-[inset_0_1px_2px_#ffffff50,0_2px_4px_#00000030,0_4px_8px_#00000015]" 
            : "shadow-[inset_0_2px_4px_#00000030,inset_0_4px_6px_#00000015]"
        )}
      >
        {/* 🎯 Mostra agent corrente se presente - SENZA spinner nell'agent name */}
        {!isUser && agent && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground/70">
            <span className="font-medium">{agent}</span>
          </div>
        )}
        
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : content ? (
          <>
            {/* 🎯 Parse e renderizza contenuto */}
            <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
              {renderParsedContent(
                parseDetailsContent(content),
                ({ children }: { children: string }) => (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {children}
                  </ReactMarkdown>
                )
              )}
            </div>
            
            {/* 🎯 Renderizza immagini se presenti - CLICCABILI */}
            {images && images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {images.map((image, index) => {
                  const imageUrl = image.url || (image.data ? `data:${image.mimeType || 'image/png'};base64,${image.data}` : null);
                  
                  return (
                    <a
                      key={index}
                      href={image.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "rounded-xl overflow-hidden shadow-[0_2px_4px_#00000020,0_4px_8px_#00000010]",
                        "transition-all hover:shadow-[0_4px_8px_#00000030,0_8px_16px_#00000015] hover:scale-[1.02]",
                        image.url ? "cursor-pointer" : "pointer-events-none"
                      )}
                    >
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </>
        ) : isGenerating ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="flex items-center">
              Ragionando
              <span className="thinking-dot">.</span>
              <span className="thinking-dot">.</span>
              <span className="thinking-dot">.</span>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
