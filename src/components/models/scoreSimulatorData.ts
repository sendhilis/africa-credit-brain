// Shared model constants & WoE bin data for the score simulator

export const SCORING_PARAMS = {
  baseScore: 600,
  baseOdds: 50,
  pdo: 20,
  // Segment-specific intercepts calibrated so "first-bin defaults" → ~620 score
  intercept: {
    retail: -6.80,
    micro: -8.40,
    sme: -8.15,
    farmer: -15.20,
  } as Record<string, number>,
  defaultIntercept: -6.80,
};

export type BorrowerSegment = "retail" | "micro" | "sme" | "farmer";
export type ScoringPillar = "identity" | "financial" | "agricultural" | "business" | "social" | "behavioral";

export const SEGMENT_LABELS: Record<BorrowerSegment, string> = {
  retail: "Individual / Retail",
  micro: "Micro Enterprise",
  sme: "SME",
  farmer: "Farmer / Agri",
};

export const PILLAR_LABELS: Record<ScoringPillar, string> = {
  identity: "Identity & Stability",
  financial: "Cash Flow & Financial Health",
  agricultural: "Agricultural & Seasonal",
  business: "Business & Trade",
  social: "Social & Community",
  behavioral: "Behavioral & Psychometric",
};

export interface SimFeature {
  key: string;
  label: string;
  beta: number;
  pillar: ScoringPillar;
  applicableTo: BorrowerSegment[];
  bins: { label: string; woe: number }[];
}

