export const isGabon = (country: unknown) => typeof country === "string" && ["gabon", "ga"].includes(country.trim().toLowerCase());

export type GabonCategory = "retail" | "micro" | "sme" | "farmer";
type FinancialField = readonly [key: string, label: string];
export const gabonFinancialFields: Record<GabonCategory, readonly FinancialField[]> = {
  retail: [["monthly_income", "Net monthly salary / recurring income"], ["monthly_expenses", "Monthly household costs excluding housing and debt"], ["rent", "Monthly housing costs"]],
  micro: [["monthly_revenue", "Average monthly business sales"], ["monthly_operating_costs", "Monthly stock and operating costs"], ["monthly_income", "Other recurring monthly household income"], ["monthly_household_costs", "Monthly household costs including housing"]],
  sme: [["avg_monthly_revenue_6m", "Average monthly revenue (last six months)"], ["monthly_operating_costs", "Monthly operating costs including stock, payroll and taxes"]],
  farmer: [["farm_cycle_months", "Months in the financed production cycle"], ["farm_projected_sales", "Expected cash sales this cycle"], ["farm_cycle_costs", "All production, transport and selling costs this cycle"], ["farm_other_income", "Other recurring monthly household income"], ["monthly_household_costs", "Monthly household costs including housing"], ["farm_cash_receipt", "Expected first cash receipt"], ["first_installment", "First proposed payment due"]],
} as const;


export function gabonNumber(value: unknown): number | null {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function assessGabonAffordability(category: string, input: Record<string, unknown>) {
  const fields = Object.prototype.hasOwnProperty.call(gabonFinancialFields, category) ? gabonFinancialFields[category as GabonCategory] : [];
  const required = [...fields, ["existing_repayments", "Existing monthly debt payments"], ["proposed_repayment", category === "farmer" ? "Proposed loan payments due within the production cycle" : "Proposed monthly payment"]];
  const date = (key: string) => {
    const value = input[key];
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value ? value : null;
  };
  const number = (key: string) => gabonNumber(input[key]);
  const missing = required.filter(([key]) => {
    if (key === "farm_cash_receipt" || key === "first_installment") return !date(key);
    const value = number(key);
    return value === null || (key === "farm_cycle_months" && (!Number.isInteger(value) || value < 1)) || (key === "proposed_repayment" && value <= 0);
  }).map(([, label]) => label);
  const receipt = date("farm_cash_receipt");
  const installment = date("first_installment");
  const timingRisk = category === "farmer" && receipt !== null && installment !== null && installment < receipt;
  if (!fields.length || missing.length) return { missing, timingRisk, cashIn: null, cashCosts: null, debt: null, surplus: null, dscr: null, period: category === "farmer" ? "cycle" : "month" };

  const n = (key: string) => number(key) ?? 0;
  const months = category === "farmer" ? n("farm_cycle_months") : 1;
  const cashIn = category === "farmer" ? n("farm_projected_sales") + months * n("farm_other_income") :
    category === "micro" ? n("monthly_revenue") + n("monthly_income") : category === "sme" ? n("avg_monthly_revenue_6m") : n("monthly_income");
  const cashCosts = category === "farmer" ? n("farm_cycle_costs") + months * n("monthly_household_costs") :
    category === "micro" ? n("monthly_operating_costs") + n("monthly_household_costs") : category === "sme" ? n("monthly_operating_costs") : n("monthly_expenses") + n("rent");
  const debt = n("existing_repayments") * months + n("proposed_repayment");
  return { missing, timingRisk, cashIn, cashCosts, debt, surplus: cashIn - cashCosts - debt, dscr: (cashIn - cashCosts) / debt, period: category === "farmer" ? "cycle" : "month" };
}

export function gabonDocumentCurrency(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const currency = value.trim().toUpperCase().replace(/\s+/g, " ");
  if (["XAF", "FCFA", "F CFA", "CFA", "FRANC CFA", "FRANCS CFA"].includes(currency)) return "XAF";
  return currency || null;
}

/** Provisional affordability rubric, not a statistically calibrated default model. */
export function gabonIndicativeScore(assessment: ReturnType<typeof assessGabonAffordability>) {
  if (assessment.dscr === null || !Number.isFinite(assessment.dscr)) return null;
  const coverage = assessment.dscr;
  const coveragePoints = coverage < 0.75 ? -150 : coverage < 1 ? -80 : coverage < 1.2 ? 0 : coverage < 1.5 ? 50 : 100;
  const timingPoints = assessment.timingRisk ? -100 : 0;
  return { score: 600 + coveragePoints + timingPoints, coveragePoints, timingPoints };
}
