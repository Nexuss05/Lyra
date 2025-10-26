import { useState, useRef, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { ChatInput } from "@/components/ChatInput";
import { useChatSessions } from "@/hooks/useChatSessions";
import type { ChatMessage } from "@/types/chat";

// ============================================================================
// TYPES - Mantengono la struttura dei dati dal backend
// ============================================================================
type DisplayData = string | null;

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

interface AgentMessage {
  parts: { text: string }[];
  role: string;
}

interface ProcessedEvent {
  title: string;
  data: any;
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  // ============================================================================
  // CHAT SESSIONS MANAGEMENT
  // ============================================================================
  const {
    sessions,
    activeSessionId,
    activeSession,
    createSession: createChatSession,
    selectSession,
    deleteSession,
    addMessage: addMessageToSession,
    updateMessage: updateMessageInSession,
    clearAllSessions,
  } = useChatSessions();

  // ============================================================================
  // STATE - Tutta la logica backend rimane identica
  // ============================================================================
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [appName, setAppName] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithAgent[]>([]);
  const [displayData, setDisplayData] = useState<DisplayData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messageEvents, setMessageEvents] = useState<Map<string, ProcessedEvent[]>>(new Map());
  const [websiteCount, setWebsiteCount] = useState<number>(0);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const currentAgentRef = useRef('');
  const accumulatedTextRef = useRef("");
  const accumulatedImagesRef = useRef<ImageData[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================================================
  // BACKEND COMMUNICATION LOGIC - NON MODIFICATA
  // ============================================================================
  
  const retryWithBackoff = async (
    fn: () => Promise<any>,
    maxRetries: number = 10,
    maxDuration: number = 120000
  ): Promise<any> => {
    const startTime = Date.now();
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (Date.now() - startTime > maxDuration) {
        throw new Error(`Retry timeout after ${maxDuration}ms`);
      }
      
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  };

  const createSession = async (): Promise<{userId: string, sessionId: string, appName: string}> => {
    const generatedSessionId = uuidv4();
    const response = await fetch(`/api/apps/app/users/u_999/sessions/${generatedSessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      userId: data.userId,
      sessionId: data.id,
      appName: data.appName
    };
  };

  const checkBackendHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/docs", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      return response.ok;
    } catch (error) {
      console.log("Backend not ready yet:", error);
      return false;
    }
  };

  const extractDataFromSSE = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      console.log('[SSE PARSED EVENT]:', JSON.stringify(parsed, null, 2));

      let textParts: string[] = [];
      let imageParts: Array<{ url?: string; data?: string; mimeType?: string }> = [];
      let agent = '';
      let finalReportWithCitations = undefined;
      let functionCall = null;
      let functionResponse = null;
      let sources = null;

      if (parsed.content && parsed.content.parts) {
        // Estrai testo
        textParts = parsed.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text);
        
        // 🎯 Estrai immagini (fileData o inlineData)
        imageParts = parsed.content.parts
          .filter((part: any) => part.fileData || part.inlineData)
          .map((part: any) => {
            if (part.fileData) {
              return {
                url: part.fileData.fileUri,
                mimeType: part.fileData.mimeType
              };
            } else if (part.inlineData) {
              return {
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType
              };
            }
            return {};
          });
        
        console.log('[SSE EXTRACT] Found images:', imageParts.length);
        
        const functionCallPart = parsed.content.parts.find((part: any) => part.functionCall);
        if (functionCallPart) {
          functionCall = functionCallPart.functionCall;
        }
        
        const functionResponsePart = parsed.content.parts.find((part: any) => part.functionResponse);
        if (functionResponsePart) {
          functionResponse = functionResponsePart.functionResponse;
        }
      }

      if (parsed.author) {
        agent = parsed.author;
        console.log('[SSE EXTRACT] Agent:', agent);
      }

      if (
        parsed.actions &&
        parsed.actions.stateDelta &&
        parsed.actions.stateDelta.final_report_with_citations
      ) {
        finalReportWithCitations = parsed.actions.stateDelta.final_report_with_citations;
      }

      let sourceCount = 0;
      if ((parsed.author === 'section_researcher' || parsed.author === 'enhanced_search_executor')) {
        console.log('[SSE EXTRACT] Relevant agent for source count:', parsed.author);
        if (parsed.actions?.stateDelta?.url_to_short_id) {
          console.log('[SSE EXTRACT] url_to_short_id found:', parsed.actions.stateDelta.url_to_short_id);
          sourceCount = Object.keys(parsed.actions.stateDelta.url_to_short_id).length;
          console.log('[SSE EXTRACT] Calculated sourceCount:', sourceCount);
        } else {
          console.log('[SSE EXTRACT] url_to_short_id NOT found for agent:', parsed.author);
        }
      }

      if (parsed.actions?.stateDelta?.sources) {
        sources = parsed.actions.stateDelta.sources;
        console.log('[SSE EXTRACT] Sources found:', sources);
      }

      return { textParts, imageParts, agent, finalReportWithCitations, functionCall, functionResponse, sourceCount, sources };
    } catch (error) {
      const truncatedData = data.length > 200 ? data.substring(0, 200) + "..." : data;
      console.error('Error parsing SSE data. Raw data (truncated): "', truncatedData, '". Error details:', error);
      return { textParts: [], imageParts: [], agent: '', finalReportWithCitations: undefined, functionCall: null, functionResponse: null, sourceCount: 0, sources: null };
    }
  };

  const getEventTitle = (agentName: string): string => {
    switch (agentName) {
      // Marketing Agents - Italiano
      case "main_orchestrator_agent":
        return "🎯 Motore Principale";
      case "auto_optimization_agent":
        return "⚡ Motore di Ottimizzazione";
      case "campaign_orchestrator_agent":
        return "📊 Gestione Campagne";
      case "analytics_agent":
        return "📈 Motore di Analisi";
      case "ad_creative_agent":
        return "🎨 Generatore Creatività";
      case "google_ads":
      case "google ads":
        return "🔍 Motore Google Ads";
      case "meta_ads":
      case "meta ads":
        return "📱 Motore Meta Ads";
      case "tiktok_ads":
      case "tiktok ads":
        return "🎵 Motore TikTok Ads";
      case "IMAGE_GENERATOR":
        return "🖼️ Generatore Immagini";
      
      // Research Agents (legacy - mantieni inglese se necessario)
      case "plan_generator":
        return "📋 Pianificazione Strategia";
      case "section_planner":
        return "📝 Strutturazione Report";
      case "section_researcher":
        return "🔎 Ricerca Web Iniziale";
      case "research_evaluator":
        return "✅ Valutazione Qualità";
      case "EscalationChecker":
        return "🔍 Controllo Qualità";
      case "enhanced_search_executor":
        return "🚀 Ricerca Web Avanzata";
      case "research_pipeline":
        return "⚙️ Pipeline di Ricerca";
      case "iterative_refinement_loop":
        return "🔄 Raffinamento";
      case "interactive_planner_agent":
      case "root_agent":
        return "💡 Pianificazione Interattiva";
      
      default:
        return `✨ Elaborazione ${agentName ? `(${agentName})` : '...'}`;
    }
  };

  const processSseEventData = (jsonData: string, aiMessageId: string, activeSessionId: string) => {
    const { textParts, imageParts, agent, finalReportWithCitations, functionCall, functionResponse, sourceCount, sources } = extractDataFromSSE(jsonData);

    // 🎯 Log summary of what was extracted
    console.log('📊 SSE EVENT SUMMARY:', {
      agent,
      hasText: textParts.length > 0,
      textPreview: textParts.length > 0 ? textParts[0].substring(0, 50) + '...' : 'none',
      hasImages: imageParts.length > 0,
      imageCount: imageParts.length,
      hasFunctionCall: !!functionCall,
      hasFunctionResponse: !!functionResponse,
      sourceCount,
      hasSources: !!sources,
      hasFinalReport: !!finalReportWithCitations,
      activeSessionId // 🎯 Log per debug
    });

    if (sourceCount > 0) {
      console.log('[SSE HANDLER] Updating websiteCount. Current sourceCount:', sourceCount);
      setWebsiteCount(prev => Math.max(prev, sourceCount));
    }

    // 🎯 Aggiorna agent corrente
    if (agent && agent !== currentAgentRef.current) {
      currentAgentRef.current = agent;
      console.log('[SSE HANDLER] Agent changed to:', agent);
      
      // Aggiorna subito il messaggio AI con il nuovo agent
      setMessages(prev => prev.map(msg =>
        msg.id === aiMessageId 
          ? { ...msg, agent: getEventTitle(agent) } 
          : msg
      ));
      
      // Aggiorna nella session
      if (activeSessionId) {
        updateMessageInSession(activeSessionId, aiMessageId, accumulatedTextRef.current, agent, accumulatedImagesRef.current);
      }
    }

    if (functionCall) {
      const functionCallTitle = `Function Call: ${functionCall.name}`;
      console.log('[SSE HANDLER] Adding Function Call timeline event:', functionCallTitle);
      setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
        title: functionCallTitle,
        data: { type: 'functionCall', name: functionCall.name, args: functionCall.args, id: functionCall.id }
      }]));
    }

    if (functionResponse) {
      const functionResponseTitle = `Function Response: ${functionResponse.name}`;
      console.log('[SSE HANDLER] Adding Function Response timeline event:', functionResponseTitle);
      setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
        title: functionResponseTitle,
        data: { type: 'functionResponse', name: functionResponse.name, response: functionResponse.response, id: functionResponse.id }
      }]));
    }

    // 🎯 AGGIORNA IL TESTO IN TEMPO REALE
    if (textParts.length > 0) {
      console.log('[SSE HANDLER] Processing text parts from agent:', agent);
      
      // Aggiungi timeline event per tutti gli agenti (eccetto report finale)
      if (agent !== "report_composer_with_citations") {
        const eventTitle = getEventTitle(agent);
        setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
          title: eventTitle,
          data: { type: 'text', content: textParts.join(" ") }
        }]));
      }
      
      // 🎯 MOSTRA IL TESTO DA QUALSIASI AGENTE (tranne report finale)
      if (agent !== "report_composer_with_citations") {
        for (const text of textParts) {
          accumulatedTextRef.current += text;
          
          console.log('[SSE HANDLER] Updating message with accumulated text:', accumulatedTextRef.current.substring(0, 100) + '...');
          
          // Aggiorna il messaggio nella UI
          setMessages(prev => prev.map(msg =>
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  content: accumulatedTextRef.current, 
                  agent: currentAgentRef.current || msg.agent,
                  images: accumulatedImagesRef.current.length > 0 ? accumulatedImagesRef.current : undefined
                } 
              : msg
          ));
          
          setDisplayData(accumulatedTextRef.current);
          
          // Aggiorna nella session
          if (activeSessionId) {
            updateMessageInSession(activeSessionId, aiMessageId, accumulatedTextRef.current, currentAgentRef.current, accumulatedImagesRef.current);
          }
        }
      }
    }
    
    // 🎯 GESTISCI LE IMMAGINI
    if (imageParts.length > 0) {
      console.log('[SSE HANDLER] Processing image parts:', imageParts);
      
      // Accumula le immagini
      accumulatedImagesRef.current = [...accumulatedImagesRef.current, ...imageParts];
      
      // Aggiorna il messaggio con le immagini
      setMessages(prev => prev.map(msg =>
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              images: accumulatedImagesRef.current,
              agent: currentAgentRef.current || msg.agent
            } 
          : msg
      ));
      
      // 🎯 Salva le immagini nella session
      if (activeSessionId) {
        updateMessageInSession(activeSessionId, aiMessageId, accumulatedTextRef.current, currentAgentRef.current, accumulatedImagesRef.current);
      }
    }

    if (sources) {
      console.log('[SSE HANDLER] Adding Retrieved Sources timeline event:', sources);
      setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
        title: "Retrieved Sources", data: { type: 'sources', content: sources }
      }]));
    }

    // 🎯 REPORT FINALE - mostra come nuovo messaggio
    if (agent === "report_composer_with_citations" && finalReportWithCitations) {
      console.log('[SSE HANDLER] Final report received');
      
      // Aggiorna il messaggio esistente con il report finale
      setMessages(prev => prev.map(msg =>
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              content: finalReportWithCitations as string, 
              agent: "Research Report",
              finalReportWithCitations: true 
            } 
          : msg
      ));
      
      setDisplayData(finalReportWithCitations as string);
      
      // Salva il report finale nella session
      if (activeSessionId) {
        updateMessageInSession(activeSessionId, aiMessageId, finalReportWithCitations as string, "report_composer_with_citations", accumulatedImagesRef.current);
      }
    }
  };

  const handleSubmit = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setIsGenerating(true);
    
    // Crea nuovo AbortController per questa richiesta
    abortControllerRef.current = new AbortController();
    
    // 🎯 Crea immediatamente il messaggio utente nella UI
    const userMessageId = Date.now().toString() + "_user";
    const userMessage: MessageWithAgent = { 
      type: "human", 
      content: query, 
      id: userMessageId 
    };
    setMessages(prev => [...prev, userMessage]);
    
    // 🎯 Crea immediatamente il messaggio AI placeholder
    const aiMessageId = Date.now().toString() + "_ai";
    const aiMessage: MessageWithAgent = { 
      type: "ai", 
      content: "", 
      id: aiMessageId,
      agent: "Initializing..."
    };
    setMessages(prev => [...prev, aiMessage]);
    
    // Reset accumulatori
    accumulatedTextRef.current = "";
    accumulatedImagesRef.current = [];
    currentAgentRef.current = "";
    
    try {
      let currentUserId = userId;
      let currentSessionId = sessionId;
      let currentAppName = appName;
      
      // Crea nuova sessione backend se necessario
      if (!currentSessionId || !currentUserId || !currentAppName) {
        console.log('Creating new session...');
        const sessionData = await retryWithBackoff(createSession);
        currentUserId = sessionData.userId;
        currentSessionId = sessionData.sessionId;
        currentAppName = sessionData.appName;
        
        setUserId(currentUserId);
        setSessionId(currentSessionId);
        setAppName(currentAppName);
        console.log('Session created successfully:', { currentUserId, currentSessionId, currentAppName });
        
        // Crea anche la chat session locale (a questo punto le variabili sono garantite non-null)
        createChatSession(currentUserId!, currentSessionId!, currentAppName!);
      }
      
      // Salva il messaggio utente nella chat session
      if (currentSessionId) {
        addMessageToSession(currentSessionId, {
          id: userMessageId,
          type: "human",
          content: query,
          timestamp: Date.now(),
        });
      }
      
      // Aggiungi placeholder AI message alla session
      if (currentSessionId) {
        addMessageToSession(currentSessionId, {
          id: aiMessageId,
          type: "ai",
          content: "",
          agent: "Initializing...",
          timestamp: Date.now(),
        });
      }

      const sendMessage = async () => {
        const response = await fetch("/api/run_sse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appName: currentAppName,
            userId: currentUserId,
            sessionId: currentSessionId,
            newMessage: {
              parts: [{ text: query }],
              role: "user"
            },
            streaming: false
          }),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
        }
        
        return response;
      };

      const response = await retryWithBackoff(sendMessage);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let lineBuffer = ""; 
      let eventDataBuffer = "";

      if (reader) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();

          if (value) {
            lineBuffer += decoder.decode(value, { stream: true });
          }
          
          let eolIndex;
          while ((eolIndex = lineBuffer.indexOf('\n')) >= 0 || (done && lineBuffer.length > 0)) {
            let line: string;
            if (eolIndex >= 0) {
              line = lineBuffer.substring(0, eolIndex);
              lineBuffer = lineBuffer.substring(eolIndex + 1);
            } else {
              line = lineBuffer;
              lineBuffer = "";
            }

            if (line.trim() === "") {
              if (eventDataBuffer.length > 0) {
                const jsonDataToParse = eventDataBuffer.endsWith('\n') ? eventDataBuffer.slice(0, -1) : eventDataBuffer;
                
                // 🔍 DETAILED LOGGING - Log complete SSE event
                console.group('📨 SSE EVENT RECEIVED');
                console.log('Raw JSON:', jsonDataToParse);
                try {
                  const parsed = JSON.parse(jsonDataToParse);
                  console.log('Parsed Object:', parsed);
                  console.log('Author/Agent:', parsed.author);
                  console.log('Content Parts:', parsed.content?.parts);
                  console.log('Actions:', parsed.actions);
                  console.log('State Delta:', parsed.actions?.stateDelta);
                } catch (e) {
                  console.warn('Failed to parse for logging:', e);
                }
                console.groupEnd();
                
                processSseEventData(jsonDataToParse, aiMessageId, currentSessionId!);
                eventDataBuffer = "";
              }
            } else if (line.startsWith('data:')) {
              eventDataBuffer += line.substring(5).trimStart() + '\n';
            } else if (line.startsWith(':')) {
              // Comment line, ignore
            }
          }

          if (done) {
            if (eventDataBuffer.length > 0) {
              const jsonDataToParse = eventDataBuffer.endsWith('\n') ? eventDataBuffer.slice(0, -1) : eventDataBuffer;
              console.log('[SSE DISPATCH FINAL EVENT]:', jsonDataToParse.substring(0,200) + "...");
              processSseEventData(jsonDataToParse, aiMessageId, currentSessionId!);
              eventDataBuffer = "";
            }
            break;
          }
        }
      }

      // 🎯 SALVATAGGIO FINALE - Assicura che il messaggio AI completo sia salvato
      console.log('[FINAL SAVE] Saving AI message to session:', {
        sessionId: currentSessionId,
        messageId: aiMessageId,
        contentLength: accumulatedTextRef.current.length,
        imagesCount: accumulatedImagesRef.current.length
      });
      
      if (currentSessionId && accumulatedTextRef.current) {
        updateMessageInSession(
          currentSessionId, 
          aiMessageId, 
          accumulatedTextRef.current, 
          currentAgentRef.current,
          accumulatedImagesRef.current.length > 0 ? accumulatedImagesRef.current : undefined
        );
      }

      setIsLoading(false);
      setIsGenerating(false);

    } catch (error) {
      console.error("Error:", error);
      
      // Se è stato abortito dall'utente, non mostrare errore
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted by user');
        setIsLoading(false);
        setIsGenerating(false);
        return;
      }
      
      const aiMessageId = Date.now().toString() + "_ai_error";
      setMessages(prev => [...prev, { 
        type: "ai", 
        content: `Sorry, there was an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        id: aiMessageId 
      }]);
      setIsLoading(false);
      setIsGenerating(false);
    }
  }, [userId, sessionId, appName, processSseEventData]);

  // ============================================================================
  // EFFECTS - Auto-scroll e backend health check
  // ============================================================================
  
  // 🎯 SALVATAGGIO AUTOMATICO - Sincronizza messages con localStorage
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      console.log('[AUTO-SAVE] Syncing messages to localStorage:', {
        sessionId,
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1]
      });
      
      // Trova la session corrente e aggiorna i suoi messaggi
      const storedData = localStorage.getItem("chat-sessions");
      if (storedData) {
        try {
          const { sessions: storedSessions, activeSessionId } = JSON.parse(storedData);
          const updatedSessions = storedSessions.map((session: any) => {
            if (session.id === sessionId) {
              return {
                ...session,
                messages: messages.map(msg => ({
                  id: msg.id,
                  type: msg.type,
                  content: msg.content,
                  agent: msg.agent,
                  finalReportWithCitations: msg.finalReportWithCitations,
                  images: msg.images,
                  timestamp: Date.now()
                })),
                updatedAt: Date.now()
              };
            }
            return session;
          });
          
          localStorage.setItem("chat-sessions", JSON.stringify({
            sessions: updatedSessions,
            activeSessionId
          }));
          
          console.log('[AUTO-SAVE] ✅ Messages saved successfully');
        } catch (error) {
          console.error('[AUTO-SAVE] ❌ Failed to save:', error);
        }
      }
    }
  }, [messages, sessionId]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    const checkBackend = async () => {
      setIsCheckingBackend(true);
      
      const maxAttempts = 60;
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        const isReady = await checkBackendHealth();
        if (isReady) {
          setIsBackendReady(true);
          setIsCheckingBackend(false);
          return;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setIsCheckingBackend(false);
      console.error("Backend failed to start within 2 minutes");
    };
    
    checkBackend();
  }, []);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setIsLoading(false);
  }, []);

  const handleNewChat = useCallback(() => {
    // Reset UI state
    setMessages([]);
    setDisplayData(null);
    setMessageEvents(new Map());
    setWebsiteCount(0);
    setSessionId(null);
    setUserId(null);
    setAppName(null);
    
    // Deselect current session (will create new one on first message)
    selectSession("");
  }, [selectSession]);

  const handleSelectConversation = useCallback((id: string) => {
    selectSession(id);
    const session = sessions.find(s => s.id === id);
    if (session) {
      // Carica i messaggi della sessione selezionata
      const loadedMessages: MessageWithAgent[] = session.messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        id: msg.id,
        agent: msg.agent,
        finalReportWithCitations: msg.finalReportWithCitations,
        images: msg.images, // 🎯 Carica anche le immagini
      }));
      setMessages(loadedMessages);
      
      // Ripristina session data
      setSessionId(session.id);
      setUserId(session.userId);
      setAppName(session.appName);
    }
  }, [selectSession, sessions]);

  const handleDeleteConversation = useCallback((id: string) => {
    deleteSession(id);
    // Se era la sessione attiva, reset
    if (id === activeSessionId) {
      setMessages([]);
      setDisplayData(null);
      setMessageEvents(new Map());
      setWebsiteCount(0);
      setSessionId(null);
    }
  }, [deleteSession, activeSessionId]);

  const handleRegenerate = useCallback(() => {
    // TODO: Implement regenerate logic
    console.log("Regenerate clicked");
  }, []);

  // ============================================================================
  // UI STATES
  // ============================================================================
  
  if (isCheckingBackend) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Starting Backend...</h2>
            <p className="text-sm text-muted-foreground mt-2">Please wait a moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isBackendReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">Backend Unavailable</h2>
          <p className="text-muted-foreground">Unable to connect to backend services</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN CHAT UI
  // ============================================================================
  
  // Trasforma sessions in formato per Sidebar
  const conversationsForSidebar = sessions.map(session => ({
    id: session.id,
    title: session.title,
    isActive: session.id === activeSessionId,
  }));

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        conversations={conversationsForSidebar}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onEditConversation={(id) => console.log("Edit conversation:", id)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          // Welcome/Empty State
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div className="text-center max-w-2xl space-y-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Welcome to LYRA AI
              </h1>
              <p className="text-lg text-muted-foreground">
                Here a prompt example that explains how to obtain the best possible response i guess
              </p>
            </div>
          </div>
        ) : (
          // Chat Messages
          <ChatArea
            messages={messages}
            isLoading={isLoading}
            isGenerating={isGenerating}
            ref={scrollAreaRef}
          />
        )}

        {/* Input Area */}
        <ChatInput
          onSubmit={handleSubmit}
          onRegenerate={handleRegenerate}
          onStop={handleStop}
          isLoading={isLoading}
          isGenerating={isGenerating}
          showRegenerateButton={messages.length > 0 && !isLoading}
        />
      </div>
    </div>
  );
}
