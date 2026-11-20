// Country-specific configuration for application forms
// Maps to scoring model feature inputs per market

export type FieldDef = { key: string; label: string; placeholder: string; type: string; section?: string; options?: { value: string; label: string }[] };

export interface CountryConfig {
  label: string;
  locationFields?: FieldDef[];
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  phonePlaceholder: string;
  idTypes: { value: string; label: string; placeholder: string }[];
  taxId: { label: string; placeholder: string } | null;
  socialId: { label: string; placeholder: string } | null;
  bureaus: string[];
  wallets: string[];
  telcos: string[];
  utilities: string[];
  businessRegistration: { label: string; placeholder: string };
  additionalRetailFields: { key: string; label: string; placeholder: string; type: string }[];
  additionalBusinessFields: { key: string; label: string; placeholder: string; type: string }[];
  microFields?: FieldDef[];
  smeFields?: FieldDef[];
  farmerFields?: FieldDef[];
  socialMediaFields?: FieldDef[];
  cashFlowFields?: FieldDef[];
  businessStabilityFields?: FieldDef[];
  collateralOptions?: { value: string; label: string }[];
  loanPurposes?: { value: string; label: string }[];
  multiCurrencyOptions?: { value: string; label: string }[];
  taxClearanceDoc?: { label: string; description: string };
}

// ── Shared field generators ──

const breadBasketMicro = (cur: string): FieldDef[] => [
  { key: "household_size", label: "Household Size (people fed)", placeholder: "5", type: "number", section: "Bread Basket" },
  { key: "monthly_food_basket", label: `Monthly Food Spend (${cur})`, placeholder: "5000", type: "number", section: "Bread Basket" },
  { key: "monthly_transport", label: `Monthly Transport (${cur})`, placeholder: "2000", type: "number", section: "Bread Basket" },
  { key: "monthly_school_fees", label: `Monthly School Fees (${cur})`, placeholder: "3000", type: "number", section: "Bread Basket" },
  { key: "monthly_health", label: `Monthly Medical / Health (${cur})`, placeholder: "1000", type: "number", section: "Bread Basket" },
];

const balanceSheetMicro = (cur: string): FieldDef[] => [
  { key: "stock_value_estimate", label: `Stock / Inventory Value (${cur})`, placeholder: "200000", type: "number", section: "Balance Sheet" },
  { key: "equipment_tools_value", label: `Equipment / Tools Value (${cur})`, placeholder: "100000", type: "number", section: "Balance Sheet" },
  { key: "total_savings", label: `Total Savings (${cur})`, placeholder: "50000", type: "number", section: "Balance Sheet" },
  { key: "receivables_amount", label: `Money Owed to You (${cur})`, placeholder: "30000", type: "number", section: "Balance Sheet" },
  { key: "payables_amount", label: `Money You Owe Suppliers (${cur})`, placeholder: "40000", type: "number", section: "Balance Sheet" },
];

const breadBasketRetail = (cur: string) => [
  { key: "household_size", label: "Household Size (people fed)", placeholder: "5", type: "number" },
  { key: "monthly_food_basket", label: `Monthly Food Spend (${cur})`, placeholder: "5000", type: "number" },
  { key: "monthly_transport", label: `Monthly Transport (${cur})`, placeholder: "2000", type: "number" },
  { key: "monthly_school_fees", label: `Monthly School Fees (${cur})`, placeholder: "3000", type: "number" },
  { key: "monthly_health", label: `Monthly Medical / Health (${cur})`, placeholder: "1000", type: "number" },
];

const defaultSocialMedia = (phone: string): FieldDef[] => [
  { key: "facebook_page", label: "Facebook Business Page URL", placeholder: "https://facebook.com/yourbusiness", type: "text" },
  { key: "facebook_followers", label: "Facebook Followers / Likes", placeholder: "500", type: "number" },
  { key: "facebook_reviews_avg", label: "Facebook Reviews Average (1-5)", placeholder: "4.2", type: "number" },
  { key: "whatsapp_business", label: "WhatsApp Business Number", placeholder: phone, type: "text" },
  { key: "instagram_handle", label: "Instagram Handle", placeholder: "@yourbusiness", type: "text" },
  { key: "instagram_followers", label: "Instagram Followers", placeholder: "200", type: "number" },
  { key: "google_maps_listing", label: "Google Maps Listing?", placeholder: "Yes / No", type: "text" },
  { key: "google_reviews_count", label: "Google Reviews Count", placeholder: "15", type: "number" },
  { key: "google_reviews_avg", label: "Google Reviews Average (1-5)", placeholder: "4.0", type: "number" },
];

const defaultCashFlow: FieldDef[] = [
  { key: "cash_cycle_days", label: "Cash Conversion Cycle (days)", placeholder: "45", type: "number" },
  { key: "seasonal_business", label: "Seasonal Business?", placeholder: "Yes / No", type: "text" },
  { key: "worst_month_cover", label: "Worst Month Cash Cover (months)", placeholder: "1.5", type: "number" },
  { key: "dscr", label: "Debt Service Coverage Ratio", placeholder: "1.5", type: "number" },
  { key: "current_ratio", label: "Current Ratio", placeholder: "1.8", type: "number" },
];

const defaultStability: FieldDef[] = [
  { key: "premises_type", label: "Business Premises", placeholder: "", type: "select", options: [
    { value: "owned", label: "Owned / Freehold" },
    { value: "rented_formal", label: "Rented — Formal Lease" },
    { value: "rented_informal", label: "Rented — Informal" },
    { value: "market_stall", label: "Market Stall" },
    { value: "mobile", label: "Mobile / No Fixed Premises" },
    { value: "home_based", label: "Home-Based" },
  ]},
  { key: "premises_years", label: "Years at Current Premises", placeholder: "3", type: "number" },
  { key: "licenses_current", label: "All Licenses Current?", placeholder: "Yes / No", type: "text" },
  { key: "insurance_coverage", label: "Business Insurance", placeholder: "Fire, Theft, None…", type: "text" },
];

const defaultCollateral = [
  { value: "none", label: "None (Unsecured)" },
  { value: "salary", label: "Salary Assignment" },
  { value: "property", label: "Property / Land Title" },
  { value: "vehicle", label: "Vehicle / Logbook" },
  { value: "group_guarantee", label: "Group Guarantee" },
  { value: "inventory", label: "Inventory / Stock" },
  { value: "livestock", label: "Livestock" },
  { value: "equipment", label: "Equipment / Machinery" },
];

const defaultLoanPurposes = [
  { value: "working_capital", label: "Working Capital" },
  { value: "asset_purchase", label: "Asset / Equipment Purchase" },
  { value: "stock_purchase", label: "Stock / Inventory Purchase" },
  { value: "agriculture", label: "Agriculture (Inputs, Season Finance)" },
  { value: "education", label: "Education / School Fees" },
  { value: "medical", label: "Medical Expenses" },
  { value: "housing", label: "Housing / Rent / Construction" },
  { value: "vehicle_purchase", label: "Vehicle Purchase" },
  { value: "debt_consolidation", label: "Debt Consolidation" },
  { value: "personal", label: "Personal / Consumption" },
];

