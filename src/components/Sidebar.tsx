import { Plus, Search, MessageCircle, Settings, Trash2, Edit2, LogOut, Moon, Sun } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils";
import lyraLogo from "@/lyralogo.svg";

interface Conversation {
  id: string;
  title: string;
  isActive?: boolean;
}

interface SidebarProps {
  conversations: Conversation[];

  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onEditConversation?: (id: string) => void;
  className?: string;
}

export function Sidebar({
  conversations,

  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onEditConversation,
  className,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className={cn(
      "w-[280px] h-screen flex flex-col transition-colors relative",
      "bg-sidebar",
      // Angoli arrotondati: top-right e bottom-left
      "rounded-tr-[32px] rounded-bl-[32px]",
      // Medium elevation - neomorphic shadow
      "shadow-[inset_0_1px_2px_#ffffff50,0_2px_4px_#00000030,0_4px_8px_#00000015]",
      className
    )}>
      {/* Logo */}
      <div className="p-6 pb-4">
        <img 
          src={lyraLogo} 
          alt="Lyra AI" 
          className="h-12 w-auto"
        />
      </div>

      {/* New Chat + Search Row */}
      <div className="px-4 pb-4 flex items-center gap-3">
        <button
          onClick={onNewChat}
          className={cn(
            "flex-1 bg-primary hover:bg-primary/90 text-white rounded-full",
            "py-3.5 px-6 flex items-center justify-center gap-2.5 font-medium",
            "transition-all duration-200 relative",
            // Strong elevation - top highlight + dark/soft shadow (from video)
            "shadow-[inset_0_1px_2px_#ffffff70,0_4px_6px_#00000030,0_6px_10px_#00000015]",
            "hover:shadow-[inset_0_1px_2px_#ffffff50,0_2px_4px_#00000030,0_4px_8px_#00000015]",
            "active:shadow-[inset_0_2px_4px_#00000030,inset_0_4px_6px_#00000015]"
          )}
        >
          <Plus className="w-5 h-5 relative z-10" strokeWidth={2.5} />
          <span className="text-[15px] relative z-10">New chat</span>
        </button>
        
        <button className={cn(
          "w-12 h-12 flex items-center justify-center rounded-full",
          "bg-primary/10 hover:bg-primary/15 transition-all duration-200",
          // Medium elevation
          "shadow-[inset_0_1px_2px_#ffffff50,0_2px_4px_#00000030,0_4px_8px_#00000015]",
          "hover:shadow-[inset_0_1px_2px_#ffffff70,0_4px_6px_#00000030,0_6px_10px_#00000015]",
          "active:shadow-[inset_0_2px_4px_#00000030,inset_0_4px_6px_#00000015]"
        )}>
          <Search className="w-5 h-5 text-primary" strokeWidth={2.5} />
        </button>
      </div>

      {/* Conversations List */}
      <div className="px-3 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground font-medium">
            Conversations
          </span>
          <button className="text-xs text-primary hover:text-primary/80">
            Clear All
          </button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-1.5">
            {conversations.map((conv) => (
              <div key={conv.id} className="group max-w-[260px]">
                {/* Contenitore chat - SEMPLICISSIMO */}
                <div
                  onClick={() => onSelectConversation(conv.id)}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-sm max-w-[260px]",
                    conv.isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-sidebar-accent/50"
                  )}
                >
                  {/* Icona */}
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  
                  {/* Testo - SI TRONCA AUTOMATICAMENTE */}
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm">{conv.title}</p>
                  </div>
                  
                  {/* Pulsanti - solo se attivo */}
                  {conv.isActive ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditConversation?.(conv.id);
                        }}
                        className="p-1 hover:bg-primary/20 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation?.(conv.id);
                        }}
                        className="p-1 hover:bg-red-500/20 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      

      {/* Bottom Section - Compact & Less Prominent */}
      <div className="px-4 pb-4 space-y-1">
        {/* Dark/Light Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className={cn(
            "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-2xl text-[12px]",
            "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-all",
            // Subtle elevation
            "hover:shadow-[0_1px_2px_#00000030,0_2px_4px_#00000015]"
          )}
        >
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_2px_#00000030,inset_0_2px_4px_#00000015]">
            {theme === "light" ? (
              <Moon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
            ) : (
              <Sun className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
            )}
          </div>
          <span className="font-medium">{theme === "light" ? "Dark" : "Light"}</span>
        </button>

        {/* Settings */}
        <button className={cn(
          "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-2xl text-[12px]",
          "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-all",
          "hover:shadow-[0_1px_2px_#00000030,0_2px_4px_#00000015]"
        )}>
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_2px_#00000030,inset_0_2px_4px_#00000015]">
            <Settings className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
          </div>
          <span className="font-medium">Settings</span>
        </button>

        {/* User Profile 
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">M</span>
          </div>
          <span className="font-medium flex-1">Mammt</span>
          <LogOut className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
        </button>
        */}
      </div>
    </aside>
  );
}
