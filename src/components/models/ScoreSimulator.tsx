import { useState, useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calculator, RotateCcw, TrendingDown, TrendingUp, Minus,
  ChevronDown, ChevronUp, User, Store, Building2, Wheat,
} from "lucide-react";
import {
  type BorrowerSegment,
  SCORING_PARAMS, SEGMENT_LABELS, PILLAR_LABELS,
  getFeaturesByPillar, getFeaturesForSegment,
  type ScoringPillar,
} from "./scoreSimulatorData";

const SEGMENT_ICONS: Record<BorrowerSegment, React.ReactNode> = {
  retail: <User className="h-4 w-4" />,
  micro: <Store className="h-4 w-4" />,
  sme: <Building2 className="h-4 w-4" />,
  farmer: <Wheat className="h-4 w-4" />,
};

const PILLAR_COLORS: Record<ScoringPillar, string> = {
  identity: "border-l-blue-500",
  financial: "border-l-emerald-500",
  agricultural: "border-l-amber-500",
  business: "border-l-violet-500",
  social: "border-l-pink-500",
  behavioral: "border-l-cyan-500",
};

const SCORE_BANDS = [
  { band: "Excellent", min: 800, max: 900, action: "Auto-Approve", color: "bg-success/20 text-success border-success/30" },
  { band: "Very Good", min: 740, max: 799, action: "Approve", color: "bg-success/20 text-success border-success/30" },
  { band: "Good", min: 670, max: 739, action: "Approve", color: "bg-success/20 text-success border-success/30" },
  { band: "Fair", min: 580, max: 669, action: "Manual Review", color: "bg-warning/20 text-warning border-warning/30" },
  { band: "Poor", min: 500, max: 579, action: "Manual Review", color: "bg-warning/20 text-warning border-warning/30" },
  { band: "Very Poor", min: 300, max: 499, action: "Decline", color: "bg-destructive/20 text-destructive border-destructive/30" },
];

function getScoreBand(score: number) {
  return SCORE_BANDS.find((b) => score >= b.min && score <= b.max) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
}

