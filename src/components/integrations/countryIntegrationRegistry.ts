// Comprehensive registry of integration entities by country

export interface IntegrationEntity {
  name: string;
  type: "bank" | "mno" | "utility" | "credit_union" | "bureau" | "fintech";
  category: string;
  apiType: "REST" | "SOAP" | "ISO8583" | "USSD" | "Custom";
  description: string;
  sandboxAvailable: boolean;
  requiredCredentials: string[];
  endpoints: { name: string; method: string; path: string; description: string }[];
  logo?: string;
}

export interface CountryRegistry {
  code: string;
  name: string;
  currency: string;
  entities: IntegrationEntity[];
}

const zimbabweRegistry: CountryRegistry = {
  code: "ZW",
  name: "Zimbabwe",
  currency: "ZWL/USD",
  entities: [
    // ── Banks ──
    {
      name: "CBZ Bank",
      type: "bank",
      category: "Commercial Bank",
      apiType: "REST",
      description: "Largest commercial bank in Zimbabwe. Provides transaction data, account verification, and balance checks.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "api_secret", "merchant_id"],
      endpoints: [
        { name: "Account Verify", method: "POST", path: "/v1/accounts/verify", description: "Verify account holder details" },
        { name: "Balance Check", method: "GET", path: "/v1/accounts/{id}/balance", description: "Check account balance" },
        { name: "Transaction History", method: "GET", path: "/v1/accounts/{id}/transactions", description: "Fetch 12-month transaction history" },
        { name: "Statement Request", method: "POST", path: "/v1/statements/request", description: "Request certified bank statement" },
      ],
    },
    {
      name: "FBC Bank",
      type: "bank",
      category: "Commercial Bank",
      apiType: "REST",
      description: "Full-service commercial bank offering corporate and retail banking APIs.",
      sandboxAvailable: true,
      requiredCredentials: ["client_id", "client_secret"],
      endpoints: [
        { name: "Account Verify", method: "POST", path: "/api/v2/verify", description: "KYC account verification" },
        { name: "Transaction History", method: "GET", path: "/api/v2/transactions", description: "Transaction listing" },
        { name: "Balance Inquiry", method: "GET", path: "/api/v2/balance", description: "Real-time balance" },
      ],
    },
    {
      name: "Stanbic Bank Zimbabwe",
      type: "bank",
      category: "Commercial Bank",
      apiType: "REST",
      description: "Part of Standard Bank Group. Corporate & retail banking APIs with open banking compliance.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "api_secret", "certificate"],
      endpoints: [
        { name: "Account Info", method: "GET", path: "/v1/accounts/{id}", description: "Account details" },
        { name: "Transactions", method: "GET", path: "/v1/accounts/{id}/transactions", description: "Transaction history" },
        { name: "Direct Debit", method: "POST", path: "/v1/direct-debit", description: "Set up direct debit mandate" },
      ],
    },
    {
      name: "ZB Bank (formerly ZB Financial Holdings)",
      type: "bank",
      category: "Commercial Bank",
      apiType: "REST",
      description: "One of Zimbabwe's oldest banks. Retail and corporate banking integration.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "merchant_code"],
      endpoints: [
        { name: "Account Lookup", method: "GET", path: "/api/accounts/lookup", description: "Account holder lookup" },
        { name: "Statement Pull", method: "POST", path: "/api/statements/pull", description: "Pull bank statements" },
      ],
    },
    {
      name: "NMB Bank",
      type: "bank",
      category: "Commercial Bank",
      apiType: "REST",
      description: "National Merchant Bank of Zimbabwe. SME and retail banking APIs.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "api_secret"],
      endpoints: [
        { name: "Account Verify", method: "POST", path: "/v1/kyc/verify", description: "KYC verification" },
        { name: "Transactions", method: "GET", path: "/v1/transactions", description: "Transaction data" },
      ],
    },
    {
      name: "Steward Bank",
      type: "bank",
      category: "Commercial Bank",
      apiType: "REST",
      description: "EcoCash-aligned commercial bank. Deep mobile money integration capabilities.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "partner_id"],
      endpoints: [
        { name: "Account Link", method: "POST", path: "/api/link", description: "Link EcoCash to bank account" },
        { name: "Transactions", method: "GET", path: "/api/transactions", description: "Combined transactions" },
      ],
    },
    {
      name: "CABS (Central Africa Building Society)",
      type: "bank",
      category: "Building Society",
      apiType: "REST",
      description: "Largest building society in Zimbabwe. Mortgage and savings account APIs.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "client_secret"],
      endpoints: [
        { name: "Account Info", method: "GET", path: "/api/v1/accounts", description: "Account information" },
        { name: "Savings History", method: "GET", path: "/api/v1/savings/history", description: "Savings transaction history" },
      ],
    },
    {
      name: "BancABC Zimbabwe",
      type: "bank",
      category: "Commercial Bank",
      apiType: "REST",
      description: "Atlas Mara-affiliated pan-African bank. Corporate banking APIs.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "api_secret"],
      endpoints: [
        { name: "Account Verify", method: "POST", path: "/v1/verify", description: "Account verification" },
        { name: "Transactions", method: "GET", path: "/v1/transactions", description: "Transaction history" },
      ],
    },
    {
      name: "Nedbank Zimbabwe",
      type: "bank",
      category: "Commercial Bank",
      apiType: "REST",
      description: "South African-owned commercial bank. Open banking APIs.",
      sandboxAvailable: true,
      requiredCredentials: ["client_id", "client_secret", "api_key"],
      endpoints: [
        { name: "Account Balance", method: "GET", path: "/api/accounts/balance", description: "Real-time balance" },
        { name: "Transaction List", method: "GET", path: "/api/transactions", description: "Transaction listing" },
      ],
    },
    {
      name: "First Capital Bank",
      type: "bank",
      category: "Commercial Bank",
      apiType: "REST",
      description: "Formerly Barclays Bank Zimbabwe. Retail and commercial banking.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "secret_key"],
      endpoints: [
        { name: "Verify Account", method: "POST", path: "/v1/accounts/verify", description: "Account verification" },
        { name: "Transactions", method: "GET", path: "/v1/txns", description: "Transaction data" },
      ],
    },
    {
      name: "Ecobank Zimbabwe",
      type: "bank",
      category: "Commercial Bank",
      apiType: "REST",
      description: "Pan-African banking group. Ecobank Open Banking APIs.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "client_id"],
      endpoints: [
        { name: "Account Info", method: "GET", path: "/api/v1/accounts", description: "Account details" },
        { name: "Transfers", method: "POST", path: "/api/v1/transfers", description: "Fund transfers" },
      ],
    },

    // ── MNOs / Mobile Money ──
    {
      name: "EcoCash (Econet Wireless)",
      type: "mno",
      category: "Mobile Money",
      apiType: "REST",
      description: "Zimbabwe's largest mobile money platform. ~10M subscribers. Transaction data, bill payments, P2P transfers.",
      sandboxAvailable: true,
      requiredCredentials: ["merchant_id", "merchant_key", "api_key"],
      endpoints: [
        { name: "Balance Check", method: "GET", path: "/v1/wallet/balance", description: "Wallet balance inquiry" },
        { name: "Transaction History", method: "GET", path: "/v1/wallet/transactions", description: "Mobile money transaction history" },
        { name: "Customer Verify", method: "POST", path: "/v1/customer/verify", description: "Verify customer by phone number" },
        { name: "C2B Payment", method: "POST", path: "/v1/payments/c2b", description: "Customer-to-business payment" },
        { name: "B2C Disbursement", method: "POST", path: "/v1/payments/b2c", description: "Business-to-customer disbursement" },
      ],
    },
    {
      name: "InnBucks",
      type: "mno",
      category: "Mobile Money / Fintech",
      apiType: "REST",
      description: "Growing mobile money and payments platform. Peer-to-peer and merchant payments.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "merchant_id"],
      endpoints: [
        { name: "Wallet Balance", method: "GET", path: "/api/wallet/balance", description: "Check wallet balance" },
        { name: "Transactions", method: "GET", path: "/api/transactions", description: "Transaction history" },
        { name: "Customer Lookup", method: "POST", path: "/api/customer/lookup", description: "Customer KYC lookup" },
      ],
    },
    {
      name: "OneMoney (NetOne)",
      type: "mno",
      category: "Mobile Money",
      apiType: "REST",
      description: "NetOne's mobile money service. State-owned telco mobile wallet.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "partner_code"],
      endpoints: [
        { name: "Balance", method: "GET", path: "/v1/balance", description: "Wallet balance" },
        { name: "Transactions", method: "GET", path: "/v1/transactions", description: "Transaction data" },
        { name: "Payment", method: "POST", path: "/v1/payment", description: "Initiate payment" },
      ],
    },
    {
      name: "Telecel Zimbabwe",
      type: "mno",
      category: "Telecom",
      apiType: "REST",
      description: "Third mobile operator in Zimbabwe. Telecash mobile money platform.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "secret"],
      endpoints: [
        { name: "Telecash Balance", method: "GET", path: "/api/telecash/balance", description: "Telecash wallet balance" },
        { name: "Transactions", method: "GET", path: "/api/telecash/transactions", description: "Transaction history" },
      ],
    },

    // ── Utilities ──
    {
      name: "ZESA (Zimbabwe Electricity Supply Authority)",
      type: "utility",
      category: "Electricity",
      apiType: "REST",
      description: "National electricity provider. Prepaid token purchases and consumption history.",
      sandboxAvailable: true,
      requiredCredentials: ["vendor_code", "api_key"],
      endpoints: [
        { name: "Meter Verify", method: "POST", path: "/v1/meters/verify", description: "Verify electricity meter number" },
        { name: "Purchase History", method: "GET", path: "/v1/meters/{id}/purchases", description: "Token purchase history" },
        { name: "Consumption", method: "GET", path: "/v1/meters/{id}/consumption", description: "Monthly consumption data" },
        { name: "Buy Token", method: "POST", path: "/v1/tokens/purchase", description: "Purchase prepaid token" },
      ],
    },
    {
      name: "Harare Water (City of Harare)",
      type: "utility",
      category: "Water",
      apiType: "REST",
      description: "Harare municipal water billing. Account verification and payment history.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "municipality_code"],
      endpoints: [
        { name: "Account Lookup", method: "GET", path: "/api/accounts/{ref}", description: "Look up water account" },
        { name: "Payment History", method: "GET", path: "/api/payments/{ref}", description: "Payment history" },
        { name: "Bill Payment", method: "POST", path: "/api/payments", description: "Submit payment" },
      ],
    },
    {
      name: "TelOne",
      type: "utility",
      category: "Telecommunications / ISP",
      apiType: "REST",
      description: "State-owned fixed-line telecom and internet provider. Billing and payment APIs.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "partner_id"],
      endpoints: [
        { name: "Account Verify", method: "GET", path: "/api/verify/{account}", description: "Verify TelOne account" },
        { name: "Bill History", method: "GET", path: "/api/bills/{account}", description: "Billing history" },
        { name: "Payment", method: "POST", path: "/api/payments", description: "Bill payment" },
      ],
    },
    {
      name: "Zinwa (Zimbabwe National Water Authority)",
      type: "utility",
      category: "Water",
      apiType: "REST",
      description: "National water authority for rural and peri-urban areas.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key"],
      endpoints: [
        { name: "Account Lookup", method: "GET", path: "/api/accounts/{id}", description: "Account details" },
        { name: "Payments", method: "GET", path: "/api/payments/{id}", description: "Payment records" },
      ],
    },

    // ── Credit Unions / MFIs ──
    {
      name: "ZETCU (Zimbabwe Federation of Trade Unions Credit Union)",
      type: "credit_union",
      category: "Credit Union",
      apiType: "REST",
      description: "Trade union-based credit union. Member savings and loan data.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "union_code"],
      endpoints: [
        { name: "Member Lookup", method: "POST", path: "/api/members/lookup", description: "Look up member by ID" },
        { name: "Savings Balance", method: "GET", path: "/api/members/{id}/savings", description: "Member savings balance" },
        { name: "Loan History", method: "GET", path: "/api/members/{id}/loans", description: "Loan repayment history" },
      ],
    },
    {
      name: "Civil Service Credit Union",
      type: "credit_union",
      category: "Credit Union",
      apiType: "REST",
      description: "Credit union for civil servants. Payroll-linked savings and loan data.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "org_code"],
      endpoints: [
        { name: "Member Verify", method: "POST", path: "/api/verify", description: "Verify member identity" },
        { name: "Payroll Data", method: "GET", path: "/api/payroll/{id}", description: "Payroll deduction history" },
        { name: "Loan Status", method: "GET", path: "/api/loans/{id}", description: "Active loan status" },
      ],
    },
    {
      name: "Zimbabwe Women's Microfinance Bank (ZWMB)",
      type: "credit_union",
      category: "Microfinance Bank",
      apiType: "REST",
      description: "Women-focused microfinance institution. Group lending and savings APIs.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "branch_code"],
      endpoints: [
        { name: "Group Lookup", method: "GET", path: "/api/groups/{id}", description: "Group lending details" },
        { name: "Savings", method: "GET", path: "/api/savings/{member_id}", description: "Individual savings" },
        { name: "Repayment History", method: "GET", path: "/api/repayments/{loan_id}", description: "Loan repayment data" },
      ],
    },
    {
      name: "Mukando Savings Groups (Digital)",
      type: "credit_union",
      category: "Savings Group",
      apiType: "REST",
      description: "Digitized traditional savings clubs (Mukando/Stokvel). Round-robin savings data.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "platform_id"],
      endpoints: [
        { name: "Group Info", method: "GET", path: "/api/groups/{id}", description: "Group membership and rotation" },
        { name: "Contributions", method: "GET", path: "/api/groups/{id}/contributions", description: "Contribution history" },
        { name: "Payout Schedule", method: "GET", path: "/api/groups/{id}/payouts", description: "Upcoming payouts" },
      ],
    },

    // ── Credit Bureaus ──
    {
      name: "TransUnion Zimbabwe",
      type: "bureau",
      category: "Credit Bureau",
      apiType: "REST",
      description: "Primary credit bureau in Zimbabwe. Credit reports, scores, and delinquency data.",
      sandboxAvailable: true,
      requiredCredentials: ["subscriber_code", "api_key", "certificate"],
      endpoints: [
        { name: "Credit Report", method: "POST", path: "/v1/reports/credit", description: "Pull full credit report" },
        { name: "Credit Score", method: "POST", path: "/v1/scores", description: "Get credit score" },
        { name: "Identity Verify", method: "POST", path: "/v1/identity/verify", description: "KYC identity verification" },
      ],
    },
    {
      name: "Dun & Bradstreet Zimbabwe",
      type: "bureau",
      category: "Business Credit Bureau",
      apiType: "REST",
      description: "Business credit reports and company verification for SME lending.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "subscriber_id"],
      endpoints: [
        { name: "Business Report", method: "POST", path: "/v1/business/report", description: "Business credit report" },
        { name: "Company Verify", method: "POST", path: "/v1/company/verify", description: "Company registration verification" },
      ],
    },
    {
      name: "XDS Zimbabwe",
      type: "bureau",
      category: "Credit Bureau",
      apiType: "REST",
      description: "Part of the XDS Group. Consumer and commercial credit reports, fraud detection, identity verification, and collections data across Zimbabwe.",
      sandboxAvailable: true,
      requiredCredentials: ["subscriber_code", "api_key", "api_secret"],
      endpoints: [
        { name: "Consumer Credit Report", method: "POST", path: "/v1/consumer/report", description: "Full consumer credit report with payment profile" },
        { name: "Commercial Report", method: "POST", path: "/v1/commercial/report", description: "Commercial entity credit report" },
        { name: "Fraud Check", method: "POST", path: "/v1/fraud/check", description: "Identity fraud and impersonation check" },
        { name: "Trace & Locate", method: "POST", path: "/v1/trace/locate", description: "Debtor tracing and address verification" },
      ],
    },
    {
      name: "CRB Africa Zimbabwe",
      type: "bureau",
      category: "Credit Bureau",
      apiType: "REST",
      description: "Licensed credit reference bureau providing consumer credit scoring, default listings, and affordability assessments across Zimbabwe's formal and informal sectors.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "subscriber_id", "certificate"],
      endpoints: [
        { name: "Credit Report", method: "POST", path: "/api/v1/reports/consumer", description: "Consumer credit report with default history" },
        { name: "Credit Score", method: "POST", path: "/api/v1/scores/consumer", description: "Proprietary consumer credit score" },
        { name: "Default Listing", method: "POST", path: "/api/v1/defaults/submit", description: "Submit adverse listing / default notice" },
        { name: "Affordability Check", method: "POST", path: "/api/v1/affordability", description: "Debt-to-income affordability assessment" },
      ],
    },
    {
      name: "Creditinfo Zimbabwe",
      type: "bureau",
      category: "Credit Bureau",
      apiType: "REST",
      description: "Part of Creditinfo Group (Iceland). Provides credit reporting, scoring, and decision analytics for consumer and SME lending in Zimbabwe.",
      sandboxAvailable: true,
      requiredCredentials: ["client_id", "client_secret", "subscriber_code"],
      endpoints: [
        { name: "Consumer Report", method: "POST", path: "/v2/consumer/report", description: "Detailed consumer credit report" },
        { name: "SME Report", method: "POST", path: "/v2/sme/report", description: "SME credit and trade report" },
        { name: "Decision Engine", method: "POST", path: "/v2/decision/evaluate", description: "Automated lending decision based on bureau data" },
        { name: "Portfolio Monitoring", method: "POST", path: "/v2/monitor/subscribe", description: "Subscribe to alerts on borrower credit changes" },
      ],
    },
    {
      name: "FinCheck Zimbabwe",
      type: "bureau",
      category: "Verification Bureau",
      apiType: "REST",
      description: "Digital verification and affordability bureau. Provides bank statement analysis, income verification, and real-time account checks for lenders.",
      sandboxAvailable: true,
      requiredCredentials: ["api_key", "partner_code"],
      endpoints: [
        { name: "Bank Statement Analysis", method: "POST", path: "/api/v1/statements/analyse", description: "Automated bank statement categorisation and income verification" },
        { name: "ID Verification", method: "POST", path: "/api/v1/identity/verify", description: "National ID and passport verification" },
        { name: "Affordability Assessment", method: "POST", path: "/api/v1/affordability/assess", description: "Real-time affordability calculation" },
      ],
    },

    // ── Fintechs ──
    {
      name: "Paynow Zimbabwe",
      type: "fintech",
      category: "Payment Gateway",
      apiType: "REST",
      description: "Leading payment gateway. Aggregate payments from EcoCash, bank transfers, and cards.",
      sandboxAvailable: true,
      requiredCredentials: ["integration_id", "integration_key"],
      endpoints: [
        { name: "Initiate Payment", method: "POST", path: "/api/v1/payments/initiate", description: "Create payment request" },
        { name: "Check Status", method: "GET", path: "/api/v1/payments/{id}/status", description: "Check payment status" },
        { name: "Payment History", method: "GET", path: "/api/v1/payments/history", description: "Transaction history" },
      ],
    },
    {
      name: "ZimSwitch",
      type: "fintech",
      category: "National Switch",
      apiType: "ISO8583",
      description: "National electronic payment switch. Interbank transfers and POS network.",
      sandboxAvailable: true,
      requiredCredentials: ["switch_id", "terminal_id", "certificate"],
      endpoints: [
        { name: "Balance Inquiry", method: "POST", path: "/switch/balance", description: "Interbank balance check" },
        { name: "Fund Transfer", method: "POST", path: "/switch/transfer", description: "ZIPIT instant transfer" },
      ],
    },
  ],
};

