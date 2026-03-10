import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, GitBranch, BarChart3, TableProperties, Weight, Target, TrendingUp, TrendingDown, Minus, Calculator } from "lucide-react";
import { useState } from "react";
import ScoreSimulator from "@/components/models/ScoreSimulator";

// ─── Actual model data from score-application edge function ───

const MODEL_META = {
  name: "WoE/IV Logistic Regression Scorecard + Bureau + Alt-Data",
  version: "v2.0",
  calibration: "African lending markets (Zimbabwe, Kenya, Nigeria, Ghana, Uganda, Rwanda)",
  baseScore: 600,
  baseOdds: "50:1 good-to-bad",
  pdo: 20,
  scoreRange: "300 – 900",
};

const MODEL_COEFFICIENTS: Record<string, { label: string; beta: number; weight: number; note?: string; category?: string }> = {
  intercept:              { label: "Intercept",              beta: 4.80,  weight: 0, category: "core" },
  // ── Traditional Features ──
  bureau_score:           { label: "Credit Bureau Score",    beta: -1.50, weight: 22, note: "PRIMARY — only when available", category: "traditional" },
  payment_history_score:  { label: "Payment History",        beta: -1.20, weight: 14, category: "traditional" },
  debt_to_income:         { label: "Debt-to-Income Ratio",   beta: -0.85, weight: 10, category: "traditional" },
  income_stability_cv:    { label: "Income Stability (CV)",  beta: -0.72, weight: 8, category: "traditional" },
  loan_to_income:         { label: "Loan-to-Income Ratio",   beta: -0.65, weight: 7, category: "traditional" },
  savings_ratio:          { label: "Savings Capacity",       beta: -0.48, weight: 5, category: "traditional" },
  age:                    { label: "Borrower Age",           beta: -0.42, weight: 3, category: "traditional" },
  existing_loan_count:    { label: "Existing Obligations",   beta: -0.38, weight: 3, category: "traditional" },
  collateral_flag:        { label: "Collateral",             beta: -0.35, weight: 2, category: "traditional" },
  business_years:         { label: "Business Tenure",        beta: -0.28, weight: 2, category: "traditional" },
  dependents:             { label: "Dependents",             beta: -0.15, weight: 1, category: "traditional" },
  // ── Alt-Data Features (Thin-File / Zimbabwe-Specific) ──
  mobile_money_activity:  { label: "Mobile Money Activity",       beta: -0.85, weight: 8, note: "EcoCash / InnBucks / OneMoney", category: "alt-data" },
  psychometric_score:     { label: "Psychometric Assessment",     beta: -0.65, weight: 5, note: "15-question behavioural score", category: "alt-data" },
  mukando_savings:        { label: "Mukando / Savings Club",      beta: -0.55, weight: 4, note: "Informal savings discipline", category: "alt-data" },
  supplier_credit:        { label: "Supplier Credit Performance", beta: -0.50, weight: 4, note: "Informal trade credit history", category: "alt-data" },
  airtime_regularity:     { label: "Airtime Top-up Regularity",   beta: -0.45, weight: 3, note: "Econet / NetOne / Telecel", category: "alt-data" },
  social_digital_footprint: { label: "Social & Digital Footprint", beta: -0.35, weight: 2, note: "Biz page, Google listing, reviews", category: "alt-data" },
};

interface WoEBin {
  label: string;
  min: number;
  max: number;
  woe: number;
  event_rate: number;
}