const smeBase = (cur: string, banks: string): FieldDef[] => [
  { key: "legal_structure", label: "Legal Structure", placeholder: "Pvt Ltd / Partnership / Co-op", type: "text", section: "Corporate Profile" },
  { key: "vat_registered", label: "VAT Registered?", placeholder: "Yes / No", type: "text", section: "Corporate Profile" },
  { key: "vat_number", label: "VAT Number", placeholder: "XXXXXXXXXX", type: "text", section: "Corporate Profile" },
  { key: "annual_turnover", label: `Annual Turnover (${cur})`, placeholder: "24000000", type: "number", section: "Financial Profile" },
  { key: "gross_margin_pct", label: "Gross Margin (%)", placeholder: "35", type: "number", section: "Financial Profile" },
  { key: "net_profit_margin_pct", label: "Net Profit Margin (%)", placeholder: "12", type: "number", section: "Financial Profile" },
  { key: "monthly_fixed_costs", label: `Monthly Fixed Costs (${cur})`, placeholder: "500000", type: "number", section: "Financial Profile" },
  { key: "avg_monthly_revenue_6m", label: `Avg Monthly Revenue 6m (${cur})`, placeholder: "2000000", type: "number", section: "Cash Flow Analysis" },
  { key: "revenue_volatility", label: "Revenue Volatility (%)", placeholder: "25", type: "number", section: "Cash Flow Analysis" },
  { key: "highest_month_revenue", label: `Highest Month Revenue (${cur})`, placeholder: "3500000", type: "number", section: "Cash Flow Analysis" },
  { key: "lowest_month_revenue", label: `Lowest Month Revenue (${cur})`, placeholder: "800000", type: "number", section: "Cash Flow Analysis" },
  { key: "receivables_days", label: "Avg Receivable Days", placeholder: "30", type: "number", section: "Cash Flow Analysis" },
  { key: "payables_days", label: "Avg Payable Days", placeholder: "45", type: "number", section: "Cash Flow Analysis" },
  { key: "top_3_customers_pct", label: "Top 3 Customers Revenue (%)", placeholder: "60", type: "number", section: "Concentration Risk" },
  { key: "top_supplier_dependency", label: "Single Supplier Dependency (%)", placeholder: "40", type: "number", section: "Concentration Risk" },
  { key: "years_audited_financials", label: "Years of Audited Financials", placeholder: "2", type: "number", section: "Governance" },
  { key: "directors_count", label: "Number of Directors", placeholder: "3", type: "number", section: "Governance" },
  { key: "key_person_risk", label: "Key Person Risk (1-5)", placeholder: "3", type: "number", section: "Governance" },
  { key: "bank_accounts_count", label: "Number of Bank Accounts", placeholder: "2", type: "number", section: "Banking" },
  { key: "primary_bank", label: "Primary Bank", placeholder: banks, type: "text", section: "Banking" },
  { key: "bank_avg_balance_6m", label: `Avg Bank Balance 6m (${cur})`, placeholder: "500000", type: "number", section: "Banking" },
  { key: "bounced_cheques_12m", label: "Bounced Cheques (12 months)", placeholder: "0", type: "number", section: "Banking" },
];

const microBase = (opts: {
  currency: string;
  locationExamples: string;
  dailySalesPlaceholder: string;
  walletLabel: string;
  walletPlaceholder: string;
  stockSourceExamples: string;
  savingsGroupLabel: string;
  savingsAmountLabel: string;
}): FieldDef[] => [
  { key: "trading_location", label: "Trading Location / Market", placeholder: opts.locationExamples, type: "text", section: "Business Profile" },
  { key: "business_description", label: "Business Description", placeholder: "What you sell or services offered", type: "text", section: "Business Profile" },
  { key: "years_trading", label: "Years Trading", placeholder: "3", type: "number", section: "Business Profile" },
  { key: "daily_sales", label: `Average Daily Sales (${opts.currency})`, placeholder: opts.dailySalesPlaceholder, type: "number", section: "Cash Flow" },
  { key: "peak_season", label: "Peak Season Months", placeholder: "e.g. Nov-Dec, Easter", type: "text", section: "Cash Flow" },
  { key: "low_season_revenue_pct", label: "Low Season Revenue (% of peak)", placeholder: "40", type: "number", section: "Cash Flow" },
  { key: "stock_source", label: "Stock Source / Suppliers", placeholder: opts.stockSourceExamples, type: "text", section: "Business Profile" },
  { key: "cross_border", label: "Cross-Border Trader?", placeholder: "Yes / No", type: "text", section: "Business Profile" },
  { key: "wallet_daily_vol", label: opts.walletLabel, placeholder: opts.walletPlaceholder, type: "number", section: "Mobile Money" },
  { key: "savings_club", label: opts.savingsGroupLabel, placeholder: "Name and monthly contribution", type: "text", section: "Savings" },
  { key: "savings_club_amount", label: opts.savingsAmountLabel, placeholder: "2000", type: "number", section: "Savings" },
  { key: "group_lending", label: "Part of Group Lending Scheme?", placeholder: "Yes / No", type: "text", section: "Savings" },
  { key: "repayment_history_informal", label: "Previous Loan Repayment (MFI / Group)", placeholder: "Describe any past loans", type: "text", section: "Repayment History" },
  { key: "supplier_credit_days", label: "Supplier Credit Terms (days)", placeholder: "14", type: "number", section: "Repayment History" },
  ...breadBasketMicro(opts.currency),
  ...balanceSheetMicro(opts.currency),
];

const farmerBase = (opts: {
  currency: string;
  landTenure: { value: string; label: string }[];
  zones: { value: string; label: string }[];
  locLabel: string;
  locPlaceholder: string;
  cropExamples: string;
  contracts: { value: string; label: string }[];
  markets: { value: string; label: string }[];
  extensions: { value: string; label: string }[];
  inputPrograms: { value: string; label: string }[];
}): FieldDef[] => [
  { key: "land_tenure", label: "Land Tenure Type", placeholder: "", type: "select", section: "Land & Tenure", options: opts.landTenure },
  { key: "hectarage", label: "Hectarage Under Cultivation", placeholder: "10", type: "number", section: "Land & Tenure" },
  { key: "total_land_ha", label: "Total Land (ha)", placeholder: "25", type: "number", section: "Land & Tenure" },
  { key: "agro_zone", label: "Agro-Ecological Zone", placeholder: "", type: "select", section: "Land & Tenure", options: opts.zones },
  { key: "farm_location", label: opts.locLabel, placeholder: opts.locPlaceholder, type: "text", section: "Land & Tenure" },
  { key: "farming_system", label: "Farming System", placeholder: "", type: "select", section: "Farming Operations", options: [
    { value: "irrigated", label: "Irrigated (Sprinkler / Drip)" },
    { value: "mixed", label: "Mixed (Irrigated + Rainfed)" },
    { value: "rainfed", label: "Rainfed Only" },
    { value: "greenhouse", label: "Greenhouse / Protected" },
  ]},
  { key: "primary_crop", label: "Primary Crop / Enterprise", placeholder: opts.cropExamples, type: "text", section: "Farming Operations" },
  { key: "secondary_enterprises", label: "Secondary Enterprises", placeholder: "e.g. Livestock, Poultry, Vegetables", type: "text", section: "Farming Operations" },
  { key: "farming_experience_years", label: "Years of Farming Experience", placeholder: "8", type: "number", section: "Farming Operations" },
  { key: "contract_farming", label: "Contract Farming Status", placeholder: "", type: "select", section: "Market & Contracts", options: opts.contracts },
  { key: "market_access", label: "Primary Market Channel", placeholder: "", type: "select", section: "Market & Contracts", options: opts.markets },
  { key: "prev_season_yield", label: "Previous Season Yield (tonnes)", placeholder: "25", type: "number", section: "Season Performance" },
  { key: "prev_season_revenue", label: `Previous Season Revenue (${opts.currency})`, placeholder: "500000", type: "number", section: "Season Performance" },
  { key: "prev_season_performance", label: "Previous Season Result", placeholder: "", type: "select", section: "Season Performance", options: [
    { value: "strong_surplus", label: "Strong Surplus — >30% Above Breakeven" },
    { value: "moderate_surplus", label: "Moderate Surplus — 10-30% Above" },
    { value: "breakeven", label: "Break-even" },
    { value: "loss", label: "Loss-Making Season" },
    { value: "first_season", label: "First Season" },
  ]},
  { key: "input_cost_estimate", label: `Input Costs This Season (${opts.currency})`, placeholder: "100000", type: "number", section: "Season Performance" },
  { key: "cattle_count", label: "Cattle Head Count", placeholder: "12", type: "number", section: "Livestock & Assets" },
  { key: "small_stock_count", label: "Small Stock (Goats / Sheep)", placeholder: "20", type: "number", section: "Livestock & Assets" },
  { key: "poultry_count", label: "Poultry Count", placeholder: "100", type: "number", section: "Livestock & Assets" },
  { key: "equipment_value_usd", label: "Farm Equipment Value (USD)", placeholder: "5000", type: "number", section: "Livestock & Assets" },
  { key: "input_access", label: "Input Access & Financing", placeholder: "", type: "select", section: "Inputs & Insurance", options: opts.inputPrograms },
  { key: "cooperative_membership", label: "Cooperative / Farmer Union", placeholder: "", type: "select", section: "Community & Support", options: [
    { value: "registered_coop", label: "Active — Registered Cooperative" },
    { value: "informal_group", label: "Active — Informal Group" },
    { value: "none", label: "No Cooperative Affiliation" },
  ]},
  { key: "extension_services", label: "Extension Services Access", placeholder: "", type: "select", section: "Community & Support", options: opts.extensions },
];

// ── Country Configurations ──

const options = (...pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));
const gaField = (key: string, label: string, section?: string, placeholder = "", type = "text"): FieldDef => ({ key, label, section, placeholder, type });
const gaChoice = (key: string, label: string, section: string | undefined, ...pairs: [string, string][]): FieldDef => ({ ...gaField(key, label, section, "", "select"), options: options(...pairs) });

