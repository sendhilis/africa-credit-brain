import { useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wallet, Package, Wrench, ArrowUpRight, ArrowDownRight,
  TrendingUp, Scale, AlertTriangle, CheckCircle2
} from "lucide-react";

interface BalanceSheetProps {
  extraData: Record<string, any>;
  currency: string;
  requestedAmount?: number | null;
  posExtraction?: {
    total_credits?: number;
    statement_period?: { start_date: string; end_date: string };
  } | null;
}

interface LineItem {
  label: string;
  value: number;
  icon: React.ElementType;
  source: string; // "declared" | "pos" | "computed"
}

function fmt(val: number, currency: string): string {
  if (val >= 1_000_000) return `${currency} ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${currency} ${(val / 1_000).toFixed(0)}K`;
  return `${currency} ${val.toLocaleString()}`;
}

function strengthLabel(score: number): { label: string; color: string; icon: React.ElementType } {
  if (score >= 80) return { label: "Very Strong", color: "text-success", icon: CheckCircle2 };
  if (score >= 60) return { label: "Strong", color: "text-success", icon: TrendingUp };
  if (score >= 40) return { label: "Moderate", color: "text-yellow-400", icon: Scale };
  if (score >= 20) return { label: "Weak", color: "text-orange-400", icon: AlertTriangle };
  return { label: "Very Weak", color: "text-destructive", icon: AlertTriangle };
}

