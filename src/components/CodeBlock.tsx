import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/utils";

interface CodeBlockProps {
  children: string;
  className?: string;
  inline?: boolean;
}

export function CodeBlock({ children, className, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Estrai il linguaggio dalla className (es: "language-json")
  const language = className?.replace(/language-/, "").toUpperCase() || "JSON";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Inline code (backtick singolo)
  if (inline) {
    return (
      <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    );
  }

  // Code block (triple backtick)
  return (
    <div className="relative group my-3">
      {/* Header con linguaggio e copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 rounded-t-lg">
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all",
            "hover:bg-black/10 dark:hover:bg-white/10",
            copied ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
          )}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <pre className="bg-black/5 dark:bg-white/5 p-4 rounded-b-lg overflow-x-auto">
        <code className="text-sm font-mono leading-relaxed">{children}</code>
      </pre>
    </div>
  );
}
