import ScoreGauge from "@/components/ScoreGauge";
import { Badge } from "@/components/ui/badge";
import GlassCard from "@/components/GlassCard";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle,
  Activity, BarChart3, Layers, Sparkles, ShieldAlert, ShieldCheck, CircleHelp,
  SearchCheck, AlertOctagon, Info
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Factor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

interface ReasonCode {
  code: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
}

interface WoEDetail {
  feature: string;
  raw_value: number | null;
  bin: string;
  woe: number;
  event_rate: number;
  coefficient: number;
  points_contribution: number;
}

interface TimeSeriesFeatures {
  payment_history?: {
    score: number;
    on_time_pct: number;
    avg_dpd: number;
    worst_dpd: number;
    trend: string;
    has_history: boolean;
  };
  income_stability?: {
    cv: number;
    mean: number;
    std: number;
    trend: string;
    has_history: boolean;
    months_of_data: number;
  };
}

interface AIInsights {
  score_adjustment?: {
    direction: "increase" | "decrease" | "maintain";
    magnitude: "minor" | "moderate" | "significant";
    adjusted_score: number;
    rationale: string;
  };
  risk_flags?: Array<{ flag: string; severity: "low" | "medium" | "high"; detail: string }>;
  mitigants?: Array<{ factor: string; detail: string }>;
  data_gaps?: string[];
  narrative?: string;
  error?: string;
}

interface SanityFlag {
  check: string;
  severity: "info" | "warning" | "critical";
  finding: string;
  declared_value: string;
  evidence_value: string;
  source: string;
  deviation_pct?: number;
}

interface DataSanity {
  flags: SanityFlag[];
  consistency_score: number;
}

interface ScoreJustificationProps {
  score: number;
  scoreBand: string;
  probabilityOfDefault: number;
  recommendation: string;
  reasonCodes: ReasonCode[];
  factors: Factor[];
  summary: string;
  scoredAt: string;
  modelVersion?: string;
  woeDetails?: WoEDetail[];
  timeSeriesFeatures?: TimeSeriesFeatures;
  aiInsights?: AIInsights | null;
  dataSanity?: DataSanity | null;
}

const impactIcons = {
  positive: <TrendingUp className="h-4 w-4 text-success" />,
  negative: <TrendingDown className="h-4 w-4 text-destructive" />,
  neutral: <Minus className="h-4 w-4 text-muted-foreground" />,
};

const impactColors = {
  positive: "bg-success/10 text-success border-success/20",
  negative: "bg-destructive/10 text-destructive border-destructive/20",
  neutral: "bg-muted/50 text-muted-foreground border-border",
};

const recommendationConfig = {
  approve: { icon: CheckCircle2, color: "bg-success/15 text-success border-success/30", label: "Recommend Approve" },
  review: { icon: AlertTriangle, color: "bg-warning/15 text-warning border-warning/30", label: "Manual Review" },
  decline: { icon: XCircle, color: "bg-destructive/15 text-destructive border-destructive/30", label: "Recommend Decline" },
};

const trendLabels: Record<string, { label: string; color: string }> = {
  improving: { label: "↗ Improving", color: "text-success" },
  stable: { label: "→ Stable", color: "text-muted-foreground" },
  deteriorating: { label: "↘ Deteriorating", color: "text-destructive" },
  growing: { label: "↗ Growing", color: "text-success" },
  declining: { label: "↘ Declining", color: "text-destructive" },
  no_history: { label: "No History", color: "text-muted-foreground" },
  insufficient_data: { label: "Insufficient Data", color: "text-muted-foreground" },
};

