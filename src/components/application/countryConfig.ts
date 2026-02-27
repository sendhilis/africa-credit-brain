// Country-specific configuration for application forms
// Maps to scoring model feature inputs per market

export interface CountryConfig {
  label: string;
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
}

export const countryConfigs: Record<string, CountryConfig> = {
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
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Agriculture, Retail, Services…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "5", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (KES)", placeholder: "200000", type: "number" },
    ],
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
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Trade, Manufacturing…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "10", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (NGN)", placeholder: "500000", type: "number" },
    ],
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
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Agribusiness, Services…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "3", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (GHS)", placeholder: "15000", type: "number" },
    ],
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
      { key: "employer", label: "Employer / Income Source", placeholder: "Company or self-employed", type: "text" },
      { key: "monthly_income", label: "Monthly Income (ZWL)", placeholder: "500000", type: "number" },
      { key: "usd_income", label: "Monthly Income (USD, if any)", placeholder: "200", type: "number" },
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Mining, Agriculture, Trade…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "5", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (ZWL)", placeholder: "2000000", type: "number" },
      { key: "usd_revenue", label: "Monthly Revenue (USD, if any)", placeholder: "1000", type: "number" },
      { key: "export_income", label: "Export Income (%)", placeholder: "0", type: "number" },
    ],
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
    wallets: ["M-Pesa Tanzania", "Tigo Pesa", "Airtel Money"],
    telcos: ["Vodacom Tanzania", "Tigo", "Airtel Tanzania"],
    utilities: ["TANESCO", "DAWASA"],
    businessRegistration: { label: "BRELA Registration", placeholder: "XXXXXXXXX" },
    additionalRetailFields: [
      { key: "region", label: "Region", placeholder: "e.g. Dar es Salaam, Arusha", type: "text" },
      { key: "employer", label: "Employer / Income Source", placeholder: "Company or self-employed", type: "text" },
      { key: "monthly_income", label: "Monthly Income (TZS)", placeholder: "500000", type: "number" },
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Agriculture, Mining, Tourism…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "4", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (TZS)", placeholder: "2000000", type: "number" },
    ],
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
    ],
    additionalBusinessFields: [
      { key: "sector", label: "Business Sector", placeholder: "Agriculture, Textile, Trade…", type: "text" },
      { key: "employees", label: "Number of Employees", placeholder: "5", type: "number" },
      { key: "monthly_revenue", label: "Monthly Revenue (ETB)", placeholder: "100000", type: "number" },
    ],
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