export default function BalanceSheet({ extraData, currency, requestedAmount, posExtraction }: BalanceSheetProps) {
  const data = useMemo(() => {
    const ed = extraData || {};

    // ── ASSETS ──
    const cashSavings = parseFloat(ed.total_savings) || 0;
    const mukando = parseFloat(ed.mukando_amount) || 0;
    const stockInventory = parseFloat(ed.stock_value_estimate) || 0;
    const equipment = parseFloat(ed.equipment_tools_value) || 0;
    const receivables = parseFloat(ed.receivables_amount) || 0;

    // Estimate cash-on-hand from daily sales (approx 7-day float)
    const dailySalesZwl = parseFloat(ed.daily_sales_zwl) || 0;
    const dailySalesUsd = parseFloat(ed.daily_sales_usd) || 0;
    const cashOnHand = (dailySalesZwl + dailySalesUsd) * 7;

    const assets: LineItem[] = [];
    if (cashSavings > 0) assets.push({ label: "Cash & Savings", value: cashSavings, icon: Wallet, source: "declared" });
    if (mukando > 0) assets.push({ label: "Mukando / Savings Club", value: mukando, icon: Wallet, source: "declared" });
    if (cashOnHand > 0) assets.push({ label: "Estimated Cash-on-Hand (7d float)", value: cashOnHand, icon: Wallet, source: "computed" });
    if (stockInventory > 0) assets.push({ label: "Stock / Inventory", value: stockInventory, icon: Package, source: "declared" });
    if (equipment > 0) assets.push({ label: "Equipment & Tools", value: equipment, icon: Wrench, source: "declared" });
    if (receivables > 0) assets.push({ label: "Accounts Receivable", value: receivables, icon: ArrowUpRight, source: "declared" });

    // POS-verified turnover as an informational asset signal
    let posMonthlyTurnover = 0;
    let posPeriodDays = 0;
    if (posExtraction?.total_credits) {
      const sp = posExtraction.statement_period;
      if (sp?.start_date && sp?.end_date) {
        const d1 = new Date(sp.start_date);
        const d2 = new Date(sp.end_date);
        posPeriodDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (86400000)) + 1);
      }
      posMonthlyTurnover = posPeriodDays > 0
        ? Math.round((posExtraction.total_credits / posPeriodDays) * 30)
        : posExtraction.total_credits;
    }

    const totalAssets = assets.reduce((s, a) => s + a.value, 0);

    // ── LIABILITIES ──
    const payables = parseFloat(ed.payables_amount) || 0;
    const supplierCredit = parseFloat(ed.supplier_credit_days) || 0; // days — not monetary

    const liabilities: LineItem[] = [];
    if (payables > 0) liabilities.push({ label: "Accounts Payable", value: payables, icon: ArrowDownRight, source: "declared" });

    // Estimate existing loan liability from requested amount context
    const existingDebt = requestedAmount && requestedAmount > 0 ? 0 : 0; // no way to know exact amount

    const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
    const netWorth = totalAssets - totalLiabilities;

    // ── FINANCIAL STRENGTH SCORE ──
    // Composite score (0-100) based on:
    // 1. Net worth ratio (net worth / total assets) — 30%
    // 2. Asset coverage of loan (total assets / requested amount) — 25%
    // 3. Liquidity (cash + savings / total liabilities) — 20%
    // 4. Asset diversification (number of asset categories with value) — 15%
    // 5. POS-verified turnover presence — 10%
    let strengthScore = 0;

    // 1. Net worth ratio
    const nwRatio = totalAssets > 0 ? netWorth / totalAssets : 0;
    strengthScore += Math.min(30, Math.round(nwRatio * 30));

    // 2. Asset coverage
    if (requestedAmount && requestedAmount > 0) {
      const coverage = totalAssets / requestedAmount;
      strengthScore += Math.min(25, Math.round(Math.min(1, coverage / 5) * 25));
    } else {
      strengthScore += 15; // neutral if no amount
    }

    // 3. Liquidity
    const liquidAssets = cashSavings + mukando + cashOnHand;
    const liquidityRatio = totalLiabilities > 0 ? liquidAssets / totalLiabilities : liquidAssets > 0 ? 1 : 0;
    strengthScore += Math.min(20, Math.round(Math.min(1, liquidityRatio / 2) * 20));

    // 4. Diversification
    const filledCategories = assets.length;
    strengthScore += Math.min(15, Math.round(Math.min(1, filledCategories / 4) * 15));

    // 5. POS verified
    if (posMonthlyTurnover > 0) strengthScore += 10;

    return {
      assets,
      liabilities,
      totalAssets,
      totalLiabilities,
      netWorth,
      strengthScore: Math.min(100, strengthScore),
      posMonthlyTurnover,
      posPeriodDays,
      liquidAssets,
      supplierCreditDays: supplierCredit,
    };
  }, [extraData, currency, requestedAmount, posExtraction]);

  const strength = strengthLabel(data.strengthScore);
  const StrengthIcon = strength.icon;

  if (data.assets.length === 0 && data.liabilities.length === 0) return null;

  return (
    <GlassCard hover={false} className="md:col-span-2 lg:col-span-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" /> Balance Sheet (Derived)
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Financial Strength</span>
          <div className="flex items-center gap-1.5">
            <StrengthIcon className={`h-4 w-4 ${strength.color}`} />
            <span className={`text-sm font-bold ${strength.color}`}>{data.strengthScore}/100</span>
            <Badge variant="outline" className={`text-xs ${strength.color} border-current/20`}>
              {strength.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-success uppercase tracking-wider">Assets</span>
            <span className="text-sm font-bold text-success">{fmt(data.totalAssets, currency)}</span>
          </div>
          <div className="space-y-1.5">
            {data.assets.map((a, i) => {
              const Icon = a.icon;
              const pct = data.totalAssets > 0 ? (a.value / data.totalAssets) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Icon className="h-3 w-3" />
                      {a.label}
                      {a.source === "computed" && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">est.</Badge>
                      )}
                    </span>
                    <span className="text-foreground font-medium">{fmt(a.value, currency)}</span>
                  </div>
                  <Progress value={pct} className="h-1 mt-0.5" />
                </div>
              );
            })}
          </div>

          {/* POS Turnover (informational) */}
          {data.posMonthlyTurnover > 0 && (
            <div className="mt-3 p-2 rounded-md bg-primary/5 border border-primary/15">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  POS Monthly Turnover (projected)
                </span>
                <span className="text-primary font-bold">{fmt(data.posMonthlyTurnover, currency)}</span>
              </div>
              {data.posPeriodDays > 0 && data.posPeriodDays < 30 && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ⚠ Based on {data.posPeriodDays}-day snapshot — extrapolated to 30 days
                </p>
              )}
            </div>
          )}
        </div>

        {/* Liabilities */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Liabilities</span>
            <span className="text-sm font-bold text-destructive">{fmt(data.totalLiabilities, currency)}</span>
          </div>
          {data.liabilities.length > 0 ? (
            <div className="space-y-1.5">
              {data.liabilities.map((l, i) => {
                const Icon = l.icon;
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Icon className="h-3 w-3" />
                      {l.label}
                    </span>
                    <span className="text-foreground font-medium">{fmt(l.value, currency)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No declared liabilities</p>
          )}

          {data.supplierCreditDays > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Supplier credit terms: {data.supplierCreditDays} days
            </div>
          )}

          {/* Net Worth Summary */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Net Worth</span>
              <span className={`text-lg font-bold ${data.netWorth >= 0 ? "text-success" : "text-destructive"}`}>
                {fmt(data.netWorth, currency)}
              </span>
            </div>
            {data.liquidAssets > 0 && (
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>Liquid Assets</span>
                <span>{fmt(data.liquidAssets, currency)}</span>
              </div>
            )}
          </div>

          {/* Strength Score Breakdown */}
          <div className="mt-3">
            <Progress value={data.strengthScore} className="h-2" />
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>0</span>
              <span>Financial Strength Score</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