const WOE_BINS: Record<string, { label: string; category: string; bins: WoEBin[] }> = {
  // ── Traditional Features ──
  bureau_score: {
    label: "Credit Bureau Score", category: "traditional",
    bins: [
      { label: "Excellent (750+)",       min: 750, max: 900, woe: -1.45, event_rate: 0.02 },
      { label: "Good (700-749)",         min: 700, max: 749, woe: -0.85, event_rate: 0.04 },
      { label: "Fair (650-699)",         min: 650, max: 699, woe: -0.25, event_rate: 0.08 },
      { label: "Below Average (600-649)",min: 600, max: 649, woe:  0.35, event_rate: 0.14 },
      { label: "Poor (500-599)",         min: 500, max: 599, woe:  0.82, event_rate: 0.24 },
      { label: "Very Poor (<500)",       min: 0,   max: 499, woe:  1.55, event_rate: 0.42 },
      { label: "No Bureau Data",         min: -1,  max: -1,  woe:  0.05, event_rate: 0.11 },
    ],
  },
  debt_to_income: {
    label: "Debt-to-Income Ratio", category: "traditional",
    bins: [
      { label: "≤ 20%",  min: 0,   max: 0.2, woe: -0.85, event_rate: 0.03 },
      { label: "20-40%", min: 0.2, max: 0.4, woe: -0.32, event_rate: 0.06 },
      { label: "40-60%", min: 0.4, max: 0.6, woe:  0.25, event_rate: 0.12 },
      { label: "60-80%", min: 0.6, max: 0.8, woe:  0.78, event_rate: 0.22 },
      { label: "> 80%",  min: 0.8, max: 999, woe:  1.45, event_rate: 0.38 },
    ],
  },
  age: {
    label: "Borrower Age", category: "traditional",
    bins: [
      { label: "18-25", min: 18, max: 25,  woe:  0.62, event_rate: 0.18 },
      { label: "26-35", min: 26, max: 35,  woe: -0.15, event_rate: 0.08 },
      { label: "36-45", min: 36, max: 45,  woe: -0.52, event_rate: 0.05 },
      { label: "46-55", min: 46, max: 55,  woe: -0.38, event_rate: 0.06 },
      { label: "56+",   min: 56, max: 120, woe:  0.22, event_rate: 0.11 },
    ],
  },
  loan_to_income: {
    label: "Loan-to-Income Ratio", category: "traditional",
    bins: [
      { label: "≤ 1x",   min: 0,  max: 1,    woe: -0.72, event_rate: 0.04 },
      { label: "1-3x",   min: 1,  max: 3,    woe: -0.18, event_rate: 0.07 },
      { label: "3-6x",   min: 3,  max: 6,    woe:  0.35, event_rate: 0.14 },
      { label: "6-12x",  min: 6,  max: 12,   woe:  0.82, event_rate: 0.24 },
      { label: "> 12x",  min: 12, max: 9999, woe:  1.55, event_rate: 0.42 },
    ],
  },
  existing_loan_count: {
    label: "Existing Obligations", category: "traditional",
    bins: [
      { label: "None",    min: 0, max: 0,   woe: -0.45, event_rate: 0.05 },
      { label: "1 loan",  min: 1, max: 1,   woe: -0.12, event_rate: 0.08 },
      { label: "2 loans", min: 2, max: 2,   woe:  0.28, event_rate: 0.13 },
      { label: "3+ loans",min: 3, max: 999, woe:  0.95, event_rate: 0.28 },
    ],
  },
  dependents: {
    label: "Dependents", category: "traditional",
    bins: [
      { label: "0",   min: 0, max: 0,   woe: -0.22, event_rate: 0.07 },
      { label: "1-2", min: 1, max: 2,   woe: -0.08, event_rate: 0.09 },
      { label: "3-5", min: 3, max: 5,   woe:  0.18, event_rate: 0.12 },
      { label: "6+",  min: 6, max: 999, woe:  0.55, event_rate: 0.19 },
    ],
  },
  payment_history_score: {
    label: "Payment History Score", category: "traditional",
    bins: [
      { label: "Excellent (>95%)", min: 0.95, max: 1.01, woe: -1.35, event_rate: 0.02 },
      { label: "Good (80-95%)",    min: 0.8,  max: 0.95, woe: -0.62, event_rate: 0.06 },
      { label: "Fair (60-80%)",    min: 0.6,  max: 0.8,  woe:  0.18, event_rate: 0.12 },
      { label: "Poor (40-60%)",    min: 0.4,  max: 0.6,  woe:  0.75, event_rate: 0.22 },
      { label: "Very Poor (<40%)", min: 0,    max: 0.4,  woe:  1.42, event_rate: 0.38 },
      { label: "No History",       min: -1,   max: 0,    woe:  0.35, event_rate: 0.15 },
    ],
  },
  income_stability_cv: {
    label: "Income Stability (CV)", category: "traditional",
    bins: [
      { label: "Very Stable (CV<10%)", min: 0,    max: 0.1,  woe: -0.82, event_rate: 0.04 },
      { label: "Stable (10-25%)",      min: 0.1,  max: 0.25, woe: -0.28, event_rate: 0.07 },
      { label: "Moderate (25-50%)",    min: 0.25, max: 0.5,  woe:  0.32, event_rate: 0.14 },
      { label: "Volatile (>50%)",      min: 0.5,  max: 999,  woe:  0.95, event_rate: 0.26 },
      { label: "Unknown",             min: -1,   max: 0,    woe:  0.15, event_rate: 0.11 },
    ],
  },
  business_years: {
    label: "Business Tenure", category: "traditional",
    bins: [
      { label: "< 1 year",   min: 0,  max: 1,   woe:  0.72, event_rate: 0.22 },
      { label: "1-3 years",  min: 1,  max: 3,   woe:  0.15, event_rate: 0.11 },
      { label: "3-5 years",  min: 3,  max: 5,   woe: -0.32, event_rate: 0.06 },
      { label: "5-10 years", min: 5,  max: 10,  woe: -0.65, event_rate: 0.04 },
      { label: "10+ years",  min: 10, max: 999, woe: -0.88, event_rate: 0.03 },
    ],
  },
  savings_ratio: {
    label: "Savings Capacity", category: "traditional",
    bins: [
      { label: "Negative",  min: -999, max: 0,    woe:  1.15, event_rate: 0.32 },
      { label: "0-10%",     min: 0,    max: 0.1,  woe:  0.42, event_rate: 0.16 },
      { label: "10-25%",    min: 0.1,  max: 0.25, woe: -0.18, event_rate: 0.08 },
      { label: "25-50%",    min: 0.25, max: 0.5,  woe: -0.62, event_rate: 0.05 },
      { label: "> 50%",     min: 0.5,  max: 999,  woe: -0.95, event_rate: 0.03 },
    ],
  },
  // ── Alt-Data Features ──
  mobile_money_activity: {
    label: "Mobile Money Activity", category: "alt-data",
    bins: [
      { label: "High (daily txns, consistent inflows)",  min: 4, max: 5, woe: -1.25, event_rate: 0.03 },
      { label: "Moderate (weekly txns, regular use)",     min: 3, max: 4, woe: -0.55, event_rate: 0.07 },
      { label: "Low (sporadic, small amounts)",           min: 2, max: 3, woe:  0.25, event_rate: 0.14 },
      { label: "Inactive / No account",                   min: 1, max: 2, woe:  0.65, event_rate: 0.22 },
      { label: "No Data Available",                        min: 0, max: 1, woe:  0.05, event_rate: 0.10 },
    ],
  },
  airtime_regularity: {
    label: "Airtime Top-up Regularity", category: "alt-data",
    bins: [
      { label: "Daily / near-daily recharges",  min: 4, max: 5, woe: -0.92, event_rate: 0.04 },
      { label: "Weekly consistent",              min: 3, max: 4, woe: -0.42, event_rate: 0.07 },
      { label: "Irregular / bulk purchases",     min: 2, max: 3, woe:  0.15, event_rate: 0.11 },
      { label: "Rare / prepaid bundles only",    min: 1, max: 2, woe:  0.52, event_rate: 0.18 },
      { label: "No Telco Data",                  min: 0, max: 1, woe:  0.05, event_rate: 0.10 },
    ],
  },
  mukando_savings: {
    label: "Mukando / Savings Club", category: "alt-data",
    bins: [
      { label: "Active member, ≥12 months",         min: 4, max: 5, woe: -1.05, event_rate: 0.03 },
      { label: "Active member, 6-12 months",         min: 3, max: 4, woe: -0.58, event_rate: 0.06 },
      { label: "Active member, <6 months",            min: 2, max: 3, woe: -0.18, event_rate: 0.09 },
      { label: "Lapsed / irregular contributions",    min: 1, max: 2, woe:  0.35, event_rate: 0.15 },
      { label: "No membership",                       min: 0, max: 1, woe:  0.15, event_rate: 0.11 },
    ],
  },
  social_digital_footprint: {
    label: "Social & Digital Footprint", category: "alt-data",
    bins: [
      { label: "Active biz page + Google listing + reviews", min: 3, max: 4, woe: -0.88, event_rate: 0.04 },
      { label: "Active social presence, few reviews",         min: 2, max: 3, woe: -0.42, event_rate: 0.07 },
      { label: "Personal social only, no biz page",           min: 1, max: 2, woe:  0.05, event_rate: 0.10 },
      { label: "No digital presence",                         min: 0, max: 1, woe:  0.20, event_rate: 0.13 },
    ],
  },
  supplier_credit: {
    label: "Supplier Credit Performance", category: "alt-data",
    bins: [
      { label: "Always pays on/before terms",       min: 4, max: 5, woe: -0.95, event_rate: 0.03 },
      { label: "Usually on time (>80%)",             min: 3, max: 4, woe: -0.45, event_rate: 0.06 },
      { label: "Sometimes late, eventually pays",    min: 2, max: 3, woe:  0.22, event_rate: 0.13 },
      { label: "Frequently late / disputes",          min: 1, max: 2, woe:  0.72, event_rate: 0.24 },
      { label: "No supplier credit history",          min: 0, max: 1, woe:  0.08, event_rate: 0.10 },
    ],
  },
  psychometric_score: {
    label: "Psychometric Assessment", category: "alt-data",
    bins: [
      { label: "Strong (>80% across dimensions)",   min: 4, max: 5, woe: -1.10, event_rate: 0.03 },
      { label: "Good (60-80%)",                      min: 3, max: 4, woe: -0.52, event_rate: 0.06 },
      { label: "Average (40-60%)",                   min: 2, max: 3, woe:  0.10, event_rate: 0.11 },
      { label: "Weak (<40%)",                        min: 1, max: 2, woe:  0.65, event_rate: 0.21 },
      { label: "Not Administered",                   min: 0, max: 1, woe:  0.05, event_rate: 0.10 },
    ],
  },
};

