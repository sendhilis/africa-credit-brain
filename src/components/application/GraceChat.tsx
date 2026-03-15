import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, Sparkles, X, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GraceChatProps {
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

const GraceChat = ({ applicationContext }: GraceChatProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `👋 Mhoro! I'm **Grace**, your Credit Scoring Assistant.\n\nI'm fully trained on the scoring model and I have complete context on **${applicationContext.appCode}** for **${applicationContext.borrowerName}**.\n\nAsk me anything about:\n- 📊 Why this score was given\n- 🔍 What each factor means\n- 💡 How to improve the score\n- ⚠️ Risk flags and data concerns\n- 📋 Model policies and thresholds\n\nI speak **English**, **Shona**, and **Ndebele** — feel free to ask in any language! 🇿🇼`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsStreaming(true);

    let assistantContent = "";

    try {
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
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          applicationContext,
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
    } catch (e: any) {
      console.error("Grace chat error:", e);
      toast({ title: "Grace Error", description: e.message, variant: "destructive" });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Ndine dambudziko. Ndapota edzai zvakare. (I encountered an error. Please try again.)" },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const quickActions = [
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
      <button
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
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] flex flex-col border border-border rounded-2xl bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
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
          <p className="text-[10px] text-muted-foreground">EN · Shona · Ndebele · Analyzing {applicationContext.appCode}</p>
        </div>
        <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px]">
          Online
        </Badge>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

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

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-muted/10">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask Grace anything about this score..."
            className="flex-1 bg-background border-border text-sm rounded-xl"
            disabled={isStreaming}
          />
          <Button size="icon" onClick={sendMessage} disabled={isStreaming || !input.trim()} className="rounded-xl shrink-0">
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GraceChat;
