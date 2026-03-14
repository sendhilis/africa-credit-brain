import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ──────────────────────────────────────────────────────────────
// SCORECARD MODEL v2.0 — Category-Aware WoE/IV Logistic Regression
// Three distinct weight schemes: Individual (retail), Micro, SME
// Enhanced features: business_stability, cashflow_volatility, social_media_score
// Calibrated for African markets with deep Zimbabwe context
// ──────────────────────────────────────────────────────────────

// Scaling parameters (standard scorecard alignment)
const BASE_SCORE = 600;
const BASE_ODDS = 50;
const PDO = 20;
const FACTOR = PDO / Math.LN2;
const OFFSET = BASE_SCORE - FACTOR * Math.log(BASE_ODDS);

// Model coefficients (β weights from logistic regression)
// v2.0: category-specific coefficients + new features
const MODEL_COEFFICIENTS = {
  intercept: -1.8,
  bureau_score: -1.50,
  debt_to_income: 0.85,
  age: -0.42,
  loan_to_income: 0.65,
  existing_loan_count: 0.38,
  dependents: 0.15,
  employment_stability: -0.55,
  payment_history_score: -1.2,
  income_stability_cv: 0.72,
  collateral_flag: -0.35,
  business_years: -0.28,
  savings_ratio: -0.48,
  // New v2.0 features
  business_stability_score: -0.65, // premises, licenses, staff retention
  cashflow_volatility: 0.58,       // revenue high/low ratio, seasonality
  social_media_score: -0.32,       // digital footprint strength
  concentration_risk: 0.42,        // customer/supplier concentration
  dscr: -0.55,                     // debt service coverage ratio
  forex_exposure: 0.28,            // multi-currency risk (Zim-specific)
  psychometric_score: -0.45,       // behavioural assessment (financial discipline, risk, conscientiousness, locus of control)
  bread_basket_margin: -0.52,     // disposable surplus after essential household expenses
};

// WoE bins for each feature
interface WoEBin {
  label: string;
  min: number;
  max: number;
  woe: number;
  event_rate: number;
}

const WOE_BINS: Record<string, WoEBin[]> = {
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
  bureau_score:                { name: "Credit Bureau Score", weight: 17 },
  payment_history_score:       { name: "Repayment History", weight: 15 },
  business_stability_score:    { name: "Business Stability", weight: 13 },
  psychometric_score:          { name: "Psychometric Assessment", weight: 12 },
  cashflow_volatility:         { name: "Cash Flow Volatility", weight: 10 },
  income_stability_cv:         { name: "Income Stability", weight: 7 },
  debt_to_income:              { name: "Debt-to-Income Ratio", weight: 6 },
  business_years:              { name: "Years Trading", weight: 5 },
  savings_ratio:               { name: "Savings (incl. Mukando)", weight: 5 },
  loan_to_income:              { name: "Loan-to-Income Ratio", weight: 4 },
  collateral_flag:             { name: "Collateral", weight: 3 },
  existing_loan_count:         { name: "Existing Obligations", weight: 3 },
};

const WEIGHTS_MICRO_NO_BUREAU: Record<string, { name: string; weight: number }> = {
  payment_history_score:       { name: "Repayment History", weight: 18 },
  business_stability_score:    { name: "Business Stability", weight: 15 },
  psychometric_score:          { name: "Psychometric Assessment", weight: 15 },
  cashflow_volatility:         { name: "Cash Flow Volatility", weight: 12 },
  income_stability_cv:         { name: "Income Stability", weight: 9 },
  debt_to_income:              { name: "Debt-to-Income Ratio", weight: 7 },
  business_years:              { name: "Years Trading", weight: 7 },
  savings_ratio:               { name: "Savings (incl. Mukando)", weight: 6 },
  loan_to_income:              { name: "Loan-to-Income Ratio", weight: 4 },
  collateral_flag:             { name: "Collateral", weight: 4 },
  existing_loan_count:         { name: "Existing Obligations", weight: 3 },
};

// SME — focus on financial analysis, cash flow volatility, concentration, social media
const WEIGHTS_SME_BUREAU: Record<string, { name: string; weight: number }> = {
  bureau_score:                { name: "Credit Bureau Score", weight: 13 },
  cashflow_volatility:         { name: "Cash Flow Volatility", weight: 14 },
  payment_history_score:       { name: "Repayment History", weight: 11 },
  dscr:                        { name: "Debt Service Coverage", weight: 10 },
  business_stability_score:    { name: "Business Stability", weight: 9 },
  psychometric_score:          { name: "Psychometric Assessment", weight: 8 },
  concentration_risk:          { name: "Concentration Risk", weight: 7 },
  income_stability_cv:         { name: "Revenue Stability", weight: 6 },
  social_media_score:          { name: "Digital Footprint", weight: 5 },
  business_years:              { name: "Business Tenure", weight: 5 },
  forex_exposure:              { name: "Forex Exposure", weight: 4 },
  debt_to_income:              { name: "Leverage Ratio", weight: 4 },
  collateral_flag:             { name: "Collateral", weight: 2 },
  savings_ratio:               { name: "Liquidity Buffer", weight: 2 },
};

