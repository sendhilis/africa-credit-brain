// ──────────────────────────────────────────────────────────────
// SCORECARD MODEL v2.1 — Category-Aware WoE/IV Logistic Regression
// Three distinct weight schemes: Individual (retail), Micro, SME
// Enhanced features: business_stability, cashflow_volatility, social_media_score
// Expert-estimated model for African markets with Zimbabwe context
// ──────────────────────────────────────────────────────────────

// Scaling parameters (standard scorecard alignment)
const BASE_SCORE = 600;
const BASE_ODDS = 50;
const PDO = 20;
const FACTOR = PDO / Math.LN2;
const OFFSET = BASE_SCORE - FACTOR * Math.log(BASE_ODDS);

// Positive β magnitudes: negative WoE is safer and raises the score.
// Risk log-odds = intercept + Σ β·WoE; score uses the opposite sign.
export const MODEL_COEFFICIENTS = {
  intercept: -1.8,
  bureau_score: 1.50,
  debt_to_income: 0.85,
  age: 0.42,
  loan_to_income: 0.65,
  existing_loan_count: 0.38,
  dependents: 0.15,
  employment_stability: 0.55,
  payment_history_score: 1.2,
  income_stability_cv: 0.72,
  collateral_flag: 0.35,
  business_years: 0.28,
  savings_ratio: 0.48,
  // New v2.0 features
  business_stability_score: 0.65, // premises, licenses, staff retention
  cashflow_volatility: 0.58,       // revenue high/low ratio, seasonality
  social_media_score: 0.32,       // digital footprint strength
  concentration_risk: 0.42,        // customer/supplier concentration
  dscr: 0.55,                     // debt service coverage ratio
  forex_exposure: 0.28,            // multi-currency risk (Zim-specific)
  psychometric_score: 0.45,       // behavioural assessment (financial discipline, risk, conscientiousness, locus of control)
  bread_basket_margin: 0.52,     // disposable surplus after essential household expenses
};

for (const [key, value] of Object.entries(MODEL_COEFFICIENTS)) {
  if (key !== "intercept" && (!Number.isFinite(value) || value <= 0)) {
    throw new Error(`MODEL_COEFFICIENTS.${key} must be a positive magnitude`);
  }
}


// WoE bins for each feature
interface WoEBin {
  label: string;
  min: number;
  max: number;
  woe: number;
  event_rate: number;
}