const kenyaRegistry: CountryRegistry = {
  code: "KE",
  name: "Kenya",
  currency: "KES",
  entities: [
    { name: "Equity Bank", type: "bank", category: "Commercial Bank", apiType: "REST", description: "Largest bank by customer base. Equitel mobile banking.", sandboxAvailable: true, requiredCredentials: ["api_key", "api_secret", "merchant_id"], endpoints: [{ name: "Account Verify", method: "POST", path: "/v1/accounts/verify", description: "Account verification" }, { name: "Transactions", method: "GET", path: "/v1/transactions", description: "Transaction history" }] },
    { name: "KCB Bank", type: "bank", category: "Commercial Bank", apiType: "REST", description: "Kenya Commercial Bank. Largest by assets.", sandboxAvailable: true, requiredCredentials: ["api_key", "client_secret"], endpoints: [{ name: "Account Info", method: "GET", path: "/api/accounts", description: "Account details" }, { name: "Statements", method: "GET", path: "/api/statements", description: "Bank statements" }] },
    { name: "Co-operative Bank", type: "bank", category: "Commercial Bank", apiType: "REST", description: "SACCO-aligned cooperative bank.", sandboxAvailable: true, requiredCredentials: ["api_key", "secret_key"], endpoints: [{ name: "Account Verify", method: "POST", path: "/v1/verify", description: "Verify account" }] },
    { name: "NCBA Bank", type: "bank", category: "Commercial Bank", apiType: "REST", description: "Merged NIC and CBA. M-Shwari partner.", sandboxAvailable: true, requiredCredentials: ["api_key", "api_secret"], endpoints: [{ name: "Transactions", method: "GET", path: "/api/transactions", description: "Transaction listing" }] },
    { name: "Absa Bank Kenya", type: "bank", category: "Commercial Bank", apiType: "REST", description: "Formerly Barclays Kenya.", sandboxAvailable: true, requiredCredentials: ["api_key", "client_id"], endpoints: [{ name: "Account Info", method: "GET", path: "/api/accounts", description: "Account info" }] },
    { name: "M-Pesa (Safaricom)", type: "mno", category: "Mobile Money", apiType: "REST", description: "World's leading mobile money platform. 50M+ users. Daraja API.", sandboxAvailable: true, requiredCredentials: ["consumer_key", "consumer_secret", "shortcode", "passkey"], endpoints: [{ name: "C2B Payment", method: "POST", path: "/mpesa/c2b/v1/simulate", description: "Customer-to-business" }, { name: "B2C Payment", method: "POST", path: "/mpesa/b2c/v1/paymentrequest", description: "Business-to-customer" }, { name: "Transaction Status", method: "POST", path: "/mpesa/transactionstatus/v1/query", description: "Check transaction" }, { name: "Account Balance", method: "POST", path: "/mpesa/accountbalance/v1/query", description: "Balance inquiry" }] },
    { name: "Airtel Money Kenya", type: "mno", category: "Mobile Money", apiType: "REST", description: "Airtel's mobile money service.", sandboxAvailable: true, requiredCredentials: ["client_id", "client_secret"], endpoints: [{ name: "Payments", method: "POST", path: "/v1/payments", description: "Payment processing" }] },
    { name: "Kenya Power (KPLC)", type: "utility", category: "Electricity", apiType: "REST", description: "National electricity distributor. Prepaid and postpaid.", sandboxAvailable: true, requiredCredentials: ["api_key", "vendor_code"], endpoints: [{ name: "Meter Verify", method: "POST", path: "/v1/meters/verify", description: "Meter verification" }, { name: "Token Purchase", method: "POST", path: "/v1/tokens/buy", description: "Buy prepaid token" }] },
    { name: "Nairobi Water", type: "utility", category: "Water", apiType: "REST", description: "Nairobi City Water and Sewerage Company.", sandboxAvailable: true, requiredCredentials: ["api_key"], endpoints: [{ name: "Bill Check", method: "GET", path: "/api/bills/{account}", description: "Check water bill" }] },
    { name: "TransUnion Kenya (CRB)", type: "bureau", category: "Credit Bureau", apiType: "REST", description: "Credit reference bureau for Kenya.", sandboxAvailable: true, requiredCredentials: ["subscriber_code", "api_key"], endpoints: [{ name: "Credit Report", method: "POST", path: "/v1/reports", description: "Pull credit report" }] },
    { name: "Metropol CRB", type: "bureau", category: "Credit Bureau", apiType: "REST", description: "Alternative credit reference bureau.", sandboxAvailable: true, requiredCredentials: ["api_key", "subscriber_id"], endpoints: [{ name: "Credit Score", method: "POST", path: "/v1/score", description: "Get Metropol score" }] },
  ],
};

