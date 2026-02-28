import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Code2, Copy, Key, Play, Clock, Trash2, Plus, BookOpen,
  Terminal, Webhook, Activity, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle,
} from "lucide-react";

// ── Code Snippets ──
const CODE_SNIPPETS: Record<string, string> = {
  python: `import requests

url = "https://vbzyihhaqtqpozrxvggr.supabase.co/functions/v1/sandbox-api"
headers = {
    "x-api-key": "YOUR_SANDBOX_KEY",
    "Content-Type": "application/json"
}
# Score a borrower
resp = requests.post(url, json={"path": "/v1/score", "borrower_id": "BRW-12345", "country": "KE", "amount": 50000}, headers=headers)
print(resp.json())`,
  node: `const res = await fetch(
  "https://vbzyihhaqtqpozrxvggr.supabase.co/functions/v1/sandbox-api",
  {
    method: "POST",
    headers: {
      "x-api-key": "YOUR_SANDBOX_KEY",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: "/v1/score",
      borrower_id: "BRW-12345",
      country: "KE",
      amount: 50000,
    }),
  }
);
console.log(await res.json());`,
  curl: `curl -X POST \\
  "https://vbzyihhaqtqpozrxvggr.supabase.co/functions/v1/sandbox-api" \\
  -H "x-api-key: YOUR_SANDBOX_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"path":"/v1/score","borrower_id":"BRW-12345","country":"KE","amount":50000}'`,
};

const API_ENDPOINTS = [
  { method: "POST", path: "/v1/score", desc: "Submit scoring request", category: "Scoring" },
  { method: "GET", path: "/v1/score/{id}", desc: "Fetch score & reasons", category: "Scoring" },
  { method: "POST", path: "/v1/applications", desc: "Create application", category: "Applications" },
  { method: "GET", path: "/v1/applications", desc: "List applications", category: "Applications" },
  { method: "POST", path: "/v1/documents", desc: "Upload & extract documents", category: "Documents" },
  { method: "GET", path: "/v1/health", desc: "Service health check", category: "System" },
];

const WEBHOOK_EVENTS = [
  "score.completed", "score.failed",
  "application.created", "application.approved", "application.declined",
  "document.extracted", "document.invalid",
];

