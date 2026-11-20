import { assessGabonAffordability, gabonNumber } from "./gabon-credit.ts";

/** Map declared XAF figures to the standard model's monthly inputs without treating turnover as income. */
export function prepareGabonScoreInput(app: Record<string, unknown>, extra: Record<string, unknown>) {
  if (app.currency !== "XAF") return { error: "Gabon scoring requires XAF amounts." } as const;

  const category = String(app.product_category);
  const assessment = assessGabonAffordability(category, {
    monthly_income: app.monthly_income, monthly_expenses: app.monthly_expenses, rent: app.monthly_rent,
    monthly_revenue: app.monthly_revenue, avg_monthly_revenue_6m: app.monthly_revenue, ...extra,
  });
  if (assessment.cashIn === null || assessment.cashCosts === null || assessment.dscr === null || !Number.isFinite(assessment.dscr)) {
    return { error: assessment.missing.length ? `Complete the Gabon financial inputs: ${assessment.missing.join("; ")}.` : "Gabon financial inputs are invalid." } as const;
  }

  const months = category === "farmer" ? gabonNumber(extra.farm_cycle_months) ?? 1 : 1;
  const operatingCosts = category === "farmer" ? (gabonNumber(extra.farm_cycle_costs) ?? 0) / months
    : category === "micro" || category === "sme" ? gabonNumber(extra.monthly_operating_costs) ?? 0 : 0;
  const householdCosts = category === "sme" ? null : assessment.cashCosts / months - operatingCosts;
  const monthlyIncome = assessment.cashIn / months - operatingCosts;
  const monthlyExpenses = (householdCosts ?? 0) + (gabonNumber(extra.existing_repayments) ?? 0);

  return {
    financials: { monthly_income: monthlyIncome, monthly_expenses: monthlyExpenses, monthly_rent: 0 },
    extra: { ...extra, dscr: assessment.dscr, _declared_monthly_household_costs: householdCosts },
    assessment,
  } as const;
}