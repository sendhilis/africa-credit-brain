import { describe, expect, it } from "vitest";
import {
  MODEL_COEFFICIENTS, WOE_BINS, computeIncomeStability, computePaymentHistoryScore,
  describeModelForGrace, findBin, runDataSanityChecks, runScorecard, scoreToBand, scoreToRecommendation,
} from "../../supabase/functions/_shared/scorecard";
import { redactPII } from "../../supabase/functions/_shared/scoring-privacy";

function score(app = {}, onTime = 12, extra = {}) {
  return runScorecard({
    app: { monthly_income: 1200, monthly_expenses: 400, monthly_rent: 200, requested_amount: 1000, tenor_months: 12, ...app },
    borrower: { date_of_birth: "1988-01-01", years_in_operation: 5, extra_data: extra },
    paymentHistory: Array.from({ length: 12 }, (_, i) => ({
      status: i < onTime ? "on_time" : "late", days_past_due: i < onTime ? 0 : 30,
      amount_due: 100, amount_paid: 100, due_date: `2025-${String(i + 1).padStart(2, "0")}-01`,
    })),
    incomeHistory: [],
  });
}

function incomeFlag(document_type: string, declared: number, evidence: number) {
  return runDataSanityChecks(
    { monthly_income: declared }, {}, {},
    [{ document_type, extraction_status: "completed", extracted_data: { average_monthly_income: evidence } }],
    null, -0.5, computePaymentHistoryScore([]), computeIncomeStability([]),
  );
}

