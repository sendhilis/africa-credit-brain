import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ShowcasePdfExport from "@/components/showcase/ShowcasePdfExport";
import OnePagerPdfExport from "@/components/showcase/OnePagerPdfExport";
import {
  Brain, Globe2, Shield, BarChart3, FileText, Zap, Users, TrendingUp,
  CheckCircle2, ArrowRight, Layers, Lock, Activity, Cpu, Eye,
  Smartphone, ChevronDown, ChevronUp, Sparkles, Target, Scale,
  Network, DatabaseZap, Rocket, Star, Key, ServerCog, ShieldCheck,
  Cable, ArrowUpDown, Fingerprint, CloudCog, Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Reusable sub-components ── */

const Section = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section className={cn("animate-fade-in", className)}>{children}</section>
);

const StatCard = ({ value, label, icon: Icon }: { value: string; label: string; icon: any }) => (
  <GlassCard className="flex flex-col items-center text-center gap-3 p-6">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <div className="font-display text-3xl font-bold text-foreground">{value}</div>
    <p className="text-sm text-muted-foreground">{label}</p>
  </GlassCard>
);

const FeatureRow = ({
  icon: Icon, title, description, highlights, reverse, gradient,
}: {
  icon: any; title: string; description: string; highlights: string[]; reverse?: boolean; gradient: string;
}) => (
  <div className={cn("flex flex-col lg:flex-row gap-8 items-center", reverse && "lg:flex-row-reverse")}>
    <div className="flex-1 space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", gradient)}>
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground">{title}</h3>
      </div>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
      <ul className="space-y-2">
        {highlights.map((h, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>{h}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="flex-1 w-full">
      <div className={cn("rounded-2xl p-px", gradient)}>
        <div className="rounded-2xl bg-card p-6 space-y-4">
          <FeatureVisual title={title} />
        </div>
      </div>
    </div>
  </div>
);

/* ── Visual mockups ── */

const FeatureVisual = ({ title }: { title: string }) => {
  if (title.includes("Scoring")) return <ScoringVisual />;
  if (title.includes("Document")) return <DocumentVisual />;
  if (title.includes("Pan-African")) return <CoverageVisual />;
  if (title.includes("Sandbox")) return <SandboxVisual />;
  if (title.includes("Fairness")) return <FairnessVisual />;
  if (title.includes("Time-Series")) return <TimeSeriesVisual />;
  if (title.includes("Credential")) return <CredentialVisual />;
  if (title.includes("Production Promotion")) return <PromotionVisual />;
  if (title.includes("API Proxy")) return <ProxyVisual />;
  if (title.includes("Psychometric")) return <PsychometricVisual />;
  return <div className="h-32 flex items-center justify-center text-muted-foreground">Visual</div>;
};

const ScoringVisual = () => {
  const bands = [
    { band: "A", range: "740–900", color: "bg-success", width: 95 },
    { band: "B", range: "670–739", color: "bg-primary", width: 78 },
    { band: "C", range: "580–669", color: "bg-warning", width: 60 },
    { band: "D", range: "500–579", color: "bg-accent", width: 42 },
    { band: "E", range: "300–499", color: "bg-destructive", width: 25 },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Score Bands</p>
      {bands.map((b) => (
        <div key={b.band} className="flex items-center gap-3">
          <span className="font-display font-bold text-foreground w-6">{b.band}</span>
          <div className="flex-1 h-3 rounded-full bg-muted/50 overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-700", b.color)} style={{ width: `${b.width}%` }} />
          </div>
          <span className="text-xs text-muted-foreground w-16 text-right">{b.range}</span>
        </div>
      ))}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">Model v1.1 • WoE + IV Logistic Regression</span>
        <Badge variant="outline" className="text-primary border-primary/30">PDO 20</Badge>
      </div>
    </div>
  );
};