const ghanaRegistry: CountryRegistry = {
  code: "GH",
  name: "Ghana",
  currency: "GHS",
  entities: [
    { name: "GCB Bank", type: "bank", category: "Commercial Bank", apiType: "REST", description: "Ghana Commercial Bank. Largest state bank.", sandboxAvailable: true, requiredCredentials: ["api_key", "merchant_id"], endpoints: [{ name: "Account Verify", method: "POST", path: "/v1/verify", description: "Account verification" }] },
    { name: "Ecobank Ghana", type: "bank", category: "Commercial Bank", apiType: "REST", description: "Pan-African bank with strong Ghanaian presence.", sandboxAvailable: true, requiredCredentials: ["api_key", "client_id"], endpoints: [{ name: "Transactions", method: "GET", path: "/api/transactions", description: "Transaction history" }] },
    { name: "MTN Mobile Money", type: "mno", category: "Mobile Money", apiType: "REST", description: "Dominant mobile money in Ghana. MTN MoMo API.", sandboxAvailable: true, requiredCredentials: ["subscription_key", "api_user", "api_key"], endpoints: [{ name: "Collection", method: "POST", path: "/v1_0/collection/requesttopay", description: "Request payment" }, { name: "Disbursement", method: "POST", path: "/v1_0/disbursement/transfer", description: "Send money" }] },
    { name: "Vodafone Cash", type: "mno", category: "Mobile Money", apiType: "REST", description: "Vodafone Ghana mobile wallet.", sandboxAvailable: true, requiredCredentials: ["api_key", "merchant_code"], endpoints: [{ name: "Payment", method: "POST", path: "/v1/payments", description: "Initiate payment" }] },
    { name: "ECG (Electricity Company of Ghana)", type: "utility", category: "Electricity", apiType: "REST", description: "Southern Ghana electricity provider.", sandboxAvailable: true, requiredCredentials: ["api_key", "vendor_id"], endpoints: [{ name: "Meter Check", method: "GET", path: "/api/meters/{id}", description: "Meter verification" }] },
    { name: "XDS Ghana (Credit Bureau)", type: "bureau", category: "Credit Bureau", apiType: "REST", description: "Ghana credit reference bureau.", sandboxAvailable: true, requiredCredentials: ["subscriber_key", "api_key"], endpoints: [{ name: "Credit Report", method: "POST", path: "/v1/reports", description: "Credit report" }] },
  ],
};

