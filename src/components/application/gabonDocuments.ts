import type { GabonCategory } from "../../../supabase/functions/_shared/gabon-credit";

export const gabonDocuments = [
  { key: "id_copy", title: "CNIE, attestation NIP, passport or residence card", desc: "Upload the identification selected on the application. An attestation NIP is supporting evidence, not a substitute for lender identity checks." },
  { key: "bank_statement", title: "Relevés bancaires (3 consecutive months)", desc: "Complete statements from a bank serving the applicant in Gabon." },
  { key: "mobile_money_statement", title: "Airtel Money / Moov Money statement", desc: "Upload the transaction history showing dates and balances; separate sales from transfers and cash-ins." },
  { key: "utility_bill", title: "Factures SEEG (3 consecutive months)", desc: "Electricity or water bills in the applicant’s name, where available." },
  { key: "address_proof", title: "Justificatif de domicile", desc: "Certificat de résidence, bail or attestation d’hébergement. Officer review only." },
  { key: "credit_report", title: "Existing credit report / repayment record", desc: "Use a report obtained through an authorized lender channel or a bank/EMF repayment statement. Officer review only." },
  { key: "payslip", title: "Bulletins de paie / attestation de solde", desc: "Salary slips, a civil-service pay statement or pension evidence. Officer review only.", categories: ["retail"] },
  { key: "employment_proof", title: "Attestation de travail / contrat de travail", desc: "Use employment or other documented income evidence if applicable. Officer review only.", categories: ["retail"] },
  { key: "pos_statement", title: "Relevé TPE / caisse", desc: "Dated point-of-sale activity or settlement statement.", categories: ["micro", "sme"] },
  { key: "trade_license", title: "Extrait RCCM / justificatif ANPI-Gabon", desc: "Registration or operating authorization, if applicable; informal traders can provide separate evidence of activity.", categories: ["micro", "sme"] },
  { key: "trader_records", title: "Carnet de ventes / justificatif de marché", desc: "Dated cash ledger, supplier receipts, market fees or stall authorization. Officer review only.", categories: ["micro"] },
  { key: "savings_records", title: "Carnet de tontine / échéancier EMF", desc: "Show actual contributions, withdrawals or existing debt payments. Officer review only.", categories: ["micro"] },
  { key: "financial_statement", title: "États financiers SYSCOHADA", desc: "Bilan, compte de résultat and cash-flow records where applicable.", categories: ["sme"] },
  { key: "tax_clearance", title: "Attestation de régularité fiscale (DGI)", desc: "Attach available DGI documentation and evidence of NIF. Officer review only.", categories: ["sme"] },
  { key: "management_accounts", title: "Comptes de gestion / balance âgée", desc: "Include aged receivables, payables or contracts supporting turnover. Officer review only.", categories: ["sme"] },
  { key: "company_governance", title: "Statuts / mandat du signataire", desc: "Company statutes and proof of signing authority. Officer review only.", categories: ["sme"] },
  { key: "land_document", title: "Titre foncier / bail / preuve de droit d’usage", desc: "Document the parcel and access for the financed cycle. An attestation does not establish mortgageable title. Officer review only.", categories: ["farmer"] },
  { key: "contract_farming_doc", title: "Contrat d’achat / bon de commande", desc: "Identify the buyer, committed volumes, pricing and payment dates. Officer review only.", categories: ["farmer"] },
  { key: "prev_season_records", title: "Carnet de production / bons de livraison", desc: "Previous-cycle harvest, sales, input receipts, cooperative records or livestock sales. Officer review only.", categories: ["farmer"] },
  { key: "farm_budget", title: "Budget de campagne / devis fournisseurs", desc: "Production and transport costs, planting or stocking dates, sales and repayment schedule. Officer review only.", categories: ["farmer"] },
  { key: "agri_insurance_doc", title: "Assurance agricole / registre d’élevage", desc: "Policy, animal health or flock records where applicable. Officer review only.", categories: ["farmer"] },
] satisfies { key: string; title: string; desc: string; categories?: GabonCategory[] }[];

export const getGabonDocuments = (category: string) => gabonDocuments.filter(doc => !doc.categories || doc.categories.some(segment => segment === category));

const gabonOcrTypes = new Set(["id_copy", "bank_statement", "mobile_money_statement", "utility_bill", "pos_statement", "trade_license", "financial_statement"]);
export const requiresGabonOcr = (key: string) => gabonOcrTypes.has(key);