const ScoreSimulator = () => {
  const [segment, setSegment] = useState<BorrowerSegment>("retail");
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [showFormula, setShowFormula] = useState(false);

  const segmentFeatures = useMemo(() => getFeaturesForSegment(segment), [segment]);
  const pillarGroups = useMemo(() => getFeaturesByPillar(segment), [segment]);

  const handleSelect = (featureKey: string, binIndex: number) => {
    setSelections((prev) => ({ ...prev, [featureKey]: binIndex }));
  };

  const handleReset = () => setSelections({});

  const handleSegmentChange = (s: BorrowerSegment) => {
    setSegment(s);
    setSelections({});
  };

  const result = useMemo(() => {
    const { baseScore, baseOdds, pdo } = SCORING_PARAMS;
    const intercept = SCORING_PARAMS.intercept[segment] ?? SCORING_PARAMS.defaultIntercept;
    const factor = pdo / Math.LN2;
    const offset = baseScore - factor * Math.log(baseOdds);

    let logOdds = intercept;
    const contributions: { key: string; label: string; pillar: ScoringPillar; beta: number; woe: number; term: number; points: number }[] = [];

    segmentFeatures.forEach((f) => {
      const binIdx = selections[f.key] ?? 0;
      const bin = f.bins[binIdx] ?? f.bins[0];
      const term = f.beta * bin.woe;
      logOdds += term;
      const points = factor * term;
      contributions.push({ key: f.key, label: f.label, pillar: f.pillar, beta: f.beta, woe: bin.woe, term, points });
    });

    const odds = Math.exp(logOdds);
    const pd = 1 / (1 + odds);
    const rawScore = offset + factor * logOdds;
    const finalScore = Math.round(Math.max(300, Math.min(900, rawScore)));

    return { logOdds, odds, pd, rawScore, finalScore, contributions, factor, offset, intercept };
  }, [selections, segmentFeatures, segment]);

  const band = getScoreBand(result.finalScore);

  const activePillars = Object.keys(pillarGroups) as ScoringPillar[];

  return (
    <div className="space-y-6">
      {/* Segment Selector */}
      <GlassCard hover={false}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Score Simulator</h2>
              <p className="text-xs text-muted-foreground">Select borrower segment, then adjust WoE bins to simulate a credit score</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>

        {/* Segment pills */}
        <div className="flex flex-wrap gap-2 mb-1">
          {(Object.keys(SEGMENT_LABELS) as BorrowerSegment[]).map((s) => (
            <button
              key={s}
              onClick={() => handleSegmentChange(s)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                segment === s
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-border/50"
              }`}
            >
              {SEGMENT_ICONS[s]}
              {SEGMENT_LABELS[s]}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Showing <span className="font-semibold text-foreground">{segmentFeatures.length}</span> features across{" "}
          <span className="font-semibold text-foreground">{activePillars.length}</span> scoring pillars for{" "}
          <span className="font-semibold text-foreground">{SEGMENT_LABELS[segment]}</span>
        </p>
      </GlassCard>

      {/* Feature Inputs — grouped by pillar */}
      {activePillars.map((pillar) => (
        <GlassCard key={pillar} hover={false} className={`border-l-4 ${PILLAR_COLORS[pillar]}`}>
          <h3 className="font-display font-semibold text-foreground mb-1">{PILLAR_LABELS[pillar]}</h3>
          <p className="text-[11px] text-muted-foreground mb-4">{pillarGroups[pillar].length} features</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pillarGroups[pillar].map((feature) => (
              <div key={feature.key} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  {feature.label}
                  <span className="font-mono text-[10px] text-muted-foreground/70">
                    β={feature.beta > 0 ? "+" : ""}{feature.beta}
                  </span>
                </label>
                <Select
                  value={String(selections[feature.key] ?? 0)}
                  onValueChange={(v) => handleSelect(feature.key, Number(v))}
                >
                  <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {feature.bins.map((bin, i) => (
                      <SelectItem key={i} value={String(i)} className="text-xs">
                        <span className="flex items-center gap-2">
                          {bin.label}
                          <span className={`font-mono text-[10px] ${bin.woe < 0 ? "text-success" : bin.woe > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                            WoE: {bin.woe > 0 ? "+" : ""}{bin.woe.toFixed(2)}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}

      {/* Score Output */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard hover={false} className="flex flex-col items-center justify-center py-8">
          <p className="text-xs text-muted-foreground mb-2">Final Score — {SEGMENT_LABELS[segment]}</p>
          <span className="font-display text-6xl font-bold text-foreground">{result.finalScore}</span>
          <Badge variant="outline" className={`mt-3 ${band.color}`}>
            {band.band} — {band.action}
          </Badge>
        </GlassCard>

        <GlassCard hover={false}>
          <h3 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">Model Output</h3>
          <div className="space-y-3">
            {[
              ["Probability of Default", `${(result.pd * 100).toFixed(2)}%`],
              ["Odds (Good:Bad)", `${result.odds.toFixed(1)}:1`],
              ["Log-Odds", result.logOdds.toFixed(4)],
              ["Raw Score (unclipped)", result.rawScore.toFixed(1)],
              ["Intercept", result.intercept.toFixed(2)],
              ["Active Features", String(segmentFeatures.length)],
            ].map(([label, val], i) => (
              <div key={i}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="font-mono text-sm font-semibold text-foreground">{val}</span>
                </div>
                {i < 5 && <Separator className="bg-border/30 mt-3" />}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <h3 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">PDO Formula</h3>
          <div className="space-y-2 text-xs font-mono bg-muted/30 rounded-lg p-3 text-foreground">
            <p><span className="text-muted-foreground">Factor</span> = PDO / ln(2) = {SCORING_PARAMS.pdo} / {Math.LN2.toFixed(4)} = <span className="text-primary font-semibold">{result.factor.toFixed(2)}</span></p>
            <p><span className="text-muted-foreground">Offset</span> = Base − Factor × ln(BaseOdds)</p>
            <p className="pl-4">= {SCORING_PARAMS.baseScore} − {result.factor.toFixed(2)} × {Math.log(SCORING_PARAMS.baseOdds).toFixed(4)} = <span className="text-primary font-semibold">{result.offset.toFixed(2)}</span></p>
            <Separator className="bg-border/30 my-2" />
            <p><span className="text-muted-foreground">Intercept</span> ({SEGMENT_LABELS[segment]}) = <span className="text-primary font-semibold">{result.intercept.toFixed(2)}</span></p>
            <p><span className="text-muted-foreground">Score</span> = Offset + Factor × log-odds</p>
            <p className="pl-4">= {result.offset.toFixed(2)} + {result.factor.toFixed(2)} × ({result.logOdds.toFixed(4)})</p>
            <p className="pl-4">= <span className="text-primary font-semibold">{result.rawScore.toFixed(1)}</span> → clamped to <span className="text-primary font-semibold">{result.finalScore}</span></p>
          </div>
        </GlassCard>
      </div>

      {/* Feature Contribution Breakdown */}
      <GlassCard hover={false}>
        <button onClick={() => setShowFormula(!showFormula)} className="flex items-center justify-between w-full">
          <h3 className="font-display font-semibold text-foreground">Feature Contributions</h3>
          {showFormula ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showFormula && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Pillar", "Feature", "β", "WoE", "β × WoE", "Points", "Direction"].map((h) => (
                    <th key={h} className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.contributions
                  .sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
                  .map((c) => (
                    <tr key={c.key} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5">
                        <Badge variant="outline" className="text-[10px] font-normal">{PILLAR_LABELS[c.pillar].split(" ")[0]}</Badge>
                      </td>
                      <td className="py-2.5 font-medium text-foreground">{c.label}</td>
                      <td className="py-2.5 font-mono text-xs text-muted-foreground">{c.beta > 0 ? "+" : ""}{c.beta.toFixed(2)}</td>
                      <td className="py-2.5 font-mono text-xs">
                        <span className={c.woe < 0 ? "text-success" : c.woe > 0 ? "text-destructive" : "text-muted-foreground"}>
                          {c.woe > 0 ? "+" : ""}{c.woe.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-xs text-foreground">{c.term > 0 ? "+" : ""}{c.term.toFixed(4)}</td>
                      <td className="py-2.5 font-mono text-xs">
                        <span className={c.points > 0 ? "text-success" : c.points < 0 ? "text-destructive" : "text-muted-foreground"}>
                          {c.points > 0 ? "+" : ""}{c.points.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2.5">
                        {c.points > 1 ? (
                          <div className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-success" /><span className="text-xs text-success">Boost</span></div>
                        ) : c.points < -1 ? (
                          <div className="flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5 text-destructive" /><span className="text-xs text-destructive">Penalty</span></div>
                        ) : (
                          <div className="flex items-center gap-1"><Minus className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Neutral</span></div>
                        )}
                      </td>
                    </tr>
                  ))}
                <tr className="border-t-2 border-border">
                  <td></td>
                  <td className="py-2.5 font-semibold text-foreground">Total</td>
                  <td></td>
                  <td></td>
                  <td className="py-2.5 font-mono text-xs font-semibold text-foreground">
                    {result.contributions.reduce((s, c) => s + c.term, 0).toFixed(4)}
                  </td>
                  <td className="py-2.5 font-mono text-xs font-semibold text-foreground">
                    {result.contributions.reduce((s, c) => s + c.points, 0).toFixed(1)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default ScoreSimulator;