const nigeriaRegistry: CountryRegistry = {
  code: "NG",
  name: "Nigeria",
  currency: "NGN",
  entities: [
    { name: "GTBank (Guaranty Trust)", type: "bank", category: "Commercial Bank", apiType: "REST", description: "Leading Nigerian bank. GTWorld digital banking.", sandboxAvailable: true, requiredCredentials: ["api_key", "merchant_id"], endpoints: [{ name: "Account Verify", method: "POST", path: "/v1/verify", description: "BVN verification" }] },
    { name: "First Bank of Nigeria", type: "bank", category: "Commercial Bank", apiType: "REST", description: "Oldest and largest bank by total assets.", sandboxAvailable: true, requiredCredentials: ["api_key", "client_id"], endpoints: [{ name: "Account Info", method: "GET", path: "/api/accounts", description: "Account details" }] },
    { name: "Access Bank", type: "bank", category: "Commercial Bank", apiType: "REST", description: "Largest bank by customer base after Diamond merger.", sandboxAvailable: true, requiredCredentials: ["api_key", "secret_key"], endpoints: [{ name: "Transactions", method: "GET", path: "/api/transactions", description: "Transaction history" }] },
    { name: "Zenith Bank", type: "bank", category: "Commercial Bank", apiType: "REST", description: "Tier-1 commercial bank.", sandboxAvailable: true, requiredCredentials: ["api_key", "api_secret"], endpoints: [{ name: "Balance", method: "GET", path: "/api/balance", description: "Balance inquiry" }] },
    { name: "OPay", type: "mno", category: "Mobile Money / Fintech", apiType: "REST", description: "Leading mobile payment platform in Nigeria.", sandboxAvailable: true, requiredCredentials: ["merchant_id", "secret_key"], endpoints: [{ name: "Payment", method: "POST", path: "/v1/payments", description: "Initiate payment" }] },
    { name: "Flutterwave", type: "fintech", category: "Payment Gateway", apiType: "REST", description: "Pan-African payment infrastructure.", sandboxAvailable: true, requiredCredentials: ["public_key", "secret_key"], endpoints: [{ name: "Charge", method: "POST", path: "/v3/charges", description: "Initiate charge" }, { name: "Verify", method: "GET", path: "/v3/transactions/{id}/verify", description: "Verify transaction" }] },
    { name: "Paystack", type: "fintech", category: "Payment Gateway", apiType: "REST", description: "Modern payments infrastructure for Africa.", sandboxAvailable: true, requiredCredentials: ["secret_key", "public_key"], endpoints: [{ name: "Initialize", method: "POST", path: "/transaction/initialize", description: "Start transaction" }] },
    { name: "CRC Credit Bureau", type: "bureau", category: "Credit Bureau", apiType: "REST", description: "Nigeria's leading credit bureau.", sandboxAvailable: true, requiredCredentials: ["subscriber_code", "api_key"], endpoints: [{ name: "Credit Report", method: "POST", path: "/v1/reports", description: "Pull credit report" }] },
    { name: "PHCN / DisCos", type: "utility", category: "Electricity", apiType: "REST", description: "Electricity distribution companies.", sandboxAvailable: true, requiredCredentials: ["api_key", "vendor_code"], endpoints: [{ name: "Meter Verify", method: "POST", path: "/v1/verify", description: "Meter verification" }] },
  ],
};

