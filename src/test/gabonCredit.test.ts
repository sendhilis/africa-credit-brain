import { describe, expect, it } from "vitest";
import { assessGabonAffordability, gabonDocumentCurrency, gabonIndicativeScore } from "../../supabase/functions/_shared/gabon-credit";
import { countryConfigs } from "@/components/application/countryConfig";
import { getGabonDocuments, requiresGabonOcr } from "@/components/application/gabonDocuments";

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
    expect(gabonIndicativeScore(result)?.score).toBe(450);
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
    expect(gabonIndicativeScore(result)?.score).toBe(700);
    const early = assessGabonAffordability("farmer", { ...farm, first_installment: "2027-04-09" });
    expect(early.timingRisk).toBe(true);
    expect(gabonIndicativeScore(early)?.score).toBe(600);
  });
  it("does not issue a score for missing costs, blank obligations, zero proposed payments or an invalid date", () => {
    for (const data of [{ farm_cycle_costs: "" }, { existing_repayments: "" }, { proposed_repayment: 0 }, { farm_cash_receipt: "2027-02-30" }]) {
      expect(gabonIndicativeScore(assessGabonAffordability("farmer", { ...farm, ...data }))).toBeNull();
    }
  });
  it("recognizes local currency notation but never converts a foreign statement", () => {
    expect(gabonDocumentCurrency("F CFA")).toBe("XAF");
    expect(gabonDocumentCurrency("XOF")).toBe("XOF");
    expect(gabonDocumentCurrency("USD")).toBe("USD");
    expect(gabonDocumentCurrency(undefined)).toBeNull();
  });
});