describe("production scorecard v2.1", () => {
  it("stores positive magnitudes and gives safer WoE bins a higher contribution", () => {
    for (const [key, coefficient] of Object.entries(MODEL_COEFFICIENTS)) {
      if (key !== "intercept") expect(coefficient, key).toBeGreaterThan(0);
    }
    for (const [key, bins] of Object.entries(WOE_BINS)) {
      const beta = MODEL_COEFFICIENTS[key as keyof typeof MODEL_COEFFICIENTS];
      const ordered = [...new Set(bins.map(bin => bin.woe))].sort((a, b) => a - b);
      for (let i = 1; i < ordered.length; i++) expect(-beta * ordered[i - 1], key).toBeGreaterThan(-beta * ordered[i]);
    }
  });

  it("ranks bureau 780 and 12/12 payments above bureau 450 and 3/12", () => {
    const strong = score({ bureau_score: 780 }, 12);
    const weak = score({ bureau_score: 450 }, 3);
    expect(strong).toMatchObject({ score_band: "Good", recommendation: "approve", model_version: "v2.1-retail-woe-lr-bureau" });
    expect(weak).toMatchObject({ score_band: "Very Poor", recommendation: "decline" });
    expect(strong.score - weak.score).toBeGreaterThan(150);
    expect(strong.probability_of_default).toBeLessThan(weak.probability_of_default);
  });

  it("rewards on-time repayment even without a bureau score", () => {
    expect(score({}, 12).score).toBeGreaterThan(score({}, 3).score);
  });

  it("rewards a psychometric score of 90 over 15", () => {
    expect(score({}, 12, { psychometric_score: 90 }).score).toBeGreaterThan(score({}, 12, { psychometric_score: 15 }).score);
  });

  it("awards five score points for declared collateral in the reference case", () => {
    expect(score({ collateral: "equipment" }).score - score({ collateral: "none" }).score).toBe(5);
  });

  it("distinguishes absent household data from a real -50% margin", () => {
    const bin = WOE_BINS.bread_basket_margin;
    expect(findBin(bin, null).label).toBe("No Data");
    expect(findBin(bin, NaN).label).toBe("No Data");
    const missing = score({ monthly_rent: 0 });
    const deficit = score({ monthly_rent: 0 }, 12, { monthly_food_basket: 1800 });
    const factor = (result: ReturnType<typeof score>) => result.woe_details.find(row => row.feature === "Bread Basket Margin");
    expect(factor(missing)).toMatchObject({ bin: "No Data", raw_value: null, woe: 0.10 });
    expect(factor(deficit)).toMatchObject({ bin: "Critical (<5%)", raw_value: -0.5, woe: 1.05 });
    expect(factor(score({ monthly_income: 0 }))).toMatchObject({ bin: "No Data", raw_value: null });
  });

  it.each(["pos_statement", "bank_statement", "mobile_money"])("flags 1200 vs 500 as critical and the reverse as warning for %s", document => {
    const over = incomeFlag(document, 1200, 500);
    const under = incomeFlag(document, 500, 1200);
    expect(over.flags[0]).toMatchObject({ severity: "critical", deviation_pct: 140 });
    expect(under.flags[0]).toMatchObject({ severity: "warning", deviation_pct: 140 });
    expect(over.consistency_score).toBe(70);
    expect(under.consistency_score).toBe(88);
    expect(incomeFlag(document, 1000, 900).flags[0]).toMatchObject({ severity: "info", deviation_pct: 11 });
  });

  it.each([["pos_statement", 1500, 2000], ["bank_statement", 1400, 1800], ["mobile_money", 1600, 2000]])(
    "keeps the warning and critical thresholds for %s", (document, warn, critical) => {
      expect(incomeFlag(document, warn, 1000).flags[0].severity).toBe("info");
      expect(incomeFlag(document, warn + 1, 1000).flags[0].severity).toBe("warning");
      expect(incomeFlag(document, critical, 1000).flags[0].severity).toBe("warning");
      expect(incomeFlag(document, critical + 1, 1000).flags[0].severity).toBe("critical");
    },
  );

  it("only includes business tenure for Micro and SME", () => {
    for (const [category, feature] of [["micro", "Years Trading"], ["sme", "Business Tenure"]]) {
      expect(score({ product_category: category }).woe_details).toContainEqual(expect.objectContaining({ feature, raw_value: 5 }));
    }
    for (const category of ["retail", "farmer"]) {
      expect(score({ product_category: category }).woe_details.find(row => /tenure|trading|business_years/i.test(row.feature))).toBeUndefined();
    }
  });

  it("uses the same band and recommendation boundaries for scoring and Grace", () => {
    const guidance = describeModelForGrace();
    for (const [min, band, previous] of [[800, "Excellent", "Very Good"], [740, "Very Good", "Good"], [670, "Good", "Fair"], [580, "Fair", "Poor"], [500, "Poor", "Very Poor"]] as const) {
      expect(scoreToBand(min)).toBe(band);
      expect(scoreToBand(min - 1)).toBe(previous);
      expect(guidance).toContain(`${band} ≥ ${min}`);
    }
    expect([539, 540, 669, 670].map(scoreToRecommendation)).toEqual(["decline", "review", "review", "approve"]);
    expect(guidance).toContain("approve ≥ 670, review 540–669, decline below 540");
    expect(guidance).toMatch(/Retail with bureau: Credit Bureau Score \(23%\)/);
    expect(guidance).toMatch(/Micro with bureau: Credit Bureau Score \(15%\)/);
    expect(guidance).toMatch(/SME with bureau: Credit Bureau Score \(11%\)/);
    expect(score({ bureau_score: 780 }).summary).not.toContain("30% weight");
  });

  it("redacts nested document identifiers and gender but retains dates and amounts", () => {
    const extraction = { account_holder_name: "Applicant Test", account_number: "ABC", billing_address: "Street", gender: "female", id_number: "ID", dateOfBirth: "1990-01-01", registration_number: "REG", phone_number: "123", transactions: [{ description: "Transfer to Applicant Test", amount: 1200, date: "2025-11-20" }] };
    expect(redactPII(extraction)).toEqual({
      account_holder_name: "[redacted]", account_number: "[redacted]", billing_address: "[redacted]", gender: "[redacted]", id_number: "[redacted]", dateOfBirth: "[redacted]", registration_number: "[redacted]", phone_number: "[redacted]", transactions: [{ description: "[redacted]", amount: 1200, date: "2025-11-20" }],
    });
    expect(extraction.account_holder_name).toBe("Applicant Test");
  });
});
