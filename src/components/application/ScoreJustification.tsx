import ScoreGauge from "@/components/ScoreGauge";
import { Badge } from "@/components/ui/badge";
import GlassCard from "@/components/GlassCard";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

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

interface ScoreJustificationProps {
  score: number;
  scoreBand: string;
  probabilityOfDefault: number;
  recommendation: string;
  reasonCodes: ReasonCode[];
  factors: Factor[];
  summary: string;
  scoredAt: string;
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

const ScoreJustification = ({
  score,
  scoreBand,
  probabilityOfDefault,
  recommendation,
  reasonCodes,
  factors,
  summary,
  scoredAt,
}: ScoreJustificationProps) => {
  const recConfig = recommendationConfig[recommendation as keyof typeof recommendationConfig] || recommendationConfig.review;
  const RecIcon = recConfig.icon;

  // Sort factors by weight descending
  const sortedFactors = [...factors].sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard hover={false} className="flex flex-col items-center justify-center py-6">
          <ScoreGauge score={score} band={scoreBand} size={200} label="Credit Score" />
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

      {/* Factor Breakdown */}
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

      {/* Reason Codes */}
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
                <p className="text-sm mt-0.5">{rc.description}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default ScoreJustification;