const rwandaRegistry: CountryRegistry = {
  code: "RW",
  name: "Rwanda",
  currency: "RWF",
  entities: [
    { name: "Bank of Kigali", type: "bank", category: "Commercial Bank", apiType: "REST", description: "Largest commercial bank in Rwanda.", sandboxAvailable: true, requiredCredentials: ["api_key", "client_secret"], endpoints: [{ name: "Account Verify", method: "POST", path: "/v1/verify", description: "Account verification" }] },
    { name: "MTN Mobile Money Rwanda", type: "mno", category: "Mobile Money", apiType: "REST", description: "Leading mobile money in Rwanda.", sandboxAvailable: true, requiredCredentials: ["subscription_key", "api_user", "api_key"], endpoints: [{ name: "Collection", method: "POST", path: "/v1_0/collection/requesttopay", description: "Request payment" }] },
    { name: "Airtel Money Rwanda", type: "mno", category: "Mobile Money", apiType: "REST", description: "Airtel mobile money service.", sandboxAvailable: true, requiredCredentials: ["client_id", "client_secret"], endpoints: [{ name: "Payment", method: "POST", path: "/v1/payments", description: "Payment processing" }] },
    { name: "REG (Rwanda Energy Group)", type: "utility", category: "Electricity", apiType: "REST", description: "National electricity and water utility.", sandboxAvailable: true, requiredCredentials: ["api_key", "vendor_code"], endpoints: [{ name: "Meter Verify", method: "POST", path: "/v1/meters/verify", description: "Meter verification" }] },
    { name: "CRB Africa Rwanda", type: "bureau", category: "Credit Bureau", apiType: "REST", description: "Rwanda credit reference bureau.", sandboxAvailable: true, requiredCredentials: ["subscriber_code", "api_key"], endpoints: [{ name: "Report", method: "POST", path: "/v1/reports", description: "Credit report" }] },
  ],
};

