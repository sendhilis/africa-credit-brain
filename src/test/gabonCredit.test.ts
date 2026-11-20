import { describe, expect, it } from "vitest";
import { assessGabonAffordability, gabonDocumentCurrency } from "../../supabase/functions/_shared/gabon-credit";
import { prepareGabonScoreInput } from "../../supabase/functions/_shared/gabon-score-input";
import { runScorecard } from "../../supabase/functions/_shared/scorecard";
import { countryConfigs } from "@/components/application/countryConfig";
import { getGabonDocuments, requiresGabonOcr, reviewGabonEvidence } from "@/components/application/gabonDocuments";

const debts = { existing_repayments: 20000, proposed_repayment: 40000 };
const farm = { farm_cycle_months: 4, farm_projected_sales: 900000, farm_cycle_costs: 450000, farm_other_income: 20000, monthly_household_costs: 50000, farm_cash_receipt: "2027-04-10", first_installment: "2027-04-10", existing_repayments: 10000, proposed_repayment: 150000 };

describe("Gabon market treatment", () => {
  it("uses XAF, +241, nine local provinces and Gabon identity and consent sources", () => {
    const config = countryConfigs.gabon;
    expect([config.currency, config.phonePrefix]).toEqual(["XAF", "+241"]);
    expect(config.locationFields?.[0].options).toHaveLength(9);
    expect(config.idTypes.map(id => id.value)).toEqual(["cnie", "nip_attestation", "passport", "residence_card"]);
    expect(config.wallets).toEqual(["Airtel Money", "Moov Money"]);
    expect(config.utilities).toEqual(["SEEG"]);
  });
  it.each([["retail", "payslip"], ["micro", "trader_records"], ["sme", "management_accounts"], ["farmer", "land_document"]])("keeps %s evidence specific to the category", (category, key) => {
    expect(getGabonDocuments(category).filter(doc => doc.categories?.length === 1).map(doc => doc.key)).toContain(key);
    expect(getGabonDocuments(category === "retail" ? "farmer" : "retail").map(doc => doc.key)).not.toContain(key);
    expect(requiresGabonOcr(key)).toBe(false);
    expect(requiresGabonOcr("mobile_money_statement")).toBe(true);
  });
  it("deducts household costs, housing, and both debts for an individual", () => {
    const result = assessGabonAffordability("retail", { ...debts, monthly_income: 300000, monthly_expenses: 140000, rent: 60000 });
    expect(result.surplus).toBe(40000);
    expect(result.dscr).toBeCloseTo(100000 / 60000);
  });
  it("does not mistake trader sales or wallet turnover for income", () => {
    const result = assessGabonAffordability("micro", { ...debts, monthly_revenue: 600000, monthly_operating_costs: 440000, monthly_income: 0, monthly_household_costs: 120000, wallet_daily_vol: 100000 });
    expect(result.surplus).toBe(-20000);
  });
  it("measures SME coverage on operating cash, not gross revenue", () => {
    const result = assessGabonAffordability("sme", { ...debts, avg_monthly_revenue_6m: 2400000, monthly_operating_costs: 2300000 });
    expect(result.dscr).toBeCloseTo(100000 / 60000);
    expect(result.surplus).toBe(40000);
  });
  it("includes the full farm cycle's costs and debt and flags a payment before receipts", () => {
    const result = assessGabonAffordability("farmer", farm);
    expect([result.cashIn, result.cashCosts, result.debt, result.surplus]).toEqual([980000, 650000, 190000, 140000]);
    expect(result.timingRisk).toBe(false);
    const early = assessGabonAffordability("farmer", { ...farm, first_installment: "2027-04-09" });
    expect(early.timingRisk).toBe(true);
    expect(early.surplus).toBe(140000);
  });
  it("does not issue a score for missing costs, blank obligations, zero proposed payments or an invalid date", () => {
    for (const data of [{ farm_cycle_costs: "" }, { existing_repayments: "" }, { proposed_repayment: 0 }, { farm_cash_receipt: "2027-02-30" }]) {
      expect(prepareGabonScoreInput({ product_category: "farmer", currency: "XAF" }, { ...farm, ...data })).toHaveProperty("error");
    }
  });
  it("recognizes local currency notation but never converts a foreign statement", () => {
    expect(gabonDocumentCurrency("F CFA")).toBe("XAF");
    expect(gabonDocumentCurrency("XOF")).toBe("XOF");
    expect(gabonDocumentCurrency("USD")).toBe("USD");
    expect(gabonDocumentCurrency(undefined)).toBeNull();
  });
  it("flags missing farm evidence independently of the affordability score", () => {
    const review = reviewGabonEvidence("farmer", [{ type: "land_document", storage_path: "land.pdf" }, { type: "farm_budget" }], []);
    expect(review.checks.map(({ label, status }) => [label, status])).toEqual([
      ["Identity evidence", "missing"], ["Land access", "officer_review"],
      ["Production budget", "missing"], ["Sales and production evidence", "missing"],
    ]);
  });
  it("treats a payslip as an alternative to a bank statement, without hiding invalid files", () => {
    const review = reviewGabonEvidence("retail", [{ type: "payslip", storage_path: "pay.pdf" }, { type: "bank_statement", storage_path: "bank.pdf" }], [
      { document_type: "bank_statement", storage_path: "bank.pdf", extraction_status: "invalid", extracted_data: { meets_period_requirement: false } },
    ]);
    expect(review.checks.find(check => check.label === "Income evidence")?.status).toBe("officer_review");
    expect(review.files[1]).toMatchObject({ status: "invalid", insufficientPeriod: true });
  });
  it("uses the latest extraction for the same file and type and distinguishes pending from failure", () => {
    const review = reviewGabonEvidence("sme", [{ type: "financial_statement", storage_path: "accounts.pdf" }, { type: "id_copy", storage_path: "id.pdf" }], [
      { document_type: "financial_statement", storage_path: "accounts.pdf", extraction_status: "completed" },
      { document_type: "financial_statement", storage_path: "accounts.pdf", extraction_status: "failed" },
      { document_type: "bank_statement", storage_path: "id.pdf", extraction_status: "completed" },
    ]);
    expect(review.checks.map(check => check.status)).toEqual(["pending", "failed"]);
  });
});