export const SIM_FEATURES: SimFeature[] = [
  // ════════════════════════════════════════════════════════════
  // PILLAR: Identity & Stability
  // ════════════════════════════════════════════════════════════
  {
    key: "age",
    label: "Borrower Age",
    beta: -0.42,
    pillar: "identity",
    applicableTo: ["retail", "micro", "sme", "farmer"],
    bins: [
      { label: "18-25", woe: 0.62 },
      { label: "26-35", woe: -0.15 },
      { label: "36-45", woe: -0.52 },
      { label: "46-55", woe: -0.38 },
      { label: "56+", woe: 0.22 },
    ],
  },
  {
    key: "dependents",
    label: "Dependents",
    beta: -0.15,
    pillar: "identity",
    applicableTo: ["retail", "micro", "sme", "farmer"],
    bins: [
      { label: "0", woe: -0.22 },
      { label: "1-2", woe: -0.08 },
      { label: "3-5", woe: 0.18 },
      { label: "6+", woe: 0.55 },
    ],
  },
  {
    key: "residence_stability",
    label: "Residence Stability",
    beta: -0.32,
    pillar: "identity",
    applicableTo: ["retail", "micro", "sme", "farmer"],
    bins: [
      { label: "Owned property, 5+ years", woe: -0.78 },
      { label: "Owned property, <5 years", woe: -0.42 },
      { label: "Rented, 3+ years same address", woe: -0.15 },
      { label: "Rented, <3 years", woe: 0.28 },
      { label: "Communal / family land", woe: 0.05 },
      { label: "No fixed address", woe: 0.72 },
    ],
  },
  {
    key: "geographic_risk",
    label: "Geographic Risk Zone",
    beta: -0.25,
    pillar: "identity",
    applicableTo: ["retail", "micro", "sme", "farmer"],
    bins: [
      { label: "Urban — Harare / Bulawayo CBD", woe: -0.55 },
      { label: "Urban — secondary city", woe: -0.32 },
      { label: "Peri-urban / growth point", woe: -0.08 },
      { label: "Rural — communal lands", woe: 0.22 },
      { label: "Resettlement area (A1/A2)", woe: 0.38 },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // PILLAR: Cash Flow & Financial Health
  // ════════════════════════════════════════════════════════════
  {
    key: "bureau_score",
    label: "Credit Bureau Score",
    beta: -1.50,
    pillar: "financial",
    applicableTo: ["retail", "micro", "sme", "farmer"],
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
    pillar: "financial",
    applicableTo: ["retail", "micro", "sme", "farmer"],
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
    pillar: "financial",
    applicableTo: ["retail", "micro", "sme", "farmer"],
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
    pillar: "financial",
    applicableTo: ["retail", "micro", "sme", "farmer"],
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
    pillar: "financial",
    applicableTo: ["retail", "micro", "sme", "farmer"],
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
    pillar: "financial",
    applicableTo: ["retail", "micro", "sme", "farmer"],
    bins: [
      { label: "Negative", woe: 1.15 },
      { label: "0-10%", woe: 0.42 },
      { label: "10-25%", woe: -0.18 },
      { label: "25-50%", woe: -0.62 },
      { label: "> 50%", woe: -0.95 },
    ],
  },
  {
    key: "existing_loan_count",
    label: "Existing Obligations",
    beta: -0.38,
    pillar: "financial",
    applicableTo: ["retail", "micro", "sme", "farmer"],
    bins: [
      { label: "None", woe: -0.45 },
      { label: "1 loan", woe: -0.12 },
      { label: "2 loans", woe: 0.28 },
      { label: "3+ loans", woe: 0.95 },
    ],
  },
  {
    key: "collateral_flag",
    label: "Collateral",
    beta: -0.35,
    pillar: "financial",
    applicableTo: ["retail", "micro", "sme", "farmer"],
    bins: [
      { label: "Yes — titled property", woe: -0.75 },
      { label: "Yes — movable assets / vehicle", woe: -0.45 },
      { label: "Yes — livestock (cattle/goats)", woe: -0.30 },
      { label: "Guarantor only", woe: 0.10 },
      { label: "No", woe: 0.45 },
    ],
  },
  {
    key: "remittance_inflows",
    label: "Diaspora Remittance Inflows",
    beta: -0.38,
    pillar: "financial",
    applicableTo: ["retail", "micro", "farmer"],
    bins: [
      { label: "Regular monthly (documented)", woe: -0.85 },
      { label: "Frequent but irregular", woe: -0.42 },
      { label: "Occasional (<quarterly)", woe: 0.05 },
      { label: "No remittance income", woe: 0.15 },
    ],
  },
  {
    key: "multi_currency_exposure",
    label: "Multi-Currency Exposure",
    beta: -0.30,
    pillar: "financial",
    applicableTo: ["micro", "sme", "farmer"],
    bins: [
      { label: "Primarily USD (>80% revenue)", woe: -0.72 },
      { label: "Mixed USD/ZWL (50-80% USD)", woe: -0.28 },
      { label: "Primarily ZWL (>80% revenue)", woe: 0.35 },
      { label: "ZAR/Rand-based border trade", woe: -0.15 },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // PILLAR: Business & Trade
  // ════════════════════════════════════════════════════════════
  {
    key: "business_years",
    label: "Business Tenure",
    beta: -0.28,
    pillar: "business",
    applicableTo: ["micro", "sme"],
    bins: [
      { label: "< 1 year", woe: 0.72 },
      { label: "1-3 years", woe: 0.15 },
      { label: "3-5 years", woe: -0.32 },
      { label: "5-10 years", woe: -0.65 },
      { label: "10+ years", woe: -0.88 },
    ],
  },
  {
    key: "formal_registration",
    label: "Formal Registration (ZimRA)",
    beta: -0.35,
    pillar: "business",
    applicableTo: ["micro", "sme", "farmer"],
    bins: [
      { label: "Registered + tax compliant", woe: -0.82 },
      { label: "Registered, tax irregular", woe: -0.28 },
      { label: "Informal — no registration", woe: 0.35 },
      { label: "Pending registration", woe: 0.12 },
    ],
  },
  {
    key: "premises_type",
    label: "Business Premises",
    beta: -0.22,
    pillar: "business",
    applicableTo: ["micro", "sme"],
    bins: [
      { label: "Owned commercial premises", woe: -0.72 },
      { label: "Leased / rented shop", woe: -0.25 },
      { label: "Market stall / flea market", woe: 0.15 },
      { label: "Mobile / no fixed premises", woe: 0.48 },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // PILLAR: Agricultural & Seasonal (FARMER segment)
  // ════════════════════════════════════════════════════════════
  {
    key: "land_tenure",
    label: "Land Tenure Type",
    beta: -0.75,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "Title deed (freehold)", woe: -1.15 },
      { label: "99-year lease (A2 farm)", woe: -0.72 },
      { label: "Offer letter (A1 resettlement)", woe: -0.25 },
      { label: "Communal land (chief allocation)", woe: 0.18 },
      { label: "Leased / rented land", woe: 0.42 },
      { label: "No formal tenure", woe: 0.88 },
    ],
  },
  {
    key: "hectarage",
    label: "Hectarage Under Cultivation",
    beta: -0.55,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "< 1 ha (subsistence garden)", woe: 0.62 },
      { label: "1-5 ha (smallholder)", woe: 0.08 },
      { label: "5-20 ha (emerging farmer)", woe: -0.38 },
      { label: "20-100 ha (commercial small)", woe: -0.72 },
      { label: "> 100 ha (commercial large)", woe: -0.95 },
    ],
  },
  {
    key: "farming_system",
    label: "Farming System",
    beta: -0.68,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "Irrigated (centre pivot / drip)", woe: -1.05 },
      { label: "Irrigated (flood / furrow)", woe: -0.55 },
      { label: "Mixed (irrigated + rainfed)", woe: -0.25 },
      { label: "Rainfed only", woe: 0.42 },
      { label: "Greenhouse / controlled", woe: -0.82 },
    ],
  },
  {
    key: "crop_diversification",
    label: "Crop & Enterprise Diversification",
    beta: -0.52,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "Diversified (crop + livestock + horticulture)", woe: -0.92 },
      { label: "Mixed (2-3 enterprises)", woe: -0.48 },
      { label: "Dual crop (e.g. maize + soya)", woe: -0.12 },
      { label: "Monocrop only", woe: 0.55 },
    ],
  },
  {
    key: "contract_farming",
    label: "Contract Farming Status",
    beta: -0.62,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "Active contract — tobacco (Mashonaland Tobacco)", woe: -0.95 },
      { label: "Active contract — cotton (Cottco) / sugar (Hippo Valley)", woe: -0.78 },
      { label: "Active contract — horticulture (export)", woe: -0.88 },
      { label: "Expired / lapsed contract", woe: 0.15 },
      { label: "No contract — sells to open market", woe: 0.32 },
    ],
  },
  {
    key: "market_access",
    label: "Market Access & Off-take",
    beta: -0.48,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "Formal off-taker / export market", woe: -0.88 },
      { label: "GMB / commodity exchange", woe: -0.52 },
      { label: "Established private buyers (repeat)", woe: -0.28 },
      { label: "Local market / Mbare Musika", woe: 0.12 },
      { label: "Farm-gate / informal only", woe: 0.48 },
    ],
  },
  {
    key: "farming_experience",
    label: "Farming Experience",
    beta: -0.45,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "10+ years", woe: -0.82 },
      { label: "5-10 years", woe: -0.48 },
      { label: "2-5 years", woe: -0.08 },
      { label: "< 2 years (new entrant)", woe: 0.65 },
    ],
  },
  {
    key: "prev_season_performance",
    label: "Previous Season Performance",
    beta: -0.72,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "Strong surplus — above breakeven >30%", woe: -1.08 },
      { label: "Moderate surplus — 10-30% above breakeven", woe: -0.55 },
      { label: "Break-even", woe: 0.10 },
      { label: "Loss-making season", woe: 0.72 },
      { label: "First season — no track record", woe: 0.45 },
    ],
  },
  {
    key: "livestock_assets",
    label: "Livestock Assets (Collateral Proxy)",
    beta: -0.42,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "20+ cattle head", woe: -0.92 },
      { label: "6-20 cattle head", woe: -0.52 },
      { label: "1-5 cattle head", woe: -0.15 },
      { label: "Small stock only (goats/poultry)", woe: 0.12 },
      { label: "No livestock", woe: 0.38 },
    ],
  },
  {
    key: "input_access",
    label: "Input Access & Financing",
    beta: -0.38,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "Self-funded (cash reserves)", woe: -0.78 },
      { label: "Government scheme (Pfumvudza / Presidential Input)", woe: -0.32 },
      { label: "Agro-dealer credit (established)", woe: -0.18 },
      { label: "Shared / borrowed inputs", woe: 0.35 },
      { label: "No input access — needs full financing", woe: 0.72 },
    ],
  },
  {
    key: "irrigation_infrastructure",
    label: "Irrigation Infrastructure",
    beta: -0.55,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "Centre pivot / sprinkler (functional)", woe: -0.95 },
      { label: "Drip irrigation (functional)", woe: -0.75 },
      { label: "Flood / canal (seasonal water)", woe: -0.22 },
      { label: "Borehole + manual watering", woe: 0.08 },
      { label: "None — fully rainfed", woe: 0.52 },
    ],
  },
  {
    key: "climate_risk_region",
    label: "Climate Risk — Natural Region",
    beta: -0.48,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "NR I — Eastern Highlands (>1000mm rain)", woe: -0.85 },
      { label: "NR II — Mashonaland (750-1000mm)", woe: -0.55 },
      { label: "NR III — Midlands (650-800mm)", woe: -0.10 },
      { label: "NR IV — Masvingo / lowveld (450-650mm)", woe: 0.42 },
      { label: "NR V — Matabeleland South (<450mm)", woe: 0.78 },
    ],
  },
  {
    key: "post_harvest_storage",
    label: "Post-Harvest Storage & Handling",
    beta: -0.35,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "Commercial silo / cold chain", woe: -0.82 },
      { label: "Warehouse / covered storage", woe: -0.42 },
      { label: "Basic covered shed", woe: 0.05 },
      { label: "Open-air / no storage", woe: 0.58 },
    ],
  },
  {
    key: "agri_insurance",
    label: "Agricultural Insurance",
    beta: -0.32,
    pillar: "agricultural",
    applicableTo: ["farmer"],
    bins: [
      { label: "Active crop + livestock policy", woe: -0.88 },
      { label: "Active crop-only policy", woe: -0.52 },
      { label: "Index-based / weather insurance", woe: -0.35 },
      { label: "Lapsed policy", woe: 0.15 },
      { label: "Never insured", woe: 0.42 },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // PILLAR: Social & Community (Alt-Data)
  // ════════════════════════════════════════════════════════════
  {
    key: "mobile_money_activity",
    label: "Mobile Money Activity",
    beta: -0.85,
    pillar: "social",
    applicableTo: ["retail", "micro", "sme", "farmer"],
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
    pillar: "social",
    applicableTo: ["retail", "micro", "farmer"],
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
    pillar: "social",
    applicableTo: ["retail", "micro", "farmer"],
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
    pillar: "social",
    applicableTo: ["micro", "sme"],
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
    pillar: "social",
    applicableTo: ["micro", "sme", "farmer"],
    bins: [
      { label: "Always pays on/before terms", woe: -0.95 },
      { label: "Usually on time (>80%)", woe: -0.45 },
      { label: "Sometimes late, eventually pays", woe: 0.22 },
      { label: "Frequently late / disputes", woe: 0.72 },
      { label: "No supplier credit history", woe: 0.08 },
    ],
  },
  {
    key: "cooperative_membership",
    label: "Cooperative / Farmer Union",
    beta: -0.40,
    pillar: "social",
    applicableTo: ["farmer"],
    bins: [
      { label: "Active member — registered cooperative", woe: -0.82 },
      { label: "Active member — informal buying group", woe: -0.38 },
      { label: "Lapsed membership", woe: 0.12 },
      { label: "No cooperative affiliation", woe: 0.28 },
    ],
  },
  {
    key: "community_standing",
    label: "Community Standing / References",
    beta: -0.28,
    pillar: "social",
    applicableTo: ["retail", "micro", "farmer"],
    bins: [
      { label: "Chief / headman endorsement + 2 references", woe: -0.72 },
      { label: "Employer / landlord reference", woe: -0.42 },
      { label: "Peer references only", woe: 0.05 },
      { label: "No references available", woe: 0.35 },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // PILLAR: Behavioral & Psychometric
  // ════════════════════════════════════════════════════════════
  {
    key: "psychometric_score",
    label: "Psychometric Assessment",
    beta: -0.65,
    pillar: "behavioral",
    applicableTo: ["retail", "micro", "sme", "farmer"],
    bins: [
      { label: "Strong (>80% across dimensions)", woe: -1.10 },
      { label: "Good (60-80%)", woe: -0.52 },
      { label: "Average (40-60%)", woe: 0.10 },
      { label: "Weak (<40%)", woe: 0.65 },
      { label: "Not Administered", woe: 0.05 },
    ],
  },
  {
    key: "utility_payment",
    label: "Utility Payment Consistency (ZESA/TelOne)",
    beta: -0.30,
    pillar: "behavioral",
    applicableTo: ["retail", "micro", "sme", "farmer"],
    bins: [
      { label: "Regular monthly top-ups (documented)", woe: -0.68 },
      { label: "Frequent but variable amounts", woe: -0.25 },
      { label: "Irregular / seasonal", woe: 0.18 },
      { label: "No utility data", woe: 0.05 },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // MISSING CRITICAL FEATURES — Added for completeness
  // ════════════════════════════════════════════════════════════

  // BREAD BASKET MARGIN — Household affordability indicator
  {
    key: "bread_basket_margin",
    label: "Bread Basket Margin",
    beta: -0.78,
    pillar: "financial",
    applicableTo: ["retail", "micro", "sme", "farmer"],
    bins: [
      { label: "Comfortable (>40% surplus after essentials)", woe: -1.15 },
      { label: "Adequate (20-40% surplus)", woe: -0.55 },
      { label: "Tight (5-20% surplus)", woe: 0.12 },
      { label: "Stretched (0-5% surplus)", woe: 0.65 },
      { label: "Deficit (expenses > income)", woe: 1.35 },
    ],
  },

  // DSCR — Debt Service Coverage Ratio
  {
    key: "dscr",
    label: "Debt Service Coverage Ratio (DSCR)",
    beta: -0.82,
    pillar: "financial",
    applicableTo: ["sme", "farmer"],
    bins: [
      { label: "> 2.0x (strong coverage)", woe: -1.05 },
      { label: "1.5-2.0x (adequate)", woe: -0.55 },
      { label: "1.2-1.5x (marginal)", woe: 0.08 },
      { label: "1.0-1.2x (tight)", woe: 0.52 },
      { label: "< 1.0x (insufficient)", woe: 1.25 },
    ],
  },

  // Employment Stability — Retail segment
  {
    key: "employment_stability",
    label: "Employment Stability",
    beta: -0.58,
    pillar: "identity",
    applicableTo: ["retail"],
    bins: [
      { label: "Permanent / civil service (5+ years)", woe: -0.95 },
      { label: "Permanent employment (1-5 years)", woe: -0.55 },
      { label: "Contract employment (renewable)", woe: -0.12 },
      { label: "Casual / piece work", woe: 0.48 },
      { label: "Self-employed informal", woe: 0.25 },
      { label: "Unemployed / dependent", woe: 0.88 },
    ],
  },

  // Cashflow Volatility — POS / Till data
  {
    key: "cashflow_volatility",
    label: "Cashflow Volatility (POS/Till)",
    beta: -0.62,
    pillar: "financial",
    applicableTo: ["micro", "sme"],
    bins: [
      { label: "Very stable (CV <15%, 6+ months data)", woe: -0.92 },
      { label: "Stable (CV 15-30%)", woe: -0.42 },
      { label: "Moderate (CV 30-50%)", woe: 0.10 },
      { label: "Volatile (CV >50%)", woe: 0.62 },
      { label: "Insufficient POS data (<30 days)", woe: 0.25 },
    ],
  },

  // EcoCash Income Triangulation
  {
    key: "ecocash_triangulation",
    label: "EcoCash Income Triangulation",
    beta: -0.58,
    pillar: "financial",
    applicableTo: ["retail", "micro", "sme", "farmer"],
    bins: [
      { label: "Bank + POS + EcoCash aligned (>90% match)", woe: -1.05 },
      { label: "Mostly aligned (70-90% match)", woe: -0.52 },
      { label: "Partial alignment (50-70%)", woe: 0.05 },
      { label: "Significant discrepancy (<50%)", woe: 0.58 },
      { label: "Single source only — no triangulation", woe: 0.25 },
    ],
  },

  // Concentration Risk — Customer/revenue dependency
  {
    key: "concentration_risk",
    label: "Revenue Concentration Risk",
    beta: -0.48,
    pillar: "business",
    applicableTo: ["sme", "farmer"],
    bins: [
      { label: "Diversified (no client >20% of revenue)", woe: -0.82 },
      { label: "Moderate (top client 20-40%)", woe: -0.28 },
      { label: "Concentrated (top client 40-60%)", woe: 0.22 },
      { label: "Highly concentrated (>60% single buyer)", woe: 0.72 },
    ],
  },

  // Revenue Seasonality
  {
    key: "revenue_seasonality",
    label: "Revenue Seasonality Index",
    beta: -0.45,
    pillar: "financial",
    applicableTo: ["micro", "sme", "farmer"],
    bins: [
      { label: "Year-round consistent (<20% seasonal swing)", woe: -0.75 },
      { label: "Mild seasonality (20-40% swing)", woe: -0.28 },
      { label: "Moderate seasonality (40-60% swing)", woe: 0.15 },
      { label: "Highly seasonal (>60% swing, e.g. harvest-dependent)", woe: 0.58 },
      { label: "Single season income (one harvest/year)", woe: 0.85 },
    ],
  },

  // Loan Purpose Risk
  {
    key: "loan_purpose_risk",
    label: "Loan Purpose Risk",
    beta: -0.35,
    pillar: "financial",
    applicableTo: ["retail", "micro", "sme", "farmer"],
    bins: [
      { label: "Productive asset (equipment, machinery)", woe: -0.72 },
      { label: "Working capital / stock replenishment", woe: -0.35 },
      { label: "Seasonal input financing (seed, fertilizer)", woe: -0.22 },
      { label: "Education / medical (human capital)", woe: 0.05 },
      { label: "Consumption / lifestyle", woe: 0.55 },
      { label: "Debt consolidation / refinancing", woe: 0.42 },
    ],
  },
];

/** Get features applicable to a specific borrower segment */
export function getFeaturesForSegment(segment: BorrowerSegment): SimFeature[] {
  return SIM_FEATURES.filter((f) => f.applicableTo.includes(segment));
}

/** Get features grouped by pillar for a specific segment */
export function getFeaturesByPillar(segment: BorrowerSegment): Record<ScoringPillar, SimFeature[]> {
  const features = getFeaturesForSegment(segment);
  const grouped = {} as Record<ScoringPillar, SimFeature[]>;
  for (const f of features) {
    if (!grouped[f.pillar]) grouped[f.pillar] = [];
    grouped[f.pillar].push(f);
  }
  return grouped;
}
