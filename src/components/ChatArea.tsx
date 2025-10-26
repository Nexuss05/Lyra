import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatBubble } from "@/components/ChatBubble";
import { forwardRef } from "react";

interface ImageData {
  url?: string;
  data?: string;
  mimeType?: string;
}

interface MessageWithAgent {
  type: "human" | "ai";
  content: string;
  id: string;
  agent?: string;
  finalReportWithCitations?: boolean;
  images?: ImageData[];
}

interface ChatAreaProps {
  messages: MessageWithAgent[];
  isLoading: boolean;
  isGenerating: boolean;
  className?: string;
}

export const ChatArea = forwardRef<HTMLDivElement, ChatAreaProps>(
  ({ messages, isGenerating, className }, ref) => {
    return (
      <div className={`flex-1 min-h-0 overflow-hidden ${className || ""}`}>
        <ScrollArea className="h-full px-6 py-8" ref={ref}>
          <div className="max-w-5xl mx-auto space-y-6">
            {messages.map((message, index) => {
              // 🎯 L'ultimo messaggio AI è in generazione se isGenerating è true
              const isLastAiMessage = message.type === "ai" && index === messages.length - 1;
              const isCurrentlyGenerating = isGenerating && isLastAiMessage;
              
              return (
                <ChatBubble
                  key={message.id}
                  type={message.type}
                  content={message.content}
                  agent={message.agent}
                  isGenerating={isCurrentlyGenerating}
                  images={message.images}
                />
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }
);

ChatArea.displayName = "ChatArea";