const WEIGHTS_SME_NO_BUREAU: Record<string, { name: string; weight: number }> = {
  cashflow_volatility:         { name: "Cash Flow Volatility", weight: 16 },
  payment_history_score:       { name: "Repayment History", weight: 13 },
  dscr:                        { name: "Debt Service Coverage", weight: 11 },
  business_stability_score:    { name: "Business Stability", weight: 11 },
  psychometric_score:          { name: "Psychometric Assessment", weight: 10 },
  concentration_risk:          { name: "Concentration Risk", weight: 8 },
  income_stability_cv:         { name: "Revenue Stability", weight: 7 },
  social_media_score:          { name: "Digital Footprint", weight: 5 },
  business_years:              { name: "Business Tenure", weight: 5 },
  forex_exposure:              { name: "Forex Exposure", weight: 5 },
  debt_to_income:              { name: "Leverage Ratio", weight: 4 },
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

function findBin(bins: WoEBin[], value: number): WoEBin {
  for (const bin of bins) {
    if (value >= bin.min && value <= bin.max) return bin;
  }
  return bins[bins.length - 1];
}

function calculateAge(dob: string | null): number {
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

function scoreToBand(score: number): string {
  if (score >= 800) return "Excellent";
  if (score >= 740) return "Very Good";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  if (score >= 500) return "Poor";
  return "Very Poor";
}

function scoreToRecommendation(score: number): string {
  if (score >= 670) return "approve";
  if (score >= 540) return "review";
  return "decline";
}

// ──────────────────────────────────────────────────────────────
// Time-series feature extraction
// ──────────────────────────────────────────────────────────────

interface PaymentRecord {
  status: string;
  days_past_due: number;
  amount_due: number;
  amount_paid: number;
  due_date: string;
}

interface IncomeRecord {
  income_amount: number;
  period_start: string;
  period_end: string;
}

function computePaymentHistoryScore(payments: PaymentRecord[]): {
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

function computeIncomeStability(incomes: IncomeRecord[]): {
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

function computeBusinessStability(borrower: any, extraData: any): number {
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
    console.log(`Business stability boosted by POS data: credits=${extraData._pos_total_credits}, conf=${confidence}`);
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
      console.log(`Cash flow volatility moderated by POS data: ${vol.toFixed(2)} (reduced by ${posModeration.toFixed(2)})`);
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

// ──────────────────────────────────────────────────────────────
// Main scorecard computation (v2.0 — category-aware)
// ──────────────────────────────────────────────────────────────

interface ScorecardInput {
  app: any;
  borrower: any;
  paymentHistory: PaymentRecord[];
  incomeHistory: IncomeRecord[];
}

function runScorecard(input: ScorecardInput) {
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

  // 5. Find WoE bins for each feature
  const featureValues: Record<string, { value: number; bin: WoEBin; woe: number }> = {};

  const binAndStore = (key: string, value: number) => {
    const bins = WOE_BINS[key];
    if (bins) {
      const bin = findBin(bins, value);
      featureValues[key] = { value, bin, woe: bin.woe };
    }
  };

  if (hasBureauScore) binAndStore("bureau_score", bureauScore!);

  binAndStore("debt_to_income", dti);
  binAndStore("age", age);
  binAndStore("loan_to_income", loanToIncome);
  binAndStore("existing_loan_count", existingLoanCount);
  binAndStore("dependents", dependents);
  binAndStore("payment_history_score", paymentStats.has_history ? paymentStats.score : -0.5);
  binAndStore("income_stability_cv", incomeStats.has_history ? incomeStats.cv : -0.5);
  binAndStore("business_years", category !== "retail" ? businessYears : 5);
  binAndStore("savings_ratio", savingsRatio);

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
  const finalScore = Math.max(300, Math.min(900, logOddsToScore(logOdds)));
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

  let summary = `Category-aware scorecard v2.0 (${category}) produced a score of ${finalScore} (${scoreBand}), indicating a ${(pd * 100).toFixed(1)}% estimated probability of default. `;
  if (hasBureauScore) {
    summary += `Credit Bureau score of ${bureauScore} was factored in as the primary input (30% weight). `;
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
    model_version: `v2.0-${category}-woe-lr${hasBureauScore ? "-bureau" : ""}`,
    woe_details: woeDetails,
    time_series_features: {
      payment_history: paymentStats,
      income_stability: incomeStats,
    },
    base_score: BASE_SCORE,
    scaling: { pdo: PDO, base_odds: BASE_ODDS, factor: FACTOR, offset: OFFSET },
    bureau_score_used: hasBureauScore,
  };
}

// ──────────────────────────────────────────────────────────────
// Edge function handler
// ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { application_id } = await req.json();
    if (!application_id) throw new Error("application_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch application with borrower
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("*, borrower:borrowers!applications_borrower_id_fkey(*)")
      .eq("id", application_id)
      .single();

    if (appErr || !app) throw new Error(appErr?.message || "Application not found");

    const borrower = app.borrower;

    // Fetch time-series data and OCR extractions in parallel
    const [paymentRes, incomeRes, ocrRes] = await Promise.all([
      supabase
        .from("payment_history")
        .select("status, days_past_due, amount_due, amount_paid, due_date")
        .eq("borrower_id", app.borrower_id)
        .order("due_date", { ascending: true }),
      supabase
        .from("income_history")
        .select("income_amount, period_start, period_end")
        .eq("borrower_id", app.borrower_id)
        .order("period_start", { ascending: true }),
      supabase
        .from("document_extractions")
        .select("document_type, extracted_data, extraction_status, confidence_score")
        .eq("application_id", application_id)
        .eq("extraction_status", "completed"),
    ]);

    // Enrich application data with OCR extractions before scoring
    const ocrExtractions = ocrRes.data || [];
    const bankExtraction = ocrExtractions.find((e: any) => e.document_type === "bank_statement");
    const posExtraction = ocrExtractions.find((e: any) => e.document_type === "pos_statement");
    const financialExtraction = ocrExtractions.find((e: any) => e.document_type === "financial_statement");

    // Track which OCR source provided income data
    let ocrIncomeSource: string | null = null;

    if (bankExtraction?.extracted_data) {
      const bd = bankExtraction.extracted_data;
      if (bd.average_monthly_income && (!app.monthly_income || bankExtraction.confidence_score > 0.7)) {
        app.monthly_income = bd.average_monthly_income;
        ocrIncomeSource = "bank_statement";
      }
      if (bd.average_monthly_expenses && (!app.monthly_expenses || bankExtraction.confidence_score > 0.7)) {
        app.monthly_expenses = bd.average_monthly_expenses;
      }

      // Enrich income history from OCR salary deposits
      const existingIncomeCount = (incomeRes.data || []).length;
      if (bd.salary_deposits?.length > 0 && existingIncomeCount < 3) {
        const ocrIncomeRecords: IncomeRecord[] = bd.salary_deposits.map((dep: any) => ({
          income_amount: dep.amount,
          period_start: dep.date,
          period_end: dep.date,
        }));
        if (incomeRes.data) {
          incomeRes.data.push(...ocrIncomeRecords);
        } else {
          (incomeRes as any).data = ocrIncomeRecords;
        }
        console.log(`Enriched income history with ${ocrIncomeRecords.length} OCR salary deposits`);
      }

      if (bd.statement_period) {
        console.log(`Bank statement period: ${bd.statement_period.start_date} to ${bd.statement_period.end_date}`);
      }
    }

    // ── POS / Till Statement enrichment ──
    // For cash-based traders without bank statements, POS data is the primary income signal
    if (posExtraction?.extracted_data && posExtraction.confidence_score >= 0.5) {
      const pd = posExtraction.extracted_data;
      console.log(`POS extraction found: total_credits=${pd.total_credits}, avg_monthly_income=${pd.average_monthly_income}`);

      // ── Normalize POS income by statement period length ──
      // A single-day POS snapshot should NOT be treated as monthly income
      let posPeriodDays = 30; // default assumption
      let periodConfidenceDiscount = 1.0;
      if (pd.statement_period?.start_date && pd.statement_period?.end_date) {
        const start = new Date(pd.statement_period.start_date);
        const end = new Date(pd.statement_period.end_date);
        posPeriodDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        console.log(`POS statement covers ${posPeriodDays} day(s): ${pd.statement_period.start_date} → ${pd.statement_period.end_date}`);
      }

      // Apply confidence discount based on data window:
      //   30+ days → full confidence (1.0)
      //   7-29 days → proportional (days/30)
      //   1-6 days → heavy discount (days/30 * 0.5) — single-day extrapolation is unreliable
      if (posPeriodDays >= 30) {
        periodConfidenceDiscount = 1.0;
      } else if (posPeriodDays >= 7) {
        periodConfidenceDiscount = posPeriodDays / 30;
      } else {
        periodConfidenceDiscount = (posPeriodDays / 30) * 0.5;
      }
      console.log(`POS period confidence discount: ${periodConfidenceDiscount.toFixed(3)} (${posPeriodDays} days)`);

      // Extrapolate to monthly: (total_credits / days) * 30, then apply discount
      const rawPosIncome = pd.total_credits || pd.average_monthly_income || 0;
      let normalizedMonthlyIncome: number;
      if (posPeriodDays < 30 && pd.total_credits) {
        // Extrapolate daily rate to monthly, then discount for uncertainty
        const dailyRate = pd.total_credits / posPeriodDays;
        normalizedMonthlyIncome = Math.round(dailyRate * 30 * periodConfidenceDiscount);
        console.log(`POS income normalized: daily=${dailyRate.toFixed(0)} × 30 × ${periodConfidenceDiscount.toFixed(3)} = ${normalizedMonthlyIncome}`);
      } else {
        normalizedMonthlyIncome = Math.round(rawPosIncome * periodConfidenceDiscount);
      }

      if (normalizedMonthlyIncome > 0 && !ocrIncomeSource) {
        if (!app.monthly_income || app.monthly_income === 0) {
          app.monthly_income = normalizedMonthlyIncome;
          ocrIncomeSource = "pos_statement";
          console.log(`Set monthly_income from POS (normalized): ${normalizedMonthlyIncome} (raw: ${rawPosIncome})`);
        }
        if (!app.monthly_revenue || app.monthly_revenue === 0) {
          app.monthly_revenue = normalizedMonthlyIncome;
        }
      }

      // POS expenses — also normalize by period
      const rawPosExpenses = pd.total_debits || pd.average_monthly_expenses || 0;
      if (rawPosExpenses > 0 && (!app.monthly_expenses || app.monthly_expenses === 0)) {
        const normalizedExpenses = posPeriodDays < 30
          ? Math.round((rawPosExpenses / posPeriodDays) * 30 * periodConfidenceDiscount)
          : Math.round(rawPosExpenses * periodConfidenceDiscount);
        app.monthly_expenses = normalizedExpenses;
      }

      // Enrich borrower extra_data with POS-derived business signals
      const extraData = borrower?.extra_data || {};

      if (pd.total_credits > 0) {
        extraData._pos_total_credits = pd.total_credits;
        extraData._pos_confidence = posExtraction.confidence_score * periodConfidenceDiscount;
        extraData._pos_has_data = true;
        extraData._pos_period_days = posPeriodDays;
        extraData._pos_period_discount = periodConfidenceDiscount;
      }

      if (pd.transaction_count && pd.transaction_count > 5) {
        extraData._pos_transaction_count = pd.transaction_count;
      }

      if (borrower) {
        borrower.extra_data = extraData;
      }
    }

    if (financialExtraction?.extracted_data) {
      const fd = financialExtraction.extracted_data;
      if (fd.monthly_revenue_estimate && !app.monthly_revenue) {
        app.monthly_revenue = fd.monthly_revenue_estimate;
      }
    }

    console.log(`Pre-scoring: monthly_income=${app.monthly_income}, monthly_revenue=${app.monthly_revenue}, monthly_expenses=${app.monthly_expenses}, source=${ocrIncomeSource}`);

    // Run the scorecard
    const result = runScorecard({
      app,
      borrower,
      paymentHistory: (paymentRes.data || []) as PaymentRecord[],
      incomeHistory: (incomeRes.data || []) as IncomeRecord[],
    });

    // ── AI Insights Layer ──────────────────────────────────────
    let aiInsights = null;
    try {
      const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
      const bureauContext = app.bureau_score !== null
        ? `- Credit Bureau Score: ${app.bureau_score} (PRIMARY weight: 30%)`
        : `- Credit Bureau Score: NOT AVAILABLE (scoring relied on application data only)`;

      const aiPrompt = `You are a senior credit risk analyst reviewing a statistical scorecard output for an African lending market application. Provide qualitative insights that the model cannot capture.

SCORECARD OUTPUT:
- Final Score: ${result.score} (${result.score_band})
- Probability of Default: ${(result.probability_of_default * 100).toFixed(1)}%
- Recommendation: ${result.recommendation}
- Model Version: ${result.model_version}
${bureauContext}

FACTOR CONTRIBUTIONS:
${result.woe_details.map((w: any) => `- ${w.feature}: Raw=${w.raw_value}, Bin="${w.bin}", WoE=${w.woe}, Points=${w.points_contribution}`).join("\n")}

TIME-SERIES:
- Payment History: ${JSON.stringify(result.time_series_features.payment_history)}
- Income Stability: ${JSON.stringify(result.time_series_features.income_stability)}

APPLICATION CONTEXT:
- Country: ${app.country}, Product: ${app.product_category}/${app.product_type || "N/A"}
- Loan: ${app.requested_amount} ${app.currency || ""} over ${app.tenor_months} months
- Purpose: ${app.purpose || "N/A"}
- Collateral: ${app.collateral || "None"}
- Borrower: ${borrower?.full_name}, Age: ${borrower?.date_of_birth || "N/A"}, Gender: ${borrower?.gender || "N/A"}
${app.product_category !== "retail" ? `- Business: ${borrower?.business_name || "N/A"}, Sector: ${borrower?.sector || "N/A"}, Years: ${borrower?.years_in_operation || "N/A"}` : ""}

OCR DOCUMENT EXTRACTIONS:
${ocrExtractions.length > 0 ? ocrExtractions.map((e: any) => `- ${e.document_type}: ${JSON.stringify(e.extracted_data)}`).join("\n") : "No OCR extractions available"}

Use the provide_insights tool to return your analysis.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a senior credit risk analyst. Analyze the statistical scorecard output and provide actionable insights on factors the model may miss. Be specific and data-driven." },
            { role: "user", content: aiPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "provide_insights",
              description: "Return structured AI insights on the credit score",
              parameters: {
                type: "object",
                properties: {
                  score_adjustment: {
                    type: "object",
                    properties: {
                      direction: { type: "string", enum: ["increase", "decrease", "maintain"] },
                      magnitude: { type: "string", enum: ["minor", "moderate", "significant"] },
                      adjusted_score: { type: "integer", description: "Suggested adjusted score (300-900)" },
                      rationale: { type: "string", description: "Why the score should be adjusted" },
                    },
                    required: ["direction", "magnitude", "adjusted_score", "rationale"],
                    additionalProperties: false,
                  },
                  risk_flags: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        flag: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high"] },
                        detail: { type: "string" },
                      },
                      required: ["flag", "severity", "detail"],
                      additionalProperties: false,
                    },
                  },
                  mitigants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        factor: { type: "string" },
                        detail: { type: "string" },
                      },
                      required: ["factor", "detail"],
                      additionalProperties: false,
                    },
                  },
                  data_gaps: {
                    type: "array",
                    items: { type: "string" },
                    description: "Missing data that could improve scoring accuracy",
                  },
                  narrative: {
                    type: "string",
                    description: "2-4 sentence expert narrative summarizing the AI analysis",
                  },
                },
                required: ["score_adjustment", "risk_flags", "mitigants", "data_gaps", "narrative"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "provide_insights" } },
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          aiInsights = JSON.parse(toolCall.function.arguments);
        }
      } else {
        const errStatus = aiResponse.status;
        console.error("AI insights error:", errStatus);
        if (errStatus === 429 || errStatus === 402) {
          aiInsights = { error: errStatus === 429 ? "Rate limited" : "Credits exhausted", narrative: "AI insights unavailable due to rate limiting. Scorecard results are unaffected." };
        }
      }
    } catch (aiErr) {
      console.error("AI insights failed (non-blocking):", aiErr);
      aiInsights = { error: "AI analysis unavailable", narrative: "AI insights could not be generated. The statistical scorecard score remains valid." };
    }

    // Save results to both applications and scorecard_results
    const [updateRes, insertRes] = await Promise.all([
      supabase
        .from("applications")
        .update({
          score: result.score,
          score_band: result.score_band,
          probability_of_default: result.probability_of_default,
          reason_codes: result.reason_codes,
          scored_at: new Date().toISOString(),
          status: app.status === "submitted" ? "review" : app.status,
        })
        .eq("id", application_id),
      supabase
        .from("scorecard_results")
        .insert({
          application_id,
          model_version: result.model_version,
          base_score: result.base_score,
          final_score: result.score,
          probability_of_default: result.probability_of_default,
          score_band: result.score_band,
          recommendation: result.recommendation,
          feature_contributions: result.factors,
          woe_details: result.woe_details,
          time_series_features: result.time_series_features,
          summary: result.summary,
          ai_insights: aiInsights,
        }),
    ]);

    if (updateRes.error) throw updateRes.error;
    if (insertRes.error) console.error("Scorecard result insert error:", insertRes.error);

    return new Response(JSON.stringify({ success: true, ...result, ai_insights: aiInsights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-application error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