describe("Gabon standard scoring", () => {
  const households = { monthly_household_costs: 120000 };
  const files = [
    ["retail", { monthly_income: 300000, monthly_expenses: 140000, rent: 60000 }, 300000, 220000, 200000],
    ["micro", { ...households, monthly_revenue: 600000, monthly_operating_costs: 440000, monthly_income: 0 }, 160000, 140000, 120000],
    ["sme", { avg_monthly_revenue_6m: 2400000, monthly_operating_costs: 2300000 }, 100000, 20000, null],
    ["farmer", farm, 132500, 60000, 50000],
  ] as const;

  it.each(files)("maps %s cash flows into the same WoE model and estimated PD", (category, declared, income, expenses, essentials) => {
    const app = { country: "gabon", currency: "XAF", product_category: category, requested_amount: 300000, tenor_months: 12 };
    const input = prepareGabonScoreInput(app, { ...debts, ...declared });
    if ("error" in input) throw new Error(input.error);
    expect(input.financials).toEqual({ monthly_income: income, monthly_expenses: expenses, monthly_rent: 0 });
    const score = (country: string) => runScorecard({
      app: { ...app, ...input.financials, country }, borrower: { extra_data: input.extra }, paymentHistory: [], incomeHistory: [],
    });
    const result = score("gabon");
    expect(result).toEqual(score("kenya"));
    expect(result.model_version).toBe(`v2.1-${category}-woe-lr`);
    expect(result.probability_of_default).toBeGreaterThan(0);
    expect(result.probability_of_default).toBeLessThan(1);
    expect(result.bread_basket?.total_essentials ?? null).toBe(essentials);
    expect(result.woe_details.length).toBeGreaterThan(0);
  });

  it("does not silently treat a foreign currency as XAF", () => {
    expect(prepareGabonScoreInput({ product_category: "farmer", currency: "USD" }, farm)).toEqual({ error: "Gabon scoring requires XAF amounts." });
  });
});