const gabon: CountryConfig = {
  label: "Gabon", currency: "XAF", currencySymbol: "FCFA", phonePrefix: "+241", phonePlaceholder: "+241 6X XX XX XX",
  idTypes: [
    { value: "cnie", label: "Carte nationale d’identité électronique (CNIE)", placeholder: "Numéro figurant sur la CNIE" },
    { value: "nip_attestation", label: "Attestation du NIP (supporting evidence)", placeholder: "14 caractères alphanumériques" },
    { value: "passport", label: "Passeport", placeholder: "Numéro du passeport" },
    { value: "residence_card", label: "Carte de séjour", placeholder: "Numéro de la carte" },
  ],
  taxId: { label: "NIF (DGI, if applicable)", placeholder: "Numéro d’identification fiscale" },
  socialId: null,
  locationFields: [
    gaChoice("province", "Province", undefined, ...["Estuaire", "Haut-Ogooué", "Moyen-Ogooué", "Ngounié", "Nyanga", "Ogooué-Ivindo", "Ogooué-Lolo", "Ogooué-Maritime", "Woleu-Ntem"].map((name): [string, string] => [name, name])),
    gaField("gabon_locality", "Département / commune / village", undefined, "Ntoum, Franceville, Mouila…"),
    gaField("gabon_landmark", "Quartier / repère (if no street address)", undefined, "Quartier, marché ou point de repère"),
  ],
  bureaus: [], wallets: ["Airtel Money", "Moov Money"], telcos: ["Airtel Gabon", "Moov Africa Gabon Telecom"], utilities: ["SEEG"],
  businessRegistration: { label: "RCCM / ANPI-Gabon (if applicable)", placeholder: "Numéro RCCM" },
  additionalRetailFields: [gaField("employer", "Employer / income source", undefined, "Administration, entreprise, pension…"), ...breadBasketRetail("XAF")],
  additionalBusinessFields: [],
  collateralOptions: defaultCollateral,
  loanPurposes: defaultLoanPurposes,
  taxClearanceDoc: { label: "Attestation de régularité fiscale (DGI)", description: "Current tax compliance evidence, if applicable." },
  microFields: [
    ...microBase({ currency: "XAF", locationExamples: "Marché Mont-Bouët, marché de Nkembo, Port-Gentil…", dailySalesPlaceholder: "25000", walletLabel: "Daily Airtel Money / Moov Money sales (XAF)", walletPlaceholder: "10000", stockSourceExamples: "Grossiste local, producteur, importateur", savingsGroupLabel: "Tontine / savings group", savingsAmountLabel: "Monthly tontine contribution (XAF)" }),
    gaChoice("formalization", "Registration status", "Business Profile", ["registered", "Registered (RCCM)"], ["informal", "Informal / no RCCM"], ["pending", "Registration in progress"]),
    gaField("gabon_market_permit", "Market authorization / stall fee reference (if available)", "Business Profile"),
    gaField("trading_days", "Trading days per month", "Cash Flow", "24", "number"),
  ],
  smeFields: [
    ...smeBase("XAF", "BGFIBank Gabon, UGB, BICIG, Orabank Gabon").filter(f => f.key !== "legal_structure" && f.key !== "avg_monthly_revenue_6m"),
    gaChoice("legal_structure", "Forme juridique (OHADA)", "Corporate Profile", ["sarl", "SARL"], ["sas", "SAS"], ["sa", "SA"], ["ei", "Entreprise individuelle"], ["coop", "Coopérative"], ["other", "Autre"]),
    gaField("gabon_signatory_capacity", "Signatory role / authorization reference", "Governance"),
    gaField("gabon_customer_contracts", "Major customer contracts / order book", "Concentration Risk"),
  ],
  cashFlowFields: defaultCashFlow.filter(f => f.key !== "dscr"), businessStabilityFields: defaultStability,
  socialMediaFields: defaultSocialMedia("+241 6X XX XX XX"),
  farmerFields: [
    ...farmerBase({ currency: "XAF",
      landTenure: options(["title_deed", "Titre foncier"], ["leased", "Bail écrit"], ["use_agreement", "Convention de mise à disposition"], ["family_use", "Usage familial / coutumier"], ["undocumented", "No written evidence"]),
      zones: options(["coastal", "Littoral / bas-fonds"], ["forest", "Forêt / zone de transition"], ["savanna", "Savane / plateau"], ["unknown", "Not assessed"]),
      locLabel: "Farm province / département / village", locPlaceholder: "Ngounié, Mouila, village ou repère",
      cropExamples: "Manioc, banane plantain, maraîchage, cacao, aviculture, pisciculture…",
      contracts: options(["written", "Signed buyer agreement"], ["purchase_order", "Bon de commande"], ["verbal", "Verbal commitment"], ["none", "No commitment / open market"]),
      markets: options(["urban", "Urban market / wholesaler"], ["coop", "Cooperative / aggregation"], ["processor", "Processor / institutional buyer"], ["farm_gate", "Farm-gate / local market"]),
      extensions: options(["provincial", "Provincial agriculture service"], ["igad", "IGAD / field support"], ["coop", "Cooperative / private adviser"], ["none", "None"]),
      inputPrograms: options(["self_funded", "Self-funded"], ["supplier", "Supplier / buyer advance"], ["emf", "Bank / EMF"], ["program", "Documented support program"], ["needs_full_financing", "Finance not yet secured"]),
    }).filter(f => !["equipment_value_usd", "prev_season_yield", "input_cost_estimate"].includes(f.key)),
    gaField("gabon_land_evidence", "Parcel reference / evidence of use / lease end date", "Land & Tenure"),
    gaField("gabon_water_source", "Water source, irrigation and dry-season reliability", "Infrastructure"),
    gaField("gabon_storage", "Storage, cold chain and rainy-season road access", "Infrastructure"),
    gaField("gabon_farm_risks", "Flooding, dry spells, pest or livestock disease controls", "Farming Operations"),
    gaField("gabon_production_date", "Planned planting / stocking date", "Farming Operations", "", "date"),
    gaField("gabon_harvest_date", "Expected harvest / sale readiness date", "Farming Operations", "", "date"),
    gaField("gabon_buyer_terms", "Buyer, committed volume, price and payment terms", "Market & Contracts"),
    gaField("gabon_prior_output", "Previous cycle output and unit (kg, crates, birds, etc.)", "Season Performance"),
    gaField("gabon_prior_costs", "Previous cycle costs (XAF)", "Season Performance", "", "number"),
    gaField("pig_count", "Pigs", "Livestock & Assets", "", "number"),
    gaField("gabon_asset_value", "Documented livestock and equipment value (XAF)", "Livestock & Assets", "", "number"),
    gaField("gabon_insurance", "Insurance coverage or contingency plan", "Inputs & Insurance"),
  ],
};