export const WOE_BINS: Record<string, WoEBin[]> = {
  bureau_score: [
    { label: "Excellent (750+)", min: 750, max: 900, woe: -1.45, event_rate: 0.02 },
    { label: "Good (700-749)", min: 700, max: 749, woe: -0.85, event_rate: 0.04 },
    { label: "Fair (650-699)", min: 650, max: 699, woe: -0.25, event_rate: 0.08 },
    { label: "Below Average (600-649)", min: 600, max: 649, woe: 0.35, event_rate: 0.14 },
    { label: "Poor (500-599)", min: 500, max: 599, woe: 0.82, event_rate: 0.24 },
    { label: "Very Poor (<500)", min: 0, max: 499, woe: 1.55, event_rate: 0.42 },
    { label: "No Bureau Data", min: -1, max: -1, woe: 0.10, event_rate: 0.11 },
  ],
  debt_to_income: [
    { label: "≤ 20%", min: 0, max: 0.2, woe: -0.85, event_rate: 0.03 },
    { label: "20-40%", min: 0.2, max: 0.4, woe: -0.32, event_rate: 0.06 },
    { label: "40-60%", min: 0.4, max: 0.6, woe: 0.25, event_rate: 0.12 },
    { label: "60-80%", min: 0.6, max: 0.8, woe: 0.78, event_rate: 0.22 },
    { label: "> 80%", min: 0.8, max: 999, woe: 1.45, event_rate: 0.38 },
  ],
  age: [
    { label: "18-25", min: 18, max: 25, woe: 0.62, event_rate: 0.18 },
    { label: "26-35", min: 26, max: 35, woe: -0.15, event_rate: 0.08 },
    { label: "36-45", min: 36, max: 45, woe: -0.52, event_rate: 0.05 },
    { label: "46-55", min: 46, max: 55, woe: -0.38, event_rate: 0.06 },
    { label: "56+", min: 56, max: 120, woe: 0.22, event_rate: 0.11 },
  ],
  loan_to_income: [
    { label: "≤ 1x", min: 0, max: 1, woe: -0.72, event_rate: 0.04 },
    { label: "1-3x", min: 1, max: 3, woe: -0.18, event_rate: 0.07 },
    { label: "3-6x", min: 3, max: 6, woe: 0.35, event_rate: 0.14 },
    { label: "6-12x", min: 6, max: 12, woe: 0.82, event_rate: 0.24 },
    { label: "> 12x", min: 12, max: 9999, woe: 1.55, event_rate: 0.42 },
  ],
  existing_loan_count: [
    { label: "None", min: 0, max: 0, woe: -0.45, event_rate: 0.05 },
    { label: "1 loan", min: 1, max: 1, woe: -0.12, event_rate: 0.08 },
    { label: "2 loans", min: 2, max: 2, woe: 0.28, event_rate: 0.13 },
    { label: "3+ loans", min: 3, max: 999, woe: 0.95, event_rate: 0.28 },
  ],
  dependents: [
    { label: "0", min: 0, max: 0, woe: -0.22, event_rate: 0.07 },
    { label: "1-2", min: 1, max: 2, woe: -0.08, event_rate: 0.09 },
    { label: "3-5", min: 3, max: 5, woe: 0.18, event_rate: 0.12 },
    { label: "6+", min: 6, max: 999, woe: 0.55, event_rate: 0.19 },
  ],
  payment_history_score: [
    { label: "Excellent (>95%)", min: 0.95, max: 1.01, woe: -1.35, event_rate: 0.02 },
    { label: "Good (80-95%)", min: 0.8, max: 0.95, woe: -0.62, event_rate: 0.06 },
    { label: "Fair (60-80%)", min: 0.6, max: 0.8, woe: 0.18, event_rate: 0.12 },
    { label: "Poor (40-60%)", min: 0.4, max: 0.6, woe: 0.75, event_rate: 0.22 },
    { label: "Very Poor (<40%)", min: 0, max: 0.4, woe: 1.42, event_rate: 0.38 },
    { label: "No History", min: -1, max: 0, woe: 0.35, event_rate: 0.15 },
  ],
  income_stability_cv: [
    { label: "Very Stable (CV<10%)", min: 0, max: 0.1, woe: -0.82, event_rate: 0.04 },
    { label: "Stable (10-25%)", min: 0.1, max: 0.25, woe: -0.28, event_rate: 0.07 },
    { label: "Moderate (25-50%)", min: 0.25, max: 0.5, woe: 0.32, event_rate: 0.14 },
    { label: "Volatile (>50%)", min: 0.5, max: 999, woe: 0.95, event_rate: 0.26 },
    { label: "Unknown", min: -1, max: 0, woe: 0.15, event_rate: 0.11 },
  ],
  business_years: [
    { label: "< 1 year", min: 0, max: 1, woe: 0.72, event_rate: 0.22 },
    { label: "1-3 years", min: 1, max: 3, woe: 0.15, event_rate: 0.11 },
    { label: "3-5 years", min: 3, max: 5, woe: -0.32, event_rate: 0.06 },
    { label: "5-10 years", min: 5, max: 10, woe: -0.65, event_rate: 0.04 },
    { label: "10+ years", min: 10, max: 999, woe: -0.88, event_rate: 0.03 },
  ],
  savings_ratio: [
    { label: "Negative", min: -999, max: 0, woe: 1.15, event_rate: 0.32 },
    { label: "0-10%", min: 0, max: 0.1, woe: 0.42, event_rate: 0.16 },
    { label: "10-25%", min: 0.1, max: 0.25, woe: -0.18, event_rate: 0.08 },
    { label: "25-50%", min: 0.25, max: 0.5, woe: -0.62, event_rate: 0.05 },
    { label: "> 50%", min: 0.5, max: 999, woe: -0.95, event_rate: 0.03 },
  ],
  // New v2.0 WoE bins
  business_stability_score: [
    { label: "Very Stable (80-100%)", min: 0.8, max: 1.01, woe: -0.92, event_rate: 0.03 },
    { label: "Stable (60-80%)", min: 0.6, max: 0.8, woe: -0.35, event_rate: 0.06 },
    { label: "Moderate (40-60%)", min: 0.4, max: 0.6, woe: 0.15, event_rate: 0.11 },
    { label: "Unstable (20-40%)", min: 0.2, max: 0.4, woe: 0.62, event_rate: 0.20 },
    { label: "Very Unstable (<20%)", min: 0, max: 0.2, woe: 1.18, event_rate: 0.34 },
    { label: "No Data", min: -1, max: 0, woe: 0.20, event_rate: 0.12 },
  ],
  cashflow_volatility: [
    { label: "Very Low (<15%)", min: 0, max: 0.15, woe: -0.78, event_rate: 0.04 },
    { label: "Low (15-30%)", min: 0.15, max: 0.3, woe: -0.25, event_rate: 0.07 },
    { label: "Moderate (30-50%)", min: 0.3, max: 0.5, woe: 0.22, event_rate: 0.13 },
    { label: "High (50-75%)", min: 0.5, max: 0.75, woe: 0.68, event_rate: 0.22 },
    { label: "Very High (>75%)", min: 0.75, max: 999, woe: 1.25, event_rate: 0.35 },
    { label: "No Data", min: -1, max: 0, woe: 0.15, event_rate: 0.11 },
  ],
  social_media_score: [
    { label: "Strong Presence", min: 0.7, max: 1.01, woe: -0.65, event_rate: 0.04 },
    { label: "Moderate Presence", min: 0.4, max: 0.7, woe: -0.22, event_rate: 0.07 },
    { label: "Minimal Presence", min: 0.1, max: 0.4, woe: 0.10, event_rate: 0.10 },
    { label: "No Presence", min: 0, max: 0.1, woe: 0.05, event_rate: 0.10 },
    { label: "No Data", min: -1, max: 0, woe: 0.0, event_rate: 0.10 },
  ],
  concentration_risk: [
    { label: "Well Diversified (<30%)", min: 0, max: 0.3, woe: -0.55, event_rate: 0.05 },
    { label: "Moderate (30-50%)", min: 0.3, max: 0.5, woe: -0.10, event_rate: 0.08 },
    { label: "Concentrated (50-70%)", min: 0.5, max: 0.7, woe: 0.35, event_rate: 0.15 },
    { label: "Highly Concentrated (>70%)", min: 0.7, max: 1.01, woe: 0.82, event_rate: 0.25 },
    { label: "No Data", min: -1, max: 0, woe: 0.10, event_rate: 0.10 },
  ],
  dscr: [
    { label: "Strong (>2.0x)", min: 2.0, max: 999, woe: -0.85, event_rate: 0.03 },
    { label: "Adequate (1.5-2.0x)", min: 1.5, max: 2.0, woe: -0.42, event_rate: 0.06 },
    { label: "Marginal (1.2-1.5x)", min: 1.2, max: 1.5, woe: 0.15, event_rate: 0.12 },
    { label: "Weak (1.0-1.2x)", min: 1.0, max: 1.2, woe: 0.55, event_rate: 0.20 },
    { label: "Insufficient (<1.0x)", min: 0, max: 1.0, woe: 1.15, event_rate: 0.35 },
    { label: "No Data", min: -1, max: 0, woe: 0.20, event_rate: 0.12 },
  ],
  forex_exposure: [
    { label: "No Exposure", min: 0, max: 0.05, woe: -0.15, event_rate: 0.08 },
    { label: "Low (<20%)", min: 0.05, max: 0.2, woe: -0.05, event_rate: 0.09 },
    { label: "Moderate (20-50%)", min: 0.2, max: 0.5, woe: 0.18, event_rate: 0.12 },
    { label: "High (>50%)", min: 0.5, max: 1.01, woe: 0.42, event_rate: 0.17 },
    { label: "No Data", min: -1, max: 0, woe: 0.05, event_rate: 0.10 },
  ],
  psychometric_score: [
    { label: "Excellent (80-100%)", min: 0.8, max: 1.01, woe: -0.88, event_rate: 0.03 },
    { label: "Good (60-80%)", min: 0.6, max: 0.8, woe: -0.35, event_rate: 0.06 },
    { label: "Average (40-60%)", min: 0.4, max: 0.6, woe: 0.12, event_rate: 0.11 },
    { label: "Below Average (20-40%)", min: 0.2, max: 0.4, woe: 0.58, event_rate: 0.20 },
    { label: "Poor (<20%)", min: 0, max: 0.2, woe: 1.05, event_rate: 0.30 },
    { label: "No Assessment", min: -1, max: 0, woe: 0.08, event_rate: 0.10 },
  ],
  bread_basket_margin: [
    { label: "Strong Surplus (>50%)", min: 0.5, max: 999, woe: -0.92, event_rate: 0.03 },
    { label: "Healthy (30-50%)", min: 0.3, max: 0.5, woe: -0.45, event_rate: 0.05 },
    { label: "Adequate (15-30%)", min: 0.15, max: 0.3, woe: -0.10, event_rate: 0.09 },
    { label: "Tight (5-15%)", min: 0.05, max: 0.15, woe: 0.42, event_rate: 0.18 },
    { label: "Critical (<5%)", min: -999, max: 0.05, woe: 1.05, event_rate: 0.32 },
    { label: "No Data", min: -1, max: -0.999, woe: 0.10, event_rate: 0.10 },
  ],
};

// ── CATEGORY-SPECIFIC FEATURE WEIGHT SCHEMES ──

// INDIVIDUAL (retail) — focus on personal income, employment, DTI
const WEIGHTS_RETAIL_BUREAU: Record<string, { name: string; weight: number }> = {
  bureau_score:           { name: "Credit Bureau Score", weight: 23 },
  payment_history_score:  { name: "Payment History", weight: 14 },
  debt_to_income:         { name: "Debt-to-Income Ratio", weight: 11 },
  bread_basket_margin:    { name: "Bread Basket Margin", weight: 9 },
  income_stability_cv:    { name: "Income Stability", weight: 9 },
  psychometric_score:     { name: "Psychometric Assessment", weight: 9 },
  loan_to_income:         { name: "Loan-to-Income Ratio", weight: 7 },
  savings_ratio:          { name: "Savings Capacity", weight: 6 },
  age:                    { name: "Borrower Age", weight: 4 },
  existing_loan_count:    { name: "Existing Obligations", weight: 3 },
  dependents:             { name: "Dependents", weight: 2 },
  collateral_flag:        { name: "Collateral", weight: 3 },
};

const WEIGHTS_RETAIL_NO_BUREAU: Record<string, { name: string; weight: number }> = {
  payment_history_score:  { name: "Payment History", weight: 19 },
  debt_to_income:         { name: "Debt-to-Income Ratio", weight: 15 },
  bread_basket_margin:    { name: "Bread Basket Margin", weight: 10 },
  income_stability_cv:    { name: "Income Stability", weight: 13 },
  psychometric_score:     { name: "Psychometric Assessment", weight: 11 },
  loan_to_income:         { name: "Loan-to-Income Ratio", weight: 9 },
  savings_ratio:          { name: "Savings Capacity", weight: 8 },
  age:                    { name: "Borrower Age", weight: 5 },
  existing_loan_count:    { name: "Existing Obligations", weight: 4 },
  dependents:             { name: "Dependents", weight: 3 },
  collateral_flag:        { name: "Collateral", weight: 3 },
};

