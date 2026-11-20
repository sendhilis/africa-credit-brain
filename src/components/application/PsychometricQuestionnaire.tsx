import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Brain, ChevronRight, ChevronLeft, CheckCircle2,
  Wallet, Shield, Target, Compass, BarChart3
} from "lucide-react";

type ProductCategory = "retail" | "micro" | "sme" | "farmer";

interface PsychometricQuestion {
  id: string;
  dimension: "financial_discipline" | "risk_attitude" | "conscientiousness" | "locus_of_control";
  text: string;
  options: { value: string; label: string; score: number }[];
  /** Which categories this question applies to. Empty = all. */
  categories?: ProductCategory[];
}

// ── QUESTIONS — 15 core questions, Zimbabwe-contextualized ──
const ALL_QUESTIONS: PsychometricQuestion[] = [
  // ═══ FINANCIAL DISCIPLINE (4) ═══
  {
    id: "fd_1",
    dimension: "financial_discipline",
    text: "When you receive your salary or business income, what do you typically do first?",
    options: [
      { value: "save_first", label: "Set aside savings before spending", score: 4 },
      { value: "pay_bills", label: "Pay bills and obligations first", score: 3 },
      { value: "spend_needs", label: "Spend on immediate needs, save what's left", score: 2 },
      { value: "spend_all", label: "Use it all — there's never enough", score: 1 },
    ],
  },
  {
    id: "fd_2",
    dimension: "financial_discipline",
    text: "Do you participate in any savings group (e.g. Mukando, Round, Stokvel)?",
    options: [
      { value: "active_leader", label: "Yes — I organise or lead a group", score: 4 },
      { value: "active_member", label: "Yes — I'm an active member and never miss a round", score: 3 },
      { value: "sometimes", label: "I've participated but not consistently", score: 2 },
      { value: "never", label: "No, I don't use savings groups", score: 1 },
    ],
  },
  {
    id: "fd_3",
    dimension: "financial_discipline",
    text: "If you had an unexpected expense of one month's income, how would you handle it?",
    options: [
      { value: "savings", label: "I have savings or an emergency fund to cover it", score: 4 },
      { value: "borrow_formal", label: "Borrow from a bank or microfinance institution", score: 3 },
      { value: "borrow_informal", label: "Borrow from family, friends, or a Mukando group", score: 2 },
      { value: "sell_asset", label: "Sell an asset or go without until next payday", score: 1 },
    ],
  },
  {
    id: "fd_4",
    dimension: "financial_discipline",
    text: "How do you track your personal or business finances?",
    options: [
      { value: "digital_records", label: "I use an app, spreadsheet, or accounting software", score: 4 },
      { value: "written_records", label: "I keep a written ledger or notebook", score: 3 },
      { value: "mental", label: "I keep track in my head", score: 2 },
      { value: "no_tracking", label: "I don't really track — I just know what's in my pocket", score: 1 },
    ],
  },

  // ═══ RISK ATTITUDE (4) ═══
  {
    id: "ra_1",
    dimension: "risk_attitude",
    text: "A friend offers you a business deal that could double your money in a month but you could also lose everything. What do you do?",
    options: [
      { value: "investigate", label: "Research it thoroughly before deciding", score: 4 },
      { value: "small_amount", label: "Invest a small amount I can afford to lose", score: 3 },
      { value: "go_big", label: "Go all in — high risk, high reward", score: 1 },
      { value: "refuse", label: "Decline — I prefer guaranteed returns", score: 3 },
    ],
  },
  {
    id: "ra_2",
    dimension: "risk_attitude",
    text: "When dealing with USD and ZWL, how do you manage currency risk?",
    categories: ["retail", "micro"],
    options: [
      { value: "hedge", label: "I keep most savings in USD and convert only when needed", score: 4 },
      { value: "mix", label: "I split between currencies based on what I need to pay", score: 3 },
      { value: "zwl_only", label: "I mostly use ZWL and don't think about exchange rates", score: 2 },
      { value: "speculate", label: "I try to profit from exchange rate changes", score: 1 },
    ],
  },
  {
    id: "ra_2_sme",
    dimension: "risk_attitude",
    text: "How does your business manage foreign currency exposure?",
    categories: ["sme"],
    options: [
      { value: "hedged", label: "We hedge with forward contracts or maintain USD reserves", score: 4 },
      { value: "natural_hedge", label: "We match revenue and costs in the same currency", score: 3 },
      { value: "reactive", label: "We convert when rates look good", score: 2 },
      { value: "no_strategy", label: "We don't actively manage forex exposure", score: 1 },
    ],
  },
  {
    id: "ra_3",
    dimension: "risk_attitude",
    text: "How much of your total income or revenue comes from a single customer, employer, or source?",
    options: [
      { value: "diversified", label: "Less than 30% — I have multiple income sources", score: 4 },
      { value: "moderate", label: "30–50% — mostly one source but with side income", score: 3 },
      { value: "concentrated", label: "50–80% — heavily dependent on one source", score: 2 },
      { value: "single", label: "Almost everything comes from one source", score: 1 },
    ],
  },
  {
    id: "ra_4",
    dimension: "risk_attitude",
    text: "How do you feel about taking on debt to grow your business or improve your life?",
    options: [
      { value: "strategic", label: "Debt is a tool — I borrow with a clear repayment plan", score: 4 },
      { value: "cautious", label: "I only borrow when absolutely necessary", score: 3 },
      { value: "avoid", label: "I avoid all debt — cash only", score: 2 },
      { value: "comfortable", label: "I borrow whenever I see an opportunity", score: 1 },
    ],
  },

  // ═══ CONSCIENTIOUSNESS (4) ═══
  {
    id: "co_1",
    dimension: "conscientiousness",
    text: "If you owe someone money and payday is still a week away, what do you do?",
    options: [
      { value: "communicate", label: "Contact them early and agree on a new date", score: 4 },
      { value: "partial", label: "Pay what I can now and the rest later", score: 3 },
      { value: "wait", label: "Wait until I have the full amount, then pay", score: 2 },
      { value: "avoid", label: "Hope they don't ask — deal with it later", score: 1 },
    ],
  },
  {
    id: "co_2",
    dimension: "conscientiousness",
    text: "When you make a commitment (meeting, delivery, payment), how often do you follow through on time?",
    options: [
      { value: "always", label: "Almost always — I'm known for being reliable", score: 4 },
      { value: "mostly", label: "Most of the time, but sometimes things happen", score: 3 },
      { value: "sometimes", label: "It depends — life in Zim is unpredictable", score: 2 },
      { value: "rarely", label: "I struggle with deadlines — too many demands", score: 1 },
    ],
  },
  {
    id: "co_3",
    dimension: "conscientiousness",
    text: "How far ahead do you plan your finances or business activities?",
    options: [
      { value: "year_plus", label: "12+ months — I have annual goals and budgets", score: 4 },
      { value: "quarterly", label: "3–6 months ahead", score: 3 },
      { value: "monthly", label: "Month by month — I plan for the next 30 days", score: 2 },
      { value: "day_by_day", label: "Day by day — I deal with what comes", score: 1 },
    ],
  },
  {
    id: "co_4",
    dimension: "conscientiousness",
    text: "If a customer or employer pays you late, what is your typical response?",
    categories: ["micro", "sme"],
    options: [
      { value: "formal_followup", label: "I follow up with a formal reminder and keep records", score: 4 },
      { value: "verbal", label: "I call or text to remind them", score: 3 },
      { value: "wait", label: "I wait — they'll pay eventually", score: 2 },
      { value: "write_off", label: "I often let it go to keep the relationship", score: 1 },
    ],
  },
  {
    id: "co_4_retail",
    dimension: "conscientiousness",
    text: "How do you handle your utility bills (ZESA, water, rates)?",
    categories: ["retail"],
    options: [
      { value: "always_on_time", label: "I pay before or on the due date, every time", score: 4 },
      { value: "mostly_on_time", label: "Usually on time, occasionally a few days late", score: 3 },
      { value: "when_reminded", label: "I pay when I get a reminder or disconnection notice", score: 2 },
      { value: "often_late", label: "I'm often behind — other things take priority", score: 1 },
    ],
  },

  // ═══ LOCUS OF CONTROL (3) ═══
  {
    id: "lc_1",
    dimension: "locus_of_control",
    text: "When things go wrong financially, what do you believe is the main cause?",
    options: [
      { value: "own_decisions", label: "Usually my own decisions — I could have planned better", score: 4 },
      { value: "mix", label: "A mix of my choices and circumstances beyond my control", score: 3 },
      { value: "economy", label: "The economy, inflation, or government policies", score: 2 },
      { value: "bad_luck", label: "Bad luck or things outside anyone's control", score: 1 },
    ],
  },
  {
    id: "lc_2",
    dimension: "locus_of_control",
    text: "Do you believe your financial situation in 2 years will be better than today?",
    options: [
      { value: "yes_plan", label: "Yes — I have a clear plan to improve it", score: 4 },
      { value: "yes_hope", label: "Yes — if the economy improves", score: 2 },
      { value: "same", label: "Probably about the same", score: 2 },
      { value: "uncertain", label: "Hard to say — too much is out of my hands", score: 1 },
    ],
  },
  {
    id: "lc_3",
    dimension: "locus_of_control",
    text: "If this loan is approved, how confident are you in your ability to repay on time, every month?",
    options: [
      { value: "very_confident", label: "Very confident — I've already budgeted for repayments", score: 4 },
      { value: "confident", label: "Confident — my income should cover it", score: 3 },
      { value: "hopeful", label: "Hopeful — if nothing unexpected happens", score: 2 },
      { value: "unsure", label: "I'll try my best, but it depends on many factors", score: 1 },
    ],
  },
];