const ugandaRegistry: CountryRegistry = {
  code: "UG",
  name: "Uganda",
  currency: "UGX",
  entities: [
    { name: "Stanbic Bank Uganda", type: "bank", category: "Commercial Bank", apiType: "REST", description: "Largest bank in Uganda by assets.", sandboxAvailable: true, requiredCredentials: ["api_key", "client_secret"], endpoints: [{ name: "Account Info", method: "GET", path: "/api/accounts", description: "Account details" }] },
    { name: "MTN Mobile Money Uganda", type: "mno", category: "Mobile Money", apiType: "REST", description: "Largest mobile money platform in Uganda.", sandboxAvailable: true, requiredCredentials: ["subscription_key", "api_user", "api_key"], endpoints: [{ name: "Collection", method: "POST", path: "/v1_0/collection/requesttopay", description: "Request payment" }] },
    { name: "Airtel Money Uganda", type: "mno", category: "Mobile Money", apiType: "REST", description: "Airtel mobile money service.", sandboxAvailable: true, requiredCredentials: ["client_id", "client_secret"], endpoints: [{ name: "Payment", method: "POST", path: "/v1/payments", description: "Payment processing" }] },
    { name: "Umeme", type: "utility", category: "Electricity", apiType: "REST", description: "Main electricity distribution company.", sandboxAvailable: true, requiredCredentials: ["api_key", "vendor_code"], endpoints: [{ name: "Meter Check", method: "POST", path: "/v1/meters/verify", description: "Verify meter" }] },
    { name: "Compuscan Uganda", type: "bureau", category: "Credit Bureau", apiType: "REST", description: "Uganda credit reference bureau.", sandboxAvailable: true, requiredCredentials: ["subscriber_code", "api_key"], endpoints: [{ name: "Report", method: "POST", path: "/v1/reports", description: "Credit report" }] },
  ],
};

export const countryRegistries: Record<string, CountryRegistry> = {
  ZW: zimbabweRegistry,
  KE: kenyaRegistry,
  GH: ghanaRegistry,
  NG: nigeriaRegistry,
  RW: rwandaRegistry,
  UG: ugandaRegistry,
};

export const getCountryOptions = () =>
  Object.values(countryRegistries).map((r) => ({ code: r.code, name: r.name }));

export const getEntitiesByCountry = (code: string) =>
  countryRegistries[code]?.entities || [];

export const getEntityTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    bank: "Banks",
    mno: "Mobile Money / MNOs",
    utility: "Utilities",
    credit_union: "Credit Unions & MFIs",
    bureau: "Credit Bureaus",
    fintech: "Fintechs & Payment Gateways",
  };
  return labels[type] || type;
};

export const getEntityTypeIcon = (type: string) => type;

export const entityTypeOrder = ["bank", "mno", "utility", "credit_union", "bureau", "fintech"];