export const countryConfigs: Record<string, CountryConfig> = {
  gabon,
  kenya: {
    label: "Kenya",
    currency: "KES",
    currencySymbol: "KSh",
    phonePrefix: "+254",
    phonePlaceholder: "+254 7XX XXX XXX",
    idTypes: [
      { value: "national_id", label: "National ID", placeholder: "12345678" },
      { value: "huduma_namba", label: "Huduma Namba", placeholder: "HN-XXXXXXXXX" },
      { value: "passport", label: "Passport", placeholder: "A1234567" },
    ],
    taxId: { label: "KRA PIN", placeholder: "A012345678Z" },
    socialId: { label: "NHIF / NSSF Number", placeholder: "XXXXXXXXXX" },
    bureaus: ["TransUnion Kenya (CRB)", "Metropol CRB", "Creditinfo"],
    wallets: ["M-Pesa", "Airtel Money", "T-Kash"],
    telcos: ["Safaricom", "Airtel Kenya", "Telkom Kenya"],
    utilities: ["Kenya Power (KPLC)", "Nairobi Water"],
    businessRegistration: { label: "Business Registration (CR)", placeholder: "PVT-XXXXXXX" },
    additionalRetailFields: [
      { key: "county", label: "County", placeholder: "e.g. Nairobi, Mombasa", type: "text" },
      { key: "employer", label: "Employer / Income Source", placeholder: "Company or self-employed", type: "text" },
      { key: "monthly_income", label: "Monthly Income (KES)", placeholder: "50000", type: "number" },
      ...breadBasketRetail("KES"),
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Agriculture, Retail, Services…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "5", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (KES)", placeholder: "200000", type: "number" },
    ],
    collateralOptions: defaultCollateral,
    loanPurposes: defaultLoanPurposes,
    taxClearanceDoc: { label: "KRA Tax Compliance Certificate", description: "Valid tax compliance certificate from KRA." },
    microFields: microBase({
      currency: "KES",
      locationExamples: "e.g. Gikomba, Toi, Marikiti, City Park",
      dailySalesPlaceholder: "5000",
      walletLabel: "M-Pesa Daily Volume (KES)",
      walletPlaceholder: "10000",
      stockSourceExamples: "e.g. Eastleigh imports, local wholesaler",
      savingsGroupLabel: "Chama / Savings Group",
      savingsAmountLabel: "Chama Monthly Contribution (KES)",
    }),
    smeFields: smeBase("KES", "KCB, Equity, Co-op, ABSA, Stanbic"),
    socialMediaFields: defaultSocialMedia("+254 7XX XXX XXX"),
    cashFlowFields: defaultCashFlow,
    businessStabilityFields: defaultStability,
    farmerFields: farmerBase({
      currency: "KES",
      landTenure: [
        { value: "title_deed", label: "Title Deed (Freehold)" },
        { value: "allotment_letter", label: "Allotment Letter" },
        { value: "community_land", label: "Community / Trust Land" },
        { value: "leased", label: "Leased / Rented" },
        { value: "squatter", label: "Squatter / No Formal Tenure" },
      ],
      zones: [
        { value: "highland", label: "Highland (>2000m — Tea, Dairy)" },
        { value: "upper_midland", label: "Upper Midland (1500-2000m — Coffee, Maize)" },
        { value: "lower_midland", label: "Lower Midland (900-1500m — Mixed)" },
        { value: "lowland", label: "Lowland (<900m — Sugarcane, Horticulture)" },
        { value: "arid", label: "Arid / Semi-Arid (Livestock, Drought-Resistant)" },
      ],
      locLabel: "County / Sub-County",
      locPlaceholder: "e.g. Kiambu, Nakuru, Trans-Nzoia",
      cropExamples: "e.g. Tea, Coffee, Maize, Horticulture, Dairy",
      contracts: [
        { value: "ktda_tea", label: "Active — KTDA (Tea)" },
        { value: "bat_tobacco", label: "Active — BAT (Tobacco)" },
        { value: "sugar", label: "Active — Sugar (Mumias / Nzoia)" },
        { value: "hort_export", label: "Active — Horticulture Export" },
        { value: "none", label: "No Contract — Open Market" },
      ],
      markets: [
        { value: "formal_export", label: "Formal Export / Off-taker" },
        { value: "ncpb", label: "NCPB / Commodity Board" },
        { value: "private_buyers", label: "Established Private Buyers" },
        { value: "local_market", label: "Local Market / Wakulima" },
        { value: "farm_gate", label: "Farm-gate / Informal" },
      ],
      extensions: [
        { value: "county_govt", label: "County Government — Regular" },
        { value: "private", label: "Private Agronomist" },
        { value: "ngo", label: "NGO (e.g. One Acre Fund, USAID)" },
        { value: "none", label: "No Extension Access" },
      ],
      inputPrograms: [
        { value: "self_funded", label: "Self-Funded" },
        { value: "govt_subsidy", label: "Government Subsidy (e-voucher)" },
        { value: "agro_dealer_credit", label: "Agro-Dealer Credit" },
        { value: "shared_borrowed", label: "Shared / Borrowed Inputs" },
        { value: "needs_full_financing", label: "Needs Full Financing" },
      ],
    }),
  },

  nigeria: {
    label: "Nigeria",
    currency: "NGN",
    currencySymbol: "₦",
    phonePrefix: "+234",
    phonePlaceholder: "+234 8XX XXX XXXX",
    idTypes: [
      { value: "bvn", label: "BVN", placeholder: "22XXXXXXXXX" },
      { value: "nin", label: "NIN", placeholder: "XXXXXXXXXXX" },
      { value: "voters_card", label: "Voter's Card (PVC)", placeholder: "XXXXXXXXXXXXXXXXXXXX" },
      { value: "drivers_license", label: "Driver's License", placeholder: "AAA12345AA01" },
    ],
    taxId: { label: "TIN (FIRS)", placeholder: "XXXXXXXXXX" },
    socialId: null,
    bureaus: ["CRC Credit Bureau", "FirstCentral Credit Bureau", "CreditRegistry"],
    wallets: ["OPay", "PalmPay", "Paga", "Kuda"],
    telcos: ["MTN Nigeria", "Airtel Nigeria", "Glo", "9mobile"],
    utilities: ["EKEDC", "IKEDC", "AEDC"],
    businessRegistration: { label: "CAC Registration", placeholder: "RC-XXXXXXX" },
    additionalRetailFields: [
      { key: "state", label: "State of Residence", placeholder: "e.g. Lagos, Abuja", type: "text" },
      { key: "employer", label: "Employer / Income Source", placeholder: "Company or self-employed", type: "text" },
      { key: "monthly_income", label: "Monthly Income (NGN)", placeholder: "150000", type: "number" },
      ...breadBasketRetail("NGN"),
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Trade, Manufacturing…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "10", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (NGN)", placeholder: "500000", type: "number" },
    ],
    collateralOptions: [
      ...defaultCollateral,
      { value: "warehouse_receipt", label: "Warehouse Receipt" },
    ],
    loanPurposes: defaultLoanPurposes,
    taxClearanceDoc: { label: "FIRS Tax Clearance Certificate", description: "Valid FIRS tax clearance certificate." },
    microFields: microBase({
      currency: "NGN",
      locationExamples: "e.g. Balogun, Onitsha Main, Alaba International",
      dailySalesPlaceholder: "20000",
      walletLabel: "OPay / PalmPay Daily Volume (NGN)",
      walletPlaceholder: "50000",
      stockSourceExamples: "e.g. Lagos imports, Onitsha wholesaler",
      savingsGroupLabel: "Ajo / Esusu Savings Group",
      savingsAmountLabel: "Ajo Monthly Contribution (NGN)",
    }),
    smeFields: smeBase("NGN", "GTBank, Access, Zenith, First Bank, UBA"),
    socialMediaFields: defaultSocialMedia("+234 8XX XXX XXXX"),
    cashFlowFields: defaultCashFlow,
    businessStabilityFields: defaultStability,
    farmerFields: farmerBase({
      currency: "NGN",
      landTenure: [
        { value: "c_of_o", label: "Certificate of Occupancy (C of O)" },
        { value: "cro", label: "Customary Right of Occupancy" },
        { value: "lease", label: "Lease Agreement" },
        { value: "family_land", label: "Family / Community Land" },
        { value: "no_formal", label: "No Formal Tenure" },
      ],
      zones: [
        { value: "guinea_savanna", label: "Guinea Savanna (Middle Belt)" },
        { value: "sudan_savanna", label: "Sudan Savanna (North)" },
        { value: "rainforest", label: "Rainforest (South)" },
        { value: "mangrove", label: "Mangrove / Swamp (Delta)" },
        { value: "sahel", label: "Sahel (Far North)" },
      ],
      locLabel: "State / LGA",
      locPlaceholder: "e.g. Kaduna, Benue, Ogun",
      cropExamples: "e.g. Cassava, Rice, Yams, Cocoa, Palm Oil",
      contracts: [
        { value: "olam", label: "Active — Olam" },
        { value: "dangote", label: "Active — Dangote" },
        { value: "cbn_anchor", label: "Active — CBN Anchor Borrowers" },
        { value: "nirsal", label: "Active — NIRSAL" },
        { value: "none", label: "No Contract — Open Market" },
      ],
      markets: [
        { value: "formal_export", label: "Formal Export / Off-taker" },
        { value: "commodity_exchange", label: "Commodity Exchange" },
        { value: "private_buyers", label: "Established Private Buyers" },
        { value: "local_market", label: "Local Market" },
        { value: "farm_gate", label: "Farm-gate / Informal" },
      ],
      extensions: [
        { value: "adp", label: "ADP (Agricultural Development Programme)" },
        { value: "private", label: "Private Agronomist" },
        { value: "ngo", label: "NGO Programme" },
        { value: "none", label: "No Extension Access" },
      ],
      inputPrograms: [
        { value: "self_funded", label: "Self-Funded" },
        { value: "cbn_anchor", label: "CBN Anchor Borrowers Programme" },
        { value: "agro_dealer_credit", label: "Agro-Dealer Credit" },
        { value: "shared_borrowed", label: "Shared / Borrowed" },
        { value: "needs_full_financing", label: "Needs Full Financing" },
      ],
    }),
  },

  ghana: {
    label: "Ghana",
    currency: "GHS",
    currencySymbol: "GH₵",
    phonePrefix: "+233",
    phonePlaceholder: "+233 XX XXX XXXX",
    idTypes: [
      { value: "ghana_card", label: "Ghana Card", placeholder: "GHA-XXXXXXXXX-X" },
      { value: "voter_id", label: "Voter ID", placeholder: "XXXXXXXXXX" },
      { value: "passport", label: "Passport", placeholder: "G0123456" },
    ],
    taxId: { label: "TIN (GRA)", placeholder: "CXXXXXXXXXX" },
    socialId: { label: "SSNIT Number", placeholder: "CXXXXXXXXXX" },
    bureaus: ["XDS Data Ghana", "Dun & Bradstreet Ghana"],
    wallets: ["MTN MoMo", "AirtelTigo Money", "Vodafone Cash"],
    telcos: ["MTN Ghana", "AirtelTigo", "Vodafone Ghana"],
    utilities: ["ECG", "Ghana Water"],
    businessRegistration: { label: "RGD Business Certificate", placeholder: "CS-XXXXXXXX" },
    additionalRetailFields: [
      { key: "region", label: "Region", placeholder: "e.g. Greater Accra", type: "text" },
      { key: "employer", label: "Employer / Income Source", placeholder: "Company or self-employed", type: "text" },
      { key: "monthly_income", label: "Monthly Income (GHS)", placeholder: "3000", type: "number" },
      ...breadBasketRetail("GHS"),
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Agribusiness, Services…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "3", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (GHS)", placeholder: "15000", type: "number" },
    ],
    collateralOptions: defaultCollateral,
    loanPurposes: defaultLoanPurposes,
    taxClearanceDoc: { label: "GRA Tax Clearance Certificate", description: "Valid tax clearance from Ghana Revenue Authority." },
    microFields: microBase({
      currency: "GHS",
      locationExamples: "e.g. Makola, Kejetia, Kaneshie Market",
      dailySalesPlaceholder: "500",
      walletLabel: "MTN MoMo Daily Volume (GHS)",
      walletPlaceholder: "1000",
      stockSourceExamples: "e.g. Tema port imports, Kumasi wholesaler",
      savingsGroupLabel: "Susu Savings Group",
      savingsAmountLabel: "Susu Monthly Contribution (GHS)",
    }),
    smeFields: smeBase("GHS", "GCB, Ecobank, Stanbic, CalBank, Fidelity"),
    socialMediaFields: defaultSocialMedia("+233 XX XXX XXXX"),
    cashFlowFields: defaultCashFlow,
    businessStabilityFields: defaultStability,
    farmerFields: farmerBase({
      currency: "GHS",
      landTenure: [
        { value: "freehold", label: "Freehold" },
        { value: "leasehold", label: "Leasehold" },
        { value: "stool_land", label: "Stool / Skin Land" },
        { value: "family_land", label: "Family Land" },
        { value: "sharecropping", label: "Sharecropping (Abunu / Abusa)" },
      ],
      zones: [
        { value: "forest", label: "Forest Zone (Cocoa Belt)" },
        { value: "transition", label: "Transition Zone" },
        { value: "guinea_savanna", label: "Guinea Savanna (Northern)" },
        { value: "coastal_savanna", label: "Coastal Savanna" },
        { value: "sudan_savanna", label: "Sudan Savanna (Upper East/West)" },
      ],
      locLabel: "Region / District",
      locPlaceholder: "e.g. Ashanti, Western, Northern",
      cropExamples: "e.g. Cocoa, Cashew, Maize, Rice, Cassava",
      contracts: [
        { value: "cocobod", label: "Active — COCOBOD (Cocoa)" },
        { value: "pbc", label: "Active — PBC Ltd" },
        { value: "olam_ghana", label: "Active — Olam Ghana" },
        { value: "none", label: "No Contract — Open Market" },
      ],
      markets: [
        { value: "cocobod", label: "COCOBOD Purchase" },
        { value: "formal_export", label: "Formal Export" },
        { value: "private_buyers", label: "Established Private Buyers" },
        { value: "local_market", label: "Local Market" },
        { value: "farm_gate", label: "Farm-gate / Informal" },
      ],
      extensions: [
        { value: "mofa", label: "MoFA (Ministry of Food & Agriculture)" },
        { value: "private", label: "Private Agronomist" },
        { value: "ngo", label: "NGO (e.g. USAID, GIZ)" },
        { value: "none", label: "No Extension Access" },
      ],
      inputPrograms: [
        { value: "self_funded", label: "Self-Funded" },
        { value: "pfj", label: "Planting for Food & Jobs (PFJ)" },
        { value: "agro_dealer_credit", label: "Agro-Dealer Credit" },
        { value: "shared_borrowed", label: "Shared / Borrowed" },
        { value: "needs_full_financing", label: "Needs Full Financing" },
      ],
    }),
  },

  rwanda: {
    label: "Rwanda",
    currency: "RWF",
    currencySymbol: "FRw",
    phonePrefix: "+250",
    phonePlaceholder: "+250 78X XXX XXX",
    idTypes: [
      { value: "national_id", label: "National ID (Indangamuntu)", placeholder: "1 19XX XXXXXXX X XX" },
      { value: "passport", label: "Passport", placeholder: "PCXXXXXXX" },
    ],
    taxId: { label: "TIN (RRA)", placeholder: "XXXXXXXXX" },
    socialId: { label: "RSSB Number", placeholder: "XXXXXXXXXX" },
    bureaus: ["TransUnion Rwanda (CRB)"],
    wallets: ["MTN MoMo Rwanda", "Airtel Money Rwanda"],
    telcos: ["MTN Rwanda", "Airtel Rwanda"],
    utilities: ["REG (Rwanda Energy)", "WASAC"],
    businessRegistration: { label: "RDB Registration", placeholder: "UPI XXXXXXXX" },
    additionalRetailFields: [
      { key: "province", label: "Province / District", placeholder: "e.g. Kigali, Eastern", type: "text" },
      { key: "employer", label: "Employer / Income Source", placeholder: "Company or Umurenge SACCO", type: "text" },
      { key: "monthly_income", label: "Monthly Income (RWF)", placeholder: "200000", type: "number" },
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Agriculture, ICT…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "2", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (RWF)", placeholder: "800000", type: "number" },
    ],
  },

  zimbabwe: {
    label: "Zimbabwe",
    currency: "ZWL",
    currencySymbol: "ZWL$",
    phonePrefix: "+263",
    phonePlaceholder: "+263 7X XXX XXXX",
    idTypes: [
      { value: "national_id", label: "National ID", placeholder: "XX-XXXXXXX-X-XX" },
      { value: "passport", label: "Passport", placeholder: "FNXXXXXXX" },
      { value: "drivers_license", label: "Driver's License", placeholder: "XXXXXXXXXX" },
    ],
    taxId: { label: "ZIMRA Tax Clearance (ITF 263)", placeholder: "XXXXXXXXXX" },
    socialId: { label: "NSSA Number", placeholder: "XXXXXXXXXX" },
    bureaus: ["TransUnion Zimbabwe", "Dun & Bradstreet Zimbabwe"],
    wallets: ["EcoCash", "OneMoney", "InnBucks"],
    telcos: ["Econet Wireless", "NetOne", "Telecel"],
    utilities: ["ZESA (Zimbabwe Electricity)", "Harare Water", "ZINWA"],
    businessRegistration: { label: "Companies Registry (DEEDS)", placeholder: "CR XX/XXXX" },
    additionalRetailFields: [
      { key: "province", label: "Province", placeholder: "e.g. Harare, Bulawayo, Manicaland", type: "text" },
      { key: "suburb", label: "Suburb / Ward", placeholder: "e.g. Borrowdale, Nkulumane", type: "text" },
      { key: "employer", label: "Employer", placeholder: "Company name", type: "text" },
      { key: "employment_type", label: "Employment Type", placeholder: "Permanent / Contract / Casual", type: "text" },
      { key: "employment_years", label: "Years with Current Employer", placeholder: "3", type: "number" },
      { key: "monthly_income", label: "Monthly Income (ZWL)", placeholder: "500000", type: "number" },
      { key: "usd_income", label: "Monthly Income (USD, if any)", placeholder: "200", type: "number" },
      { key: "payslip_net", label: "Net Payslip Amount (ZWL)", placeholder: "450000", type: "number" },
      { key: "other_income", label: "Other Income Sources (ZWL)", placeholder: "Rental, diaspora remittances", type: "text" },
      { key: "other_income_amount", label: "Other Income Amount (ZWL)", placeholder: "100000", type: "number" },
      ...breadBasketRetail("ZWL"),
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Mining, Agriculture, Trade…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "5", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (ZWL)", placeholder: "2000000", type: "number" },
      { key: "usd_revenue", label: "Monthly Revenue (USD, if any)", placeholder: "1000", type: "number" },
      { key: "export_income", label: "Export Income (%)", placeholder: "0", type: "number" },
    ],
    microFields: microBase({
      currency: "ZWL",
      locationExamples: "e.g. Soweto Market, City Market, Kamwala",
      dailySalesPlaceholder: "500",
      walletLabel: "Airtel Money Daily Volume (ZWL)",
      walletPlaceholder: "2000",
      stockSourceExamples: "e.g. Lusaka wholesaler, SA imports",
      savingsGroupLabel: "Chilimba / Savings Group",
      savingsAmountLabel: "Chilimba Monthly Contribution (ZWL)",
    }),
    smeFields: smeBase("ZWL", "Zanaco, Stanbic, FNB, ABSA, Atlas Mara"),
    socialMediaFields: defaultSocialMedia("+260 9XX XXX XXX"),
    cashFlowFields: defaultCashFlow,
    businessStabilityFields: defaultStability,
    farmerFields: farmerBase({
      currency: "ZWL",
      landTenure: [
        { value: "title_deed", label: "Title Deed (State Land)" },
        { value: "leasehold", label: "Leasehold (14/99 year)" },
        { value: "customary_land", label: "Customary Land (Chief Allocation)" },
        { value: "resettlement", label: "Resettlement Scheme" },
        { value: "no_formal", label: "No Formal Tenure" },
      ],
      zones: [
        { value: "zone_i", label: "Zone I — Low Rainfall (Southern/Western, <800mm)" },
        { value: "zone_iia", label: "Zone IIa — Moderate (Central Plateau, 800-1000mm)" },
        { value: "zone_iib", label: "Zone IIb — Moderate (Valleys)" },
        { value: "zone_iii", label: "Zone III — High Rainfall (Northern, >1000mm)" },
      ],
      locLabel: "Province / District",
      locPlaceholder: "e.g. Lusaka, Central, Copperbelt",
      cropExamples: "e.g. Maize, Soya, Tobacco, Cotton, Groundnuts",
      contracts: [
        { value: "zambia_breweries", label: "Active — Zambia Breweries" },
        { value: "cargill", label: "Active — Cargill" },
        { value: "alliance_one", label: "Active — Alliance One (Tobacco)" },
        { value: "none", label: "No Contract — Open Market" },
      ],
      markets: [
        { value: "fra", label: "FRA (Food Reserve Agency)" },
        { value: "formal_export", label: "Formal Export" },
        { value: "private_buyers", label: "Established Private Buyers" },
        { value: "local_market", label: "Local Market" },
        { value: "farm_gate", label: "Farm-gate / Informal" },
      ],
      extensions: [
        { value: "daco", label: "DACO / Ministry of Agriculture" },
        { value: "private", label: "Private Agronomist" },
        { value: "ngo", label: "NGO (e.g. IAPRI, USAID)" },
        { value: "none", label: "No Extension Access" },
      ],
      inputPrograms: [
        { value: "self_funded", label: "Self-Funded" },
        { value: "fisp", label: "FISP (Farmer Input Support Programme)" },
        { value: "agro_dealer_credit", label: "Agro-Dealer Credit" },
        { value: "shared_borrowed", label: "Shared / Borrowed" },
        { value: "needs_full_financing", label: "Needs Full Financing" },
      ],
    }),
    multiCurrencyOptions: [
      { value: "zwl", label: "ZWL (Zimbabwe Dollar)" },
      { value: "usd", label: "USD" },
      { value: "zar", label: "ZAR (South African Rand)" },
      { value: "mixed", label: "Multi-Currency Mix" },
    ],
    taxClearanceDoc: { label: "ZIMRA Tax Clearance (ITF 263)", description: "Valid ZIMRA tax clearance certificate." },
  },

  senegal: {
    label: "Senegal",
    currency: "XOF",
    currencySymbol: "FCFA",
    phonePrefix: "+221",
    phonePlaceholder: "+221 7X XXX XXXX",
    idTypes: [
      { value: "cni", label: "CNI (Carte Nationale d'Identité)", placeholder: "1 XXX XXXX XXXXX" },
      { value: "passport", label: "Passport", placeholder: "AXXXXXXX" },
    ],
    taxId: { label: "NINEA", placeholder: "XXXXXXXXX" },
    socialId: null,
    bureaus: ["Creditinfo UEMOA"],
    wallets: ["Orange Money", "Wave", "Free Money"],
    telcos: ["Orange Senegal", "Free Senegal", "Expresso"],
    utilities: ["SENELEC", "SDE/Sen'Eau"],
    businessRegistration: { label: "RCCM / NINEA", placeholder: "SN-DKR-XXXX-XXXX" },
    additionalRetailFields: [
      { key: "region", label: "Region", placeholder: "e.g. Dakar, Thiès", type: "text" },
      { key: "employer", label: "Employeur / Source de Revenu", placeholder: "Entreprise ou indépendant", type: "text" },
      { key: "monthly_income", label: "Revenu Mensuel (FCFA)", placeholder: "250000", type: "number" },
      ...breadBasketRetail("XOF"),
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Secteur d'Activité", placeholder: "Commerce, Pêche, Agriculture…", type: "text" },
      { key: "employees", label: "Nombre d'Employés", placeholder: "3", type: "number" },
      { key: "monthly_revenue", label: "Chiffre d'Affaires Mensuel (FCFA)", placeholder: "1000000", type: "number" },
    ],
  },

  tanzania: {
    label: "Tanzania",
    currency: "TZS",
    currencySymbol: "TSh",
    phonePrefix: "+255",
    phonePlaceholder: "+255 7XX XXX XXX",
    idTypes: [
      { value: "nida", label: "NIDA (National ID)", placeholder: "XXXXXXXXXXXXXXXXXXXX" },
      { value: "voter_id", label: "Voter ID", placeholder: "T-XXXXXXXX" },
      { value: "passport", label: "Passport", placeholder: "ABXXXXXXX" },
    ],
    taxId: { label: "TIN (TRA)", placeholder: "XXX-XXX-XXX" },
    socialId: { label: "NSSF Number", placeholder: "XXXXXXXXXX" },
    bureaus: ["Creditinfo Tanzania"],
    wallets: ["M-Pesa (Vodacom)", "Airtel Money", "Halopesa"],
    telcos: ["Vodacom Tanzania", "Airtel Tanzania", "Halotel (TTCL)"],
    utilities: ["TANESCO", "DAWASA"],
    businessRegistration: { label: "BRELA Registration", placeholder: "XXXXXXXXX" },
    additionalRetailFields: [
      { key: "region", label: "Region", placeholder: "e.g. Dar es Salaam, Arusha", type: "text" },
      { key: "employer", label: "Employer / Income Source", placeholder: "Company or self-employed", type: "text" },
      { key: "monthly_income", label: "Monthly Income (TZS)", placeholder: "500000", type: "number" },
      ...breadBasketRetail("TZS"),
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Agriculture, Mining, Tourism…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "4", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (TZS)", placeholder: "2000000", type: "number" },
    ],
    collateralOptions: defaultCollateral,
    loanPurposes: defaultLoanPurposes,
    taxClearanceDoc: { label: "TRA Tax Clearance Certificate", description: "Valid tax clearance from Tanzania Revenue Authority." },
    microFields: microBase({
      currency: "TZS",
      locationExamples: "e.g. Kariakoo, Mwenge, Makumbusho",
      dailySalesPlaceholder: "50000",
      walletLabel: "M-Pesa Daily Volume (TZS)",
      walletPlaceholder: "100000",
      stockSourceExamples: "e.g. Dar imports, local wholesaler",
      savingsGroupLabel: "Vikoba / SACCOS Savings",
      savingsAmountLabel: "Vikoba Monthly Contribution (TZS)",
    }),
    smeFields: smeBase("TZS", "NMB, CRDB, NBC, Stanbic, DTB"),
    socialMediaFields: defaultSocialMedia("+255 7XX XXX XXX"),
    cashFlowFields: defaultCashFlow,
    businessStabilityFields: defaultStability,
    farmerFields: farmerBase({
      currency: "TZS",
      landTenure: [
        { value: "ccro", label: "CCRO (Certificate of Customary Right)" },
        { value: "right_of_occupancy", label: "Right of Occupancy (Granted)" },
        { value: "village_allocation", label: "Village Council Allocation" },
        { value: "leased", label: "Leased / Rented" },
        { value: "no_formal", label: "No Formal Tenure" },
      ],
      zones: [
        { value: "northern_highlands", label: "Northern Highlands (Kilimanjaro, Arusha)" },
        { value: "southern_highlands", label: "Southern Highlands (Iringa, Mbeya)" },
        { value: "coastal_lowland", label: "Coastal Lowland (Dar, Tanga)" },
        { value: "lake_zone", label: "Lake Zone (Mwanza, Kagera)" },
        { value: "central_plateau", label: "Central Plateau (Dodoma, Singida)" },
      ],
      locLabel: "Region / District",
      locPlaceholder: "e.g. Arusha, Iringa, Mbeya",
      cropExamples: "e.g. Coffee, Cashew, Tea, Cotton, Maize, Sisal",
      contracts: [
        { value: "tcb_coffee", label: "Active — Tanzania Coffee Board" },
        { value: "cashewnut_board", label: "Active — Cashewnut Board" },
        { value: "kilombero_sugar", label: "Active — Kilombero Sugar" },
        { value: "none", label: "No Contract — Open Market" },
      ],
      markets: [
        { value: "auction", label: "Auction / Commodity Exchange" },
        { value: "formal_export", label: "Formal Export" },
        { value: "private_buyers", label: "Established Private Buyers" },
        { value: "local_market", label: "Local Market" },
        { value: "farm_gate", label: "Farm-gate / Informal" },
      ],
      extensions: [
        { value: "lga_extension", label: "LGA Extension Officer" },
        { value: "private", label: "Private Agronomist" },
        { value: "ngo", label: "NGO Programme" },
        { value: "none", label: "No Extension Access" },
      ],
      inputPrograms: [
        { value: "self_funded", label: "Self-Funded" },
        { value: "tasaf", label: "TASAF / Government Programme" },
        { value: "agro_dealer_credit", label: "Agro-Dealer Credit" },
        { value: "shared_borrowed", label: "Shared / Borrowed" },
        { value: "needs_full_financing", label: "Needs Full Financing" },
      ],
    }),
  },

  sierra_leone: {
    label: "Sierra Leone",
    currency: "SLE",
    currencySymbol: "Le",
    phonePrefix: "+232",
    phonePlaceholder: "+232 XX XXXXXX",
    idTypes: [
      { value: "national_id", label: "National ID (NCRA)", placeholder: "XXXXXXXXXX" },
      { value: "voter_id", label: "Voter ID (NEC)", placeholder: "XXXXXXXXXX" },
      { value: "passport", label: "Passport", placeholder: "PXXXXXXX" },
    ],
    taxId: { label: "TIN (NRA)", placeholder: "XXXXXXXXX" },
    socialId: { label: "NASSIT Number", placeholder: "XXXXXXXXXX" },
    bureaus: ["Creditinfo Sierra Leone"],
    wallets: ["Orange Money SL", "Afrimoney"],
    telcos: ["Orange SL", "Africell"],
    utilities: ["EDSA", "GVWC"],
    businessRegistration: { label: "OARG Business Registration", placeholder: "SL-XXXXXXX" },
    additionalRetailFields: [
      { key: "district", label: "District", placeholder: "e.g. Western Area, Bo", type: "text" },
      { key: "employer", label: "Employer / Income Source", placeholder: "Company or self-employed", type: "text" },
      { key: "monthly_income", label: "Monthly Income (SLE)", placeholder: "3000", type: "number" },
      ...breadBasketRetail("SLE"),
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Mining, Agriculture, Trade…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "2", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (SLE)", placeholder: "15000", type: "number" },
    ],
  },

  mali: {
    label: "Mali",
    currency: "XOF",
    currencySymbol: "FCFA",
    phonePrefix: "+223",
    phonePlaceholder: "+223 XX XX XX XX",
    idTypes: [
      { value: "nina", label: "NINA", placeholder: "XXXXXXXXXXXXXXXXXX" },
      { value: "cni", label: "CNI", placeholder: "XXXXXXXXX" },
      { value: "passport", label: "Passport", placeholder: "MXXXXXXX" },
    ],
    taxId: { label: "NIF (DGI)", placeholder: "XXXXXXXXX" },
    socialId: null,
    bureaus: ["Creditinfo UEMOA"],
    wallets: ["Orange Money Mali", "Moov Money"],
    telcos: ["Orange Mali", "Moov Africa Mali"],
    utilities: ["EDM-SA"],
    businessRegistration: { label: "RCCM", placeholder: "MA-BKO-XXXX-XXXX" },
    additionalRetailFields: [
      { key: "region", label: "Région", placeholder: "e.g. Bamako, Sikasso", type: "text" },
      { key: "employer", label: "Employeur / Source de Revenu", placeholder: "Entreprise ou indépendant", type: "text" },
      { key: "monthly_income", label: "Revenu Mensuel (FCFA)", placeholder: "150000", type: "number" },
      ...breadBasketRetail("XOF"),
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Secteur d'Activité", placeholder: "Agriculture, Commerce…", type: "text" },
      { key: "employees", label: "Nombre d'Employés", placeholder: "2", type: "number" },
      { key: "monthly_revenue", label: "Chiffre d'Affaires Mensuel (FCFA)", placeholder: "500000", type: "number" },
    ],
  },

  uganda: {
    label: "Uganda",
    currency: "UGX",
    currencySymbol: "USh",
    phonePrefix: "+256",
    phonePlaceholder: "+256 7XX XXX XXX",
    idTypes: [
      { value: "nin", label: "NIN (National ID)", placeholder: "CMXXXXXXXXXXXXXXXXX" },
      { value: "voter_id", label: "Voter ID", placeholder: "XXXXXXXXX" },
      { value: "passport", label: "Passport", placeholder: "AXXXXXXX" },
    ],
    taxId: { label: "TIN (URA)", placeholder: "XXXXXXXXXX" },
    socialId: { label: "NSSF Number", placeholder: "XXXXXXXXXX" },
    bureaus: ["Compuscan Uganda", "Creditinfo Uganda"],
    wallets: ["MTN MoMo Uganda", "Airtel Money Uganda"],
    telcos: ["MTN Uganda", "Airtel Uganda"],
    utilities: ["UMEME", "NWSC"],
    businessRegistration: { label: "URSB Registration", placeholder: "XXXXXXXXXX" },
    additionalRetailFields: [
      { key: "district", label: "District", placeholder: "e.g. Kampala, Wakiso", type: "text" },
      { key: "employer", label: "Employer / Income Source", placeholder: "Company or self-employed", type: "text" },
      { key: "monthly_income", label: "Monthly Income (UGX)", placeholder: "1000000", type: "number" },
      ...breadBasketRetail("UGX"),
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Agriculture, Trade, Services…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "3", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (UGX)", placeholder: "5000000", type: "number" },
    ],
  },

  south_africa: {
    label: "South Africa",
    currency: "ZAR",
    currencySymbol: "R",
    phonePrefix: "+27",
    phonePlaceholder: "+27 XX XXX XXXX",
    idTypes: [
      { value: "rsa_id", label: "RSA ID", placeholder: "YYMMDDXXXXXXX" },
      { value: "passport", label: "Passport", placeholder: "AXXXXXXXX" },
      { value: "asylum_permit", label: "Asylum Seeker Permit", placeholder: "XXXXXXXXXX" },
    ],
    taxId: { label: "SARS Tax Number", placeholder: "XXXXXXXXXX" },
    socialId: null,
    bureaus: ["TransUnion SA", "Experian SA", "Compuscan SA", "XDS"],
    wallets: ["FNB eWallet", "Standard Bank Instant Money"],
    telcos: ["Vodacom", "MTN SA", "Cell C", "Telkom SA"],
    utilities: ["Eskom", "City Power", "Rand Water"],
    businessRegistration: { label: "CIPC Registration", placeholder: "XXXX/XXXXXX/XX" },
    additionalRetailFields: [
      { key: "province", label: "Province", placeholder: "e.g. Gauteng, Western Cape", type: "text" },
      { key: "employer", label: "Employer / Income Source", placeholder: "Company or self-employed", type: "text" },
      { key: "monthly_income", label: "Monthly Income (ZAR)", placeholder: "15000", type: "number" },
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Mining, Finance, Retail…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "10", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (ZAR)", placeholder: "100000", type: "number" },
      { key: "bee_level", label: "B-BBEE Level", placeholder: "1-8", type: "text" },
    ],
  },

  mozambique: {
    label: "Mozambique",
    currency: "MZN",
    currencySymbol: "MT",
    phonePrefix: "+258",
    phonePlaceholder: "+258 8X XXX XXXX",
    idTypes: [
      { value: "bi", label: "BI (Bilhete de Identidade)", placeholder: "XXXXXXXXXXXXX" },
      { value: "passport", label: "Passaporte", placeholder: "MXXXXXXX" },
    ],
    taxId: { label: "NUIT", placeholder: "XXXXXXXXX" },
    socialId: { label: "INSS Number", placeholder: "XXXXXXXXXX" },
    bureaus: ["Creditinfo Mozambique"],
    wallets: ["M-Pesa Mozambique", "e-Mola"],
    telcos: ["Vodacom Moçambique", "Tmcel"],
    utilities: ["EDM", "FIPAG"],
    businessRegistration: { label: "CRCom Registration", placeholder: "XXXXXXXXX" },
    additionalRetailFields: [
      { key: "province", label: "Província", placeholder: "e.g. Maputo, Sofala", type: "text" },
      { key: "employer", label: "Empregador / Fonte de Renda", placeholder: "Empresa ou autônomo", type: "text" },
      { key: "monthly_income", label: "Renda Mensal (MZN)", placeholder: "20000", type: "number" },
      ...breadBasketRetail("MZN"),
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Setor de Atividade", placeholder: "Agricultura, Comércio…", type: "text" },
      { key: "employees", label: "Número de Funcionários", placeholder: "3", type: "number" },
      { key: "monthly_revenue", label: "Receita Mensal (MZN)", placeholder: "100000", type: "number" },
    ],
  },

  zambia: {
    label: "Zambia",
    currency: "ZMW",
    currencySymbol: "ZK",
    phonePrefix: "+260",
    phonePlaceholder: "+260 9XX XXX XXX",
    idTypes: [
      { value: "nrc", label: "NRC (National Registration Card)", placeholder: "XXXXXX/XX/X" },
      { value: "passport", label: "Passport", placeholder: "ZNXXXXXXX" },
    ],
    taxId: { label: "TPIN (ZRA)", placeholder: "XXXXXXXXXX" },
    socialId: { label: "NAPSA Number", placeholder: "XXXXXXXXXX" },
    bureaus: ["TransUnion Zambia", "Creditinfo Zambia"],
    wallets: ["Airtel Money Zambia", "MTN MoMo Zambia", "Zoona"],
    telcos: ["Airtel Zambia", "MTN Zambia", "Zamtel"],
    utilities: ["ZESCO", "Lusaka Water"],
    businessRegistration: { label: "PACRA Registration", placeholder: "XXXXXXXXXX" },
    additionalRetailFields: [
      { key: "province", label: "Province", placeholder: "e.g. Lusaka, Copperbelt", type: "text" },
      { key: "employer", label: "Employer / Income Source", placeholder: "Company or self-employed", type: "text" },
      { key: "monthly_income", label: "Monthly Income (ZMW)", placeholder: "5000", type: "number" },
      ...breadBasketRetail("ZMW"),
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Mining, Agriculture, Trade…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "4", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (ZMW)", placeholder: "30000", type: "number" },
    ],
  },

  ethiopia: {
    label: "Ethiopia",
    currency: "ETB",
    currencySymbol: "Br",
    phonePrefix: "+251",
    phonePlaceholder: "+251 9XX XXX XXX",
    idTypes: [
      { value: "kebele_id", label: "Kebele ID", placeholder: "XXXXXXXXXX" },
      { value: "fayda_id", label: "Fayda Digital ID", placeholder: "XXXXXXXXXXXXXX" },
      { value: "passport", label: "Passport", placeholder: "EPXXXXXXX" },
    ],
    taxId: { label: "TIN (MoR)", placeholder: "XXXXXXXXXX" },
    socialId: null,
    bureaus: ["National Bank of Ethiopia (Credit Reference)"],
    wallets: ["Telebirr", "M-Birr", "CBE Birr"],
    telcos: ["Ethio Telecom", "Safaricom Ethiopia"],
    utilities: ["EEU (Ethiopian Electric Utility)", "Addis Ababa Water"],
    businessRegistration: { label: "Trade License", placeholder: "XX/XX/XXXX" },
    additionalRetailFields: [
      { key: "region", label: "Region / City", placeholder: "e.g. Addis Ababa, Oromia", type: "text" },
      { key: "employer", label: "Employer / Income Source", placeholder: "Company or self-employed", type: "text" },
      { key: "monthly_income", label: "Monthly Income (ETB)", placeholder: "15000", type: "number" },
      ...breadBasketRetail("ETB"),
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Agriculture, Textile, Trade…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "5", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (ETB)", placeholder: "100000", type: "number" },
    ],
    collateralOptions: defaultCollateral,
    loanPurposes: defaultLoanPurposes,
    taxClearanceDoc: { label: "MoR Tax Clearance Certificate", description: "Valid tax clearance from Ministry of Revenue." },
    microFields: microBase({
      currency: "ETB",
      locationExamples: "e.g. Merkato, Shola Market, Piazza",
      dailySalesPlaceholder: "3000",
      walletLabel: "Telebirr Daily Volume (ETB)",
      walletPlaceholder: "5000",
      stockSourceExamples: "e.g. Merkato wholesale, local producers",
      savingsGroupLabel: "Equb / Savings Group",
      savingsAmountLabel: "Equb Monthly Contribution (ETB)",
    }),
    smeFields: smeBase("ETB", "CBE, Awash, Dashen, Abyssinia, Zemen"),
    socialMediaFields: defaultSocialMedia("+251 9XX XXX XXX"),
    cashFlowFields: defaultCashFlow,
    businessStabilityFields: defaultStability,
    farmerFields: farmerBase({
      currency: "ETB",
      landTenure: [
        { value: "state_use_right", label: "State Use Right (Certified)" },
        { value: "kebele_allocation", label: "Kebele Allocation" },
        { value: "communal_grazing", label: "Communal Grazing Land" },
        { value: "leased", label: "Leased from Other Farmer" },
        { value: "no_formal", label: "No Formal Tenure" },
      ],
      zones: [
        { value: "dega", label: "Dega — Highland (>2500m, Teff, Barley)" },
        { value: "weyna_dega", label: "Weyna Dega — Mid-altitude (1500-2500m, Coffee, Wheat)" },
        { value: "kolla", label: "Kolla — Lowland (<1500m, Sorghum, Sesame)" },
        { value: "bereha", label: "Bereha — Arid / Desert (Livestock)" },
      ],
      locLabel: "Region / Woreda",
      locPlaceholder: "e.g. Oromia, Amhara, SNNPR",
      cropExamples: "e.g. Coffee, Teff, Wheat, Sesame, Chat, Sorghum",
      contracts: [
        { value: "ecx_coffee", label: "Active — ECX (Coffee)" },
        { value: "flower_farms", label: "Active — Flower Farm / Export" },
        { value: "sugar_corp", label: "Active — Sugar Corporation" },
        { value: "none", label: "No Contract — Open Market" },
      ],
      markets: [
        { value: "ecx", label: "ECX (Ethiopian Commodity Exchange)" },
        { value: "formal_export", label: "Formal Export" },
        { value: "union_cooperative", label: "Union / Cooperative Purchase" },
        { value: "local_market", label: "Local Market" },
        { value: "farm_gate", label: "Farm-gate / Informal" },
      ],
      extensions: [
        { value: "da", label: "DA (Development Agent) — Regular" },
        { value: "regional_boa", label: "Regional Bureau of Agriculture" },
        { value: "ngo", label: "NGO (e.g. USAID, GIZ)" },
        { value: "none", label: "No Extension Access" },
      ],
      inputPrograms: [
        { value: "self_funded", label: "Self-Funded" },
        { value: "regional_govt", label: "Regional Government Scheme" },
        { value: "mfi_credit", label: "MFI Credit (ACSI, OCSSCO)" },
        { value: "shared_borrowed", label: "Shared / Borrowed" },
        { value: "needs_full_financing", label: "Needs Full Financing" },
      ],
    }),
  },
};

export const productTypes = [
  { value: "micro_loan", label: "Micro-loan" },
  { value: "nano_credit", label: "Nano-credit" },
  { value: "sme_working_capital", label: "SME Working Capital" },
  { value: "retail_individual", label: "Retail Individual" },
  { value: "micro_enterprise", label: "Micro-enterprise" },
  { value: "asset_finance", label: "Asset Finance" },
  { value: "agriculture", label: "Agriculture Loan" },
  { value: "education", label: "Education Loan" },
];