const DIMENSION_META = {
  financial_discipline: { label: "Financial Discipline", icon: Wallet, color: "text-primary" },
  risk_attitude: { label: "Risk Attitude", icon: Shield, color: "text-accent" },
  conscientiousness: { label: "Conscientiousness", icon: Target, color: "text-success" },
  locus_of_control: { label: "Locus of Control", icon: Compass, color: "text-warning" },
};

export interface PsychometricResult {
  overall_score: number; // 0–100
  dimensions: Record<string, { score: number; max: number; pct: number }>;
  answers: Record<string, string>;
  completed: boolean;
}

interface Props {
  category: ProductCategory;
  market?: "gabon";
  onComplete: (result: PsychometricResult) => void;
  initialAnswers?: Record<string, string>;
}

export default function PsychometricQuestionnaire({ category, market, onComplete, initialAnswers = {} }: Props) {
  const questions = useMemo(() => ALL_QUESTIONS
    .filter(q => (!q.categories || q.categories.includes(category)) && !(market === "gabon" && q.id === "ra_2"))
    .map(q => market !== "gabon" ? q : {
      ...q,
      text: q.text.replace("Mukando, Round, Stokvel", "tontine"),
      options: q.options.map(option => ({ ...option, label: option.label.replace("a Mukando group", "a tontine").replace("USD reserves", "reserves in the currency we owe") })),
    }), [category, market]);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);

  const progress = (Object.keys(answers).length / questions.length) * 100;
  const question = questions[currentQ];
  const isLast = currentQ === questions.length - 1;
  const allAnswered = questions.every(q => answers[q.id]);

  const handleSelect = (value: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  };

  const computeResult = (): PsychometricResult => {
    const dimensions: Record<string, { score: number; max: number; pct: number }> = {};

    for (const dim of Object.keys(DIMENSION_META)) {
      const dimQs = questions.filter(q => q.dimension === dim);
      if (dimQs.length === 0) continue;
      const total = dimQs.reduce((sum, q) => {
        const ans = answers[q.id];
        const opt = q.options.find(o => o.value === ans);
        return sum + (opt?.score || 0);
      }, 0);
      const max = dimQs.length * 4;
      dimensions[dim] = { score: total, max, pct: Math.round((total / max) * 100) };
    }

    const totalScore = Object.values(dimensions).reduce((s, d) => s + d.score, 0);
    const totalMax = Object.values(dimensions).reduce((s, d) => s + d.max, 0);

    return {
      overall_score: Math.round((totalScore / totalMax) * 100),
      dimensions,
      answers,
      completed: true,
    };
  };

  const handleFinish = () => {
    onComplete(computeResult());
  };

  const handleNext = () => {
    if (isLast) return;
    setCurrentQ(c => c + 1);
  };

  const handlePrev = () => {
    setCurrentQ(c => Math.max(0, c - 1));
  };

  const dimMeta = DIMENSION_META[question.dimension];
  const DimIcon = dimMeta.icon;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Psychometric Assessment</span>
        </div>
        <Badge variant="outline" className="text-xs border-border">
          {Object.keys(answers).length} / {questions.length} answered
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>~{Math.max(1, Math.ceil((questions.length - Object.keys(answers).length) * 0.35))} min remaining</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </div>

      {/* Dimension badge */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30`}>
        <DimIcon className={`h-3.5 w-3.5 ${dimMeta.color}`} />
        <span className={`text-xs font-medium ${dimMeta.color}`}>{dimMeta.label}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">Question {currentQ + 1} of {questions.length}</span>
      </div>

      {/* Question */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-foreground leading-relaxed">
          {question.text}
        </p>

        <RadioGroup
          value={answers[question.id] || ""}
          onValueChange={handleSelect}
          className="space-y-2"
        >
          {question.options.map(opt => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                answers[question.id] === opt.value
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/20 border-border/40 hover:border-primary/20"
              }`}
            >
              <RadioGroupItem value={opt.value} className="mt-0.5" />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentQ === 0} className="gap-1.5 border-border">
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </Button>

        <div className="flex gap-2">
          {!isLast && (
            <Button size="sm" onClick={handleNext} disabled={!answers[question.id]} className="gap-1.5">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {isLast && allAnswered && (
            <Button size="sm" onClick={handleFinish} className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete Assessment
            </Button>
          )}
          {isLast && !allAnswered && (
            <span className="text-xs text-muted-foreground self-center">Answer all questions to finish</span>
          )}
        </div>
      </div>

      {/* Dimension summary (bottom) */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/20">
        {Object.entries(DIMENSION_META).map(([key, meta]) => {
          const dimQs = questions.filter(q => q.dimension === key);
          if (dimQs.length === 0) return null;
          const answered = dimQs.filter(q => answers[q.id]).length;
          const Icon = meta.icon;
          return (
            <div key={key} className="text-center space-y-1">
              <Icon className={`h-3.5 w-3.5 mx-auto ${answered === dimQs.length ? meta.color : "text-muted-foreground/40"}`} />
              <div className="text-[10px] text-muted-foreground">{answered}/{dimQs.length}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
