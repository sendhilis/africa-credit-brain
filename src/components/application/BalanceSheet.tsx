import { useMemo } from "react";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wallet, Package, Wrench, ArrowUpRight, ArrowDownRight,
  TrendingUp, Scale, AlertTriangle, CheckCircle2,
  ShoppingBasket, Bus, GraduationCap, HeartPulse, Home
} from "lucide-react";

interface BalanceSheetProps {
  extraData: Record<string, any>;
  currency: string;
  requestedAmount?: number | null;
  monthlyIncome?: number | null;
  monthlyRent?: number | null;
  posExtraction?: {
    total_credits?: number;
    statement_period?: { start_date: string; end_date: string };
  } | null;
  breadBasketData?: {
    monthly_income: number;
    food_basket: number;
    transport: number;
    school_fees: number;
    health: number;
    rent: number;
    total_essentials: number;
    disposable_surplus: number;
    margin_pct: number;
  } | null;
}

interface LineItem {
  label: string;
  value: number;
  icon: React.ElementType;
  source: string;
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

function marginLabel(pct: number): { label: string; color: string } {
  if (pct >= 50) return { label: "Strong Surplus", color: "text-success" };
  if (pct >= 30) return { label: "Healthy", color: "text-success" };
  if (pct >= 15) return { label: "Adequate", color: "text-yellow-400" };
  if (pct >= 5) return { label: "Tight", color: "text-orange-400" };
  return { label: "Critical", color: "text-destructive" };
}

export default function BalanceSheet({ extraData, currency, requestedAmount, monthlyIncome, monthlyRent, posExtraction, breadBasketData }: BalanceSheetProps) {
  // Derive bread basket from extraData if not provided from scoring
  const breadBasket = useMemo(() => {
    if (breadBasketData) return breadBasketData;
    const ed = extraData || {};
    const income = monthlyIncome || 0;
    if (income <= 0) return null;
    const food = parseFloat(ed.monthly_food_basket) || 0;
    const transport = parseFloat(ed.monthly_transport) || 0;
    const school = parseFloat(ed.monthly_school_fees) || 0;
    const health = parseFloat(ed.monthly_health) || 0;
    const rent = monthlyRent || 0;
    if (food === 0 && transport === 0 && school === 0 && health === 0 && rent === 0) return null;
    const total = food + transport + school + health + rent;
    const surplus = income - total;
    return {
      monthly_income: income,
      food_basket: food,
      transport,
      school_fees: school,
      health,
      rent,
      total_essentials: total,
      disposable_surplus: surplus,
      margin_pct: Math.round((surplus / income) * 1000) / 10,
    };
  }, [extraData, monthlyIncome, monthlyRent, breadBasketData]);

  const data = useMemo(() => {
    const ed = extraData || {};

    // ── ASSETS ──
    const cashSavings = parseFloat(ed.total_savings) || 0;
    const mukando = parseFloat(ed.mukando_amount) || 0;
    const stockInventory = parseFloat(ed.stock_value_estimate) || 0;
    const equipment = parseFloat(ed.equipment_tools_value) || 0;
    const receivables = parseFloat(ed.receivables_amount) || 0;

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
    const supplierCredit = parseFloat(ed.supplier_credit_days) || 0;

    const liabilities: LineItem[] = [];
    if (payables > 0) liabilities.push({ label: "Accounts Payable", value: payables, icon: ArrowDownRight, source: "declared" });

    const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
    const netWorth = totalAssets - totalLiabilities;

    // ── FINANCIAL STRENGTH SCORE ──
    let strengthScore = 0;
    const nwRatio = totalAssets > 0 ? netWorth / totalAssets : 0;
    strengthScore += Math.min(30, Math.round(nwRatio * 30));
    if (requestedAmount && requestedAmount > 0) {
      const coverage = totalAssets / requestedAmount;
      strengthScore += Math.min(25, Math.round(Math.min(1, coverage / 5) * 25));
    } else {
      strengthScore += 15;
    }
    const liquidAssets = cashSavings + mukando + cashOnHand;
    const liquidityRatio = totalLiabilities > 0 ? liquidAssets / totalLiabilities : liquidAssets > 0 ? 1 : 0;
    strengthScore += Math.min(20, Math.round(Math.min(1, liquidityRatio / 2) * 20));
    const filledCategories = assets.length;
    strengthScore += Math.min(15, Math.round(Math.min(1, filledCategories / 4) * 15));
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

  const hasBalanceSheet = data.assets.length > 0 || data.liabilities.length > 0;
  const hasBreadBasket = breadBasket !== null;

  if (!hasBalanceSheet && !hasBreadBasket) return null;

  return (
    <div className="space-y-4">
      {/* Bread Basket Margin */}
      {hasBreadBasket && breadBasket && (
        <GlassCard hover={false} className="md:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              <ShoppingBasket className="h-4 w-4 text-primary" /> Bread Basket Margin — Repayment Ability
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Disposable Margin</span>
              <span className={`text-lg font-bold ${marginLabel(breadBasket.margin_pct).color}`}>
                {breadBasket.margin_pct}%
              </span>
              <Badge variant="outline" className={`text-xs ${marginLabel(breadBasket.margin_pct).color} border-current/20`}>
                {marginLabel(breadBasket.margin_pct).label}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Expense Breakdown */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Essential Expenses</span>
                <span className="text-sm font-bold text-destructive">{fmt(breadBasket.total_essentials, currency)}</span>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Food Basket", value: breadBasket.food_basket, icon: ShoppingBasket },
                  { label: "Transport", value: breadBasket.transport, icon: Bus },
                  { label: "School Fees", value: breadBasket.school_fees, icon: GraduationCap },
                  { label: "Health / Medical", value: breadBasket.health, icon: HeartPulse },
                  { label: "Rent / Housing", value: breadBasket.rent, icon: Home },
                ].filter(item => item.value > 0).map((item, i) => {
                  const Icon = item.icon;
                  const pct = breadBasket.monthly_income > 0 ? (item.value / breadBasket.monthly_income) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Icon className="h-3 w-3" />
                          {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{pct.toFixed(0)}% of income</span>
                          <span className="text-foreground font-medium w-24 text-right">{fmt(item.value, currency)}</span>
                        </div>
                      </div>
                      <Progress value={pct} className="h-1.5 mt-0.5" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="text-xs text-muted-foreground mb-1">Monthly Income</div>
                <div className="text-lg font-bold text-foreground">{fmt(breadBasket.monthly_income, currency)}</div>
              </div>
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/15">
                <div className="text-xs text-muted-foreground mb-1">Total Essentials</div>
                <div className="text-lg font-bold text-destructive">{fmt(breadBasket.total_essentials, currency)}</div>
              </div>
              <div className={`p-3 rounded-lg border ${breadBasket.disposable_surplus >= 0 ? "bg-success/5 border-success/15" : "bg-destructive/5 border-destructive/15"}`}>
                <div className="text-xs text-muted-foreground mb-1">Disposable Surplus</div>
                <div className={`text-lg font-bold ${breadBasket.disposable_surplus >= 0 ? "text-success" : "text-destructive"}`}>
                  {fmt(breadBasket.disposable_surplus, currency)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Available for loan repayment after essentials
                </div>
              </div>

              {/* Visual margin bar */}
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>0%</span>
                  <span>Margin</span>
                  <span>100%</span>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  {/* Essentials portion */}
                  <div
                    className="absolute left-0 top-0 h-full bg-destructive/40 rounded-l-full"
                    style={{ width: `${Math.min(100, 100 - breadBasket.margin_pct)}%` }}
                  />
                  {/* Surplus portion */}
                  <div
                    className={`absolute right-0 top-0 h-full rounded-r-full ${breadBasket.margin_pct >= 30 ? "bg-success/60" : breadBasket.margin_pct >= 15 ? "bg-yellow-400/60" : "bg-orange-400/60"}`}
                    style={{ width: `${Math.max(0, breadBasket.margin_pct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] mt-0.5">
                  <span className="text-destructive">Essentials</span>
                  <span className={marginLabel(breadBasket.margin_pct).color}>Surplus</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-muted-foreground border-t border-border/30 pt-2">
            💡 <strong>Scoring weight:</strong> Bread Basket Margin carries 8–10% weight in the credit model.
            A margin above 30% indicates strong repayment capacity; below 5% signals high strain on essential expenses.
          </div>
        </GlassCard>
      )}

      {/* Balance Sheet */}
      {hasBalanceSheet && (
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
      )}
    </div>
  );
}