// MICRO — focus on business stability, cash flow, informal savings, repayment
const WEIGHTS_MICRO_BUREAU: Record<string, { name: string; weight: number }> = {
  bureau_score:                { name: "Credit Bureau Score", weight: 15 },
  payment_history_score:       { name: "Repayment History", weight: 13 },
  business_stability_score:    { name: "Business Stability", weight: 12 },
  psychometric_score:          { name: "Psychometric Assessment", weight: 11 },
  bread_basket_margin:         { name: "Bread Basket Margin", weight: 9 },
  cashflow_volatility:         { name: "Cash Flow Volatility", weight: 9 },
  income_stability_cv:         { name: "Income Stability", weight: 6 },
  debt_to_income:              { name: "Debt-to-Income Ratio", weight: 6 },
  business_years:              { name: "Years Trading", weight: 5 },
  savings_ratio:               { name: "Savings (incl. Mukando)", weight: 4 },
  loan_to_income:              { name: "Loan-to-Income Ratio", weight: 4 },
  collateral_flag:             { name: "Collateral", weight: 3 },
  existing_loan_count:         { name: "Existing Obligations", weight: 3 },
};

const WEIGHTS_MICRO_NO_BUREAU: Record<string, { name: string; weight: number }> = {
  payment_history_score:       { name: "Repayment History", weight: 16 },
  business_stability_score:    { name: "Business Stability", weight: 14 },
  psychometric_score:          { name: "Psychometric Assessment", weight: 13 },
  bread_basket_margin:         { name: "Bread Basket Margin", weight: 10 },
  cashflow_volatility:         { name: "Cash Flow Volatility", weight: 11 },
  income_stability_cv:         { name: "Income Stability", weight: 8 },
  debt_to_income:              { name: "Debt-to-Income Ratio", weight: 6 },
  business_years:              { name: "Years Trading", weight: 6 },
  savings_ratio:               { name: "Savings (incl. Mukando)", weight: 5 },
  loan_to_income:              { name: "Loan-to-Income Ratio", weight: 4 },
  collateral_flag:             { name: "Collateral", weight: 4 },
  existing_loan_count:         { name: "Existing Obligations", weight: 3 },
};

// SME — focus on financial analysis, cash flow volatility, concentration, social media
const WEIGHTS_SME_BUREAU: Record<string, { name: string; weight: number }> = {
  bureau_score:                { name: "Credit Bureau Score", weight: 11 },
  cashflow_volatility:         { name: "Cash Flow Volatility", weight: 13 },
  payment_history_score:       { name: "Repayment History", weight: 10 },
  dscr:                        { name: "Debt Service Coverage", weight: 9 },
  business_stability_score:    { name: "Business Stability", weight: 8 },
  bread_basket_margin:         { name: "Bread Basket Margin", weight: 8 },
  psychometric_score:          { name: "Psychometric Assessment", weight: 7 },
  concentration_risk:          { name: "Concentration Risk", weight: 7 },
  income_stability_cv:         { name: "Revenue Stability", weight: 6 },
  social_media_score:          { name: "Digital Footprint", weight: 5 },
  business_years:              { name: "Business Tenure", weight: 5 },
  forex_exposure:              { name: "Forex Exposure", weight: 4 },
  debt_to_income:              { name: "Leverage Ratio", weight: 3 },
  collateral_flag:             { name: "Collateral", weight: 2 },
  savings_ratio:               { name: "Liquidity Buffer", weight: 2 },
};

const WEIGHTS_SME_NO_BUREAU: Record<string, { name: string; weight: number }> = {
  cashflow_volatility:         { name: "Cash Flow Volatility", weight: 14 },
  payment_history_score:       { name: "Repayment History", weight: 12 },
  dscr:                        { name: "Debt Service Coverage", weight: 10 },
  business_stability_score:    { name: "Business Stability", weight: 10 },
  bread_basket_margin:         { name: "Bread Basket Margin", weight: 9 },
  psychometric_score:          { name: "Psychometric Assessment", weight: 9 },
  concentration_risk:          { name: "Concentration Risk", weight: 7 },
  income_stability_cv:         { name: "Revenue Stability", weight: 7 },
  social_media_score:          { name: "Digital Footprint", weight: 5 },
  business_years:              { name: "Business Tenure", weight: 5 },
  forex_exposure:              { name: "Forex Exposure", weight: 4 },
  debt_to_income:              { name: "Leverage Ratio", weight: 3 },
  collateral_flag:             { name: "Collateral", weight: 3 },
  savings_ratio:               { name: "Liquidity Buffer", weight: 2 },
};

function getWeightScheme(category: string, hasBureau: boolean): Record<string, { name: string; weight: number }> {
  switch (category) {
    case "micro":
      return hasBureau ? WEIGHTS_MICRO_BUREAU : WEIGHTS_MICRO_NO_BUREAU;
    case "sme":
      return hasBureau ? WEIGHTS_SME_BUREAU : WEIGHTS_SME_NO_BUREAU;
    default: // retail
      return hasBureau ? WEIGHTS_RETAIL_BUREAU : WEIGHTS_RETAIL_NO_BUREAU;
  }
}

// ──────────────────────────────────────────────────────────────
// Helper functions
// ──────────────────────────────────────────────────────────────

const NO_DATA_LABEL = /no data|no history|unknown|no bureau data|no assessment/i;

export function findBin(bins: WoEBin[], value: number | null): WoEBin {
  if (value === null || Number.isNaN(value)) {
    return bins.find(bin => NO_DATA_LABEL.test(bin.label)) ?? bins[bins.length - 1];
  }
  for (const bin of bins) {
    if (value >= bin.min && value <= bin.max) return bin;
  }
  return bins[bins.length - 1];
}

