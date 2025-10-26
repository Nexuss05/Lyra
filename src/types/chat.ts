// ============================================================================
// CHAT SESSION TYPES
// ============================================================================

/**
 * Rappresenta un singolo messaggio nella chat
 */
export interface ChatMessage {
  id: string;
  type: "human" | "ai";
  content: string;
  agent?: string;
  finalReportWithCitations?: boolean;
  timestamp: number;
  images?: Array<{
    url?: string;
    data?: string;
    mimeType?: string;
  }>;
}

/**
 * Rappresenta una sessione di chat completa
 */
export interface ChatSession {
  id: string; // Session ID dal backend
  title: string; // Titolo generato dal primo messaggio
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  userId: string;
  appName: string;
}

/**
 * Eventi processati per la timeline (mantenuto per compatibilità)
 */
export interface ProcessedEvent {
  title: string;
  data: any;
}

/**
 * Store locale delle chat sessions
 */
export interface ChatSessionsStore {
  sessions: ChatSession[];
  activeSessionId: string | null;
}