const DocumentVisual = () => (
  <div className="space-y-3">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">OCR Pipeline</p>
    <div className="flex items-center gap-2">
      {["Upload", "AI Extract", "Validate Period", "Score Enrich"].map((step, i) => (
        <div key={step} className="flex items-center gap-2 flex-1">
          <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2 text-center">
            <span className="text-xs font-medium text-foreground">{step}</span>
          </div>
          {i < 3 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-3 pt-2">
      <div className="rounded-lg border border-border p-3">
        <p className="text-xs text-muted-foreground mb-1">Bank Statement</p>
        <p className="text-sm font-medium text-foreground">≥ 3 months required</p>
        <div className="flex items-center gap-1 mt-1">
          <CheckCircle2 className="h-3 w-3 text-success" />
          <span className="text-xs text-success">Period validated</span>
        </div>
      </div>
      <div className="rounded-lg border border-border p-3">
        <p className="text-xs text-muted-foreground mb-1">Utility Bill</p>
        <p className="text-sm font-medium text-foreground">≥ 3 months required</p>
        <div className="flex items-center gap-1 mt-1">
          <CheckCircle2 className="h-3 w-3 text-success" />
          <span className="text-xs text-success">Auto-enriched</span>
        </div>
      </div>
    </div>
  </div>
);

const CoverageVisual = () => {
  const countries = [
    { name: "Kenya", flag: "🇰🇪" }, { name: "Nigeria", flag: "🇳🇬" }, { name: "Ghana", flag: "🇬🇭" },
    { name: "Rwanda", flag: "🇷🇼" }, { name: "Tanzania", flag: "🇹🇿" }, { name: "Uganda", flag: "🇺🇬" },
    { name: "South Africa", flag: "🇿🇦" }, { name: "Ethiopia", flag: "🇪🇹" }, { name: "Senegal", flag: "🇸🇳" },
    { name: "Zimbabwe", flag: "🇿🇼" }, { name: "Mozambique", flag: "🇲🇿" }, { name: "Zambia", flag: "🇿🇲" },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Markets</p>
      <div className="grid grid-cols-3 gap-2">
        {countries.map((c) => (
          <div key={c.name} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <span className="text-lg">{c.flag}</span>
            <span className="text-xs font-medium text-foreground truncate">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SandboxVisual = () => (
  <div className="space-y-3 font-mono text-xs">
    <p className="text-xs font-sans font-medium text-muted-foreground uppercase tracking-wider">API Console</p>
    <div className="rounded-lg bg-muted/30 p-3 border border-border space-y-1">
      <span className="text-success">POST</span> <span className="text-foreground">/v1/score</span>
      <pre className="text-muted-foreground mt-2">{`{
  "borrower_id": "BRW-12345",
  "country": "KE",
  "amount": 50000
}`}</pre>
    </div>
    <div className="rounded-lg bg-muted/30 p-3 border border-primary/30 space-y-1">
      <span className="text-primary">200 OK</span> <span className="text-muted-foreground">• 47ms</span>
      <pre className="text-foreground mt-2">{`{
  "score": 742, "band": "A",
  "decision": "APPROVE",
  "pd": 0.0312
}`}</pre>
    </div>
  </div>
);

const FairnessVisual = () => (
  <div className="space-y-3">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bias Audit</p>
    <div className="space-y-3">
      {[
        { dim: "Gender", disparity: 2.1 },
        { dim: "Age Group", disparity: 3.8 },
        { dim: "Region", disparity: 4.2 },
      ].map((d) => (
        <div key={d.dim} className="flex items-center gap-3">
          <span className="text-sm text-foreground w-20">{d.dim}</span>
          <div className="flex-1"><Progress value={100 - d.disparity * 10} className="h-2" /></div>
          <Badge variant="outline" className="text-success border-success/30 text-xs">{d.disparity}% gap</Badge>
        </div>
      ))}
    </div>
    <p className="text-xs text-muted-foreground">All dimensions within ≤5% threshold</p>
  </div>
);

const TimeSeriesVisual = () => (
  <div className="space-y-3">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Temporal Analysis</p>
    <div className="flex items-end gap-1 h-24">
      {[45, 52, 48, 65, 70, 68, 75, 80, 78, 85, 82, 90].map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm bg-primary/60 transition-all duration-500 hover:bg-primary" style={{ height: `${v}%` }} />
      ))}
    </div>
    <div className="flex justify-between text-xs text-muted-foreground"><span>Jan</span><span>Jun</span><span>Dec</span></div>
    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
      <div className="text-center"><p className="text-xs text-muted-foreground">Stability</p><p className="font-display font-bold text-foreground">0.87</p></div>
      <div className="text-center"><p className="text-xs text-muted-foreground">Trend</p><p className="font-display font-bold text-success">↑ 12%</p></div>
      <div className="text-center"><p className="text-xs text-muted-foreground">Volatility</p><p className="font-display font-bold text-foreground">Low</p></div>
    </div>
  </div>
);

const PsychometricVisual = () => (
  <div className="space-y-3">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assessment Flow</p>
    <div className="space-y-2">
      {[
        { step: "SMS / WhatsApp link sent", status: "✓", color: "text-success" },
        { step: "Borrower opens questionnaire", status: "✓", color: "text-success" },
        { step: "Responses scored in real-time", status: "✓", color: "text-success" },
        { step: "Score feeds into decisioning model", status: "✓", color: "text-success" },
      ].map((s, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
          <span className={cn("font-bold", s.color)}>{s.status}</span>
          <span className="text-sm text-foreground">{s.step}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ── NEW: Production Infrastructure Visuals ── */

const CredentialVisual = () => (
  <div className="space-y-3">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Credential Vault</p>
    <div className="space-y-2">
      {[
        { label: "API Key", masked: "sk_live_••••••••3f9a", status: "Encrypted" },
        { label: "Client Secret", masked: "cs_••••••••7b2e", status: "Encrypted" },
        { label: "Base URL", masked: "https://api.cbz.co.zw/v1", status: "Verified" },
      ].map((c) => (
        <div key={c.label} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">{c.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-foreground">{c.masked}</span>
            <Badge variant="outline" className="text-success border-success/30 text-[10px]">{c.status}</Badge>
          </div>
        </div>
      ))}
    </div>
    <div className="flex items-center gap-2 pt-1">
      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs text-muted-foreground">Server-side decryption only — never exposed to frontend</span>
    </div>
  </div>
);

const PromotionVisual = () => (
  <div className="space-y-3">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sandbox → Production</p>
    <div className="flex flex-col gap-2">
      {[
        { step: "1", label: "Sandbox Tests Pass", icon: CheckCircle2, done: true },
        { step: "2", label: "Credentials Encrypted & Stored", icon: Lock, done: true },
        { step: "3", label: "Config Cloned to Production", icon: Layers, done: true },
        { step: "4", label: "Live Traffic Enabled", icon: Zap, done: true },
      ].map((s) => (
        <div key={s.step} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">{s.step}</div>
          <s.icon className="h-4 w-4 text-success" />
          <span className="text-sm text-foreground">{s.label}</span>
          <Badge variant="outline" className="ml-auto text-success border-success/30 text-[10px]">Done</Badge>
        </div>
      ))}
    </div>
  </div>
);

const ProxyVisual = () => (
  <div className="space-y-3 font-mono text-xs">
    <p className="text-xs font-sans font-medium text-muted-foreground uppercase tracking-wider">Secure API Proxy</p>
    <div className="rounded-lg bg-muted/30 p-3 border border-border">
      <span className="text-warning">→ Client Request</span>
      <pre className="text-muted-foreground mt-1">{`POST /integration-proxy
{ "config_id": "cfg_zw_cbz",
  "endpoint": "/kyc/verify",
  "body": { "id_number": "63-..." } }`}</pre>
    </div>
    <div className="rounded-lg bg-muted/30 p-3 border border-primary/30">
      <span className="text-primary">← Proxy Layer</span>
      <pre className="text-foreground mt-1">{`1. Decrypt credentials (server-side)
2. Inject auth headers (X-API-Key / OAuth2)
3. Forward to: api.cbz.co.zw/v1/kyc/verify
4. Return response (200 OK • 142ms)`}</pre>
    </div>
  </div>
);

/* ── Expandable advantage card ── */

const AdvantageCard = ({ icon: Icon, title, subtitle, details }: {
  icon: any; title: string; subtitle: string; details: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <GlassCard className="cursor-pointer" hover>
      <button onClick={() => setOpen(!open)} className="w-full text-left space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-display font-bold text-foreground">{title}</h4>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
        {open && <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">{details}</p>}
      </button>
    </GlassCard>
  );
};

/* ════════════════════════════════════════════
   MAIN SHOWCASE PAGE
   ════════════════════════════════════════════ */

const Showcase = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  const tabs = ["Overview", "AI Scoring", "Features", "Infrastructure", "Advantages", "Integration"];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-12">

        {/* ── Hero ── */}
        <Section>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-accent/10 p-10 lg:p-14">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1.5 text-sm">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Pan-African Credit Intelligence
                </Badge>
                <ShowcasePdfExport />
              </div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-3xl">
                The AI-Powered Credit Brain for{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Africa's Financial Future
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                AfricaOne delivers statistically validated credit scoring, intelligent document extraction,
                production-grade integrations, and real-time decisioning — purpose-built for MFIs and digital lenders across 12+ African markets.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <StatCard value="12+" label="African Markets" icon={Globe2} />
                <StatCard value="300–900" label="Score Range" icon={Target} />
                <StatCard value="< 2s" label="Scoring Latency" icon={Zap} />
                <StatCard value="40+" label="Entity Integrations" icon={Cable} />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Tab navigation ── */}
        <Section>
          <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border overflow-x-auto">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={cn(
                  "flex-1 min-w-[100px] px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === i
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </Section>

        {/* ── Tab Content ── */}
        <div className="space-y-12 animate-fade-in" key={activeTab}>

          {/* ═══ OVERVIEW ═══ */}
          {activeTab === 0 && (
            <>
              <Section>
                <div className="text-center space-y-3 mb-10">
                  <h2 className="font-display text-3xl font-bold text-foreground">Why AfricaOne?</h2>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    A neutral, multi-tenant platform that transforms credit underwriting with AI-driven insights
                    tailored for thin-file borrowers in emerging African markets.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { icon: Brain, title: "AI-First Scoring", desc: "WoE/IV logistic regression with time-series analysis and bureau integration for explainable, accurate decisions." },
                    { icon: Globe2, title: "Pan-African Coverage", desc: "Localized ID types, mobile wallets, bureaus, and currencies across 12+ markets — one integration for the continent." },
                    { icon: Shield, title: "Regulatory Compliant", desc: "Built-in fairness auditing, bias monitoring, and full model transparency for central bank compliance." },
                    { icon: FileText, title: "Smart OCR", desc: "AI-powered document extraction with mandatory 3-month period validation for bank statements and utility bills." },
                    { icon: ServerCog, title: "Production-Ready Integrations", desc: "Full sandbox → production promotion pipeline with encrypted credential vault and secure API proxy for live traffic." },
                    { icon: Rocket, title: "Developer-First", desc: "Full sandbox environment, interactive API console, webhook callbacks, and SDK snippets in Python, Node.js, and cURL." },
                  ].map((f) => (
                    <GlassCard key={f.title} className="space-y-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <f.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-display font-bold text-lg text-foreground">{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </GlassCard>
                  ))}
                </div>
              </Section>

              <Section>
                <GlassCard className="p-8" hover={false}>
                  <div className="text-center space-y-4">
                    <h3 className="font-display text-2xl font-bold text-foreground">Platform at a Glance</h3>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-6 pt-4">
                      {[
                        { icon: Users, label: "Multi-Tenant", value: "Isolated" },
                        { icon: Lock, label: "Security", value: "RLS + RBAC" },
                        { icon: Activity, label: "Uptime", value: "99.9%" },
                        { icon: DatabaseZap, label: "Storage", value: "Encrypted" },
                        { icon: Scale, label: "Fairness", value: "Audited" },
                        { icon: Cable, label: "Integrations", value: "40+ Entities" },
                      ].map((s) => (
                        <div key={s.label} className="flex flex-col items-center gap-2">
                          <s.icon className="h-6 w-6 text-primary" />
                          <span className="font-display font-bold text-foreground">{s.value}</span>
                          <span className="text-xs text-muted-foreground">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </Section>
            </>
          )}

          {/* ═══ AI SCORING ═══ */}
          {activeTab === 1 && (
            <>
              <Section>
                <div className="text-center space-y-3 mb-10">
                  <Badge className="bg-accent/20 text-accent border-accent/30 px-3 py-1">Core Engine</Badge>
                  <h2 className="font-display text-3xl font-bold text-foreground">AI-Powered Scoring Model</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    A statistically validated WoE + IV logistic regression scorecard scaled to a 300–900 range,
                    enriched with time-series analysis and AI-generated qualitative insights.
                  </p>
                </div>
              </Section>

              <Section>
                <FeatureRow
                  icon={Brain}
                  title="Scoring Engine"
                  description="The scoring model uses Weight of Evidence (WoE) binning and Information Value (IV) feature selection to build an interpretable logistic regression scorecard. Each feature's contribution is transparent and auditable."
                  highlights={[
                    "Base score 600, Points-to-Double-Odds (PDO) 20 scaling",
                    "Credit Bureau scores weighted at 30% when available",
                    "Probability of Default (PD) with calibrated conversion",
                    "5 risk bands (A–E) with configurable policy thresholds",
                    "Explainable reason codes for every decision",
                    "Interactive Score Simulator for what-if analysis",
                  ]}
                  gradient="bg-gradient-to-br from-primary/30 to-primary/5"
                />
              </Section>

              <Section>
                <FeatureRow
                  icon={TrendingUp}
                  title="Time-Series Intelligence"
                  description="Beyond static snapshots, AfricaOne analyzes temporal patterns in income, expenses, and payment behavior to detect trends that traditional scorecards miss."
                  highlights={[
                    "Income stability coefficient from 12-month salary data",
                    "Payment trajectory scoring for existing loan history",
                    "Seasonal pattern recognition for agricultural borrowers",
                    "Auto-enrichment from OCR-extracted bank statement data",
                  ]}
                  reverse
                  gradient="bg-gradient-to-br from-accent/30 to-accent/5"
                />
              </Section>

              <Section>
                <GlassCard className="p-8" hover={false}>
                  <h3 className="font-display text-xl font-bold text-foreground mb-6 text-center">Scoring Architecture</h3>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    {[
                      { icon: FileText, label: "Data Ingestion", sub: "Application + OCR + Bureau" },
                      { icon: Layers, label: "WoE Binning", sub: "Feature transformation" },
                      { icon: Cpu, label: "Logistic Regression", sub: "Score calculation" },
                      { icon: Target, label: "Band Assignment", sub: "A–E risk bands" },
                      { icon: Sparkles, label: "AI Insights", sub: "Qualitative analysis" },
                    ].map((step, i) => (
                      <div key={step.label} className="flex items-center gap-4 flex-1">
                        <div className="flex flex-col items-center text-center gap-2 flex-1">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                            <step.icon className="h-6 w-6 text-primary" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{step.label}</span>
                          <span className="text-xs text-muted-foreground">{step.sub}</span>
                        </div>
                        {i < 4 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden md:block" />}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </Section>
            </>
          )}

          {/* ═══ FEATURES ═══ */}
          {activeTab === 2 && (
            <>
              <Section>
                <div className="text-center space-y-3 mb-10">
                  <h2 className="font-display text-3xl font-bold text-foreground">Platform Features</h2>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    End-to-end capabilities from application intake to decisioning, monitoring, and reporting.
                  </p>
                </div>
              </Section>

              <Section>
                <FeatureRow
                  icon={Eye}
                  title="Smart Document Intelligence"
                  description="AI-powered OCR extracts structured financial data from bank statements and utility bills, automatically validating document type and enforcing a minimum 3-month coverage period."
                  highlights={[
                    "Gemini-powered extraction with 92%+ confidence",
                    "Mandatory 3-month period validation",
                    "Salary deposit auto-mapping to income history",
                    "Additional document upload with category tagging",
                    "Invalid documents flagged with specific error reasons",
                  ]}
                  gradient="bg-gradient-to-br from-success/30 to-success/5"
                />
              </Section>

              <Section>
                <FeatureRow
                  icon={Globe2}
                  title="Pan-African Market Coverage"
                  description="Purpose-built for African financial markets with localized configurations for ID types, credit bureaus, mobile money wallets, utilities, and regulatory requirements."
                  highlights={[
                    "12+ countries with complete local configurations",
                    "Multi-currency support including dual-currency markets (e.g. ZWL/USD)",
                    "Local ID types: BVN, Huduma Namba, Kebele ID, Ghana Card, etc.",
                    "Regional bureau and mobile wallet integrations",
                    "Country-specific balance sheet templates",
                  ]}
                  reverse
                  gradient="bg-gradient-to-br from-primary/30 to-primary/5"
                />
              </Section>

              <Section>
                <FeatureRow
                  icon={Shield}
                  title="Fairness & Bias Monitoring"
                  description="Continuous monitoring of model outcomes across demographic dimensions ensures equitable credit access and regulatory compliance."
                  highlights={[
                    "Gender, age, and regional disparity tracking",
                    "Configurable disparity thresholds (default ≤5%)",
                    "Transparent feature contributions for audit trails",
                    "Central bank compliance-ready reporting",
                  ]}
                  gradient="bg-gradient-to-br from-accent/30 to-accent/5"
                />
              </Section>

              <Section>
                <FeatureRow
                  icon={Smartphone}
                  title="Psychometric Assessment"
                  description="Optional borrower psychometric profiling via SMS or WhatsApp, with in-branch sessions supported for walk-in applicants."
                  highlights={[
                    "Remote assessment via SMS / WhatsApp link",
                    "In-branch session with guided prompts",
                    "Granular status tracking: sent → in-progress → completed",
                    "Scores fed directly into the decisioning model",
                  ]}
                  reverse
                  gradient="bg-gradient-to-br from-destructive/30 to-destructive/5"
                />
              </Section>

              <Section>
                <FeatureRow
                  icon={BarChart3}
                  title="Grace AI Assistant"
                  description="An AI-powered contextual assistant embedded within each application, providing real-time insights and recommendations to credit officers during review."
                  highlights={[
                    "Natural language Q&A about any application",
                    "Score justification and risk factor explanation",
                    "Policy recommendation based on institution rules",
                    "Session persistence for audit trail",
                  ]}
                  gradient="bg-gradient-to-br from-primary/30 to-primary/5"
                />
              </Section>
            </>
          )}

          {/* ═══ INFRASTRUCTURE (NEW) ═══ */}
          {activeTab === 3 && (
            <>
              <Section>
                <div className="text-center space-y-3 mb-10">
                  <Badge className="bg-success/20 text-success border-success/30 px-3 py-1">Production-Ready</Badge>
                  <h2 className="font-display text-3xl font-bold text-foreground">Integration Infrastructure</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    A complete pipeline from sandbox testing to production traffic with encrypted credential management,
                    agentic AI setup, and a secure API proxy layer.
                  </p>
                </div>
              </Section>

              <Section>
                <FeatureRow
                  icon={Key}
                  title="Credential Vault & Encryption"
                  description="Secure storage for API keys, OAuth secrets, and certificates. Credentials are encrypted server-side and never exposed to the frontend."
                  highlights={[
                    "XOR obfuscation with environment-scoped encryption keys",
                    "Per-entity credential isolation by institution",
                    "Base URL and endpoint path auto-detection from registry",
                    "Masked display in admin UI — full values never leave the server",
                    "Support for API-Key, OAuth2 Client Credentials, and Bearer tokens",
                  ]}
                  gradient="bg-gradient-to-br from-warning/30 to-warning/5"
                />
              </Section>

              <Section>
                <FeatureRow
                  icon={ArrowUpDown}
                  title="Production Promotion Flow"
                  description="Automated sandbox-to-production promotion that validates test results, verifies encrypted credentials, and clones configurations to the live environment."
                  highlights={[
                    "Pre-flight validation: sandbox tests must pass before promotion",
                    "Credential verification: encrypted keys must be stored before go-live",
                    "Config cloning: sandbox settings replicated to production environment",
                    "Status tracking: LIVE badge and production count metrics in catalog",
                    "Rollback-safe: sandbox config preserved independently",
                  ]}
                  reverse
                  gradient="bg-gradient-to-br from-success/30 to-success/5"
                />
              </Section>

              <Section>
                <FeatureRow
                  icon={CloudCog}
                  title="API Proxy Gateway"
                  description="A secure edge function that serves as the single gateway for all production API calls to external financial institutions. Credentials are decrypted server-side and authentication headers are injected automatically."
                  highlights={[
                    "Server-side credential decryption — zero client exposure",
                    "Auto-detection of auth type: X-API-Key, OAuth2 Basic, Bearer",
                    "Request/response passthrough with latency tracking",
                    "Per-institution endpoint routing based on stored config",
                    "Deno edge function with ~50ms cold start",
                  ]}
                  gradient="bg-gradient-to-br from-primary/30 to-primary/5"
                />
              </Section>

              <Section>
                <FeatureRow
                  icon={Workflow}
                  title="Agentic AI Integration Setup"
                  description="Zero-code integration onboarding powered by a streaming AI agent. Connect to banks, credit bureaus, MNOs, and utilities through a conversational interface."
                  highlights={[
                    "Natural language 'connect' and 'test' commands",
                    "Entity-specific sandbox test suites (USSD STK, KYC pull, etc.)",
                    "Real-time streaming progress with step-by-step observation",
                    "40+ pre-configured entities across 6 countries",
                    "Drag-and-drop entity catalog with status indicators",
                  ]}
                  reverse
                  gradient="bg-gradient-to-br from-accent/30 to-accent/5"
                />
              </Section>

              <Section>
                <GlassCard className="p-8" hover={false}>
                  <h3 className="font-display text-xl font-bold text-foreground mb-6 text-center">End-to-End Integration Pipeline</h3>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    {[
                      { icon: Cable, label: "Select Entity", sub: "From catalog" },
                      { icon: Brain, label: "AI Connect", sub: "Agentic setup" },
                      { icon: Activity, label: "Sandbox Test", sub: "Automated suites" },
                      { icon: Key, label: "Store Credentials", sub: "Encrypted vault" },
                      { icon: ArrowUpDown, label: "Promote", sub: "Go production" },
                      { icon: CloudCog, label: "Live Traffic", sub: "Via API proxy" },
                    ].map((step, i) => (
                      <div key={step.label} className="flex items-center gap-3 flex-1">
                        <div className="flex flex-col items-center text-center gap-2 flex-1">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                            <step.icon className="h-6 w-6 text-primary" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{step.label}</span>
                          <span className="text-xs text-muted-foreground">{step.sub}</span>
                        </div>
                        {i < 5 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden md:block" />}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </Section>
            </>
          )}

          {/* ═══ ADVANTAGES ═══ */}
          {activeTab === 4 && (
            <>
              <Section>
                <div className="text-center space-y-3 mb-10">
                  <h2 className="font-display text-3xl font-bold text-foreground">Competitive Advantages</h2>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    What sets AfricaOne apart from traditional credit scoring platforms.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <AdvantageCard
                    icon={Star}
                    title="Thin-File Friendly"
                    subtitle="Score borrowers with minimal credit history"
                    details="Unlike traditional scorecards that require extensive bureau data, AfricaOne leverages alternative data signals — mobile money transactions, utility payment history, psychometric assessments, and OCR-extracted financial data — to produce reliable scores for first-time borrowers and informal sector workers."
                  />
                  <AdvantageCard
                    icon={Eye}
                    title="Full Model Transparency"
                    subtitle="Every coefficient and bin is visible"
                    details="The Models & Policies page exposes actual WoE bins, feature coefficients, and IV values. The interactive Score Simulator lets risk officers run what-if scenarios. Every variable's contribution to a score is visible, satisfying both internal governance and regulatory requirements for model explainability."
                  />
                  <AdvantageCard
                    icon={ServerCog}
                    title="Production-Grade Integration Pipeline"
                    subtitle="Sandbox → credentials → promotion → live traffic"
                    details="The complete integration lifecycle is automated: AI-powered sandbox setup, entity-specific test suites, encrypted credential storage, one-click production promotion, and a secure API proxy for live traffic. No manual infrastructure work required — connect to 40+ entities across 6 countries through a conversational interface."
                  />
                  <AdvantageCard
                    icon={Lock}
                    title="Enterprise-Grade Security"
                    subtitle="Row-level isolation & encrypted credential vault"
                    details="Every institution's data is strictly isolated via Row Level Security (RLS) policies. API keys are SHA-256 hashed, production credentials are encrypted server-side and never exposed to the frontend, documents stored in encrypted buckets, and role-based access control (admin, credit officer, underwriter, viewer) ensures least-privilege access."
                  />
                  <AdvantageCard
                    icon={Layers}
                    title="One Integration, All Markets"
                    subtitle="A single API for 12+ countries"
                    details="Third-party integrators connect once and get access to all supported African markets. Country-specific ID types, bureau providers, currencies, and regulatory rules are handled by the platform — no per-country integration needed."
                  />
                  <AdvantageCard
                    icon={Scale}
                    title="Regulatory-First Design"
                    subtitle="Built for central bank compliance"
                    details="Fairness auditing, model transparency, reason code generation, and complete audit trails are baked into the platform — not bolted on. AfricaOne generates the exact reporting artifacts that African regulators require for model approval."
                  />
                  <AdvantageCard
                    icon={Fingerprint}
                    title="Grace AI Assistant"
                    subtitle="Contextual AI embedded in every application"
                    details="Each credit application has an embedded AI assistant (Grace) that provides real-time insights, score justifications, risk factor explanations, and policy recommendations. Sessions are persisted for audit trails and compliance."
                  />
                  <AdvantageCard
                    icon={TrendingUp}
                    title="Reloan & Upgrade Engine"
                    subtitle="Automated credit progression tracking"
                    details="Beyond initial scoring, the system tracks borrower repayment performance over time. Good payment history automatically improves future scores, enabling automated reloan approvals and credit limit upgrades — reducing manual underwriting costs."
                  />
                </div>
              </Section>

              <Section>
                <GlassCard className="p-8 bg-gradient-to-br from-primary/10 to-accent/5" hover={false}>
                  <div className="text-center space-y-4">
                    <h3 className="font-display text-2xl font-bold text-foreground">Model Comparison</h3>
                    <p className="text-sm text-muted-foreground">AfricaOne vs. Traditional Scoring</p>
                    <div className="grid md:grid-cols-2 gap-6 pt-4 text-left">
                      <div className="space-y-3">
                        <h4 className="font-display font-bold text-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" /> AfricaOne
                        </h4>
                        {[
                          "Alternative data + bureau fusion",
                          "Time-series income analysis",
                          "AI-powered document OCR",
                          "Real-time API scoring < 2s",
                          "Pan-African localization",
                          "Built-in fairness monitoring",
                          "Encrypted credential vault",
                          "Sandbox → Production pipeline",
                          "Secure API proxy for live traffic",
                        ].map((f) => (
                          <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />{f}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-display font-bold text-foreground flex items-center gap-2 text-muted-foreground">
                          Traditional Scorecard
                        </h4>
                        {[
                          "Bureau-only data dependency",
                          "Static point-in-time snapshot",
                          "Manual document review",
                          "Batch processing (hours/days)",
                          "Single-market configuration",
                          "Compliance as afterthought",
                          "Manual credential management",
                          "No sandbox environment",
                          "Direct API key exposure",
                        ].map((f) => (
                          <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground/60">
                            <span className="h-3.5 w-3.5 shrink-0 text-center">—</span>{f}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </Section>
            </>
          )}

          {/* ═══ INTEGRATION ═══ */}
          {activeTab === 5 && (
            <>
              <Section>
                <div className="text-center space-y-3 mb-10">
                  <h2 className="font-display text-3xl font-bold text-foreground">Integration & Developer Experience</h2>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    Full-fledged sandbox, interactive console, production promotion, and comprehensive API for seamless third-party integration.
                  </p>
                </div>
              </Section>

              <Section>
                <FeatureRow
                  icon={Rocket}
                  title="Sandbox Environment"
                  description="A complete mock environment that mirrors production behavior. Third-party services can build and test integrations without impacting live data or incurring costs."
                  highlights={[
                    "Environment-specific API keys (sk_sandbox_* vs sk_live_*)",
                    "Mock scoring, applications, and document extraction endpoints",
                    "Real-time request logging with latency metrics",
                    "Webhook configuration for event-driven callbacks",
                    "One-click promotion to production after tests pass",
                  ]}
                  gradient="bg-gradient-to-br from-primary/30 to-primary/5"
                />
              </Section>

              <Section>
                <div className="grid md:grid-cols-2 gap-6">
                  <GlassCard className="space-y-4">
                    <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" /> Available Endpoints
                    </h3>
                    <div className="space-y-2">
                      {[
                        { method: "POST", path: "/v1/score", desc: "Score a borrower application" },
                        { method: "POST", path: "/v1/applications", desc: "Create a new application" },
                        { method: "POST", path: "/v1/documents", desc: "Extract document data" },
                        { method: "POST", path: "/integration-proxy", desc: "Proxy to live entity APIs" },
                        { method: "GET", path: "/v1/applications", desc: "List all applications" },
                        { method: "GET", path: "/v1/health", desc: "Service health check" },
                      ].map((ep) => (
                        <div key={ep.path + ep.method} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                          <Badge variant="outline" className={cn("text-xs font-mono",
                            ep.method === "POST" ? "text-warning border-warning/30" : "text-success border-success/30"
                          )}>
                            {ep.method}
                          </Badge>
                          <span className="font-mono text-sm text-foreground">{ep.path}</span>
                          <span className="text-xs text-muted-foreground ml-auto hidden md:block">{ep.desc}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <SandboxVisual />
                </div>
              </Section>

              <Section>
                <GlassCard className="p-8" hover={false}>
                  <h3 className="font-display text-xl font-bold text-foreground mb-6 text-center">Integration Flow</h3>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    {[
                      { step: "1", label: "Generate API Key", sub: "Sandbox or Live" },
                      { step: "2", label: "Test in Sandbox", sub: "Interactive console" },
                      { step: "3", label: "Configure Webhooks", sub: "Event callbacks" },
                      { step: "4", label: "Store Credentials", sub: "Encrypted vault" },
                      { step: "5", label: "Go Live", sub: "Production promote" },
                    ].map((s, i) => (
                      <div key={s.step} className="flex items-center gap-4 flex-1">
                        <div className="flex flex-col items-center text-center gap-2 flex-1">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 border-2 border-primary/40 font-display font-bold text-primary text-lg">
                            {s.step}
                          </div>
                          <span className="text-sm font-medium text-foreground">{s.label}</span>
                          <span className="text-xs text-muted-foreground">{s.sub}</span>
                        </div>
                        {i < 4 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden md:block" />}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </Section>

              <Section>
                <GlassCard className="p-8" hover={false}>
                  <h3 className="font-display text-xl font-bold text-foreground mb-4 text-center">Entity Coverage by Country</h3>
                  <p className="text-sm text-muted-foreground text-center mb-6">40+ pre-configured financial entities ready for sandbox and production</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { country: "🇿🇼 Zimbabwe", entities: "CBZ Bank, EcoCash, ZESA, TransUnion, XDS, CRB Africa, Creditinfo, FinCheck" },
                      { country: "🇰🇪 Kenya", entities: "M-Pesa, Equity Bank, KCB, TransUnion KE, Metropol, KPLC, CRB" },
                      { country: "🇬🇭 Ghana", entities: "MTN MoMo, GCB, Ecobank, XDS Ghana, GWCL, ECG, GhIPSS" },
                      { country: "🇳🇬 Nigeria", entities: "GTBank, Access Bank, CRC Bureau, First Central, NIBSS, Flutterwave" },
                      { country: "🇷🇼 Rwanda", entities: "MTN Rwanda, BK, TransUnion RW, RURA, REG" },
                      { country: "🇺🇬 Uganda", entities: "MTN Uganda, Stanbic, Compuscan, UMEME, NWSC" },
                    ].map((c) => (
                      <div key={c.country} className="rounded-lg border border-border p-4 space-y-2">
                        <h4 className="font-display font-bold text-foreground text-sm">{c.country}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{c.entities}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </Section>
            </>
          )}
        </div>

        {/* ── Footer CTA ── */}
        <Section>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-card to-primary/10 p-10 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.08),transparent_60%)]" />
            <div className="relative space-y-4">
              <h2 className="font-display text-3xl font-bold text-foreground">Ready to Transform Credit Decisioning?</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Start scoring borrowers across Africa in minutes — not months.
              </p>
              <div className="flex justify-center gap-3 pt-2 flex-wrap">
                <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-2 text-sm">
                  <Zap className="h-3.5 w-3.5 mr-1.5" /> API-First
                </Badge>
                <Badge className="bg-accent/20 text-accent border-accent/30 px-4 py-2 text-sm">
                  <Globe2 className="h-3.5 w-3.5 mr-1.5" /> 12+ Markets
                </Badge>
                <Badge className="bg-success/20 text-success border-success/30 px-4 py-2 text-sm">
                  <Shield className="h-3.5 w-3.5 mr-1.5" /> Compliant
                </Badge>
                <Badge className="bg-warning/20 text-warning border-warning/30 px-4 py-2 text-sm">
                  <Cable className="h-3.5 w-3.5 mr-1.5" /> 40+ Entities
                </Badge>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
};

export default Showcase;