const SCORE_BANDS = [
  { band: "Excellent",  min: 800, max: 900, action: "Auto-Approve" },
  { band: "Very Good",  min: 740, max: 799, action: "Approve" },
  { band: "Good",       min: 670, max: 739, action: "Approve" },
  { band: "Fair",       min: 580, max: 669, action: "Manual Review" },
  { band: "Poor",       min: 500, max: 579, action: "Manual Review" },
  { band: "Very Poor",  min: 300, max: 499, action: "Decline" },
];

const products = [
  { name: "Micro-loan",          model: "WoE/IV LR v1.0", countries: ["Kenya", "Rwanda", "Ghana"],    approveThreshold: 670, reviewThreshold: 540 },
  { name: "Nano-credit",         model: "WoE/IV LR v1.0", countries: ["Kenya", "Nigeria", "Senegal"], approveThreshold: 670, reviewThreshold: 540 },
  { name: "SME Working Capital", model: "WoE/IV LR v1.0", countries: ["Nigeria", "Ghana"],            approveThreshold: 670, reviewThreshold: 540 },
  { name: "Retail Individual",   model: "WoE/IV LR v1.0", countries: ["All markets"],                 approveThreshold: 670, reviewThreshold: 540 },
];

const WoeImpactBar = ({ woe }: { woe: number }) => {
  const isNeg = woe < 0;
  const width = Math.min(Math.abs(woe) * 40, 100);
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="w-24 h-2 bg-muted/50 rounded-full relative overflow-hidden">
        {isNeg ? (
          <div className="absolute right-1/2 top-0 h-full bg-success rounded-full" style={{ width: `${width}%` }} />
        ) : (
          <div className="absolute left-1/2 top-0 h-full bg-destructive rounded-full" style={{ width: `${width}%` }} />
        )}
      </div>
      <span className={`text-xs font-mono ${isNeg ? "text-success" : woe > 0 ? "text-destructive" : "text-muted-foreground"}`}>
        {woe > 0 ? "+" : ""}{woe.toFixed(2)}
      </span>
    </div>
  );
};

