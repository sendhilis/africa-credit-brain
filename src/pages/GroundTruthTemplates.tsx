import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, Building2, Zap, CreditCard, ScrollText, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const TEMPLATES = [
  {
    id: "bank_statement",
    title: "Bank Statements",
    icon: Building2,
    description: "CBZ, FBC, Stanbic, EcoCash, InnBucks — 3-month minimum",
    fields: [
      "file_name", "bank_name", "account_number", "account_holder",
      "statement_period_start", "statement_period_end", "currency",
      "opening_balance", "closing_balance", "total_credits", "total_debits",
      "transaction_count", "salary_deposit_count", "salary_amount",
      "ecocash_in_count", "ecocash_in_total", "ecocash_out_count", "ecocash_out_total",
      "loan_repayment_count", "loan_repayment_total", "lowest_balance",
      "avg_monthly_balance", "income_regularity_score", "notes"
    ],
    sampleRow: [
      "cbz_jan2026.pdf", "CBZ Bank", "1234567890", "John Moyo",
      "2026-01-01", "2026-01-31", "USD",
      "1250.00", "2780.00", "8500.00", "6970.00",
      "47", "1", "4200.00",
      "12", "3100.00", "8", "2400.00",
      "2", "650.00", "85.00",
      "1890.00", "0.85", ""
    ],
    color: "text-blue-400",
  },
  {
    id: "utility_bill",
    title: "Utility Bills",
    icon: Zap,
    description: "ZESA, TelOne, Harare Water — address & payment verification",
    fields: [
      "file_name", "provider", "service_type", "account_number", "customer_name",
      "billing_period_start", "billing_period_end", "currency",
      "amount_due", "amount_paid", "payment_date", "payment_method",
      "days_past_due", "address_line_1", "address_line_2", "city",
      "is_prepaid", "meter_number", "units_consumed", "notes"
    ],
    sampleRow: [
      "zesa_feb2026.pdf", "ZESA", "Electricity", "M-98765", "John Moyo",
      "2026-02-01", "2026-02-28", "USD",
      "45.00", "45.00", "2026-02-15", "EcoCash",
      "0", "14 Samora Machel Ave", "", "Harare",
      "No", "54321", "120", ""
    ],
    color: "text-yellow-400",
  },
  {
    id: "id_document",
    title: "ID Documents",
    icon: CreditCard,
    description: "National ID (Metal/Plastic), Passport, Driver's Licence",
    fields: [
      "file_name", "document_type", "full_name", "id_number",
      "date_of_birth", "gender", "nationality", "district_of_origin",
      "issue_date", "expiry_date", "issuing_authority",
      "photo_present", "signature_present", "is_legible", "notes"
    ],
    sampleRow: [
      "id_front.jpg", "National ID (Metal)", "John Moyo", "63-123456-A-42",
      "1990-05-12", "M", "Zimbabwean", "Harare",
      "2015-03-20", "", "Registrar General",
      "Yes", "Yes", "Yes", ""
    ],
    color: "text-green-400",
  },
  {
    id: "trade_license",
    title: "Trade / Business Licenses",
    icon: ScrollText,
    description: "ZimRA tax clearance, city council licences, ZIMRA TIN",
    fields: [
      "file_name", "document_type", "business_name", "registration_number",
      "tax_id_tin", "owner_name", "business_type", "sector",
      "issue_date", "expiry_date", "issuing_authority",
      "address", "city", "is_current", "notes"
    ],
    sampleRow: [
      "zimra_clearance_2026.pdf", "Tax Clearance (ITF 263)", "Moyo Trading", "CR-2024/5678",
      "TIN-12345678", "John Moyo", "Sole Trader", "Retail",
      "2026-01-15", "2026-12-31", "ZimRA",
      "Mbare Musika Stall 42", "Harare", "Yes", ""
    ],
    color: "text-purple-400",
  },
  {
    id: "financial_statement",
    title: "Financial Statements",
    icon: BarChart3,
    description: "Audited/management accounts, cash flow, balance sheet",
    fields: [
      "file_name", "statement_type", "business_name", "period_start", "period_end",
      "currency", "total_revenue", "cost_of_sales", "gross_profit",
      "operating_expenses", "net_profit", "total_assets", "total_liabilities",
      "equity", "cash_and_equivalents", "accounts_receivable", "accounts_payable",
      "is_audited", "auditor_name", "notes"
    ],
    sampleRow: [
      "moyo_trading_fy2025.pdf", "Income Statement + Balance Sheet", "Moyo Trading", "2025-01-01", "2025-12-31",
      "USD", "120000.00", "78000.00", "42000.00",
      "28000.00", "14000.00", "65000.00", "31000.00",
      "34000.00", "8500.00", "12000.00", "9500.00",
      "No", "", ""
    ],
    color: "text-orange-400",
  },
];

function generateCSV(template: typeof TEMPLATES[0], includeSample: boolean): string {
  const header = template.fields.join(",");
  if (!includeSample) return header + "\n";
  const sample = template.sampleRow.map(v => v.includes(",") ? `"${v}"` : v).join(",");
  return header + "\n" + sample + "\n";
}

function downloadCSV(template: typeof TEMPLATES[0], includeSample: boolean) {
  const csv = generateCSV(template, includeSample);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ground_truth_${template.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${template.title} template`);
}

function downloadAll() {
  const sheets = TEMPLATES.map(t => {
    const section = `### ${t.title} ###\n${generateCSV(t, true)}`;
    return section;
  });
  const csv = sheets.join("\n\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ground_truth_all_templates.csv";
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Downloaded combined template");
}

export default function GroundTruthTemplates() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ground Truth Templates</h1>
            <p className="text-muted-foreground mt-1">
              Download CSV templates, fill in correct values for each sample document, then upload to benchmark extraction accuracy.
            </p>
          </div>
          <Button onClick={downloadAll} className="gap-2">
            <Download className="h-4 w-4" />
            Download All
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <Card key={t.id} className="border-border/50 bg-card/80 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <t.icon className={`h-5 w-5 ${t.color}`} />
                  <CardTitle className="text-base text-foreground">{t.title}</CardTitle>
                </div>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {t.fields.slice(0, 8).map((f) => (
                    <Badge key={f} variant="secondary" className="text-xs font-mono">
                      {f}
                    </Badge>
                  ))}
                  {t.fields.length > 8 && (
                    <Badge variant="outline" className="text-xs">
                      +{t.fields.length - 8} more
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => downloadCSV(t, false)}>
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Blank
                  </Button>
                  <Button size="sm" className="flex-1 gap-1.5" onClick={() => downloadCSV(t, true)}>
                    <Download className="h-3.5 w-3.5" />
                    With Sample
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base text-foreground">How to use</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Download</strong> — Pick a template (blank or with sample row).</li>
              <li><strong className="text-foreground">Collect documents</strong> — Gather 3–5 redacted samples per type (PDF/JPG).</li>
              <li><strong className="text-foreground">Fill in truth values</strong> — One row per document, entering the correct value for every field.</li>
              <li><strong className="text-foreground">Upload both</strong> — Provide the CSV + matching documents to run the accuracy benchmark.</li>
              <li><strong className="text-foreground">Review results</strong> — Field-level accuracy, confidence scores, and edge-case failures.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