// ── Component ──
const Developers = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("console");
  const [codeLang, setCodeLang] = useState("python");

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyEnv, setNewKeyEnv] = useState("sandbox");
  const [showRawKey, setShowRawKey] = useState<string | null>(null);
  const [rawKeyValue, setRawKeyValue] = useState("");
  const [loadingKeys, setLoadingKeys] = useState(false);

  // Console state
  const [consoleMethod, setConsoleMethod] = useState("POST");
  const [consolePath, setConsolePath] = useState("/v1/score");
  const [consoleBody, setConsoleBody] = useState(JSON.stringify({ borrower_id: "BRW-12345", country: "KE", amount: 50000 }, null, 2));
  const [consoleResponse, setConsoleResponse] = useState<any>(null);
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [consoleStatus, setConsoleStatus] = useState<number | null>(null);
  const [consoleLatency, setConsoleLatency] = useState<number | null>(null);

  // Logs state
  const [requestLogs, setRequestLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [webhooksLoading, setWebhooksLoading] = useState(false);

  const invokeManageKeys = useCallback(async (action: string, extra: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke("manage-api-keys", {
      body: { action, ...extra },
    });
    if (error) throw error;
    return data;
  }, []);

  // Load data on mount
  useEffect(() => {
    loadKeys();
    loadLogs();
    loadWebhooks();
  }, []);

  const loadKeys = async () => {
    setLoadingKeys(true);
    try {
      const data = await invokeManageKeys("list");
      setApiKeys(data || []);
    } catch (e: any) {
      console.error("Failed to load keys:", e);
    } finally {
      setLoadingKeys(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await invokeManageKeys("logs", { limit: 50 });
      setRequestLogs(data || []);
    } catch (e: any) {
      console.error("Failed to load logs:", e);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadWebhooks = async () => {
    setWebhooksLoading(true);
    try {
      const data = await invokeManageKeys("webhook_list");
      setWebhooks(data || []);
    } catch (e: any) {
      console.error("Failed to load webhooks:", e);
    } finally {
      setWebhooksLoading(false);
    }
  };

  const createKey = async () => {
    try {
      const data = await invokeManageKeys("create", {
        environment: newKeyEnv,
        label: newKeyLabel || `${newKeyEnv} key`,
      });
      setRawKeyValue(data.raw_key);
      setShowRawKey(data.id);
      setNewKeyLabel("");
      toast({ title: "API Key Created", description: "Copy it now — it won't be shown again." });
      loadKeys();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const revokeKey = async (keyId: string) => {
    try {
      await invokeManageKeys("revoke", { key_id: keyId });
      toast({ title: "Key Revoked" });
      loadKeys();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const runConsole = async () => {
    setConsoleLoading(true);
    setConsoleResponse(null);
    const start = Date.now();
    try {
      // Find any active sandbox key to use
      const sandboxKey = apiKeys.find(k => k.environment === "sandbox" && k.is_active);

      const res = await fetch(
        `https://vbzyihhaqtqpozrxvggr.supabase.co/functions/v1/sandbox-api`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(sandboxKey ? { "x-api-key": sandboxKey.key_prefix + "xxxxxxxxxxxxxxxxxxxx" } : {}),
          },
          body: JSON.stringify({
            path: consolePath,
            ...(consoleMethod === "POST" ? JSON.parse(consoleBody || "{}") : {}),
          }),
        }
      );
      const data = await res.json();
      setConsoleStatus(res.status);
      setConsoleLatency(Date.now() - start);
      setConsoleResponse(data);
      loadLogs();
    } catch (e: any) {
      setConsoleStatus(500);
      setConsoleLatency(Date.now() - start);
      setConsoleResponse({ error: e.message });
    } finally {
      setConsoleLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!newWebhookUrl) return;
    try {
      await invokeManageKeys("webhook_create", { url: newWebhookUrl, events: WEBHOOK_EVENTS.slice(0, 3) });
      setNewWebhookUrl("");
      toast({ title: "Webhook Created" });
      loadWebhooks();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    try {
      await invokeManageKeys("webhook_delete", { webhook_id: webhookId });
      toast({ title: "Webhook Deleted" });
      loadWebhooks();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-foreground">Developer Portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full sandbox environment — generate keys, test endpoints, view logs, and configure webhooks
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-muted/30">
          <TabsTrigger value="console" className="gap-2"><Terminal className="h-3.5 w-3.5" />API Console</TabsTrigger>
          <TabsTrigger value="keys" className="gap-2"><Key className="h-3.5 w-3.5" />API Keys</TabsTrigger>
          <TabsTrigger value="logs" className="gap-2"><Activity className="h-3.5 w-3.5" />Request Logs</TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2"><Webhook className="h-3.5 w-3.5" />Webhooks</TabsTrigger>
          <TabsTrigger value="docs" className="gap-2"><BookOpen className="h-3.5 w-3.5" />Docs</TabsTrigger>
        </TabsList>

        {/* ── API Console ── */}
        <TabsContent value="console">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GlassCard>
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Play className="h-4 w-4 text-primary" /> Try It Out
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select value={consoleMethod} onValueChange={setConsoleMethod}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={consolePath} onValueChange={setConsolePath}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {API_ENDPOINTS.map(ep => (
                        <SelectItem key={`${ep.method}-${ep.path}`} value={ep.path}>
                          {ep.path} — {ep.desc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {consoleMethod === "POST" && (
                  <textarea
                    className="w-full h-32 rounded-lg bg-background p-3 text-xs font-mono text-foreground border border-border resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    value={consoleBody}
                    onChange={e => setConsoleBody(e.target.value)}
                    placeholder="Request body (JSON)"
                  />
                )}
                <Button onClick={runConsole} disabled={consoleLoading} className="w-full gap-2">
                  <Play className="h-3.5 w-3.5" />
                  {consoleLoading ? "Sending…" : "Send Request"}
                </Button>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" /> Response
                </h3>
                {consoleStatus !== null && (
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className={consoleStatus < 300 ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                      {consoleStatus}
                    </Badge>
                    {consoleLatency !== null && (
                      <span className="text-muted-foreground">{consoleLatency}ms</span>
                    )}
                  </div>
                )}
              </div>
              <pre className="overflow-auto rounded-lg bg-background p-4 text-xs text-muted-foreground h-64 font-mono">
                {consoleResponse ? JSON.stringify(consoleResponse, null, 2) : "// Response will appear here…"}
              </pre>
            </GlassCard>
          </div>
        </TabsContent>

        {/* ── API Keys ── */}
        <TabsContent value="keys">
          <GlassCard>
            <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" /> API Keys
            </h3>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Key label (e.g. 'Dev Testing')"
                value={newKeyLabel}
                onChange={e => setNewKeyLabel(e.target.value)}
                className="max-w-xs"
              />
              <Select value={newKeyEnv} onValueChange={setNewKeyEnv}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={createKey} className="gap-1"><Plus className="h-3.5 w-3.5" /> Generate</Button>
            </div>

            {showRawKey && rawKeyValue && (
              <div className="mb-4 rounded-lg bg-success/10 border border-success/30 p-3">
                <p className="text-xs text-success font-medium mb-1">⚠️ Copy this key now — it won't be shown again</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-foreground flex-1 break-all">{rawKeyValue}</code>
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard(rawKeyValue)} className="shrink-0">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {loadingKeys ? (
                <p className="text-xs text-muted-foreground">Loading keys…</p>
              ) : apiKeys.length === 0 ? (
                <p className="text-xs text-muted-foreground">No API keys yet. Generate one to get started.</p>
              ) : (
                apiKeys.map(key => (
                  <div key={key.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                    <Badge variant="outline" className={key.environment === "sandbox" ? "bg-warning/20 text-warning border-warning/30" : "bg-primary/20 text-primary border-primary/30"}>
                      {key.environment}
                    </Badge>
                    <span className="text-sm text-foreground font-medium">{key.label}</span>
                    <code className="text-xs font-mono text-muted-foreground">{key.key_prefix}••••••••</code>
                    {key.is_active ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success ml-auto" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive ml-auto" />
                    )}
                    {key.last_used_at && (
                      <span className="text-xs text-muted-foreground">
                        Last used: {new Date(key.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                    {key.is_active && (
                      <Button size="icon" variant="ghost" onClick={() => revokeKey(key.id)} className="h-7 w-7 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </TabsContent>

        {/* ── Request Logs ── */}
        <TabsContent value="logs">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Request Logs
              </h3>
              <Button size="sm" variant="outline" onClick={loadLogs} disabled={logsLoading}>
                <Clock className="h-3.5 w-3.5 mr-1" /> Refresh
              </Button>
            </div>
            <div className="space-y-1 max-h-96 overflow-auto">
              {logsLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : requestLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No requests yet. Use the API Console to make your first call.</p>
              ) : (
                requestLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-2 rounded bg-muted/20 px-3 py-1.5 text-xs">
                    <span className={`font-mono font-bold ${log.method === "POST" ? "text-primary" : "text-success"}`}>
                      {log.method}
                    </span>
                    <span className="font-mono text-foreground flex-1">{log.endpoint}</span>
                    <Badge variant="outline" className={log.status_code < 300 ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                      {log.status_code}
                    </Badge>
                    <span className="text-muted-foreground">{log.latency_ms}ms</span>
                    <span className="text-muted-foreground">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </TabsContent>

        {/* ── Webhooks ── */}
        <TabsContent value="webhooks">
          <GlassCard>
            <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Webhook className="h-4 w-4 text-primary" /> Webhook Endpoints
            </h3>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="https://your-server.com/webhooks/africa-one"
                value={newWebhookUrl}
                onChange={e => setNewWebhookUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createWebhook} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
            </div>
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Available events:</p>
              <div className="flex flex-wrap gap-1">
                {WEBHOOK_EVENTS.map(e => (
                  <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {webhooksLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : webhooks.length === 0 ? (
                <p className="text-xs text-muted-foreground">No webhooks configured.</p>
              ) : (
                webhooks.map(wh => (
                  <div key={wh.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                    <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">{wh.environment}</Badge>
                    <span className="text-xs font-mono text-foreground truncate flex-1">{wh.url}</span>
                    <div className="flex gap-1">
                      {wh.events?.slice(0, 2).map((e: string) => (
                        <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>
                      ))}
                      {wh.events?.length > 2 && <Badge variant="secondary" className="text-[10px]">+{wh.events.length - 2}</Badge>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteWebhook(wh.id)} className="h-7 w-7 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </TabsContent>

        {/* ── Docs ── */}
        <TabsContent value="docs">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GlassCard>
              <div className="flex items-center gap-3 mb-4">
                <Code2 className="h-5 w-5 text-primary" />
                <h3 className="font-display font-semibold text-foreground">Quick Start</h3>
                <div className="ml-auto flex gap-1">
                  {Object.keys(CODE_SNIPPETS).map(lang => (
                    <Button
                      key={lang}
                      size="sm"
                      variant={codeLang === lang ? "default" : "outline"}
                      onClick={() => setCodeLang(lang)}
                      className="text-xs h-7 px-2"
                    >
                      {lang}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-background p-4 text-xs text-muted-foreground font-mono">
                  <code>{CODE_SNIPPETS[codeLang]}</code>
                </pre>
                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(CODE_SNIPPETS[codeLang])} className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-foreground">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </GlassCard>

            <div className="space-y-4">
              <GlassCard>
                <h3 className="font-display font-semibold text-foreground mb-2">API Endpoints</h3>
                <div className="space-y-2 text-xs">
                  {API_ENDPOINTS.map(ep => (
                    <div key={`${ep.method}-${ep.path}`} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                      <span className={`font-mono font-bold ${ep.method === "POST" ? "text-primary" : "text-success"}`}>{ep.method}</span>
                      <span className="font-mono text-foreground">{ep.path}</span>
                      <span className="ml-auto text-muted-foreground">{ep.desc}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" /> Sandbox Rules
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>All sandbox responses return <strong>mock data</strong> — no real borrowers or scores are affected</li>
                  <li>Sandbox keys start with <code className="text-foreground">sk_sandbox_</code>, live keys with <code className="text-foreground">sk_live_</code></li>
                  <li>Using a live key in sandbox returns <code className="text-foreground">403 LIVE_KEY_IN_SANDBOX</code></li>
                  <li>All requests are logged and visible in the Request Logs tab</li>
                  <li>Rate limit: <strong>100 requests/min</strong> per key (sandbox), <strong>1000/min</strong> (live)</li>
                  <li>Webhooks fire for both sandbox and live events separately</li>
                  <li>Document uploads in sandbox return mock extraction results with 3-month period validation</li>
                </ul>
              </GlassCard>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Developers;
