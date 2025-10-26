import { useState, useRef, KeyboardEvent } from "react";
import { Send, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  onRegenerate?: () => void;
  onStop?: () => void;
  isLoading: boolean;
  isGenerating?: boolean;
  showRegenerateButton?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSubmit,
  onRegenerate,
  onStop,
  isLoading,
  isGenerating = false,
  showRegenerateButton = false,
  placeholder = "What's in your mind?",
  className,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
      setInput("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 300)}px`;
  };

  return (
    <div className={cn("border-t border-border bg-background ", className)}>
      <div className="max-w-5xl mx-auto px-6 py-4">
        {/* Regenerate Button */}
        {showRegenerateButton && !isLoading && (
          <div className="flex justify-center mb-4">
            <Button
              onClick={onRegenerate}
              variant="outline"
              className={cn(
                "rounded-full px-6 py-2 text-sm border-primary text-primary",
                "hover:bg-primary hover:text-primary-foreground transition-all",
                // Level 2 elevation for secondary actions
                "shadow-[var(--shadow-2)]",
                "hover:shadow-[var(--shadow-3)]",
                "active:shadow-[var(--shadow-1)]"
              )}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Regenerate response
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-center gap-3">
          {/* Input Container */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className={cn(
                "min-h-[80px] max-h-[300px] resize-none rounded-3xl text-base",
                "px-5 py-4 pr-14",
                "bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary/30",
                "placeholder:text-muted-foreground",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                // Inset shadow - carved into screen (NO top highlight for inputs)
                "shadow-[inset_0_2px_4px_#00000030,inset_0_4px_6px_#00000015]"
              )}
              rows={1}
            />

            {/* Send/Stop Button - Aligned right */}
            {isGenerating ? (
              <Button
                onClick={onStop}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2",
                  "w-12 h-12 rounded-full p-0",
                  "bg-primary hover:bg-primary/90",
                  "transition-all duration-200",
                  // Neomorphic shadow from video - top highlight + dark/soft shadow
                  "shadow-[inset_0_1px_2px_#ffffff70,0_4px_6px_#00000030,0_6px_10px_#00000015]",
                  "hover:shadow-[inset_0_1px_2px_#ffffff50,0_2px_4px_#00000030,0_4px_8px_#00000015]",
                  "active:shadow-[inset_0_2px_4px_#00000030,inset_0_4px_6px_#00000015]"
                )}
              >
                <Square className="w-5 h-5 text-white fill-white relative z-10" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2",
                  "w-12 h-12 rounded-full p-0",
                  "bg-primary hover:bg-primary/90",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-200",
                  // Neomorphic shadow from video - top highlight + dark/soft shadow
                  "shadow-[inset_0_1px_2px_#ffffff70,0_4px_6px_#00000030,0_6px_10px_#00000015]",
                  "hover:shadow-[inset_0_1px_2px_#ffffff50,0_2px_4px_#00000030,0_4px_8px_#00000015]",
                  "active:shadow-[inset_0_2px_4px_#00000030,inset_0_4px_6px_#00000015]",
                  "disabled:shadow-none"
                )}
              >
                <Send className="w-5 h-5 text-white relative z-10" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
