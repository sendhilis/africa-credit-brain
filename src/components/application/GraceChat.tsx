import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, Sparkles, X, MessageCircle, History, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { isGabon } from "../../../supabase/functions/_shared/gabon-credit";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface GraceChatProps {
  applicationId: string;
  applicationContext: {
    appCode: string;
    borrowerName: string;
    country: string;
    productType: string | null;
    productCategory: string;
    status: string;
    currency: string | null;
    requestedAmount: number | null;
    tenorMonths: number | null;
    score: number | null;
    scoreBand: string | null;
    probabilityOfDefault: number | null;
    recommendation: string | null;
    modelVersion: string | null;
    factors: any[];
    reasonCodes: any[];
    woeDetails: any[];
    summary: string | null;
    aiInsights: any;
    dataSanity: any;
    monthlyIncome: number | null;
    monthlyExpenses: number | null;
    monthlyRent: number | null;
    dependents: number | null;
    existingLoans: string | null;
    employer: string | null;
  };
}

const GRACE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/grace-assistant`;

const WELCOME_MESSAGE = (ctx: GraceChatProps["applicationContext"]): Message => ({
  role: "assistant",
  content: isGabon(ctx.country)
    ? "Bonjour! I'm **Grace**. Ask me about missing documents, what to verify, or how this application's indicative affordability score was calculated. You can ask in English or French."
    : `👋 Mhoro! I'm **Grace**, your Credit Scoring Assistant.\n\nAsk me about **${ctx.appCode}** for **${ctx.borrowerName}**: scoring factors, risk flags, and data concerns. I speak **English**, **Shona**, and **Ndebele**.`,
});

