import { useState, useCallback, useEffect } from "react";
import type { ChatSession, ChatMessage } from "@/types/chat";

/**
 * Hook per gestire le chat sessions
 * Gestisce: creazione, selezione, eliminazione, aggiornamento messaggi
 */
export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Carica sessions dal localStorage all'avvio
  useEffect(() => {
    const stored = localStorage.getItem("chat-sessions");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed.sessions || []);
        setActiveSessionId(parsed.activeSessionId || null);
      } catch (error) {
        console.error("Failed to load chat sessions:", error);
      }
    }
  }, []);

  // Salva sessions nel localStorage quando cambiano
  useEffect(() => {
    if (sessions.length > 0 || activeSessionId) {
      localStorage.setItem(
        "chat-sessions",
        JSON.stringify({ sessions, activeSessionId })
      );
    }
  }, [sessions, activeSessionId]);

  /**
   * Genera un titolo dalla prima parte del messaggio
   */
  const generateTitle = (message: string): string => {
    const maxLength = 40;
    const cleaned = message.trim().replace(/\n/g, " ");
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.substring(0, maxLength - 3) + "...";
  };

  /**
   * Crea una nuova chat session
   */
  const createSession = useCallback(
    (userId: string, sessionId: string, appName: string): ChatSession => {
      const newSession: ChatSession = {
        id: sessionId,
        title: "New Chat", // Sarà aggiornato con il primo messaggio
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId,
        appName,
      };

      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(sessionId);

      return newSession;
    },
    []
  );

  /**
   * Seleziona una chat session esistente
   */
  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  /**
   * Elimina una chat session
   */
  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setActiveSessionId((current) =>
      current === sessionId ? null : current
    );
  }, []);

  /**
   * Aggiunge un messaggio alla sessione attiva
   */
  const addMessage = useCallback(
    (sessionId: string, message: ChatMessage) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== sessionId) return session;

          const updatedMessages = [...session.messages, message];
          
          // Se è il primo messaggio utente, aggiorna il titolo
          let updatedTitle = session.title;
          if (
            message.type === "human" &&
            session.messages.filter((m) => m.type === "human").length === 0
          ) {
            updatedTitle = generateTitle(message.content);
          }

          return {
            ...session,
            messages: updatedMessages,
            title: updatedTitle,
            updatedAt: Date.now(),
          };
        })
      );
    },
    []
  );

  /**
   * Aggiorna un messaggio esistente (per streaming AI responses)
   */
  const updateMessage = useCallback(
    (sessionId: string, messageId: string, content: string, agent?: string, images?: Array<{url?: string; data?: string; mimeType?: string}>) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== sessionId) return session;

          return {
            ...session,
            messages: session.messages.map((msg) =>
              msg.id === messageId
                ? { 
                    ...msg, 
                    content, 
                    agent: agent || msg.agent,
                    images: images || msg.images
                  }
                : msg
            ),
            updatedAt: Date.now(),
          };
        })
      );
    },
    []
  );

  /**
   * Pulisce tutti i messaggi dalla sessione attiva (Clear All)
   */
  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setActiveSessionId(null);
    localStorage.removeItem("chat-sessions");
  }, []);

  /**
   * Ottiene la sessione attiva
   */
  const getActiveSession = useCallback((): ChatSession | null => {
    if (!activeSessionId) return null;
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  /**
   * Ottiene tutte le sessioni ordinate per data (più recente prima)
   */
  const getSortedSessions = useCallback((): ChatSession[] => {
    return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [sessions]);

  return {
    // State
    sessions: getSortedSessions(),
    activeSessionId,
    activeSession: getActiveSession(),

    // Actions
    createSession,
    selectSession,
    deleteSession,
    addMessage,
    updateMessage,
    clearAllSessions,
  };
}