const Models = () => {
  const [approveScore, setApproveScore] = useState([670]);
  const [selectedFeature, setSelectedFeature] = useState<string>("debt_to_income");

  const coefficients = Object.entries(MODEL_COEFFICIENTS).filter(([k]) => k !== "intercept");

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Models & Policies</h1>
        <p className="mt-1 text-sm text-muted-foreground">Scorecard architecture, WoE binning, coefficients, and decision thresholds</p>
      </div>

      {/* Model Overview */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-display font-semibold text-foreground">{MODEL_META.name}</h3>
              <p className="text-xs text-muted-foreground">{MODEL_META.version} · {MODEL_META.calibration}</p>
            </div>
            <Badge className="ml-auto bg-success/20 text-success border-success/30" variant="outline">Active</Badge>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Score Range</span><span className="font-medium text-foreground">{MODEL_META.scoreRange}</span></div>
            <div className="flex justify-between"><span>Base Score</span><span className="font-medium text-foreground">{MODEL_META.baseScore}</span></div>
            <div className="flex justify-between"><span>Base Odds</span><span className="font-medium text-foreground">{MODEL_META.baseOdds}</span></div>
            <div className="flex justify-between"><span>Points to Double Odds</span><span className="font-medium text-foreground">{MODEL_META.pdo}</span></div>
            <div className="flex justify-between"><span>Traditional Features</span><span className="font-medium text-foreground">{coefficients.filter(([,c]) => c.category === "traditional").length}</span></div>
            <div className="flex justify-between"><span>Alt-Data Features</span><span className="font-medium text-foreground">{coefficients.filter(([,c]) => c.category === "alt-data").length}</span></div>
          </div>
        </GlassCard>

        {/* Score Bands */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Score Bands & Decision Rules</h3>
          </div>
          <div className="space-y-1.5">
            {SCORE_BANDS.map((sb) => (
              <div key={sb.band} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                <span className="text-muted-foreground">{sb.band}</span>
                <span className="font-mono text-foreground">{sb.min}–{sb.max}</span>
                <Badge variant="outline" className={`text-[10px] ${
                  sb.action === "Decline" ? "bg-destructive/10 text-destructive border-destructive/20" :
                  sb.action === "Manual Review" ? "bg-warning/10 text-warning border-warning/20" :
                  "bg-success/10 text-success border-success/20"
                }`}>{sb.action}</Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Tabs: Coefficients, WoE Bins, Policies */}
      <Tabs defaultValue="simulator" className="mb-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="simulator" className="gap-1.5 text-xs"><Calculator className="h-3.5 w-3.5" /> Simulator</TabsTrigger>
          <TabsTrigger value="coefficients" className="gap-1.5 text-xs"><Weight className="h-3.5 w-3.5" /> Coefficients</TabsTrigger>
          <TabsTrigger value="woe" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" /> WoE Bins</TabsTrigger>
          <TabsTrigger value="policies" className="gap-1.5 text-xs"><TableProperties className="h-3.5 w-3.5" /> Product Policies</TabsTrigger>
        </TabsList>

        {/* Simulator Tab */}
        <TabsContent value="simulator">
          <ScoreSimulator />
        </TabsContent>

        {/* Coefficients Tab */}
        <TabsContent value="coefficients">
          <GlassCard hover={false}>
            <h2 className="mb-1 font-display text-lg font-semibold text-foreground">Model Coefficients (β) — v2.0</h2>
            <p className="mb-4 text-xs text-muted-foreground">Logistic regression coefficients — negative β is protective (lowers PD). Alt-data features enable thin-file scoring when bureau data is unavailable.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Feature", "β Coefficient", "Weight %", "Direction", "Note"].map((h) => (
                      <th key={h} className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <td className="py-3 font-medium text-foreground">Intercept</td>
                    <td className="py-3 font-mono text-foreground">{MODEL_COEFFICIENTS.intercept.beta.toFixed(2)}</td>
                    <td className="py-3 text-muted-foreground">—</td>
                    <td className="py-3 text-muted-foreground">—</td>
                    <td className="py-3 text-muted-foreground">—</td>
                  </tr>
                  {/* Traditional Features */}
                  <tr><td colSpan={5} className="pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-primary">Traditional Features</td></tr>
                  {coefficients
                    .filter(([, c]) => c.category === "traditional")
                    .sort(([, a], [, b]) => b.weight - a.weight)
                    .map(([key, c]) => {
                      const isProtective = c.beta < 0;
                      return (
                        <tr key={key} className="border-b border-border/50 last:border-0">
                          <td className="py-3 font-medium text-foreground">{c.label}</td>
                          <td className="py-3 font-mono">
                            <span className={isProtective ? "text-success" : "text-destructive"}>
                              {c.beta > 0 ? "+" : ""}{c.beta.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${c.weight * 4}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{c.weight}%</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              {isProtective ? (
                                <><TrendingDown className="h-3.5 w-3.5 text-success" /><span className="text-xs text-success">Protective</span></>
                              ) : (
                                <><TrendingUp className="h-3.5 w-3.5 text-destructive" /><span className="text-xs text-destructive">Risk-increasing</span></>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-xs text-muted-foreground">{c.note || "—"}</td>
                        </tr>
                      );
                    })}
                  {/* Alt-Data Features */}
                  <tr><td colSpan={5} className="pt-6 pb-2 text-xs font-semibold uppercase tracking-wider text-accent-foreground"><Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/30 mr-2">Alt-Data</Badge>Alternative Data Features (Thin-File)</td></tr>
                  {coefficients
                    .filter(([, c]) => c.category === "alt-data")
                    .sort(([, a], [, b]) => b.weight - a.weight)
                    .map(([key, c]) => {
                      const isProtective = c.beta < 0;
                      return (
                        <tr key={key} className="border-b border-border/50 last:border-0 bg-accent/5">
                          <td className="py-3 font-medium text-foreground">{c.label}</td>
                          <td className="py-3 font-mono">
                            <span className={isProtective ? "text-success" : "text-destructive"}>
                              {c.beta > 0 ? "+" : ""}{c.beta.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${c.weight * 4}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{c.weight}%</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <TrendingDown className="h-3.5 w-3.5 text-success" /><span className="text-xs text-success">Protective</span>
                            </div>
                          </td>
                          <td className="py-3 text-xs text-muted-foreground italic">{c.note || "—"}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </TabsContent>

        {/* WoE Bins Tab */}
        <TabsContent value="woe">
          <GlassCard hover={false}>
            <h2 className="mb-1 font-display text-lg font-semibold text-foreground">Weight of Evidence Bins</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Negative WoE → lower default risk (good). Positive WoE → higher default risk (bad). Alt-data features enable scoring for thin-file borrowers.
            </p>

            {/* Feature selector with category grouping */}
            <div className="mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Traditional</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Object.entries(WOE_BINS).filter(([, f]) => f.category === "traditional").map(([key, feat]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFeature(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedFeature === key
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
                    }`}
                  >
                    {feat.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Alt-Data <Badge variant="outline" className="text-[9px] bg-accent/10 text-accent-foreground border-accent/30 ml-1 py-0">Thin-File</Badge></p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Object.entries(WOE_BINS).filter(([, f]) => f.category === "alt-data").map(([key, feat]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFeature(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedFeature === key
                        ? "bg-accent/20 text-accent-foreground border border-accent/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
                    }`}
                  >
                    {feat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected feature bins */}
            {WOE_BINS[selectedFeature] && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Bin", "Range", "WoE", "Default Rate", "Impact"].map((h) => (
                        <th key={h} className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {WOE_BINS[selectedFeature].bins.map((bin, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-3 font-medium text-foreground">{bin.label}</td>
                        <td className="py-3 font-mono text-xs text-muted-foreground">
                          {bin.min === -999 || bin.min === -1 ? "< " : ""}{bin.min !== -999 && bin.min !== -1 ? bin.min : ""} – {bin.max >= 999 ? "∞" : bin.max}
                        </td>
                        <td className="py-3">
                          <WoeImpactBar woe={bin.woe} />
                        </td>
                        <td className="py-3 font-mono text-xs text-foreground">{(bin.event_rate * 100).toFixed(0)}%</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            {bin.woe < -0.1 ? (
                              <><TrendingDown className="h-3.5 w-3.5 text-success" /><span className="text-xs text-success">Low risk</span></>
                            ) : bin.woe > 0.1 ? (
                              <><TrendingUp className="h-3.5 w-3.5 text-destructive" /><span className="text-xs text-destructive">High risk</span></>
                            ) : (
                              <><Minus className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Neutral</span></>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </TabsContent>

        {/* Product Policies Tab */}
        <TabsContent value="policies">
          <GlassCard hover={false}>
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Product Policies</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Product", "Model", "Markets", "Approve ≥", "Review ≥"].map((h) => (
                      <th key={h} className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.name} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-medium text-foreground">{p.name}</td>
                      <td className="py-3 text-muted-foreground text-xs">{p.model}</td>
                      <td className="py-3 text-xs text-muted-foreground">{p.countries.join(", ")}</td>
                      <td className="py-3 font-display font-semibold text-success">{p.approveThreshold}</td>
                      <td className="py-3 font-display font-semibold text-warning">{p.reviewThreshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Policy Editor */}
          <GlassCard className="mt-6">
            <h3 className="mb-4 font-display font-semibold text-foreground">Policy Editor — Micro-loan</h3>
            <div className="space-y-6">
              <div>
                <Label className="text-xs text-muted-foreground">Auto-Approve Threshold: {approveScore[0]}</Label>
                <Slider value={approveScore} onValueChange={setApproveScore} min={300} max={900} step={10} className="mt-2" />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>300</span><span>900</span></div>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="defaults" />
                <Label htmlFor="defaults" className="text-sm text-muted-foreground">Block borrowers with active default trade lines</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="bureau" defaultChecked />
                <Label htmlFor="bureau" className="text-sm text-muted-foreground">Require bureau check before scoring</Label>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Models;
