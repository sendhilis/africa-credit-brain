import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Code2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const codeSnippet = `import requests

url = "https://api.africaone.credit/v1/score"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "borrower_id": "BRW-12345",
    "country": "KE",
    "product": "micro-loan",
    "amount": 50000,
    "tenor_months": 12
}
response = requests.post(url, json=payload, headers=headers)
print(response.json())
# { "score": 745, "band": "A", "pd": 0.023, "decision": "APPROVE" }`;

const Developers = () => (
  <DashboardLayout>
    <div className="mb-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Developers</h1>
      <p className="mt-1 text-sm text-muted-foreground">API documentation, sandbox, and integration guides</p>
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <Code2 className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Quick Start — Python</h3>
        </div>
        <div className="relative">
          <pre className="overflow-x-auto rounded-lg bg-background p-4 text-xs text-muted-foreground">
            <code>{codeSnippet}</code>
          </pre>
          <Button size="icon" variant="ghost" className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-foreground">
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </GlassCard>

      <div className="space-y-4">
        <GlassCard>
          <h3 className="font-display font-semibold text-foreground mb-2">API Endpoints</h3>
          <div className="space-y-2 text-xs">
            {[
              { method: "POST", path: "/v1/score", desc: "Submit scoring request" },
              { method: "POST", path: "/v1/applications", desc: "Create application" },
              { method: "POST", path: "/v1/documents", desc: "Upload documents" },
              { method: "GET", path: "/v1/score/{id}", desc: "Fetch score & reasons" },
              { method: "GET", path: "/v1/health", desc: "Service health" },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                <span className={`font-mono font-bold ${ep.method === "POST" ? "text-primary" : "text-success"}`}>{ep.method}</span>
                <span className="font-mono text-foreground">{ep.path}</span>
                <span className="ml-auto text-muted-foreground">{ep.desc}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display font-semibold text-foreground mb-2">Sandbox</h3>
          <p className="text-xs text-muted-foreground mb-3">Test the API with sandbox credentials — no real data affected.</p>
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Sandbox Key</p>
            <p className="mt-1 font-mono text-xs text-foreground">sk_sandbox_••••••••••••af3d</p>
          </div>
        </GlassCard>
      </div>
    </div>
  </DashboardLayout>
);

export default Developers;