export function calculateAge(dob: string | null): number {
  if (!dob) return 30;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function countExistingLoans(existingLoans: string | null): number {
  if (!existingLoans || existingLoans.toLowerCase() === "none" || existingLoans.trim() === "") return 0;
  const num = parseInt(existingLoans);
  if (!isNaN(num)) return num;
  return existingLoans.split(",").length;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function logOddsToScore(logOdds: number): number {
  return Math.round(OFFSET + FACTOR * logOdds);
}

const SCORE_RANGE = { min: 300, max: 900 } as const;
const MODEL_VERSION = "v2.1";

export const SCORE_BANDS = [
  { band: "Excellent", min: 800 },
  { band: "Very Good", min: 740 },
  { band: "Good", min: 670 },
  { band: "Fair", min: 580 },
  { band: "Poor", min: 500 },
  { band: "Very Poor", min: SCORE_RANGE.min },
] as const;

export const DECISION_THRESHOLDS = { approve: 670, review: 540 } as const;

export function scoreToBand(score: number) {
  return (SCORE_BANDS.find(band => score >= band.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]).band;
}

export function scoreToRecommendation(score: number) {
  if (score >= DECISION_THRESHOLDS.approve) return "approve";
  if (score >= DECISION_THRESHOLDS.review) return "review";
  return "decline";
}

export function describeModelForGrace(): string {
  const segments = [["retail", "Retail"], ["micro", "Micro"], ["sme", "SME"]] as const;
  const weights = segments.flatMap(([category, label]) => [true, false].map(hasBureau => {
    const factors = Object.values(getWeightScheme(category, hasBureau)).map(({ name, weight }) => `${name} (${weight}%)`);
    return `- ${label} ${hasBureau ? "with" : "without"} bureau: ${factors.join(", ")}`;
  }));
  return `## Current category-aware WoE scorecard (${MODEL_VERSION})
Display weights below describe the factor breakdown; they are not the coefficients or a fixed share of score points.
${weights.join("\n")}
Score range: ${SCORE_RANGE.min}–${SCORE_RANGE.max}. Bands (inclusive minimums): ${SCORE_BANDS.map(({ band, min }) => `${band} ≥ ${min}`).join(", ")}.
Recommendations are separate from bands: approve ≥ ${DECISION_THRESHOLDS.approve}, review ${DECISION_THRESHOLDS.review}–${DECISION_THRESHOLDS.approve - 1}, decline below ${DECISION_THRESHOLDS.review}. These are model recommendations, not lending decisions.
Scaling: base score ${BASE_SCORE} at ${BASE_ODDS}:1 good-to-bad odds; score rises ${PDO} points when good-to-bad odds double. Default-risk estimates are not validated probabilities.
For stored v2.0 scores, warn that the coefficient signs were incorrect and recommend re-scoring before relying on the result.`;
}

// ──────────────────────────────────────────────────────────────
// Time-series feature extraction
// ──────────────────────────────────────────────────────────────

export interface PaymentRecord {
  status: string;
  days_past_due: number;
  amount_due: number;
  amount_paid: number;
  due_date: string;
}

export interface IncomeRecord {
  income_amount: number;
  period_start: string;
  period_end: string;
}

export function computePaymentHistoryScore(payments: PaymentRecord[]): {
  score: number;
  on_time_pct: number;
  avg_dpd: number;
  worst_dpd: number;
  trend: string;
  has_history: boolean;
} {
  if (!payments || payments.length === 0) {
    return { score: -0.5, on_time_pct: 0, avg_dpd: 0, worst_dpd: 0, trend: "no_history", has_history: false };
  }

  const sorted = [...payments].sort((a, b) =>
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const onTimeCount = sorted.filter(p => p.status === "on_time" || p.days_past_due <= 0).length;
  const onTimePct = onTimeCount / sorted.length;
  const avgDpd = sorted.reduce((s, p) => s + Math.max(0, p.days_past_due), 0) / sorted.length;
  const worstDpd = Math.max(...sorted.map(p => p.days_past_due));

  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);
  const firstOnTime = firstHalf.filter(p => p.status === "on_time").length / (firstHalf.length || 1);
  const secondOnTime = secondHalf.filter(p => p.status === "on_time").length / (secondHalf.length || 1);
  const trend = secondOnTime > firstOnTime + 0.1 ? "improving" :
    secondOnTime < firstOnTime - 0.1 ? "deteriorating" : "stable";

  return { score: onTimePct, on_time_pct: onTimePct, avg_dpd: avgDpd, worst_dpd: worstDpd, trend, has_history: true };
}

export function computeIncomeStability(incomes: IncomeRecord[]): {
  cv: number;
  mean: number;
  std: number;
  trend: string;
  has_history: boolean;
  months_of_data: number;
} {
  if (!incomes || incomes.length < 2) {
    return { cv: -0.5, mean: 0, std: 0, trend: "insufficient_data", has_history: false, months_of_data: incomes?.length || 0 };
  }

  const sorted = [...incomes].sort((a, b) =>
    new Date(a.period_start).getTime() - new Date(b.period_start).getTime()
  );

  const amounts = sorted.map(i => i.income_amount);
  const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  const variance = amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / amounts.length;
  const std = Math.sqrt(variance);
  const cv = mean > 0 ? std / mean : 1;

  const n = amounts.length;
  const xMean = (n - 1) / 2;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (amounts[i] - mean);
    den += Math.pow(i - xMean, 2);
  }
  const slope = den > 0 ? num / den : 0;
  const trend = slope > mean * 0.02 ? "growing" :
    slope < -mean * 0.02 ? "declining" : "stable";

  return { cv, mean, std, trend, has_history: true, months_of_data: n };
}

// ──────────────────────────────────────────────────────────────
// New v2.0 feature extractors
// ──────────────────────────────────────────────────────────────

export function computeBusinessStability(borrower: any, extraData: any): number {
  if (!extraData && !borrower) return -0.5;
  let score = 0;
  let factors = 0;

  // Premises stability (owned > formal lease > informal > mobile)
  const premises = extraData?.premises_type;
  if (premises) {
    factors++;
    if (premises === "owned") score += 1.0;
    else if (premises === "rented_formal") score += 0.75;
    else if (premises === "rented_informal" || premises === "market_stall") score += 0.5;
    else if (premises === "home_based") score += 0.4;
    else score += 0.2; // mobile
  }

  // Premises tenure
  const premisesYears = parseFloat(extraData?.premises_years) || 0;
  if (premisesYears > 0) {
    factors++;
    score += Math.min(1, premisesYears / 5);
  }

  // Licenses current
  const licenses = extraData?.licenses_current;
  if (licenses) {
    factors++;
    score += (licenses.toLowerCase() === "yes") ? 1.0 : 0.2;
  }

  // Staff turnover (lower is better)
  const staffTurnover = parseFloat(extraData?.staff_turnover_pct) || 0;
  if (staffTurnover >= 0 && extraData?.staff_turnover_pct) {
    factors++;
    score += Math.max(0, 1 - staffTurnover / 50);
  }

  // Business years
  const years = borrower?.years_in_operation || 0;
  if (years > 0) {
    factors++;
    score += Math.min(1, years / 10);
  }

  // POS / Till statement data — strong signal of active, trading business
  // A cash trader with verifiable POS transactions has demonstrable business activity
  if (extraData?._pos_has_data && extraData._pos_total_credits > 0) {
    factors++;
    // High-confidence POS extraction with meaningful turnover = strong stability signal
    const confidence = extraData._pos_confidence || 0.5;
    score += Math.min(1, confidence * 0.9); // up to 0.9 for high-confidence POS data
  }

  // POS transaction count — frequent transactions = active trading business
  if (extraData?._pos_transaction_count && extraData._pos_transaction_count > 10) {
    factors++;
    score += Math.min(1, extraData._pos_transaction_count / 50);
  }

  return factors > 0 ? score / factors : -0.5;
}

function computeCashflowVolatility(extraData: any): number {
  if (!extraData) return -0.5;

  // Try explicit volatility field first
  const explicitVol = parseFloat(extraData?.revenue_volatility);
  if (!isNaN(explicitVol) && explicitVol > 0) return explicitVol / 100;

  // Compute from high/low ratio
  const high = parseFloat(extraData?.highest_month_revenue);
  const low = parseFloat(extraData?.lowest_month_revenue);
  if (!isNaN(high) && !isNaN(low) && high > 0 && low > 0) {
    return (high - low) / high;
  }

  // Micro: peak vs low season — but moderate with POS evidence
  const lowSeasonPct = parseFloat(extraData?.low_season_revenue_pct);
  if (!isNaN(lowSeasonPct) && lowSeasonPct > 0) {
    let vol = 1 - (lowSeasonPct / 100);

    // If we have POS data showing real transactions, moderate the seasonality penalty
    // Rationale: POS evidence proves the business IS transacting, even if seasonal
    if (extraData?._pos_has_data && extraData._pos_total_credits > 0) {
      const posModeration = Math.min(0.25, (extraData._pos_confidence || 0.5) * 0.3);
      vol = Math.max(0.1, vol - posModeration);
    }

    return vol;
  }

  // If only POS data available with no seasonality info, assume moderate volatility
  if (extraData?._pos_has_data && extraData._pos_total_credits > 0) {
    return 0.35; // Moderate — we know they're trading but lack seasonal data
  }

  return -0.5;
}

function computeSocialMediaScore(extraData: any): number {
  if (!extraData) return -0.5;
  let score = 0;
  let signals = 0;

  // Facebook presence
  const fbFollowers = parseFloat(extraData?.facebook_followers) || 0;
  if (fbFollowers > 0) {
    signals++;
    score += Math.min(1, fbFollowers / 1000);
  }
  const fbReviews = parseFloat(extraData?.facebook_reviews_avg) || 0;
  if (fbReviews > 0) {
    signals++;
    score += fbReviews / 5;
  }

  // Google presence
  const googleReviews = parseFloat(extraData?.google_reviews_count) || 0;
  if (googleReviews > 0) {
    signals++;
    score += Math.min(1, googleReviews / 20);
  }
  const googleAvg = parseFloat(extraData?.google_reviews_avg) || 0;
  if (googleAvg > 0) {
    signals++;
    score += googleAvg / 5;
  }

  // Google Maps listing
  if (extraData?.google_maps_listing?.toLowerCase() === "yes") {
    signals++;
    score += 0.8;
  }

  // Instagram
  const igFollowers = parseFloat(extraData?.instagram_followers) || 0;
  if (igFollowers > 0) {
    signals++;
    score += Math.min(1, igFollowers / 500);
  }

  // WhatsApp Business
  if (extraData?.whatsapp_business && extraData.whatsapp_business.trim()) {
    signals++;
    score += 0.6;
  }

  return signals > 0 ? Math.min(1, score / signals) : -0.5;
}

function computeConcentrationRisk(extraData: any): number {
  const top3 = parseFloat(extraData?.top_3_customers_pct);
  if (!isNaN(top3) && top3 > 0) return top3 / 100;
  return -0.5;
}

function computeDSCR(extraData: any): number {
  const dscr = parseFloat(extraData?.dscr);
  if (!isNaN(dscr) && dscr > 0) return dscr;
  return -0.5;
}

function computeForexExposure(extraData: any, app: any): number {
  const forex = parseFloat(extraData?.forex_exposure_pct) || parseFloat(app?.export_income_pct);
  if (!isNaN(forex) && forex >= 0) return forex / 100;
  return -0.5;
}

function computeBreadBasketMargin(extraData: any, app: any): { margin: number | null; breakdown: any } {
  const monthlyIncome = app.monthly_income || app.monthly_revenue || 0;
  if (monthlyIncome <= 0) return { margin: null, breakdown: null };

  const foodBasket = parseFloat(extraData?.monthly_food_basket) || 0;
  const transport = parseFloat(extraData?.monthly_transport) || 0;
  const schoolFees = parseFloat(extraData?.monthly_school_fees) || 0;
  const health = parseFloat(extraData?.monthly_health) || 0;
  const rent = app.monthly_rent || 0;

  const totalEssentials = foodBasket + transport + schoolFees + health + rent;

  // If no household expense data was captured at all, return no data
  if (foodBasket === 0 && transport === 0 && schoolFees === 0 && health === 0 && rent === 0) {
    return { margin: null, breakdown: null };
  }

  const disposableSurplus = monthlyIncome - totalEssentials;
  const margin = disposableSurplus / monthlyIncome;


  return {
    margin,
    breakdown: {
      monthly_income: monthlyIncome,
      food_basket: foodBasket,
      transport: transport,
      school_fees: schoolFees,
      health: health,
      rent: rent,
      total_essentials: totalEssentials,
      disposable_surplus: disposableSurplus,
      margin_pct: Math.round(margin * 1000) / 10,
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Data Sanity / Consistency Checks — Inherent Intelligence
// Cross-references declared data against extracted/computed data
// to detect potential falsification or inconsistencies
// ──────────────────────────────────────────────────────────────

interface SanityFlag {
  check: string;
  severity: "info" | "warning" | "critical";
  finding: string;
  declared_value: string;
  evidence_value: string;
  source: string;
  deviation_pct?: number;
}

function incomeGap(declared: number, evidence: number) {
  return { ratio: (Math.max(declared, evidence) - Math.min(declared, evidence)) / Math.min(declared, evidence), overstated: declared > evidence };
}

function gapSeverity(gap: ReturnType<typeof incomeGap>, warnAt: number, criticalAt: number): SanityFlag["severity"] {
  if (gap.ratio <= warnAt) return "info";
  return gap.overstated && gap.ratio > criticalAt ? "critical" : "warning";
}

export function runDataSanityChecks(
  app: any,
  borrower: any,
  extraData: any,
  ocrExtractions: any[],
  breadBasketBreakdown: any,
  businessStability: number,
  paymentStats: any,
  incomeStats: any,
): { flags: SanityFlag[]; consistency_score: number } {
  const flags: SanityFlag[] = [];

  const declaredIncome = app.monthly_income || app.monthly_revenue || 0;
  const declaredExpenses = (app.monthly_expenses || 0) + (app.monthly_rent || 0);

  // ── 1. Declared Income vs POS Turnover ──
  const posExtraction = ocrExtractions.find((e: any) => e.document_type === "pos_statement" && e.extraction_status === "completed");
  if (posExtraction?.extracted_data && declaredIncome > 0) {
    const posData = posExtraction.extracted_data;
    const posPeriod = posData.statement_period;
    let posMonthly = posData.average_monthly_income || posData.total_credits || 0;
    if (posPeriod?.start_date && posPeriod?.end_date) {
      const days = Math.max(1, Math.round((new Date(posPeriod.end_date).getTime() - new Date(posPeriod.start_date).getTime()) / 86400000) + 1);
      if (days < 30 && posData.total_credits) {
        posMonthly = Math.round((posData.total_credits / days) * 30);
      }
    }
    if (posMonthly > 0) {
      const gap = incomeGap(declaredIncome, posMonthly);
      const deviation = gap.ratio;
      const severity = gapSeverity(gap, 0.5, 1.0);
      if (severity !== "info") {
        flags.push({
          check: "Income vs POS Turnover",
          severity,
          finding: gap.overstated
            ? `Declared income is ${(deviation * 100).toFixed(0)}% higher than POS-verified turnover. Possible income inflation.`
            : `POS turnover exceeds declared income by ${(deviation * 100).toFixed(0)}%. Possible under-reporting or multiple revenue streams.`,
          declared_value: `${app.currency || ""} ${declaredIncome.toLocaleString()}`,
          evidence_value: `${app.currency || ""} ${posMonthly.toLocaleString()} (POS)`,
          source: "POS Statement",
          deviation_pct: Math.round(deviation * 100),
        });
      } else {
        flags.push({
          check: "Income vs POS Turnover",
          severity: "info",
          finding: `Declared income is consistent with POS turnover (${(deviation * 100).toFixed(0)}% deviation). Data corroborated.`,
          declared_value: `${app.currency || ""} ${declaredIncome.toLocaleString()}`,
          evidence_value: `${app.currency || ""} ${posMonthly.toLocaleString()} (POS)`,
          source: "POS Statement",
          deviation_pct: Math.round(deviation * 100),
        });
      }
    }
  }

  // ── 2. Declared Income vs Bank Statement ──
  const bankExtraction = ocrExtractions.find((e: any) => e.document_type === "bank_statement" && e.extraction_status === "completed");
  if (bankExtraction?.extracted_data && declaredIncome > 0) {
    const bankIncome = bankExtraction.extracted_data.average_monthly_income || 0;
    if (bankIncome > 0) {
      const gap = incomeGap(declaredIncome, bankIncome);
      const deviation = gap.ratio;
      const severity = gapSeverity(gap, 0.4, 0.8);
      if (severity !== "info") {
        flags.push({
          check: "Income vs Bank Statement",
          severity,
          finding: gap.overstated
            ? `Declared income exceeds bank-verified income by ${(deviation * 100).toFixed(0)}%. Possible overstatement.`
            : `Bank statement shows higher income than declared (${(deviation * 100).toFixed(0)}% gap). Possible under-declaration.`,
          declared_value: `${app.currency || ""} ${declaredIncome.toLocaleString()}`,
          evidence_value: `${app.currency || ""} ${bankIncome.toLocaleString()} (Bank)`,
          source: "Bank Statement",
          deviation_pct: Math.round(deviation * 100),
        });
      } else {
        flags.push({
          check: "Income vs Bank Statement",
          severity: "info",
          finding: `Declared income aligns with bank statement deposits (${(deviation * 100).toFixed(0)}% deviation).`,
          declared_value: `${app.currency || ""} ${declaredIncome.toLocaleString()}`,
          evidence_value: `${app.currency || ""} ${bankIncome.toLocaleString()} (Bank)`,
          source: "Bank Statement",
          deviation_pct: Math.round(deviation * 100),
        });
      }
    }
  }

  // ── 3. Balance Sheet Strength vs Business Activity ──
  // A healthy balance sheet (high savings, assets) should correlate with actual business activity
  const totalSavings = parseFloat(extraData?.total_savings) || 0;
  const stockValue = parseFloat(extraData?.stock_value_estimate) || 0;
  const equipmentValue = parseFloat(extraData?.equipment_tools_value) || 0;
  const totalDeclaredAssets = totalSavings + stockValue + equipmentValue;

  if (totalDeclaredAssets > 0 && declaredIncome > 0) {
    // Assets-to-income ratio check: if declared assets are very high relative to income, suspicious
    const assetIncomeRatio = totalDeclaredAssets / (declaredIncome * 12);
    if (assetIncomeRatio > 5) {
      flags.push({
        check: "Asset-to-Income Plausibility",
        severity: assetIncomeRatio > 10 ? "critical" : "warning",
        finding: `Declared assets (${assetIncomeRatio.toFixed(1)}x annual income) appear disproportionately high. May indicate inflated asset values.`,
        declared_value: `${app.currency || ""} ${totalDeclaredAssets.toLocaleString()} (total assets)`,
        evidence_value: `${app.currency || ""} ${(declaredIncome * 12).toLocaleString()} (annual income)`,
        source: "Balance Sheet vs Income",
        deviation_pct: Math.round((assetIncomeRatio - 1) * 100),
      });
    }

    // If POS data exists and shows low turnover but balance sheet is very strong
    if (posExtraction?.extracted_data?.total_credits) {
      const posTurnover = posExtraction.extracted_data.total_credits;
      if (totalDeclaredAssets > posTurnover * 3 && totalDeclaredAssets > declaredIncome * 6) {
        flags.push({
          check: "Balance Sheet vs POS Activity",
          severity: "warning",
          finding: `Strong balance sheet (${app.currency || ""} ${totalDeclaredAssets.toLocaleString()}) but POS activity is relatively low. Declared assets may not reflect operational reality.`,
          declared_value: `${app.currency || ""} ${totalDeclaredAssets.toLocaleString()} (assets)`,
          evidence_value: `${app.currency || ""} ${posTurnover.toLocaleString()} (POS credits)`,
          source: "Balance Sheet vs POS",
        });
      }
    }
  }

  // ── 4. Bread Basket Plausibility ──
  if (breadBasketBreakdown) {
    const { monthly_income, total_essentials, margin_pct } = breadBasketBreakdown;

    // Extremely low essentials relative to income — suspicious
    if (margin_pct > 90 && monthly_income > 0) {
      flags.push({
        check: "Bread Basket Plausibility",
        severity: "warning",
        finding: `Reported essential expenses are only ${(100 - margin_pct).toFixed(1)}% of income. Household expenses appear unrealistically low — possible under-reporting of costs.`,
        declared_value: `${app.currency || ""} ${total_essentials.toLocaleString()} (essentials)`,
        evidence_value: `${app.currency || ""} ${monthly_income.toLocaleString()} (income)`,
        source: "Bread Basket Margin",
      });
    }

    // Zero rent declared but business is in formal premises
    const premisesType = extraData?.premises_type;
    if ((app.monthly_rent || 0) === 0 && premisesType && premisesType.includes("rented")) {
      flags.push({
        check: "Rent Consistency",
        severity: "warning",
        finding: `Zero rent declared but premises are listed as "${premisesType}". Expected non-zero rent expense.`,
        declared_value: "ZWL 0 (declared rent)",
        evidence_value: `Premises: ${premisesType}`,
        source: "Application vs Business Profile",
      });
    }
  }

  // ── 5. Business Years vs Stability Indicators ──
  const businessYears = borrower?.years_in_operation || parseFloat(extraData?.years_trading) || 0;
  if (businessYears > 5 && businessStability >= 0 && businessStability < 0.3) {
    flags.push({
      check: "Business Tenure vs Stability",
      severity: "warning",
      finding: `Claims ${businessYears} years in operation but business stability score is very low (${(businessStability * 100).toFixed(0)}%). Long-tenured businesses typically show stronger stability indicators.`,
      declared_value: `${businessYears} years`,
      evidence_value: `Stability: ${(businessStability * 100).toFixed(0)}%`,
      source: "Business Profile",
    });
  }

  // ── 6. Savings vs Income Consistency ──
  if (totalSavings > 0 && declaredIncome > 0) {
    const savingsToIncome = totalSavings / declaredIncome;
    // Very high savings relative to monthly income without corresponding high income stability
    if (savingsToIncome > 12 && incomeStats.has_history && incomeStats.cv > 0.5) {
      flags.push({
        check: "Savings vs Income Volatility",
        severity: "warning",
        finding: `High declared savings (${savingsToIncome.toFixed(0)}x monthly income) but income is highly volatile (CV: ${(incomeStats.cv * 100).toFixed(0)}%). Difficult to accumulate such savings with unstable income.`,
        declared_value: `${app.currency || ""} ${totalSavings.toLocaleString()} (savings)`,
        evidence_value: `Income CV: ${(incomeStats.cv * 100).toFixed(0)}%`,
        source: "Savings vs Income History",
      });
    }
  }

  // ── 7. Declared Expenses vs Dependents Plausibility ──
  if (app.dependents > 0 && declaredExpenses > 0 && declaredIncome > 0) {
    const expensePerDependent = declaredExpenses / (1 + app.dependents);
    // Extremely low per-person expenses in context
    if (expensePerDependent < declaredIncome * 0.03 && app.dependents >= 3) {
      flags.push({
        check: "Expenses vs Dependents",
        severity: "warning",
        finding: `${app.dependents} dependents declared but per-person expenses (${app.currency || ""} ${Math.round(expensePerDependent).toLocaleString()}) seem very low relative to income. Possible expense under-reporting.`,
        declared_value: `${app.dependents} dependents, ${app.currency || ""} ${declaredExpenses.toLocaleString()} total expenses`,
        evidence_value: `${app.currency || ""} ${Math.round(expensePerDependent).toLocaleString()} per person`,
        source: "Expense Analysis",
      });
    }
  }

  // ── 8. EcoCash / Mobile Money Cross-Check ──
  const ecocashExtraction = ocrExtractions.find((e: any) =>
    (e.document_type === "ecocash_statement" || e.document_type === "mobile_money") && e.extraction_status === "completed"
  );
  if (ecocashExtraction?.extracted_data && declaredIncome > 0) {
    const mobileIncome = ecocashExtraction.extracted_data.average_monthly_income || ecocashExtraction.extracted_data.total_credits || 0;
    if (mobileIncome > 0) {
      const gap = incomeGap(declaredIncome, mobileIncome);
      const deviation = gap.ratio;
      const severity = gapSeverity(gap, 0.6, 1.0);
      if (severity !== "info") {
        flags.push({
          check: "Income vs Mobile Money",
          severity,
          finding: `Declared income diverges from EcoCash/mobile money activity by ${(deviation * 100).toFixed(0)}%. ${
            gap.overstated ? "Lower mobile money activity than expected for declared income level." : "Higher mobile money activity suggests undeclared income."
          }`,
          declared_value: `${app.currency || ""} ${declaredIncome.toLocaleString()}`,
          evidence_value: `${app.currency || ""} ${mobileIncome.toLocaleString()} (Mobile Money)`,
          source: "EcoCash/Mobile Money Statement",
          deviation_pct: Math.round(deviation * 100),
        });
      } else {
        flags.push({
          check: "Income vs Mobile Money",
          severity: "info",
          finding: `Mobile money activity is consistent with declared income (${(deviation * 100).toFixed(0)}% deviation).`,
          declared_value: `${app.currency || ""} ${declaredIncome.toLocaleString()}`,
          evidence_value: `${app.currency || ""} ${mobileIncome.toLocaleString()} (Mobile Money)`,
          source: "EcoCash/Mobile Money Statement",
          deviation_pct: Math.round(deviation * 100),
        });
      }
    }
  }

  // ── 9. Cross-Source Income Triangulation ──
  // If we have 2+ income sources, check they're mutually consistent
  const incomeSources: { source: string; value: number }[] = [];
  if (declaredIncome > 0) incomeSources.push({ source: "Declared", value: declaredIncome });
  if (posExtraction?.extracted_data?.total_credits) {
    const pd = posExtraction.extracted_data;
    let posMonthly = pd.average_monthly_income || pd.total_credits;
    if (pd.statement_period?.start_date && pd.statement_period?.end_date) {
      const days = Math.max(1, Math.round((new Date(pd.statement_period.end_date).getTime() - new Date(pd.statement_period.start_date).getTime()) / 86400000) + 1);
      if (days < 30) posMonthly = Math.round((pd.total_credits / days) * 30);
    }
    incomeSources.push({ source: "POS", value: posMonthly });
  }
  if (bankExtraction?.extracted_data?.average_monthly_income) {
    incomeSources.push({ source: "Bank", value: bankExtraction.extracted_data.average_monthly_income });
  }
  if (ecocashExtraction?.extracted_data?.average_monthly_income) {
    incomeSources.push({ source: "Mobile Money", value: ecocashExtraction.extracted_data.average_monthly_income });
  }

  if (incomeSources.length >= 3) {
    const values = incomeSources.map(s => s.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const maxDev = Math.max(...values.map(v => Math.abs(v - mean) / mean));
    if (maxDev > 0.5) {
      flags.push({
        check: "Multi-Source Income Triangulation",
        severity: maxDev > 1.0 ? "critical" : "warning",
        finding: `Income reported across ${incomeSources.length} sources shows significant dispersion (max ${(maxDev * 100).toFixed(0)}% from mean). Sources: ${incomeSources.map(s => `${s.source}: ${app.currency || ""} ${s.value.toLocaleString()}`).join(", ")}. Investigate root cause.`,
        declared_value: incomeSources.map(s => `${s.source}: ${s.value.toLocaleString()}`).join(", "),
        evidence_value: `Mean: ${app.currency || ""} ${Math.round(mean).toLocaleString()}`,
        source: "Cross-Source Analysis",
        deviation_pct: Math.round(maxDev * 100),
      });
    } else {
      flags.push({
        check: "Multi-Source Income Triangulation",
        severity: "info",
        finding: `Income is consistent across ${incomeSources.length} independent sources (max ${(maxDev * 100).toFixed(0)}% deviation). Strong data corroboration.`,
        declared_value: incomeSources.map(s => `${s.source}: ${s.value.toLocaleString()}`).join(", "),
        evidence_value: `Mean: ${app.currency || ""} ${Math.round(mean).toLocaleString()}`,
        source: "Cross-Source Analysis",
        deviation_pct: Math.round(maxDev * 100),
      });
    }
  }

  // ── Compute overall consistency score ──
  const criticalCount = flags.filter(f => f.severity === "critical").length;
  const warningCount = flags.filter(f => f.severity === "warning").length;
  const infoCount = flags.filter(f => f.severity === "info").length;
  const consistencyScore = Math.max(0, Math.min(100,
    100 - (criticalCount * 30) - (warningCount * 12) + (infoCount * 3)
  ));


  return { flags, consistency_score: consistencyScore };
}

// ──────────────────────────────────────────────────────────────
// Main scorecard computation (v2.1 — category-aware)
// ──────────────────────────────────────────────────────────────

interface ScorecardInput {
  app: any;
  borrower: any;
  paymentHistory: PaymentRecord[];
  incomeHistory: IncomeRecord[];
}

export function runScorecard(input: ScorecardInput) {
  const { app, borrower, paymentHistory, incomeHistory } = input;
  const category = app.product_category || "retail";
  const extraData = borrower?.extra_data || {};

  // Determine if bureau score is available
  const hasBureauScore = app.bureau_score !== null && app.bureau_score !== undefined;
  const bureauScore = hasBureauScore ? app.bureau_score : null;

  // Select category-specific weight scheme
  const FEATURE_WEIGHTS = getWeightScheme(category, hasBureauScore);

  // 1. Extract raw features
  const monthlyIncome = app.monthly_income || app.monthly_revenue || 0;
  const monthlyExpenses = (app.monthly_expenses || 0) + (app.monthly_rent || 0);
  const requestedAmount = app.requested_amount || 0;
  const tenorMonths = app.tenor_months || 12;
  const age = calculateAge(borrower?.date_of_birth);
  const existingLoanCount = countExistingLoans(app.existing_loans);
  const dependents = app.dependents || 0;
  const businessYears = borrower?.years_in_operation || parseFloat(extraData?.years_trading) || 0;
  const hasCollateral = !!(app.collateral && app.collateral.toLowerCase() !== "none" && app.collateral.trim() !== "");

  // 2. Compute derived features
  const dti = monthlyIncome > 0 ? monthlyExpenses / monthlyIncome : 0.9;
  const loanToIncome = monthlyIncome > 0 ? requestedAmount / (monthlyIncome * tenorMonths) : 8;

  // Savings ratio — for micro, include mukando contributions
  let savingsBase = monthlyIncome - monthlyExpenses;
  const mukandoAmount = parseFloat(extraData?.mukando_amount) || 0;
  if (category === "micro" && mukandoAmount > 0) savingsBase += mukandoAmount;
  const savingsRatio = monthlyIncome > 0 ? savingsBase / monthlyIncome : -0.1;

  // 3. Time-series features
  const paymentStats = computePaymentHistoryScore(paymentHistory);
  const incomeStats = computeIncomeStability(incomeHistory);

  // 4. New v2.0 features
  const businessStability = computeBusinessStability(borrower, extraData);
  const cashflowVol = computeCashflowVolatility(extraData);
  const socialScore = computeSocialMediaScore(extraData);
  const concRisk = computeConcentrationRisk(extraData);
  const dscrValue = computeDSCR(extraData);
  const forexExp = computeForexExposure(extraData, app);
  const breadBasket = computeBreadBasketMargin(extraData, app);

  // 5. Find WoE bins for each feature
  const featureValues: Record<string, { value: number | null; bin: WoEBin; woe: number }> = {};

  const binAndStore = (key: string, value: number | null) => {
    const bins = WOE_BINS[key];
    if (bins) {
      const bin = findBin(bins, value);
      featureValues[key] = { value, bin, woe: bin.woe };
    }
  };

  if (bureauScore !== null) binAndStore("bureau_score", bureauScore);

  binAndStore("debt_to_income", dti);
  binAndStore("age", age);
  binAndStore("loan_to_income", loanToIncome);
  binAndStore("existing_loan_count", existingLoanCount);
  binAndStore("dependents", dependents);
  binAndStore("payment_history_score", paymentStats.has_history ? paymentStats.score : -0.5);
  binAndStore("income_stability_cv", incomeStats.has_history ? incomeStats.cv : -0.5);
  if (category === "micro" || category === "sme") binAndStore("business_years", businessYears);
  binAndStore("savings_ratio", savingsRatio);
  binAndStore("bread_basket_margin", breadBasket.margin);

  // Category-specific features
  if (category === "micro" || category === "sme") {
    binAndStore("business_stability_score", businessStability);
    binAndStore("cashflow_volatility", cashflowVol);
  }
  if (category === "sme") {
    binAndStore("social_media_score", socialScore);
    binAndStore("concentration_risk", concRisk);
    binAndStore("dscr", dscrValue);
    binAndStore("forex_exposure", forexExp);
  }

  // Psychometric score (all categories)
  const psychScore = parseFloat(extraData?.psychometric_score);
  binAndStore("psychometric_score", !isNaN(psychScore) && psychScore > 0 ? psychScore / 100 : -0.5);

  let logOdds = -MODEL_COEFFICIENTS.intercept;
  const contributions: Record<string, number> = {};

  for (const [key, fv] of Object.entries(featureValues)) {
    const coeff = MODEL_COEFFICIENTS[key as keyof typeof MODEL_COEFFICIENTS] || 0;
    const contribution = -coeff * fv.woe;
    logOdds += contribution;
    contributions[key] = contribution;
  }

  // Collateral adjustment
  if (hasCollateral) {
    const collateralContrib = -MODEL_COEFFICIENTS.collateral_flag * (-0.5);
    logOdds += collateralContrib;
    contributions["collateral_flag"] = collateralContrib;
  } else {
    contributions["collateral_flag"] = 0;
  }

  // 7. Convert to score
  const finalScore = Math.max(SCORE_RANGE.min, Math.min(SCORE_RANGE.max, logOddsToScore(logOdds)));
  const pd = sigmoid(MODEL_COEFFICIENTS.intercept +
    Object.entries(featureValues).reduce((s, [key, fv]) => {
      const coeff = MODEL_COEFFICIENTS[key as keyof typeof MODEL_COEFFICIENTS] || 0;
      return s + coeff * fv.woe;
    }, 0) +
    (hasCollateral ? MODEL_COEFFICIENTS.collateral_flag * (-0.5) : 0)
  );

  const scoreBand = scoreToBand(finalScore);
  const recommendation = scoreToRecommendation(finalScore);

  // 8. Build factor breakdown for UI
  // "No Data" / "No History" bins should NOT show inflated UI scores — cap at neutral (50)
  const NO_DATA_BIN_LABELS = ["no history", "unknown", "no data", "no bureau data", "no presence", "no assessment"];
  const factors = Object.entries(FEATURE_WEIGHTS).map(([key, fw]) => {
    const fv = featureValues[key];
    const contrib = contributions[key] || 0;
    let normalizedScore = Math.max(0, Math.min(100, 50 + contrib * 30));

    // If the feature landed in a "no data" bin, the UI score should reflect uncertainty
    // not a falsely positive/negative number driven by coefficient sign quirks
    if (fv && NO_DATA_BIN_LABELS.some(label => fv.bin.label.toLowerCase().includes(label))) {
      normalizedScore = Math.min(normalizedScore, 50); // cap at neutral — absence of data is NOT a strength
    }

    // Build human-readable description
    let description: string;
    if (fv) {
      const isNoData = NO_DATA_BIN_LABELS.some(label => fv.bin.label.toLowerCase().includes(label));
      const valueStr = typeof fv.value === "number" && fv.value % 1 !== 0
        ? (fv.value * 100).toFixed(1) + "%"
        : String(fv.value);
      description = isNoData
        ? `${fv.bin.label} — insufficient data to assess`
        : `Value: ${valueStr} → Bin: ${fv.bin.label} (WoE: ${fv.woe.toFixed(2)})`;
    } else if (key === "collateral_flag") {
      description = hasCollateral ? "Collateral provided — risk mitigant applied" : "No collateral — higher risk exposure";
    } else if (key === "bureau_score") {
      description = "No bureau data available — not factored into score";
    } else {
      description = "Data not available";
    }

    return {
      name: fw.name,
      weight: fw.weight,
      score: Math.round(normalizedScore),
      description,
    };
  });

  // 8. Generate reason codes
  const sortedContribs = Object.entries(contributions)
    .map(([key, contrib]) => ({ key, contrib, name: FEATURE_WEIGHTS[key]?.name || key }))
    .sort((a, b) => a.contrib - b.contrib);

  const reasonCodes = sortedContribs.slice(0, 5).map((c, i) => ({
    code: `RC${String(i + 1).padStart(2, "0")}`,
    description: c.contrib < -0.1
      ? `${c.name}: Negative impact on score (contribution: ${(c.contrib * FACTOR).toFixed(0)} points)`
      : c.contrib > 0.1
        ? `${c.name}: Positive impact on score (contribution: +${(c.contrib * FACTOR).toFixed(0)} points)`
        : `${c.name}: Neutral impact on score`,
    impact: (c.contrib < -0.1 ? "negative" : c.contrib > 0.1 ? "positive" : "neutral") as "positive" | "negative" | "neutral",
  }));

  const positiveContribs = sortedContribs.filter(c => c.contrib > 0.1).sort((a, b) => b.contrib - a.contrib);
  for (const c of positiveContribs.slice(0, 3)) {
    if (!reasonCodes.find(rc => rc.description.startsWith(c.name))) {
      reasonCodes.push({
        code: `RC${String(reasonCodes.length + 1).padStart(2, "0")}`,
        description: `${c.name}: Positive impact on score (contribution: +${(c.contrib * FACTOR).toFixed(0)} points)`,
        impact: "positive",
      });
    }
  }

  // 9. Build summary
  const topNeg = sortedContribs.filter(c => c.contrib < -0.1).slice(0, 2).map(c => c.name);
  const topPos = sortedContribs.filter(c => c.contrib > 0.1).sort((a, b) => b.contrib - a.contrib).slice(0, 2).map(c => c.name);

  let summary = `Category-aware scorecard ${MODEL_VERSION} (${category}) produced a score of ${finalScore} (${scoreBand}), indicating a ${(pd * 100).toFixed(1)}% estimated probability of default. `;
  if (hasBureauScore) {
    summary += `Credit Bureau score of ${bureauScore} was included in the score. `;
  } else {
    summary += `No Credit Bureau score was available — scoring relied on application and behavioral data only. `;
  }
  if (topPos.length > 0) summary += `Key strengths: ${topPos.join(", ")}. `;
  if (topNeg.length > 0) summary += `Key risks: ${topNeg.join(", ")}. `;
  if (paymentStats.has_history) {
    summary += `Payment history trend: ${paymentStats.trend} (${(paymentStats.on_time_pct * 100).toFixed(0)}% on-time). `;
  } else {
    summary += `No prior payment history available — new-to-credit risk applied. `;
  }
  if (incomeStats.has_history) {
    summary += `Income trend: ${incomeStats.trend} over ${incomeStats.months_of_data} months (CV: ${(incomeStats.cv * 100).toFixed(1)}%).`;
  }

  // 10. WoE details for detailed view
  const woeDetails = Object.entries(featureValues).map(([key, fv]) => ({
    feature: FEATURE_WEIGHTS[key]?.name || key,
    raw_value: fv.value,
    bin: fv.bin.label,
    woe: fv.woe,
    event_rate: fv.bin.event_rate,
    coefficient: MODEL_COEFFICIENTS[key as keyof typeof MODEL_COEFFICIENTS] || 0,
    points_contribution: Math.round((contributions[key] || 0) * FACTOR),
  }));

  return {
    score: finalScore,
    score_band: scoreBand,
    probability_of_default: Math.round(pd * 10000) / 10000,
    recommendation,
    reason_codes: reasonCodes,
    factors,
    summary,
    model_version: `${MODEL_VERSION}-${category}-woe-lr${hasBureauScore ? "-bureau" : ""}`,
    woe_details: woeDetails,
    time_series_features: {
      payment_history: paymentStats,
      income_stability: incomeStats,
    },
    base_score: BASE_SCORE,
    scaling: { pdo: PDO, base_odds: BASE_ODDS, factor: FACTOR, offset: OFFSET },
    bureau_score_used: hasBureauScore,
    bread_basket: breadBasket.breakdown,
  };
}