const GraceChat = ({ applicationId, applicationContext }: GraceChatProps) => {
  const gabon = isGabon(applicationContext.country);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE(applicationContext)]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load existing sessions for this application
  const loadSessions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("grace_chat_sessions")
      .select("id, title, created_at, updated_at")
      .eq("application_id", applicationId)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (data) setSessions(data);
  }, [applicationId, user]);

  // Load on open
  useEffect(() => {
    if (isOpen) loadSessions();
  }, [isOpen, loadSessions]);

  // Load a specific session's messages
  const loadSession = async (sid: string) => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("grace_chat_messages")
      .select("role, content")
      .eq("session_id", sid)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) {
      setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
    } else {
      setMessages([WELCOME_MESSAGE(applicationContext)]);
    }
    setSessionId(sid);
    setShowHistory(false);
    setLoadingHistory(false);
  };

  // Create a new session
  const createSession = async (firstUserMessage: string): Promise<string | null> => {
    if (!user) return null;
    // Get institution_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("institution_id")
      .eq("user_id", user.id)
      .single();
    if (!profile?.institution_id) return null;

    const title = firstUserMessage.length > 60
      ? firstUserMessage.slice(0, 57) + "..."
      : firstUserMessage;

    const { data, error } = await supabase
      .from("grace_chat_sessions")
      .insert({
        application_id: applicationId,
        institution_id: profile.institution_id,
        user_id: user.id,
        title,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create session:", error);
      return null;
    }
    return data.id;
  };

  // Save a message to DB
  const saveMessage = async (sid: string, role: string, content: string) => {
    await supabase.from("grace_chat_messages").insert({
      session_id: sid,
      role,
      content,
    });
    // Update session updated_at
    await supabase.from("grace_chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sid);
  };

  // Start a new chat
  const startNewChat = () => {
    setSessionId(null);
    setMessages([WELCOME_MESSAGE(applicationContext)]);
    setShowHistory(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsStreaming(true);

    let currentSessionId = sessionId;
    let assistantContent = "";

    try {
      // Create session on first user message if needed
      if (!currentSessionId) {
        currentSessionId = await createSession(userMsg.content);
        if (!currentSessionId) throw new Error("Failed to create chat session");
        setSessionId(currentSessionId);
        // Save the welcome message first
        await saveMessage(currentSessionId, "assistant", messages[0].content);
      }

      // Save user message
      await saveMessage(currentSessionId, "user", userMsg.content);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const resp = await fetch(GRACE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          applicationId,
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          applicationContext: gabon ? undefined : applicationContext,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${resp.status})`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > allMessages.length) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Save the completed assistant message
      if (assistantContent && currentSessionId) {
        await saveMessage(currentSessionId, "assistant", assistantContent);
      }
    } catch (e: any) {
      console.error("Grace chat error:", e);
      toast({ title: "Grace Error", description: e.message, variant: "destructive" });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Grace couldn't answer this time. Please try again." },
      ]);
    } finally {
      setIsStreaming(false);
      loadSessions(); // Refresh session list
    }
  };

  const quickActions = gabon ? [
    { label: "Which documents are missing?", message: "Which evidence is missing, invalid, or still awaiting verification? What specifically should I request?" },
    { label: "Explain affordability", message: "Explain repayment affordability and any indicative score. What should I verify before making a decision?" },
    { label: "Résumer en français", message: "Quels documents manquent ou restent à vérifier, et quelles sont les prochaines étapes ?" },
  ] : [
    { label: "📊 Explain this score", message: `Explain why ${applicationContext.borrowerName} received a score of ${applicationContext.score}. Walk me through each factor contribution and what drove the final score.` },
    { label: "⚠️ Key risk flags", message: `What are the main risk flags and concerns for this application? What should I watch out for before making a decision?` },
    { label: "💡 How to improve", message: `What specific steps could ${applicationContext.borrowerName} take to improve their credit score? What are the weakest factors?` },
    { label: "🔍 WoE breakdown", message: `Give me a detailed breakdown of the Weight of Evidence analysis. Which features contributed most positively and negatively to the score?` },
    { label: "📋 Recommendation", message: `Based on all the data, what is your recommendation for this application? Should we approve, decline, or request more information? Explain your reasoning.` },
    { label: "🇿🇼 Tsanangura muShona", message: `Ndapota tsanangura score iyi muShona. Sei munhu uyu akawana score iyi? Zvii zvakakosha zvandiri kufanira kuziva?` },
  ];

  // Floating button when closed
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
      >
        <div className="relative">
          <MessageCircle className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
        </div>
        <span className="font-medium text-sm">Ask Grace</span>
        {sessions.length > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {sessions.length}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(420px,calc(100%-2rem))] h-[min(600px,calc(100dvh-2rem))] flex flex-col border border-border rounded-2xl bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300" role="region" aria-label="Ask Grace">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-primary/5">
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success border-2 border-card"></span>
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Grace — Score Assistant</h3>
          <p className="text-[10px] text-muted-foreground">{gabon ? "EN · FR" : "EN · Shona · Ndebele"} · {applicationContext.appCode}</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative"
          title="Chat History"
        >
          <History className="h-4 w-4" />
          {sessions.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground font-bold">
              {sessions.length}
            </span>
          )}
        </button>
        <button
          onClick={startNewChat}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="New Chat"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="border-b border-border bg-muted/20 max-h-[200px] overflow-y-auto">
          <div className="px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Chat History</p>
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No previous chats yet.</p>
            ) : (
              <div className="space-y-1">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors hover:bg-muted/50 ${
                      sessionId === s.id ? "bg-primary/10 text-primary border border-primary/20" : "text-foreground"
                    }`}
                  >
                    <p className="font-medium truncate">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(s.updated_at).toLocaleDateString()} · {new Date(s.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading History */}
      {loadingHistory ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted/40 text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&_strong]:text-foreground [&_a]:text-primary">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 mt-0.5">
                      <User className="h-3.5 w-3.5 text-accent-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted/40 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Grace is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick actions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">Quick Questions</p>
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => { setInput(qa.message); }}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-muted/10">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={gabon ? "Ask about documents or affordability…" : "Ask Grace anything about this score..."}
            aria-label="Question for Grace"
            className="flex-1 bg-background border-border text-sm rounded-xl"
            disabled={isStreaming}
          />
          <Button size="icon" aria-label="Send question" onClick={sendMessage} disabled={isStreaming || !input.trim()} className="rounded-xl shrink-0">
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GraceChat;