const ScoreJustification = ({
  score,
  scoreBand,
  probabilityOfDefault,
  recommendation,
  reasonCodes,
  factors,
  summary,
  scoredAt,
  modelVersion,
  woeDetails,
  timeSeriesFeatures,
  aiInsights,
  dataSanity,
}: ScoreJustificationProps) => {
  const recConfig = recommendationConfig[recommendation as keyof typeof recommendationConfig] || recommendationConfig.review;
  const RecIcon = recConfig.icon;
  const sortedFactors = [...factors].sort((a, b) => b.weight - a.weight);
  const isStatisticalModel = modelVersion?.includes("woe") || !!woeDetails?.length;

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard hover={false} className="flex flex-col items-center justify-center py-6">
          <ScoreGauge score={score} band={scoreBand} size={200} label="Credit Score" />
          {isStatisticalModel && (
            <Badge variant="outline" className="mt-3 text-xs bg-primary/10 text-primary border-primary/20">
              <Layers className="h-3 w-3 mr-1" />
              WoE Logistic Regression · {modelVersion || "v1.0"}
            </Badge>
          )}
        </GlassCard>

        <GlassCard hover={false} className="flex flex-col gap-4 py-6 px-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Recommendation</p>
            <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${recConfig.color}`}>
              <RecIcon className="h-4 w-4" />
              {recConfig.label}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Probability of Default</p>
            <p className="font-display text-2xl font-bold text-foreground mt-1">
              {(probabilityOfDefault * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Scored At</p>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(scoredAt).toLocaleString()}
            </p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="py-6 px-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Executive Summary</p>
          <p className="text-sm text-foreground/90 leading-relaxed">{summary}</p>
        </GlassCard>
      </div>

      {/* Time Series Features */}
      {timeSeriesFeatures && (timeSeriesFeatures.payment_history?.has_history || timeSeriesFeatures.income_stability?.has_history) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {timeSeriesFeatures.payment_history?.has_history && (
            <GlassCard hover={false}>
              <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Payment History (Time-Series)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">On-Time Rate</p>
                  <p className="font-display text-lg font-bold text-foreground">
                    {(timeSeriesFeatures.payment_history.on_time_pct * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Days Past Due</p>
                  <p className="font-display text-lg font-bold text-foreground">
                    {timeSeriesFeatures.payment_history.avg_dpd.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Worst DPD</p>
                  <p className="font-display text-lg font-bold text-foreground">
                    {timeSeriesFeatures.payment_history.worst_dpd}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trend</p>
                  <p className={`font-display text-sm font-semibold ${trendLabels[timeSeriesFeatures.payment_history.trend]?.color || "text-muted-foreground"}`}>
                    {trendLabels[timeSeriesFeatures.payment_history.trend]?.label || timeSeriesFeatures.payment_history.trend}
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {timeSeriesFeatures.income_stability?.has_history && (
            <GlassCard hover={false}>
              <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Income Stability (Time-Series)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Mean Income</p>
                  <p className="font-display text-lg font-bold text-foreground">
                    {timeSeriesFeatures.income_stability.mean.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Coefficient of Variation</p>
                  <p className="font-display text-lg font-bold text-foreground">
                    {(timeSeriesFeatures.income_stability.cv * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Months of Data</p>
                  <p className="font-display text-lg font-bold text-foreground">
                    {timeSeriesFeatures.income_stability.months_of_data}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trend</p>
                  <p className={`font-display text-sm font-semibold ${trendLabels[timeSeriesFeatures.income_stability.trend]?.color || "text-muted-foreground"}`}>
                    {trendLabels[timeSeriesFeatures.income_stability.trend]?.label || timeSeriesFeatures.income_stability.trend}
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* Tabbed detail view */}
      <Tabs defaultValue="factors" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 sm:inline-flex sm:w-auto">
          <TabsTrigger value="factors">Factor Breakdown</TabsTrigger>
          {woeDetails && woeDetails.length > 0 && (
            <TabsTrigger value="woe">WoE Details</TabsTrigger>
          )}
          <TabsTrigger value="reasons">Reason Codes</TabsTrigger>
          {aiInsights && !aiInsights.error && (
            <TabsTrigger value="ai" className="gap-1">
              <Sparkles className="h-3.5 w-3.5" /> AI Insights
            </TabsTrigger>
          )}
          {dataSanity && dataSanity.flags.length > 0 && (
            <TabsTrigger value="sanity" className="gap-1">
              <SearchCheck className="h-3.5 w-3.5" /> Data Sanity
              {dataSanity.flags.filter(f => f.severity === "critical" || f.severity === "warning").length > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
                  {dataSanity.flags.filter(f => f.severity === "critical" || f.severity === "warning").length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Factor Breakdown */}
        <TabsContent value="factors">
          <GlassCard hover={false}>
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Factor Breakdown</h3>
            <div className="space-y-4">
              {sortedFactors.map((factor) => {
                const barColor =
                  factor.score >= 70 ? "bg-success" : factor.score >= 40 ? "bg-warning" : "bg-destructive";
                return (
                  <div key={factor.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{factor.name}</span>
                        <span className="text-xs text-muted-foreground">({factor.weight}% weight)</span>
                      </div>
                      <span className="font-display text-sm font-semibold text-foreground">{factor.score}/100</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </TabsContent>

        {/* WoE Details */}
        {woeDetails && woeDetails.length > 0 && (
          <TabsContent value="woe">
            <GlassCard hover={false}>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">Weight of Evidence (WoE) Analysis</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Each feature is binned using WoE transformation from a logistic regression model. Positive WoE indicates higher-than-average default risk; negative WoE indicates lower risk.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Feature</th>
                      <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Raw Value</th>
                      <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Bin</th>
                      <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">WoE</th>
                      <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Event Rate</th>
                      <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">β Coeff</th>
                      <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {woeDetails
                      .sort((a, b) => a.points_contribution - b.points_contribution)
                      .map((w, i) => {
                        const pointsColor = w.points_contribution > 0 ? "text-success" :
                          w.points_contribution < -5 ? "text-destructive" : "text-muted-foreground";
                        return (
                          <tr key={i} className="border-b border-border/30 last:border-0">
                            <td className="py-2 px-2 font-medium text-foreground">{w.feature}</td>
                            <td className="py-2 px-2 text-muted-foreground font-mono text-xs">
                              {typeof w.raw_value === "number"
                                ? (Math.abs(w.raw_value) < 1 && w.raw_value !== 0
                                  ? (w.raw_value * 100).toFixed(1) + "%"
                                  : w.raw_value.toFixed(1))
                                : "—"}
                            </td>
                            <td className="py-2 px-2">
                              <Badge variant="outline" className="text-xs">{w.bin}</Badge>
                            </td>
                            <td className={`py-2 px-2 text-right font-mono text-xs ${w.woe > 0 ? "text-destructive" : "text-success"}`}>
                              {w.woe > 0 ? "+" : ""}{w.woe.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-xs text-muted-foreground">
                              {(w.event_rate * 100).toFixed(1)}%
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-xs text-muted-foreground">
                              {w.coefficient.toFixed(2)}
                            </td>
                            <td className={`py-2 px-2 text-right font-mono text-xs font-semibold ${pointsColor}`}>
                              {w.points_contribution > 0 ? "+" : ""}{w.points_contribution}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </TabsContent>
        )}

        {/* Reason Codes */}
        <TabsContent value="reasons">
          <GlassCard hover={false}>
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Reason Codes</h3>
            <div className="space-y-2">
              {reasonCodes.map((rc, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${impactColors[rc.impact]}`}
                >
                  {impactIcons[rc.impact]}
                  <div>
                    <span className="text-xs font-mono font-medium">{rc.code}</span>
                    <p className="text-sm mt-0.5 text-foreground">{rc.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>

        {/* AI Insights */}
        {aiInsights && !aiInsights.error && (
          <TabsContent value="ai">
            <div className="space-y-4">
              {/* Score Adjustment Suggestion */}
              {aiInsights.score_adjustment && (
                <GlassCard hover={false}>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" /> AI Score Assessment
                  </h3>
                  <div className="flex flex-col items-start gap-4 mb-3 sm:flex-row">
                    <div className={`px-4 py-3 rounded-lg border text-center min-w-[120px] ${
                      aiInsights.score_adjustment.direction === "increase"
                        ? "bg-success/10 border-success/20"
                        : aiInsights.score_adjustment.direction === "decrease"
                          ? "bg-destructive/10 border-destructive/20"
                          : "bg-muted/50 border-border"
                    }`}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Suggested</p>
                      <p className="font-display text-2xl font-bold text-foreground mt-1">
                        {aiInsights.score_adjustment.adjusted_score}
                      </p>
                      <p className={`text-xs font-medium mt-1 ${
                        aiInsights.score_adjustment.direction === "increase" ? "text-success" :
                          aiInsights.score_adjustment.direction === "decrease" ? "text-destructive" : "text-muted-foreground"
                      }`}>
                        {aiInsights.score_adjustment.direction === "increase" ? "↑" :
                          aiInsights.score_adjustment.direction === "decrease" ? "↓" : "→"}{" "}
                        {aiInsights.score_adjustment.magnitude} {aiInsights.score_adjustment.direction === "maintain" ? "— no change" : aiInsights.score_adjustment.direction}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground/90 leading-relaxed">{aiInsights.score_adjustment.rationale}</p>
                    </div>
                  </div>
                  {aiInsights.narrative && (
                    <div className="mt-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                      <p className="text-sm text-foreground/80 leading-relaxed italic">{aiInsights.narrative}</p>
                    </div>
                  )}
                </GlassCard>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Risk Flags */}
                {aiInsights.risk_flags && aiInsights.risk_flags.length > 0 && (
                  <GlassCard hover={false}>
                    <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-destructive" /> Risk Flags
                    </h3>
                    <div className="space-y-2">
                      {aiInsights.risk_flags.map((rf, i) => (
                        <div key={i} className={`p-2.5 rounded-lg border ${
                          rf.severity === "high" ? "bg-destructive/10 border-destructive/20" :
                            rf.severity === "medium" ? "bg-warning/10 border-warning/20" :
                              "bg-muted/50 border-border"
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-xs ${
                              rf.severity === "high" ? "border-destructive/30 text-destructive" :
                                rf.severity === "medium" ? "border-warning/30 text-warning" :
                                  "border-border text-muted-foreground"
                            }`}>
                              {rf.severity}
                            </Badge>
                            <span className="text-sm font-medium text-foreground">{rf.flag}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{rf.detail}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Mitigants */}
                {aiInsights.mitigants && aiInsights.mitigants.length > 0 && (
                  <GlassCard hover={false}>
                    <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-success" /> Mitigating Factors
                    </h3>
                    <div className="space-y-2">
                      {aiInsights.mitigants.map((m, i) => (
                        <div key={i} className="p-2.5 rounded-lg border bg-success/5 border-success/15">
                          <span className="text-sm font-medium text-foreground">{m.factor}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{m.detail}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </div>

              {/* Data Gaps */}
              {aiInsights.data_gaps && aiInsights.data_gaps.length > 0 && (
                <GlassCard hover={false}>
                  <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CircleHelp className="h-4 w-4 text-accent" /> Data Gaps — Could Improve Accuracy
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {aiInsights.data_gaps.map((gap, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-accent/5 border-accent/20 text-accent">
                        {gap}
                      </Badge>
                    ))}
                  </div>
                </GlassCard>
              )}
            </div>
          </TabsContent>
        )}

        {/* Data Sanity / Consistency Checks */}
        {dataSanity && dataSanity.flags.length > 0 && (
          <TabsContent value="sanity">
            <div className="space-y-4">
              {/* Consistency Score Header */}
              <GlassCard hover={false}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                    <SearchCheck className="h-5 w-5 text-primary" /> Data Consistency Analysis
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Consistency Score</span>
                    <span className={`font-display text-2xl font-bold ${
                      dataSanity.consistency_score >= 80 ? "text-success" :
                      dataSanity.consistency_score >= 50 ? "text-warning" : "text-destructive"
                    }`}>
                      {dataSanity.consistency_score}/100
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cross-referencing declared data against POS statements, bank statements, mobile money records, and computed indicators to detect inconsistencies or potential data falsification.
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                    <p className="font-display text-xl font-bold text-destructive">
                      {dataSanity.flags.filter(f => f.severity === "critical").length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Critical</p>
                  </div>
                  <div className="p-2 rounded-lg bg-warning/10 border border-warning/20 text-center">
                    <p className="font-display text-xl font-bold text-warning">
                      {dataSanity.flags.filter(f => f.severity === "warning").length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Warnings</p>
                  </div>
                  <div className="p-2 rounded-lg bg-success/10 border border-success/20 text-center">
                    <p className="font-display text-xl font-bold text-success">
                      {dataSanity.flags.filter(f => f.severity === "info").length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Verified</p>
                  </div>
                </div>
              </GlassCard>

              {/* Flags List */}
              <GlassCard hover={false}>
                <div className="space-y-3">
                  {dataSanity.flags
                    .sort((a, b) => {
                      const order = { critical: 0, warning: 1, info: 2 };
                      return order[a.severity] - order[b.severity];
                    })
                    .map((flag, i) => {
                      const severityConfig = {
                        critical: {
                          icon: AlertOctagon,
                          bg: "bg-destructive/10 border-destructive/20",
                          iconColor: "text-destructive",
                          label: "CRITICAL",
                          labelColor: "bg-destructive text-destructive-foreground",
                        },
                        warning: {
                          icon: AlertTriangle,
                          bg: "bg-warning/10 border-warning/20",
                          iconColor: "text-warning",
                          label: "WARNING",
                          labelColor: "bg-warning text-warning-foreground",
                        },
                        info: {
                          icon: CheckCircle2,
                          bg: "bg-success/10 border-success/20",
                          iconColor: "text-success",
                          label: "VERIFIED",
                          labelColor: "bg-success text-success-foreground",
                        },
                      };
                      const config = severityConfig[flag.severity];
                      const FlagIcon = config.icon;

                      return (
                        <div key={i} className={`p-3 rounded-lg border ${config.bg}`}>
                          <div className="flex items-start gap-3">
                            <FlagIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-medium text-sm text-foreground">{flag.check}</span>
                                <Badge className={`text-[10px] px-1.5 py-0 ${config.labelColor}`}>
                                  {config.label}
                                </Badge>
                                {flag.deviation_pct !== undefined && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {flag.deviation_pct}% deviation
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-foreground/80 mb-2">{flag.finding}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Declared: </span>
                                  <span className="font-medium text-foreground">{flag.declared_value}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Evidence: </span>
                                  <span className="font-medium text-foreground">{flag.evidence_value}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Source: </span>
                                  <span className="font-medium text-foreground">{flag.source}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </GlassCard>

              <div className="text-[10px] text-muted-foreground px-1">
                💡 <strong>Inherent Intelligence:</strong> The scoring model automatically cross-references all declared data points against documentary evidence (POS/Till statements, bank statements, EcoCash/mobile money records) to detect inconsistencies. Critical flags indicate high-confidence data discrepancies that require investigation before approval.
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ScoreJustification;
