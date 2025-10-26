import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CollapsibleSectionProps {
  summary: string;
  content: string;
  defaultOpen?: boolean;
}

export function CollapsibleSection({ summary, content, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-border shadow-[inset_0_1px_2px_#ffffff30,0_1px_2px_#00000020]">
      {/* Header cliccabile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-2 px-4 py-3 text-left transition-all",
          "bg-muted/50 hover:bg-muted/70",
          "text-sm font-medium"
        )}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0 text-primary" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
        )}
        
        {/* Render summary (può contenere emoji e HTML) */}
        <div 
          className="flex-1"
          dangerouslySetInnerHTML={{ __html: summary }}
        />
      </button>

      {/* Content (collapsible) */}
      {isOpen && (
        <div className="px-4 py-3 bg-background/50 text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
