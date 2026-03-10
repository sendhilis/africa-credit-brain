// Shared model constants & WoE bin data for the score simulator

export const SCORING_PARAMS = {
  baseScore: 600,
  baseOdds: 50,
  pdo: 20,
  intercept: 4.80,
};

export interface SimFeature {
  key: string;
  label: string;
  beta: number;
  bins: { label: string; woe: number }[];
}

export const SIM_FEATURES: SimFeature[] = [
  {
    key: "bureau_score",
    label: "Credit Bureau Score",
    beta: -1.50,
    bins: [
      { label: "Excellent (750+)", woe: -1.45 },
      { label: "Good (700-749)", woe: -0.85 },
      { label: "Fair (650-699)", woe: -0.25 },
      { label: "Below Average (600-649)", woe: 0.35 },
      { label: "Poor (500-599)", woe: 0.82 },
      { label: "Very Poor (<500)", woe: 1.55 },
      { label: "No Bureau Data", woe: 0.05 },
    ],
  },
  {
    key: "payment_history_score",
    label: "Payment History",
    beta: -1.20,
    bins: [
      { label: "Excellent (>95%)", woe: -1.35 },
      { label: "Good (80-95%)", woe: -0.62 },
      { label: "Fair (60-80%)", woe: 0.18 },
      { label: "Poor (40-60%)", woe: 0.75 },
      { label: "Very Poor (<40%)", woe: 1.42 },
      { label: "No History", woe: 0.35 },
    ],
  },
  {
    key: "debt_to_income",
    label: "Debt-to-Income Ratio",
    beta: -0.85,
    bins: [
      { label: "≤ 20%", woe: -0.85 },
      { label: "20-40%", woe: -0.32 },
      { label: "40-60%", woe: 0.25 },
      { label: "60-80%", woe: 0.78 },
      { label: "> 80%", woe: 1.45 },
    ],
  },
  {
    key: "income_stability_cv",
    label: "Income Stability (CV)",
    beta: -0.72,
    bins: [
      { label: "Very Stable (CV<10%)", woe: -0.82 },
      { label: "Stable (10-25%)", woe: -0.28 },
      { label: "Moderate (25-50%)", woe: 0.32 },
      { label: "Volatile (>50%)", woe: 0.95 },
      { label: "Unknown", woe: 0.15 },
    ],
  },
  {
    key: "loan_to_income",
    label: "Loan-to-Income Ratio",
    beta: -0.65,
    bins: [
      { label: "≤ 1x", woe: -0.72 },
      { label: "1-3x", woe: -0.18 },
      { label: "3-6x", woe: 0.35 },
      { label: "6-12x", woe: 0.82 },
      { label: "> 12x", woe: 1.55 },
    ],
  },
  {
    key: "savings_ratio",
    label: "Savings Capacity",
    beta: -0.48,
    bins: [
      { label: "Negative", woe: 1.15 },
      { label: "0-10%", woe: 0.42 },
      { label: "10-25%", woe: -0.18 },
      { label: "25-50%", woe: -0.62 },
      { label: "> 50%", woe: -0.95 },
    ],
  },
  {
    key: "age",
    label: "Borrower Age",
    beta: -0.42,
    bins: [
      { label: "18-25", woe: 0.62 },
      { label: "26-35", woe: -0.15 },
      { label: "36-45", woe: -0.52 },
      { label: "46-55", woe: -0.38 },
      { label: "56+", woe: 0.22 },
    ],
  },
  {
    key: "existing_loan_count",
    label: "Existing Obligations",
    beta: -0.38,
    bins: [
      { label: "None", woe: -0.45 },
      { label: "1 loan", woe: -0.12 },
      { label: "2 loans", woe: 0.28 },
      { label: "3+ loans", woe: 0.95 },
    ],
  },
  {
    key: "business_years",
    label: "Business Tenure",
    beta: -0.28,
    bins: [
      { label: "< 1 year", woe: 0.72 },
      { label: "1-3 years", woe: 0.15 },
      { label: "3-5 years", woe: -0.32 },
      { label: "5-10 years", woe: -0.65 },
      { label: "10+ years", woe: -0.88 },
    ],
  },
  {
    key: "collateral_flag",
    label: "Collateral",
    beta: -0.35,
    bins: [
      { label: "Yes", woe: -0.55 },
      { label: "No", woe: 0.45 },
    ],
  },
  {
    key: "dependents",
    label: "Dependents",
    beta: -0.15,
    bins: [
      { label: "0", woe: -0.22 },
      { label: "1-2", woe: -0.08 },
      { label: "3-5", woe: 0.18 },
      { label: "6+", woe: 0.55 },
    ],
  },
  // ── Alt-Data Features (Thin-File / Zimbabwe-Specific) ──
  {
    key: "mobile_money_activity",
    label: "Mobile Money Activity",
    beta: -0.85,
    bins: [
      { label: "High (daily txns, consistent inflows)", woe: -1.25 },
      { label: "Moderate (weekly txns, regular use)", woe: -0.55 },
      { label: "Low (sporadic, small amounts)", woe: 0.25 },
      { label: "Inactive / No account", woe: 0.65 },
      { label: "No Data Available", woe: 0.05 },
    ],
  },
  {
    key: "airtime_regularity",
    label: "Airtime Top-up Regularity",
    beta: -0.45,
    bins: [
      { label: "Daily / near-daily recharges", woe: -0.92 },
      { label: "Weekly consistent", woe: -0.42 },
      { label: "Irregular / bulk purchases", woe: 0.15 },
      { label: "Rare / prepaid bundles only", woe: 0.52 },
      { label: "No Telco Data", woe: 0.05 },
    ],
  },
  {
    key: "mukando_savings",
    label: "Mukando / Savings Club",
    beta: -0.55,
    bins: [
      { label: "Active member, ≥12 months", woe: -1.05 },
      { label: "Active member, 6-12 months", woe: -0.58 },
      { label: "Active member, <6 months", woe: -0.18 },
      { label: "Lapsed / irregular contributions", woe: 0.35 },
      { label: "No membership", woe: 0.15 },
    ],
  },
  {
    key: "social_digital_footprint",
    label: "Social & Digital Footprint",
    beta: -0.35,
    bins: [
      { label: "Active biz page + Google listing + reviews", woe: -0.88 },
      { label: "Active social presence, few reviews", woe: -0.42 },
      { label: "Personal social only, no biz page", woe: 0.05 },
      { label: "No digital presence", woe: 0.20 },
    ],
  },
  {
    key: "supplier_credit",
    label: "Supplier Credit Performance",
    beta: -0.50,
    bins: [
      { label: "Always pays on/before terms", woe: -0.95 },
      { label: "Usually on time (>80%)", woe: -0.45 },
      { label: "Sometimes late, eventually pays", woe: 0.22 },
      { label: "Frequently late / disputes", woe: 0.72 },
      { label: "No supplier credit history", woe: 0.08 },
    ],
  },
  {
    key: "psychometric_score",
    label: "Psychometric Assessment",
    beta: -0.65,
    bins: [
      { label: "Strong (>80% across dimensions)", woe: -1.10 },
      { label: "Good (60-80%)", woe: -0.52 },
      { label: "Average (40-60%)", woe: 0.10 },
      { label: "Weak (<40%)", woe: 0.65 },
      { label: "Not Administered", woe: 0.05 },
    ],
  },
];
