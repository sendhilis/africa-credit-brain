import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Plus, ChevronRight, ChevronLeft, User, Building2, FileText,
  Smartphone, Upload, Brain, CheckCircle2, ArrowRight, Globe, CreditCard,
  Banknote, Shield, Wifi, Send, Clock, Loader2, TrendingUp, Share2,
  BarChart3, Store, Landmark, Users, Tractor, Sprout, Mountain, Wheat
} from "lucide-react";
import { countryConfigs, productTypes, type CountryConfig } from "./countryConfig";
import { useAuth } from "@/contexts/AuthContext";
import PsychometricQuestionnaire, { type PsychometricResult } from "./PsychometricQuestionnaire";

type ProductCategory = "retail" | "micro" | "sme" | "farmer";
type PsychometricStatus = "not_started" | "link_sent" | "in_progress" | "completed" | "expired";

const STORAGE_KEY = "africaone_wizard_draft";

// Dynamic steps based on category
const getSteps = (category: ProductCategory) => {
  const base = [
    { id: "borrower", label: "Personal Info", icon: User },
  ];
  
  if (category === "retail") {
    return [
      ...base,
      { id: "financial", label: "Financial Profile", icon: Banknote },
      { id: "altdata", label: "Alt-Data Consent", icon: Wifi },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "psychometric", label: "Psychometric", icon: Brain },
      { id: "review", label: "Review & Submit", icon: CheckCircle2 },
    ];
  }
  
  if (category === "micro") {
    return [
      ...base,
      { id: "business", label: "Business Profile", icon: Store },
      { id: "cashflow", label: "Cash Flow & Savings", icon: TrendingUp },
      { id: "financial", label: "Loan & Repayment", icon: Banknote },
      { id: "altdata", label: "Alt-Data Consent", icon: Wifi },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "psychometric", label: "Psychometric", icon: Brain },
      { id: "review", label: "Review & Submit", icon: CheckCircle2 },
    ];
  }
  
  if (category === "farmer") {
    return [
      ...base,
      { id: "farm_profile", label: "Farm Profile", icon: Tractor },
      { id: "farm_operations", label: "Operations & Crops", icon: Wheat },
      { id: "farm_financial", label: "Season & Finance", icon: TrendingUp },
      { id: "financial", label: "Loan Request", icon: Banknote },
      { id: "altdata", label: "Alt-Data Consent", icon: Wifi },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "psychometric", label: "Psychometric", icon: Brain },
      { id: "review", label: "Review & Submit", icon: CheckCircle2 },
    ];
  }
  
  // SME
  return [
    ...base,
    { id: "corporate", label: "Corporate Profile", icon: Landmark },
    { id: "financials", label: "Financial Analysis", icon: BarChart3 },
    { id: "cashflow", label: "Cash Flow & Stability", icon: TrendingUp },
    { id: "social", label: "Social & Digital", icon: Share2 },
    { id: "financial", label: "Loan Request", icon: Banknote },
    { id: "altdata", label: "Alt-Data Consent", icon: Wifi },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "review", label: "Review & Submit", icon: CheckCircle2 },
  ];
};

interface WizardDraft {
  step: number;
  category: ProductCategory;
  country: string;
  formData: Record<string, string>;
  altDataConsents: Record<string, boolean>;
  documents: Record<string, string>;
  psychometricStatus: PsychometricStatus;
  psychometricMethod: string | null;
  savedAt: number;
}

const saveDraft = (draft: Omit<WizardDraft, "savedAt">) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {}
};

const loadDraft = (): WizardDraft | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const draft: WizardDraft = JSON.parse(raw);
    if (Date.now() - draft.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
};

const clearDraft = () => {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
};

const StepIndicator = ({ currentStep, steps }: { currentStep: number; steps: ReturnType<typeof getSteps> }) => (
  <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
    {steps.map((step, i) => {
      const Icon = step.icon;
      const isActive = i === currentStep;
      const isDone = i < currentStep;
      return (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isActive ? "bg-primary/20 text-primary border border-primary/30" :
            isDone ? "bg-success/15 text-success" :
            "text-muted-foreground"
          }`}>
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{step.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className={`h-3.5 w-3.5 mx-0.5 ${isDone ? "text-success" : "text-muted-foreground/30"}`} />
          )}
        </div>
      );
    })}
  </div>
);

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
      <div className="h-1 w-1 rounded-full bg-primary" />
      {label}
    </h3>
    <div className="grid grid-cols-2 gap-3">{children}</div>
  </div>
);

const Field = ({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) => (
  <div className={span2 ? "col-span-2" : ""}>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="mt-1">{children}</div>
  </div>
);

const PSYCHOMETRIC_STATUS_CONFIG: Record<PsychometricStatus, { label: string; color: string; icon: typeof Clock }> = {
  not_started: { label: "Not Started", color: "bg-muted/50 text-muted-foreground border-border", icon: Clock },
  link_sent: { label: "Link Sent", color: "bg-accent/10 text-accent border-accent/20", icon: Send },
  in_progress: { label: "In Progress", color: "bg-primary/10 text-primary border-primary/20", icon: Loader2 },
  completed: { label: "Completed", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  expired: { label: "Expired", color: "bg-destructive/10 text-destructive border-destructive/20", icon: Clock },
};

const NewApplicationWizard = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<ProductCategory>("retail");
  const [country, setCountry] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [altDataConsents, setAltDataConsents] = useState<Record<string, boolean>>({});
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [psychometricStatus, setPsychometricStatus] = useState<PsychometricStatus>("not_started");
  const [psychometricMethod, setPsychometricMethod] = useState<string | null>(null);
  const [sendingLink, setSendingLink] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [psychometricResult, setPsychometricResult] = useState<PsychometricResult | null>(null);
  const config = useMemo(() => country ? countryConfigs[country] : null, [country]);
  const steps = useMemo(() => getSteps(category), [category]);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) setHasDraft(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      saveDraft({ step, category, country, formData, altDataConsents, documents, psychometricStatus, psychometricMethod });
    }, 500);
    return () => clearTimeout(timeout);
  }, [open, step, category, country, formData, altDataConsents, documents, psychometricStatus, psychometricMethod]);

  const updateField = (key: string, value: string) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const toggleConsent = (key: string) =>
    setAltDataConsents(prev => ({ ...prev, [key]: !prev[key] }));

  const resetForm = () => {
    setStep(0);
    setCategory("retail");
    setCountry("");
    setFormData({});
    setAltDataConsents({});
    setDocuments({});
    setPsychometricStatus("not_started");
    setPsychometricMethod(null);
    setPsychometricResult(null);
    clearDraft();
    setHasDraft(false);
  };

  const restoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setStep(draft.step);
      setCategory(draft.category);
      setCountry(draft.country);
      setFormData(draft.formData);
      setAltDataConsents(draft.altDataConsents);
      setDocuments(draft.documents);
      setPsychometricStatus(draft.psychometricStatus || "not_started");
      setPsychometricMethod(draft.psychometricMethod || null);
      setOpen(true);
    }
  };

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  // Reset step to 0 when category changes
  const handleCategoryChange = (v: string) => {
    setCategory(v as ProductCategory);
    setStep(0);
  };

  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSendPsychometricLink = async () => {
    const phone = formData.psychometric_phone || formData.phone;
    if (!phone) {
      toast({ title: "Phone number required", description: "Enter the borrower's phone number to send the assessment link.", variant: "destructive" });
      return;
    }
    setSendingLink(true);
    await new Promise(r => setTimeout(r, 1500));
    setPsychometricStatus("link_sent");
    setPsychometricMethod("sms");
    updateField("psychometric_method", "sms");
    setSendingLink(false);
    toast({ title: "Assessment link sent", description: `Psychometric survey link sent to ${phone}. The borrower has 48 hours to complete it.` });
  };



  const { user } = useAuth();
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstitution = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("institution_id")
        .eq("user_id", user.id)
        .single();
      if (data?.institution_id) setInstitutionId(data.institution_id);
    };
    fetchInstitution();
  }, [user]);

  const handleSubmit = async () => {
    if (!config || !country) return;
    if (!institutionId) {
      toast({ title: "No institution", description: "Your account is not linked to an institution. Contact an admin.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Build extra_data with all category-specific fields
      const extraData: Record<string, any> = {
        bank: formData.bank,
        account_number: formData.account_number,
        bank_years: formData.bank_years,
        avg_balance: formData.avg_balance,
      };

      // Capture all micro/sme/farmer specific fields into extra_data
      const specialKeys = [
        ...(config.microFields?.map(f => f.key) || []),
        ...(config.smeFields?.map(f => f.key) || []),
        ...(config.farmerFields?.map(f => f.key) || []),
        ...(config.socialMediaFields?.map(f => f.key) || []),
        ...(config.cashFlowFields?.map(f => f.key) || []),
        ...(config.businessStabilityFields?.map(f => f.key) || []),
        "employment_type", "employment_years", "payslip_net", "other_income", "other_income_amount",
        "suburb", "primary_currency",
        "legal_structure", "cr_number", "vat_registered", "vat_number",
        "annual_turnover_zwl", "annual_turnover_usd", "gross_margin_pct", "net_profit_margin_pct",
        "monthly_fixed_costs", "avg_monthly_revenue_6m", "revenue_volatility",
        "highest_month_revenue", "lowest_month_revenue", "receivables_days", "payables_days",
        "forex_exposure_pct", "top_3_customers_pct", "top_supplier_dependency", "export_contracts",
        "years_audited_financials", "directors_count", "key_person_risk",
        "bank_accounts_count", "primary_bank", "bank_avg_balance_6m", "bounced_cheques_12m",
        "trading_location", "business_description", "daily_sales_zwl", "daily_sales_usd",
        "peak_season", "low_season_revenue_pct", "stock_source", "cross_border", "cross_border_routes",
        "ecocash_daily_vol", "innbucks_balance", "savings_club", "mukando_amount",
        "group_lending", "repayment_history_informal", "supplier_credit_days",
        "cash_cycle_days", "seasonal_business", "worst_month_cover", "dscr", "current_ratio",
        "premises_type", "premises_years", "staff_turnover_pct", "licenses_current",
        "insurance_coverage", "succession_plan",
        "facebook_page", "facebook_followers", "facebook_reviews_avg",
        "whatsapp_business", "instagram_handle", "instagram_followers",
        "google_maps_listing", "google_reviews_count", "google_reviews_avg", "online_marketplace",
        // Bread basket & balance sheet fields
        "household_size", "monthly_food_basket", "monthly_transport", "monthly_school_fees",
        "monthly_health", "bread_basket_currency",
        "stock_value_estimate", "equipment_tools_value", "total_savings",
        "receivables_amount", "payables_amount",
        "premises_type", "premises_years", "staff_turnover_pct", "licenses_current",
        "insurance_coverage", "succession_plan",
        "facebook_page", "facebook_followers", "facebook_reviews_avg",
        "whatsapp_business", "instagram_handle", "instagram_followers",
        "google_maps_listing", "google_reviews_count", "google_reviews_avg", "online_marketplace",
      ];

      specialKeys.forEach(key => {
        if (formData[key]) extraData[key] = formData[key];
      });

      // Include psychometric results in extra_data
      if (psychometricResult?.completed) {
        extraData.psychometric_score = psychometricResult.overall_score;
        extraData.psychometric_dimensions = psychometricResult.dimensions;
        extraData.psychometric_answers = psychometricResult.answers;
      }

      const borrowerPayload = {
        institution_id: institutionId,
        country,
        full_name: formData.name || "Unknown",
        date_of_birth: formData.dob || null,
        gender: formData.gender || null,
        marital_status: formData.marital || null,
        id_type: formData.id_type || null,
        id_number: formData.id_number || null,
        tax_id: formData.tax_id || null,
        social_id: formData.social_id || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        location_detail: formData.province || formData.county || formData.state || formData.region || formData.district || null,
        business_name: category !== "retail" ? (formData.business_name || null) : null,
        business_registration: category !== "retail" ? (formData.business_reg || formData.cr_number || null) : null,
        business_type: category !== "retail" ? (formData.business_type || formData.legal_structure || null) : null,
        years_in_operation: category !== "retail" && (formData.years_operation || formData.years_trading) ? parseInt(formData.years_operation || formData.years_trading) : null,
        sector: formData.sector || null,
        employees: formData.employees ? parseInt(formData.employees) : null,
        extra_data: extraData,
      };

      const { data: borrower, error: borrowerError } = await supabase
        .from("borrowers")
        .insert(borrowerPayload)
        .select("id")
        .single();

      if (borrowerError) throw borrowerError;

      const applicationPayload = {
        institution_id: institutionId,
        borrower_id: borrower.id,
        created_by: user?.id || null,
        country,
        product_category: category,
        product_type: formData.product || null,
        status: "submitted" as const,
        requested_amount: formData.amount ? parseFloat(formData.amount) : null,
        currency: config.currency,
        tenor_months: formData.tenor ? parseInt(formData.tenor) : null,
        purpose: formData.purpose || null,
        collateral: formData.collateral || null,
        monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null,
        monthly_expenses: formData.monthly_expenses ? parseFloat(formData.monthly_expenses) : null,
        monthly_rent: formData.rent ? parseFloat(formData.rent) : null,
        dependents: formData.dependents ? parseInt(formData.dependents) : null,
        existing_loans: formData.existing_loans || null,
        employer: formData.employer || null,
        monthly_revenue: formData.monthly_revenue ? parseFloat(formData.monthly_revenue) : null,
        usd_income: formData.usd_income ? parseFloat(formData.usd_income) : null,
        usd_revenue: formData.usd_revenue ? parseFloat(formData.usd_revenue) : null,
        export_income_pct: formData.export_income ? parseFloat(formData.export_income) : null,
        bureau_score: formData.bureau_score ? parseInt(formData.bureau_score) : null,
        alt_data_consents: altDataConsents,
        documents: Object.entries(documents).map(([type, storagePath]) => ({ type, storage_path: storagePath, filename: storagePath.split('/').pop() || storagePath })),
        psychometric_method: psychometricMethod || null,
        psychometric_status: psychometricStatus === "not_started" ? "pending" : psychometricStatus,
        psychometric_phone: formData.psychometric_phone || formData.phone || null,
        notes: formData.notes || null,
      };

      const { data: appResult, error: appError } = await supabase
        .from("applications")
        .insert(applicationPayload)
        .select("id")
        .single();

      if (appError) throw appError;

      const docEntries = Object.entries(documents);
      if (docEntries.length > 0 && appResult?.id) {
        for (const [docType, storagePath] of docEntries) {
          const newPath = `${institutionId}/${appResult.id}/${storagePath.split('/').pop()}`;
          const { error: moveErr } = await supabase.storage
            .from("application-documents")
            .move(storagePath, newPath);

          const finalPath = moveErr ? storagePath : newPath;
          if (moveErr) console.warn("File move failed, using original path:", moveErr.message);

          const { data: extractionRecord } = await supabase
            .from("document_extractions")
            .insert({
              application_id: appResult.id,
              institution_id: institutionId,
              document_type: docType,
              storage_path: finalPath,
              extraction_status: "pending",
            })
            .select("id")
            .single();

          if (extractionRecord?.id) {
            supabase.functions.invoke("extract-document", {
              body: { extraction_id: extractionRecord.id },
            }).catch(err => console.error("OCR trigger error:", err));
          }
        }
      }

      toast({ title: "Application submitted", description: `Application for ${formData.name} has been created. ${docEntries.length > 0 ? "Document OCR extraction is running in the background." : "Queued for scoring."}` });
      resetForm();
      setOpen(false);
    } catch (err: any) {
      console.error("Submit error:", err);
      toast({ title: "Submission failed", description: err.message || "An error occurred while saving the application.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
  };

  // Get current step ID
  const currentStepId = steps[step]?.id;

  // Helper to render fields from config arrays
  const renderConfigFields = (fields: { key: string; label: string; placeholder: string; type: string; section?: string; options?: { value: string; label: string }[] }[], sectionFilter?: string) => {
    const filtered = sectionFilter ? fields.filter(f => f.section === sectionFilter) : fields;
    return filtered.map(f => (
      <Field key={f.key} label={f.label}>
        {f.type === "select" && f.options ? (
          <Select value={formData[f.key] || ""} onValueChange={v => updateField(f.key, v)}>
            <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {f.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Input type={f.type} placeholder={f.placeholder} className="bg-muted/50 border-border" value={formData[f.key] || ""} onChange={e => updateField(f.key, e.target.value)} />
        )}
      </Field>
    ));
  };

  // Collateral options (Zim-specific if available, otherwise generic)
  const collateralOptions = config?.collateralOptions || [
    { value: "none", label: "None (Unsecured)" },
    { value: "salary", label: "Salary Assignment" },
    { value: "property", label: "Property / Land" },
    { value: "vehicle", label: "Vehicle" },
    { value: "group_guarantee", label: "Group Guarantee" },
    { value: "inventory", label: "Inventory / Stock" },
  ];

  const loanPurposes = config?.loanPurposes || [
    { value: "working_capital", label: "Working Capital" },
    { value: "asset_purchase", label: "Asset Purchase" },
    { value: "education", label: "Education" },
    { value: "medical", label: "Medical" },
    { value: "agriculture", label: "Agriculture" },
    { value: "housing", label: "Housing / Rent" },
    { value: "personal", label: "Personal / Consumption" },
    { value: "debt_consolidation", label: "Debt Consolidation" },
  ];

  // ── RENDER STEPS ──

  const renderBorrowerStep = () => (
    <div className="space-y-5">
      <FieldGroup label="Country & Product">
        <Field label="Country">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(countryConfigs).map(([key, c]) => (
                <SelectItem key={key} value={key}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Product Type">
          <Select value={formData.product || ""} onValueChange={v => updateField("product", v)}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {productTypes.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <FieldGroup label={category === "retail" ? "Personal Details" : "Contact Person / Owner"}>
        <Field label="Full Name">
          <Input placeholder="Enter full name" className="bg-muted/50 border-border" value={formData.name || ""} onChange={e => updateField("name", e.target.value)} />
        </Field>
        <Field label="Date of Birth">
          <Input type="date" className="bg-muted/50 border-border" value={formData.dob || ""} onChange={e => updateField("dob", e.target.value)} />
        </Field>
        <Field label="Gender">
          <Select value={formData.gender || ""} onValueChange={v => updateField("gender", v)}>
            <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Marital Status">
          <Select value={formData.marital || ""} onValueChange={v => updateField("marital", v)}>
            <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      {config && (
        <>
          <FieldGroup label="Identification">
            <Field label="ID Type">
              <Select value={formData.id_type || ""} onValueChange={v => updateField("id_type", v)}>
                <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select ID type" /></SelectTrigger>
                <SelectContent>
                  {config.idTypes.map(id => (
                    <SelectItem key={id.value} value={id.value}>{id.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="ID Number">
              <Input
                placeholder={config.idTypes.find(i => i.value === formData.id_type)?.placeholder || "Enter ID number"}
                className="bg-muted/50 border-border"
                value={formData.id_number || ""}
                onChange={e => updateField("id_number", e.target.value)}
              />
            </Field>
            {config.taxId && (
              <Field label={config.taxId.label}>
                <Input placeholder={config.taxId.placeholder} className="bg-muted/50 border-border" value={formData.tax_id || ""} onChange={e => updateField("tax_id", e.target.value)} />
              </Field>
            )}
            {config.socialId && (
              <Field label={config.socialId.label}>
                <Input placeholder={config.socialId.placeholder} className="bg-muted/50 border-border" value={formData.social_id || ""} onChange={e => updateField("social_id", e.target.value)} />
              </Field>
            )}
          </FieldGroup>

          <FieldGroup label="Contact">
            <Field label="Mobile Number">
              <Input placeholder={config.phonePlaceholder} className="bg-muted/50 border-border" value={formData.phone || ""} onChange={e => updateField("phone", e.target.value)} />
            </Field>
            <Field label="Email (optional)">
              <Input type="email" placeholder="borrower@email.com" className="bg-muted/50 border-border" value={formData.email || ""} onChange={e => updateField("email", e.target.value)} />
            </Field>
            <Field label="Physical Address" span2>
              <Input placeholder="Street, area, city" className="bg-muted/50 border-border" value={formData.address || ""} onChange={e => updateField("address", e.target.value)} />
            </Field>
          </FieldGroup>

          {config.additionalRetailFields.filter(f => ["county","state","region","province","district","suburb"].includes(f.key)).map(f => (
            <FieldGroup key={f.key} label="Location Details">
              <Field label={f.label}>
                <Input placeholder={f.placeholder} className="bg-muted/50 border-border" value={formData[f.key] || ""} onChange={e => updateField(f.key, e.target.value)} />
              </Field>
            </FieldGroup>
          ))}
        </>
      )}
    </div>
  );

  // ── MICRO: Business Profile Step ──
  const renderMicroBusinessStep = () => {
    if (!config) return null;
    const microFields = config.microFields || [];
    const sections = [...new Set(microFields.map(f => f.section).filter(Boolean))];
    
    return (
      <div className="space-y-5">
        <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-accent">Micro-enterprise</span> — Capture the informal business profile. Market traders, cross-border traders, small vendors. Focus on trading patterns and cash flow stability.
          </p>
        </div>

        <FieldGroup label="Basic Business Details">
          <Field label="Business / Trading Name">
            <Input placeholder="Registered or trading name" className="bg-muted/50 border-border" value={formData.business_name || ""} onChange={e => updateField("business_name", e.target.value)} />
          </Field>
          <Field label={config.businessRegistration.label}>
            <Input placeholder={config.businessRegistration.placeholder} className="bg-muted/50 border-border" value={formData.business_reg || ""} onChange={e => updateField("business_reg", e.target.value)} />
          </Field>
          <Field label="Business Type">
            <Select value={formData.business_type || ""} onValueChange={v => updateField("business_type", v)}>
              <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="cooperative">Cooperative / SACCO</SelectItem>
                <SelectItem value="vendor">Market Vendor / Trader</SelectItem>
                <SelectItem value="cross_border">Cross-Border Trader</SelectItem>
                <SelectItem value="artisan">Artisan / Skilled Trade</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        {sections.map(section => (
          <FieldGroup key={section!} label={section!}>
            {renderConfigFields(microFields, section)}
          </FieldGroup>
        ))}
      </div>
    );
  };

  // ── MICRO: Cash Flow & Savings Step ──
  const renderMicroCashFlowStep = () => {
    if (!config) return null;
    const microFields = config.microFields || [];

    return (
      <div className="space-y-5">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Cash Flow & Savings Analysis</span> — Understanding cash flow volatility and informal savings mechanisms (Mukando, group lending) is critical for micro-enterprise scoring.
          </p>
        </div>

        <FieldGroup label="Revenue & Expenses">
          {config.additionalBusinessFields.map(f => (
            <Field key={f.key} label={f.label}>
              <Input type={f.type} placeholder={f.placeholder} className="bg-muted/50 border-border" value={formData[f.key] || ""} onChange={e => updateField(f.key, e.target.value)} />
            </Field>
          ))}
          <Field label={`Monthly Expenses (${config.currency})`}>
            <Input type="number" placeholder="20000" className="bg-muted/50 border-border" value={formData.monthly_expenses || ""} onChange={e => updateField("monthly_expenses", e.target.value)} />
          </Field>
        </FieldGroup>

        <FieldGroup label="Income & Employment">
          {config.additionalRetailFields.filter(f => ["monthly_income","employer","usd_income"].includes(f.key)).map(f => (
            <Field key={f.key} label={f.label}>
              <Input type={f.type} placeholder={f.placeholder} className="bg-muted/50 border-border" value={formData[f.key] || ""} onChange={e => updateField(f.key, e.target.value)} />
            </Field>
          ))}
        </FieldGroup>

        {country === "zimbabwe" && (
          <>
            <FieldGroup label="Bread Basket & Living Costs (Zimbabwe)">
              <div className="col-span-2 p-3 rounded-lg bg-warning/5 border border-warning/20 mb-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-warning">Bread Basket Assessment</span> — How much does the household spend on essentials? This determines if there's enough margin for loan repayment after inflation-impacted living costs.
                </p>
              </div>
              {renderConfigFields(microFields, "Bread Basket")}
            </FieldGroup>

            {/* Live bread basket computation */}
            {(formData.monthly_income || formData.monthly_revenue) && formData.monthly_food_basket && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bread Basket Analysis</h4>
                {(() => {
                  const income = parseFloat(formData.monthly_income || formData.monthly_revenue || "0");
                  const food = parseFloat(formData.monthly_food_basket || "0");
                  const transport = parseFloat(formData.monthly_transport || "0");
                  const school = parseFloat(formData.monthly_school_fees || "0");
                  const health = parseFloat(formData.monthly_health || "0");
                  const expenses = parseFloat(formData.monthly_expenses || "0");
                  const breadBasket = food + transport + school + health;
                  const totalOutflows = breadBasket + expenses;
                  const surplus = income - totalOutflows;
                  const marginPct = income > 0 ? Math.round((surplus / income) * 100) : 0;
                  return (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Income</span><span className="font-medium">{config.currencySymbol} {income.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Bread Basket (essentials)</span><span className="font-medium text-warning">−{config.currencySymbol} {breadBasket.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Business Expenses</span><span className="font-medium">−{config.currencySymbol} {expenses.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t border-border/30 pt-1"><span className="text-muted-foreground">Disposable Surplus</span><span className={`font-semibold ${surplus >= 0 ? "text-success" : "text-destructive"}`}>{config.currencySymbol} {surplus.toLocaleString()} ({marginPct}%)</span></div>
                    </div>
                  );
                })()}
              </div>
            )}

            <FieldGroup label="Balance Sheet Inputs">
              {renderConfigFields(microFields, "Balance Sheet")}
            </FieldGroup>

            <FieldGroup label="Multi-Currency (Zimbabwe)">
              <Field label="Primary Transaction Currency">
                <Select value={formData.primary_currency || ""} onValueChange={v => updateField("primary_currency", v)}>
                  <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zwl">ZWL (Zimbabwe Dollar)</SelectItem>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="zar">ZAR (South African Rand)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </>
        )}

        <FieldGroup label="Credit Bureau Score (if available)">
          <Field label="Bureau Score (300-900)" span2>
            <Input type="number" placeholder="e.g. 720 — leave blank if not available" className="bg-muted/50 border-border" min={300} max={900} value={formData.bureau_score || ""} onChange={e => updateField("bureau_score", e.target.value)} />
          </Field>
        </FieldGroup>
      </div>
    );
  };

  // ── SME: Corporate Profile Step ──
  const renderSMECorporateStep = () => {
    if (!config) return null;
    const smeFields = config.smeFields || [];

    return (
      <div className="space-y-5">
        <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-accent">SME Corporate Profile</span> — Formal business governance, legal structure, and registration details are weighted heavily in SME scoring.
          </p>
        </div>

        <FieldGroup label="Business Registration">
          <Field label="Business Name">
            <Input placeholder="Registered company name" className="bg-muted/50 border-border" value={formData.business_name || ""} onChange={e => updateField("business_name", e.target.value)} />
          </Field>
          {renderConfigFields(smeFields, "Corporate Profile")}
          <Field label="Years in Operation">
            <Input type="number" placeholder="5" className="bg-muted/50 border-border" value={formData.years_operation || ""} onChange={e => updateField("years_operation", e.target.value)} />
          </Field>
          <Field label="Sector">
            <Input placeholder="Mining, Manufacturing, Agriculture…" className="bg-muted/50 border-border" value={formData.sector || ""} onChange={e => updateField("sector", e.target.value)} />
          </Field>
          <Field label="Number of Employees">
            <Input type="number" placeholder="25" className="bg-muted/50 border-border" value={formData.employees || ""} onChange={e => updateField("employees", e.target.value)} />
          </Field>
        </FieldGroup>

        {config.businessStabilityFields && (
          <FieldGroup label="Business Stability Indicators">
            {renderConfigFields(config.businessStabilityFields)}
          </FieldGroup>
        )}

        <FieldGroup label="Governance">
          {renderConfigFields(smeFields, "Governance")}
        </FieldGroup>
      </div>
    );
  };

  // ── SME: Financial Analysis Step ──
  const renderSMEFinancialsStep = () => {
    if (!config) return null;
    const smeFields = config.smeFields || [];

    return (
      <div className="space-y-5">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Financial Analysis</span> — Turnover, margins, and concentration risk drive SME credit decisioning. Audited financials carry higher weight.
          </p>
        </div>

        <FieldGroup label="Revenue & Profitability">
          {renderConfigFields(smeFields, "Financial Profile")}
        </FieldGroup>

        <FieldGroup label="Banking Relationship">
          {renderConfigFields(smeFields, "Banking")}
        </FieldGroup>

        <FieldGroup label="Concentration Risk">
          {renderConfigFields(smeFields, "Concentration Risk")}
        </FieldGroup>

        <FieldGroup label="Credit Bureau Score (if available)">
          <Field label="Bureau Score (300-900)" span2>
            <Input type="number" placeholder="e.g. 720 — leave blank if not available" className="bg-muted/50 border-border" min={300} max={900} value={formData.bureau_score || ""} onChange={e => updateField("bureau_score", e.target.value)} />
          </Field>
        </FieldGroup>
      </div>
    );
  };

  // ── SME: Cash Flow & Stability Step ──
  const renderSMECashFlowStep = () => {
    if (!config) return null;
    const smeFields = config.smeFields || [];

    return (
      <div className="space-y-5">
        <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-warning">Cash Flow Volatility</span> — Revenue volatility (high/low month ratio), receivable/payable cycles, and forex exposure are critical risk indicators for SME lending.
          </p>
        </div>

        <FieldGroup label="Cash Flow Analysis">
          {renderConfigFields(smeFields, "Cash Flow Analysis")}
        </FieldGroup>

        {config.cashFlowFields && (
          <FieldGroup label="Liquidity & Coverage Ratios">
            {renderConfigFields(config.cashFlowFields)}
          </FieldGroup>
        )}

        {country === "zimbabwe" && (
          <FieldGroup label="Multi-Currency Exposure (Zimbabwe)">
            <Field label="Primary Transaction Currency">
              <Select value={formData.primary_currency || ""} onValueChange={v => updateField("primary_currency", v)}>
                <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zwl">ZWL (Zimbabwe Dollar)</SelectItem>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="zar">ZAR (South African Rand)</SelectItem>
                  <SelectItem value="mixed">Multi-Currency Mix</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        )}
      </div>
    );
  };

  // ── SME: Social & Digital Footprint Step ──
  const renderSocialMediaStep = () => {
    if (!config) return null;

    return (
      <div className="space-y-5">
        <div className="p-3 rounded-lg bg-success/5 border border-success/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-success">Social & Digital Footprint</span> — Online presence, customer reviews, and digital engagement provide alternative signals of business legitimacy, customer satisfaction, and brand strength.
          </p>
        </div>

        {config.socialMediaFields && (
          <FieldGroup label="Social Media & Online Presence">
            {renderConfigFields(config.socialMediaFields)}
          </FieldGroup>
        )}

        {!config.socialMediaFields && (
          <FieldGroup label="Social Media & Online Presence">
            <Field label="Facebook Business Page URL">
              <Input placeholder="https://facebook.com/yourbusiness" className="bg-muted/50 border-border" value={formData.facebook_page || ""} onChange={e => updateField("facebook_page", e.target.value)} />
            </Field>
            <Field label="Facebook Followers / Likes">
              <Input type="number" placeholder="500" className="bg-muted/50 border-border" value={formData.facebook_followers || ""} onChange={e => updateField("facebook_followers", e.target.value)} />
            </Field>
            <Field label="WhatsApp Business Number">
              <Input placeholder={config.phonePlaceholder} className="bg-muted/50 border-border" value={formData.whatsapp_business || ""} onChange={e => updateField("whatsapp_business", e.target.value)} />
            </Field>
            <Field label="Google Maps Listing?">
              <Input placeholder="Yes / No" className="bg-muted/50 border-border" value={formData.google_maps_listing || ""} onChange={e => updateField("google_maps_listing", e.target.value)} />
            </Field>
          </FieldGroup>
        )}

        <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Scoring Impact</h4>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p>• Active social media with positive reviews → <span className="text-success font-medium">+15-25 score points</span></p>
            <p>• Google Maps listing with reviews → <span className="text-success font-medium">+10-15 score points</span></p>
            <p>• No digital footprint → <span className="text-warning font-medium">Neutral (no penalty)</span></p>
          </div>
        </div>
      </div>
    );
  };

  // ── Financial / Loan Request Step (shared but category-aware) ──
  const renderFinancialStep = () => {
    if (!config) return null;

    return (
      <div className="space-y-5">
        <FieldGroup label="Loan Request">
          <Field label={`Requested Amount (${config.currency})`}>
            <Input type="number" placeholder="50000" className="bg-muted/50 border-border" value={formData.amount || ""} onChange={e => updateField("amount", e.target.value)} />
          </Field>
          <Field label="Tenor (months)">
            <Input type="number" placeholder="12" className="bg-muted/50 border-border" value={formData.tenor || ""} onChange={e => updateField("tenor", e.target.value)} />
          </Field>
          <Field label="Purpose of Loan">
            <Select value={formData.purpose || ""} onValueChange={v => updateField("purpose", v)}>
              <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select purpose" /></SelectTrigger>
              <SelectContent>
                {loanPurposes.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Collateral (if any)">
            <Select value={formData.collateral || ""} onValueChange={v => updateField("collateral", v)}>
              <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {collateralOptions.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        {/* Individual-specific: full income/expense capture */}
        {category === "retail" && (
          <>
            <FieldGroup label="Income & Expenses">
              {config.additionalRetailFields.filter(f => ["monthly_income","employer","usd_income","employment_type","employment_years","payslip_net","other_income","other_income_amount"].includes(f.key)).map(f => (
                <Field key={f.key} label={f.label}>
                  <Input type={f.type} placeholder={f.placeholder} className="bg-muted/50 border-border" value={formData[f.key] || ""} onChange={e => updateField(f.key, e.target.value)} />
                </Field>
              ))}
              <Field label={`Monthly Expenses (${config.currency})`}>
                <Input type="number" placeholder="20000" className="bg-muted/50 border-border" value={formData.monthly_expenses || ""} onChange={e => updateField("monthly_expenses", e.target.value)} />
              </Field>
              <Field label="Number of Dependents">
                <Input type="number" placeholder="3" className="bg-muted/50 border-border" value={formData.dependents || ""} onChange={e => updateField("dependents", e.target.value)} />
              </Field>
              <Field label={`Monthly Rent / Housing (${config.currency})`}>
                <Input type="number" placeholder="5000" className="bg-muted/50 border-border" value={formData.rent || ""} onChange={e => updateField("rent", e.target.value)} />
              </Field>
              <Field label="Existing Loan Obligations">
                <Select value={formData.existing_loans || ""} onValueChange={v => updateField("existing_loans", v)}>
                  <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No existing loans</SelectItem>
                    <SelectItem value="1">1 active loan</SelectItem>
                    <SelectItem value="2">2 active loans</SelectItem>
                    <SelectItem value="3_plus">3+ active loans</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            {country === "zimbabwe" && (
              <>
                <FieldGroup label="Bread Basket Margin (Zimbabwe)">
                  <div className="col-span-2 p-3 rounded-lg bg-warning/5 border border-warning/20 mb-2">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-warning">Affordability Check</span> — Zimbabwe uses the bread basket approach to assess whether income covers essential living costs plus proposed loan repayment. This factors inflation impact on basic goods.
                    </p>
                  </div>
                  {config.additionalRetailFields.filter(f => ["household_size","monthly_food_basket","monthly_transport","monthly_school_fees","monthly_health"].includes(f.key)).map(f => (
                    <Field key={f.key} label={f.label}>
                      <Input type={f.type} placeholder={f.placeholder} className="bg-muted/50 border-border" value={formData[f.key] || ""} onChange={e => updateField(f.key, e.target.value)} />
                    </Field>
                  ))}
                </FieldGroup>

                {/* Auto-computed bread basket margin */}
                {(formData.monthly_income || formData.payslip_net) && formData.monthly_food_basket && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bread Basket Analysis</h4>
                    {(() => {
                      const income = parseFloat(formData.payslip_net || formData.monthly_income || "0");
                      const food = parseFloat(formData.monthly_food_basket || "0");
                      const transport = parseFloat(formData.monthly_transport || "0");
                      const school = parseFloat(formData.monthly_school_fees || "0");
                      const health = parseFloat(formData.monthly_health || "0");
                      const rent = parseFloat(formData.rent || "0");
                      const breadBasket = food + transport + school + health + rent;
                      const surplus = income - breadBasket;
                      const marginPct = income > 0 ? Math.round((surplus / income) * 100) : 0;
                      const proposedRepayment = formData.amount && formData.tenor ? parseFloat(formData.amount) / parseInt(formData.tenor) : 0;
                      const afterLoan = surplus - proposedRepayment;
                      return (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between"><span className="text-muted-foreground">Net Income</span><span className="font-medium">{config.currencySymbol} {income.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Bread Basket (essentials)</span><span className="font-medium text-warning">−{config.currencySymbol} {breadBasket.toLocaleString()}</span></div>
                          <div className="flex justify-between border-t border-border/30 pt-1"><span className="text-muted-foreground">Disposable Surplus</span><span className={`font-semibold ${surplus >= 0 ? "text-success" : "text-destructive"}`}>{config.currencySymbol} {surplus.toLocaleString()} ({marginPct}%)</span></div>
                          {proposedRepayment > 0 && (
                            <div className="flex justify-between"><span className="text-muted-foreground">After Proposed Repayment</span><span className={`font-semibold ${afterLoan >= 0 ? "text-success" : "text-destructive"}`}>{config.currencySymbol} {Math.round(afterLoan).toLocaleString()}</span></div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <FieldGroup label="Multi-Currency Details (Zimbabwe)">
                  <Field label="Primary Transaction Currency">
                    <Select value={formData.primary_currency || ""} onValueChange={v => updateField("primary_currency", v)}>
                      <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zwl">ZWL (Zimbabwe Dollar)</SelectItem>
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="zar">ZAR (South African Rand)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </>
            )}

            <FieldGroup label="Credit Bureau Score (if available)">
              <Field label="Bureau Score (300-900)" span2>
                <Input type="number" placeholder="e.g. 720 — leave blank if not available" className="bg-muted/50 border-border" min={300} max={900} value={formData.bureau_score || ""} onChange={e => updateField("bureau_score", e.target.value)} />
              </Field>
            </FieldGroup>

            <FieldGroup label="Banking Details">
              <Field label="Primary Bank">
                <Input placeholder="Bank name" className="bg-muted/50 border-border" value={formData.bank || ""} onChange={e => updateField("bank", e.target.value)} />
              </Field>
              <Field label="Account Number">
                <Input placeholder="Account number" className="bg-muted/50 border-border" value={formData.account_number || ""} onChange={e => updateField("account_number", e.target.value)} />
              </Field>
              <Field label="Years with Bank">
                <Input type="number" placeholder="3" className="bg-muted/50 border-border" value={formData.bank_years || ""} onChange={e => updateField("bank_years", e.target.value)} />
              </Field>
              <Field label={`Average Monthly Balance (${config.currency})`}>
                <Input type="number" placeholder="10000" className="bg-muted/50 border-border" value={formData.avg_balance || ""} onChange={e => updateField("avg_balance", e.target.value)} />
              </Field>
            </FieldGroup>
          </>
        )}

        {/* Micro: simplified loan fields */}
        {category === "micro" && (
          <>
            <FieldGroup label="Repayment Capacity">
              <Field label="Number of Dependents">
                <Input type="number" placeholder="3" className="bg-muted/50 border-border" value={formData.dependents || ""} onChange={e => updateField("dependents", e.target.value)} />
              </Field>
              <Field label="Existing Loan Obligations">
                <Select value={formData.existing_loans || ""} onValueChange={v => updateField("existing_loans", v)}>
                  <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No existing loans</SelectItem>
                    <SelectItem value="1">1 active loan</SelectItem>
                    <SelectItem value="2">2 active loans</SelectItem>
                    <SelectItem value="3_plus">3+ active loans</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </>
        )}

        {/* SME: simplified — detailed financials captured in earlier steps */}
        {category === "sme" && (
          <>
            <FieldGroup label="Repayment Capacity">
              <Field label="Existing Loan Obligations">
                <Select value={formData.existing_loans || ""} onValueChange={v => updateField("existing_loans", v)}>
                  <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No existing loans</SelectItem>
                    <SelectItem value="1">1 active loan</SelectItem>
                    <SelectItem value="2">2 active loans</SelectItem>
                    <SelectItem value="3_plus">3+ active loans</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Total Monthly Debt Service (ZWL)">
                <Input type="number" placeholder="200000" className="bg-muted/50 border-border" value={formData.existing_repayments || ""} onChange={e => updateField("existing_repayments", e.target.value)} />
              </Field>
            </FieldGroup>
          </>
        )}

        <Field label="Notes (optional)" span2>
          <Textarea placeholder="Additional context for the underwriter…" className="bg-muted/50 border-border min-h-[60px]" value={formData.notes || ""} onChange={e => updateField("notes", e.target.value)} />
        </Field>
      </div>
    );
  };

  // ── Alt-Data Consent Step ──
  const renderAltDataStep = () => {
    if (!config) return null;
    return (
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Select which alternative data sources the borrower consents to share. Each source improves scoring accuracy.
        </p>

        <FieldGroup label={`Credit Bureaus (${config.label})`}>
          <div className="col-span-2 space-y-2">
            {config.bureaus.map(bureau => (
              <label key={bureau} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors">
                <Checkbox checked={altDataConsents[bureau] || false} onCheckedChange={() => toggleConsent(bureau)} />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{bureau}</span>
                  <p className="text-xs text-muted-foreground">Credit history, obligations, defaults</p>
                </div>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Bureau</Badge>
              </label>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label="Mobile Wallet Data">
          <div className="col-span-2 space-y-2">
            {config.wallets.map(wallet => (
              <label key={wallet} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors">
                <Checkbox checked={altDataConsents[wallet] || false} onCheckedChange={() => toggleConsent(wallet)} />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{wallet}</span>
                  <p className="text-xs text-muted-foreground">Transaction history, inflows/outflows, balance trends</p>
                </div>
                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">Wallet</Badge>
              </label>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label="Telco Data">
          <div className="col-span-2 space-y-2">
            {config.telcos.map(telco => (
              <label key={telco} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors">
                <Checkbox checked={altDataConsents[telco] || false} onCheckedChange={() => toggleConsent(telco)} />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{telco}</span>
                  <p className="text-xs text-muted-foreground">Airtime/data usage, SIM stability, recharge patterns</p>
                </div>
                <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">Telco</Badge>
              </label>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label="Utility Bills">
          <div className="col-span-2 space-y-2">
            {config.utilities.map(util => (
              <label key={util} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors">
                <Checkbox checked={altDataConsents[util] || false} onCheckedChange={() => toggleConsent(util)} />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{util}</span>
                  <p className="text-xs text-muted-foreground">Payment regularity, consumption patterns</p>
                </div>
                <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">Utility</Badge>
              </label>
            ))}
          </div>
        </FieldGroup>

        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={altDataConsents["device_telemetry"] || false} onCheckedChange={() => toggleConsent("device_telemetry")} className="mt-0.5" />
            <div>
              <span className="text-sm font-medium text-foreground">Device Telemetry (optional)</span>
              <p className="text-xs text-muted-foreground mt-0.5">Device type, SIM swap history, app usage patterns.</p>
            </div>
          </label>
        </div>
      </div>
    );
  };

  // ── Documents Step ──
  const renderDocumentsStep = () => {
    if (!config) return null;
    const docTypes = [
      { key: "bank_statement", icon: CreditCard, title: "Bank Statements (min. 3 months)", desc: "Must cover at least 3 consecutive months. Extracts: income flows, variability.", formats: "PDF, JPEG, PNG", accept: ".pdf,.jpg,.jpeg,.png" },
      ...(category !== "retail" ? [
        { key: "pos_statement", icon: Store, title: "POS / Till Statements", desc: "Point-of-sale transaction records for cash-based businesses without bank traces.", formats: "PDF, JPEG, PNG", accept: ".pdf,.jpg,.jpeg,.png" },
      ] : []),
      { key: "utility_bill", icon: Banknote, title: "Utility Bills (min. 3 months)", desc: "Electricity, water. Extracts: payment regularity.", formats: "PDF, JPEG", accept: ".pdf,.jpg,.jpeg" },
      ...(category !== "retail" ? [
        { key: "trade_license", icon: Building2, title: config.businessRegistration.label, desc: "Business registration document.", formats: "PDF, JPEG", accept: ".pdf,.jpg,.jpeg" },
        { key: "financial_statement", icon: FileText, title: "Financial Statements / Receipts", desc: "P&L, balance sheet, or sales receipts.", formats: "PDF, XLSX", accept: ".pdf,.xlsx,.xls" },
      ] : []),
      ...(category === "sme" ? [
        { key: "tax_clearance", icon: Shield, title: "ZIMRA Tax Clearance (ITF 263)", desc: "Valid tax clearance certificate.", formats: "PDF", accept: ".pdf" },
        { key: "management_accounts", icon: BarChart3, title: "Management Accounts (latest)", desc: "Monthly management accounts for cash flow analysis.", formats: "PDF, XLSX", accept: ".pdf,.xlsx,.xls" },
      ] : []),
      { key: "id_copy", icon: Shield, title: "ID Document Copy", desc: "Clear photo of the selected ID.", formats: "JPEG, PNG", accept: ".jpg,.jpeg,.png" },
    ];

    return (
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Upload supporting documents for OCR extraction. {category !== "retail" ? "No bank statement? Upload POS / Till statements instead — they work just as well for cash-based businesses." : "Extracted data feeds directly into the scoring model."}
        </p>
        {docTypes.map(doc => (
          <div key={doc.key} className="p-4 rounded-lg bg-muted/30 border border-border/50 border-dashed hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted/50">
                <doc.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-foreground">{doc.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{doc.desc}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Accepted: {doc.formats}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {documents[doc.key] ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Uploaded
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDocuments(prev => { const next = { ...prev }; delete next[doc.key]; return next; })}>×</Button>
                  </div>
                ) : (
                  <>
                    <input type="file" id={`file-${doc.key}`} className="hidden" accept={doc.accept}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !institutionId) return;
                        setUploadingDoc(doc.key);
                        try {
                          const filePath = `${institutionId}/pending/${doc.key}_${Date.now()}_${file.name}`;
                          const { error: uploadErr } = await supabase.storage.from("application-documents").upload(filePath, file);
                          if (uploadErr) throw uploadErr;
                          setDocuments(prev => ({ ...prev, [doc.key]: filePath }));
                          toast({ title: "Document uploaded", description: `${doc.title} uploaded. OCR will run after submission.` });
                        } catch (err: any) {
                          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                        } finally { setUploadingDoc(null); e.target.value = ""; }
                      }}
                    />
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border" disabled={uploadingDoc === doc.key}
                      onClick={() => document.getElementById(`file-${doc.key}`)?.click()}>
                      {uploadingDoc === doc.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      {uploadingDoc === doc.key ? "Uploading…" : "Upload"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── Psychometric Step ──
  const renderPsychometricStep = () => {
    // If assessment is completed, show results summary
    if (psychometricResult?.completed) {
      return (
        <div className="space-y-5">
          <div className="p-4 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold text-success">Assessment Complete</span>
              <Badge variant="outline" className="ml-auto text-xs border-success/30 text-success">
                Score: {psychometricResult.overall_score}/100
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(psychometricResult.dimensions).map(([key, dim]) => (
                <div key={key} className="p-2.5 rounded-md bg-background/50 border border-border/30">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    {key.replace(/_/g, " ")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={dim.pct} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium text-foreground">{dim.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border"
            onClick={() => {
              setPsychometricResult(null);
              setPsychometricStatus("not_started");
            }}>
            <Brain className="h-3 w-3" /> Retake Assessment
          </Button>
          <p className="text-xs text-muted-foreground">
            The psychometric score will be factored into the credit model with a weight of 8–12% depending on category.
          </p>
        </div>
      );
    }

    // If in-branch mode, show the actual questionnaire
    if (psychometricStatus === "in_progress" || psychometricMethod === "in_branch") {
      return (
        <PsychometricQuestionnaire
          category={category}
          initialAnswers={psychometricResult?.answers || {}}
          onComplete={(result) => {
            setPsychometricResult(result);
            setPsychometricStatus("completed");
            setPsychometricMethod("in_branch");
            updateField("psychometric_method", "in_branch");
            toast({
              title: "Assessment completed",
              description: `Psychometric score: ${result.overall_score}/100. Results will be factored into credit scoring.`
            });
          }}
        />
      );
    }

    // Default: choose delivery method
    return (
      <div className="space-y-5">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Behavioural Assessment</span> — 15 questions, ~5 minutes. Measures financial discipline, risk attitude, conscientiousness, and locus of control. Zimbabwe-contextualized with Mukando, multi-currency, and local scenarios.
          </p>
        </div>

        {(() => {
          const statusConfig = PSYCHOMETRIC_STATUS_CONFIG[psychometricStatus];
          const StatusIcon = statusConfig.icon;
          return (
            <div className={`p-4 rounded-lg border ${statusConfig.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Status: {statusConfig.label}</span>
                </div>
                {psychometricMethod && (
                  <Badge variant="outline" className="text-xs border-border">
                    {psychometricMethod === "sms" ? "SMS / WhatsApp" : "In-Branch"}
                  </Badge>
                )}
              </div>
              {psychometricStatus === "link_sent" && (
                <p className="text-xs mt-2 opacity-80">Link sent to {formData.psychometric_phone || formData.phone}. 48 hours to complete.</p>
              )}
            </div>
          );
        })()}

        {(psychometricStatus === "not_started" || psychometricStatus === "expired") && (
          <>
            <FieldGroup label="Send Assessment">
              <Field label="Phone for Assessment" span2>
                <Input placeholder={config?.phonePlaceholder || "+XXX XXX XXX XXXX"} className="bg-muted/50 border-border"
                  value={formData.psychometric_phone || formData.phone || ""} onChange={e => updateField("psychometric_phone", e.target.value)} />
              </Field>
            </FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 cursor-pointer transition-colors text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-sm font-medium text-foreground">Send via SMS / WhatsApp</h4>
                <p className="text-xs text-muted-foreground">Borrower completes remotely on their phone</p>
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs border-border" onClick={handleSendPsychometricLink} disabled={sendingLink}>
                  {sendingLink ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  {sendingLink ? "Sending…" : "Send Link"}
                </Button>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-success/30 cursor-pointer transition-colors text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-success" />
                </div>
                <h4 className="text-sm font-medium text-foreground">Start In-Branch</h4>
                <p className="text-xs text-muted-foreground">Field officer guides borrower through 15 questions now</p>
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs border-border" onClick={() => {
                  setPsychometricStatus("in_progress");
                  setPsychometricMethod("in_branch");
                  updateField("psychometric_method", "in_branch");
                }}>
                  <ArrowRight className="h-3 w-3" /> Begin Now
                </Button>
              </div>
            </div>
          </>
        )}

        {psychometricStatus === "link_sent" && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border" onClick={handleSendPsychometricLink} disabled={sendingLink}>
              {sendingLink ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Resend Link
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border" onClick={() => {
              setPsychometricStatus("in_progress");
              setPsychometricMethod("in_branch");
              updateField("psychometric_method", "in_branch");
            }}>
              <Brain className="h-3 w-3" /> Switch to In-Branch
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          You can proceed without the psychometric score — the model will use available data, but accuracy improves by 8–15% with it.
        </p>
      </div>
    );
  };

  // ── Review Step ──
  const renderReviewStep = () => {
    if (!config) return null;
    return (
      <div className="space-y-5">
        <div className="space-y-3">
          {[
            { label: "Category", value: category === "retail" ? "Individual" : category === "micro" ? "Micro-enterprise" : category === "farmer" ? "Farmer / Agri" : "SME" },
            { label: "Country", value: config.label },
            { label: "Product", value: productTypes.find(p => p.value === formData.product)?.label || "—" },
            { label: "Borrower", value: formData.name || "—" },
            { label: "ID", value: `${config.idTypes.find(i => i.value === formData.id_type)?.label || "—"}: ${formData.id_number || "—"}` },
            { label: "Phone", value: formData.phone || "—" },
            ...(category !== "retail" ? [{ label: category === "farmer" ? "Farm" : "Business", value: formData.business_name || "—" }] : []),
            { label: "Amount", value: formData.amount ? `${config.currencySymbol} ${Number(formData.amount).toLocaleString()}` : "—" },
            { label: "Tenor", value: formData.tenor ? `${formData.tenor} months` : "—" },
            ...(category === "farmer" ? [
              { label: "Land Tenure", value: formData.land_tenure?.replace(/_/g, " ") || "—" },
              { label: "Hectarage", value: formData.hectarage ? `${formData.hectarage} ha` : "—" },
              { label: "Primary Crop", value: formData.primary_crop || "—" },
              { label: "Contract Farming", value: formData.contract_farming?.replace(/_/g, " ") || "—" },
              { label: "Prev Season", value: formData.prev_season_performance?.replace(/_/g, " ") || "—" },
            ] : []),
            ...(category === "sme" ? [
              { label: "Annual Turnover", value: formData.annual_turnover_zwl ? `${config.currencySymbol} ${Number(formData.annual_turnover_zwl).toLocaleString()}` : "—" },
              { label: "Revenue Volatility", value: formData.revenue_volatility ? `${formData.revenue_volatility}%` : "—" },
            ] : []),
            ...(category !== "sme" ? [{ label: "Psychometric", value: psychometricResult?.completed ? `${psychometricResult.overall_score}/100` : PSYCHOMETRIC_STATUS_CONFIG[psychometricStatus].label }] : []),
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="text-sm font-medium text-foreground">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Auto-generated Balance Sheet */}
        {(() => {
          const savings = parseFloat(formData.total_savings || formData.avg_balance || "0");
          const stock = parseFloat(formData.stock_value_estimate || "0");
          const equipment = parseFloat(formData.equipment_tools_value || "0");
          const receivables = parseFloat(formData.receivables_amount || "0");
          const dailySales = parseFloat(formData.daily_sales_zwl || "0");
          const estimatedMonthlyRev = dailySales > 0 ? dailySales * 26 : parseFloat(formData.monthly_revenue || "0");
          const cashOnHand = estimatedMonthlyRev > 0 ? Math.round(estimatedMonthlyRev * 0.1) : 0;
          
          const totalAssets = savings + stock + equipment + receivables + cashOnHand;
          
          const payables = parseFloat(formData.payables_amount || "0");
          const existingDebt = formData.existing_loans === "none" ? 0 : formData.existing_loans === "1" ? parseFloat(formData.existing_repayments || "0") * 6 : parseFloat(formData.existing_repayments || "0") * 12;
          const totalLiabilities = payables + existingDebt;
          
          const netWorth = totalAssets - totalLiabilities;
          
          if (totalAssets > 0 || totalLiabilities > 0) {
            return (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estimated Balance Sheet</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                    <h5 className="text-[10px] uppercase tracking-wider text-success font-semibold mb-2">Assets</h5>
                    <div className="space-y-1 text-xs">
                      {cashOnHand > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Cash on Hand (est.)</span><span>{config.currencySymbol} {cashOnHand.toLocaleString()}</span></div>}
                      {savings > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Savings / Bank</span><span>{config.currencySymbol} {savings.toLocaleString()}</span></div>}
                      {receivables > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Receivables</span><span>{config.currencySymbol} {receivables.toLocaleString()}</span></div>}
                      {stock > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Stock / Inventory</span><span>{config.currencySymbol} {stock.toLocaleString()}</span></div>}
                      {equipment > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Equipment / Tools</span><span>{config.currencySymbol} {equipment.toLocaleString()}</span></div>}
                      <div className="flex justify-between border-t border-success/20 pt-1 font-semibold"><span>Total Assets</span><span>{config.currencySymbol} {totalAssets.toLocaleString()}</span></div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <h5 className="text-[10px] uppercase tracking-wider text-destructive font-semibold mb-2">Liabilities</h5>
                    <div className="space-y-1 text-xs">
                      {payables > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Supplier Payables</span><span>{config.currencySymbol} {payables.toLocaleString()}</span></div>}
                      {existingDebt > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Existing Debt (est.)</span><span>{config.currencySymbol} {existingDebt.toLocaleString()}</span></div>}
                      <div className="flex justify-between border-t border-destructive/20 pt-1 font-semibold"><span>Total Liabilities</span><span>{config.currencySymbol} {totalLiabilities.toLocaleString()}</span></div>
                    </div>
                  </div>
                </div>
                <div className={`p-2 rounded-lg text-center text-sm font-semibold ${netWorth >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  Net Worth: {config.currencySymbol} {netWorth.toLocaleString()}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Bread Basket Summary */}
        {country === "zimbabwe" && formData.monthly_food_basket && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bread Basket Margin</h4>
            {(() => {
              const income = parseFloat(formData.payslip_net || formData.monthly_income || formData.monthly_revenue || "0");
              const breadBasket = parseFloat(formData.monthly_food_basket || "0") + parseFloat(formData.monthly_transport || "0") + parseFloat(formData.monthly_school_fees || "0") + parseFloat(formData.monthly_health || "0") + parseFloat(formData.rent || "0");
              const surplus = income - breadBasket;
              const marginPct = income > 0 ? Math.round((surplus / income) * 100) : 0;
              return (
                <div className={`p-3 rounded-lg border ${marginPct >= 30 ? "bg-success/10 border-success/20" : marginPct >= 15 ? "bg-warning/10 border-warning/20" : "bg-destructive/10 border-destructive/20"}`}>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bread basket margin</span>
                    <span className="font-semibold">{marginPct}% ({config.currencySymbol} {surplus.toLocaleString()} surplus)</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {marginPct >= 30 ? "✅ Comfortable — sufficient margin after essentials" : marginPct >= 15 ? "⚠️ Tight — limited cushion for loan repayment" : "🔴 Stretched — essentials consume most income"}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Sources Consented</h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(altDataConsents).filter(([, v]) => v).map(([k]) => (
              <Badge key={k} variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">{k}</Badge>
            ))}
            {Object.values(altDataConsents).filter(Boolean).length === 0 && (
              <span className="text-xs text-muted-foreground">No alt-data sources selected</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documents</h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(documents).length > 0 ? Object.keys(documents).map(k => (
              <Badge key={k} variant="outline" className="text-xs bg-success/10 text-success border-success/20">{k.replace(/_/g, " ")}</Badge>
            )) : <span className="text-xs text-muted-foreground">No documents uploaded</span>}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            On submit, AfricaOne will initiate: <span className="text-foreground font-medium">
              {category === "retail" && "Bureau checks → Alt-data pull → Document OCR → Psychometric score → Individual Scorecard"}
              {category === "micro" && "Bureau checks → EcoCash/InnBucks pull → Cash flow analysis → Mukando verification → Micro Scorecard"}
              {category === "sme" && "Bureau checks → Financial analysis → Cash flow volatility → Social media audit → Concentration risk → SME Scorecard"}
              {category === "farmer" && "Bureau checks → Land tenure verification → Season performance analysis → Contract farming validation → Agri Scorecard"}
            </span>
          </p>
        </div>
      </div>
    );
  };

  // ── FARMER: Farm Profile Step ──
  const renderFarmProfileStep = () => {
    if (!config) return null;
    const farmerFields = config.farmerFields || [];
    return (
      <div className="space-y-5">
        <div className="p-3 rounded-lg bg-success/5 border border-success/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-success">Farm Profile</span> — Land tenure type is the strongest predictor in agricultural lending. Title deeds and 99-year leases carry significantly more weight than communal allocations.
          </p>
        </div>
        <FieldGroup label="Farm Identity">
          <Field label="Farm / Enterprise Name">
            <Input placeholder="e.g. Moyo Farm, Sunrise Horticulture" className="bg-muted/50 border-border" value={formData.business_name || ""} onChange={e => updateField("business_name", e.target.value)} />
          </Field>
          <Field label="Farmer Registration (if any)">
            <Input placeholder={config.businessRegistration.placeholder} className="bg-muted/50 border-border" value={formData.business_reg || ""} onChange={e => updateField("business_reg", e.target.value)} />
          </Field>
        </FieldGroup>
        <FieldGroup label="Land & Tenure">
          {renderConfigFields(farmerFields, "Land & Tenure")}
        </FieldGroup>
        <FieldGroup label="Infrastructure">
          {renderConfigFields(farmerFields, "Infrastructure")}
        </FieldGroup>
      </div>
    );
  };

  // ── FARMER: Operations & Crops Step ──
  const renderFarmOperationsStep = () => {
    if (!config) return null;
    const farmerFields = config.farmerFields || [];
    return (
      <div className="space-y-5">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Farming Operations</span> — Diversified enterprises with contract farming and formal market access reduce default risk by 40-60% compared to monocrop farm-gate sellers.
          </p>
        </div>
        <FieldGroup label="Farming Operations">
          {renderConfigFields(farmerFields, "Farming Operations")}
        </FieldGroup>
        <FieldGroup label="Market & Contracts">
          {renderConfigFields(farmerFields, "Market & Contracts")}
        </FieldGroup>
        <FieldGroup label="Community & Support">
          {renderConfigFields(farmerFields, "Community & Support")}
        </FieldGroup>
      </div>
    );
  };

  // ── FARMER: Season Performance & Finance Step ──
  const renderFarmFinancialStep = () => {
    if (!config) return null;
    const farmerFields = config.farmerFields || [];
    return (
      <div className="space-y-5">
        <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-warning">Season Performance & Assets</span> — Previous season results, livestock holdings, and input financing capacity are critical for assessing repayment ability on agricultural loans.
          </p>
        </div>
        <FieldGroup label="Previous Season Performance">
          {renderConfigFields(farmerFields, "Season Performance")}
        </FieldGroup>
        <FieldGroup label="Livestock & Farm Assets">
          {renderConfigFields(farmerFields, "Livestock & Assets")}
        </FieldGroup>
        <FieldGroup label="Input Access & Insurance">
          {renderConfigFields(farmerFields, "Inputs & Insurance")}
        </FieldGroup>

        {/* Livestock asset valuation */}
        {(formData.cattle_count || formData.small_stock_count) && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Livestock Asset Estimate</h4>
            {(() => {
              const cattle = parseInt(formData.cattle_count || "0");
              const smallStock = parseInt(formData.small_stock_count || "0");
              const poultry = parseInt(formData.poultry_count || "0");
              const cattleValue = cattle * 800; // ~USD 800/head avg
              const smallStockValue = smallStock * 50; // ~USD 50/head
              const poultryValue = poultry * 8; // ~USD 8/bird
              const totalLivestock = cattleValue + smallStockValue + poultryValue;
              const equipmentValue = parseInt(formData.equipment_value_usd || "0");
              return (
                <div className="space-y-1.5 text-xs">
                  {cattle > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Cattle ({cattle} head × $800)</span><span className="font-medium">USD {cattleValue.toLocaleString()}</span></div>}
                  {smallStock > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Small stock ({smallStock} × $50)</span><span className="font-medium">USD {smallStockValue.toLocaleString()}</span></div>}
                  {poultry > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Poultry ({poultry} × $8)</span><span className="font-medium">USD {poultryValue.toLocaleString()}</span></div>}
                  {equipmentValue > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Farm Equipment</span><span className="font-medium">USD {equipmentValue.toLocaleString()}</span></div>}
                  <div className="flex justify-between border-t border-border/30 pt-1 font-semibold"><span>Total Farm Assets</span><span className="text-success">USD {(totalLivestock + equipmentValue).toLocaleString()}</span></div>
                </div>
              );
            })()}
          </div>
        )}

        <FieldGroup label="Credit Bureau Score (if available)">
          <Field label="Bureau Score (300-900)" span2>
            <Input type="number" placeholder="e.g. 720 — leave blank if not available" className="bg-muted/50 border-border" min={300} max={900} value={formData.bureau_score || ""} onChange={e => updateField("bureau_score", e.target.value)} />
          </Field>
        </FieldGroup>
      </div>
    );
  };

  // ── Step Router ──
  const renderCurrentStep = () => {
    switch (currentStepId) {
      case "borrower": return renderBorrowerStep();
      case "business": return renderMicroBusinessStep();
      case "corporate": return renderSMECorporateStep();
      case "financials": return renderSMEFinancialsStep();
      case "cashflow": return category === "micro" ? renderMicroCashFlowStep() : renderSMECashFlowStep();
      case "social": return renderSocialMediaStep();
      case "farm_profile": return renderFarmProfileStep();
      case "farm_operations": return renderFarmOperationsStep();
      case "farm_financial": return renderFarmFinancialStep();
      case "financial": return renderFinancialStep();
      case "altdata": return renderAltDataStep();
      case "documents": return renderDocumentsStep();
      case "psychometric": return renderPsychometricStep();
      case "review": return renderReviewStep();
      default: return null;
    }
  };

  return (
    <div className="flex gap-2">
      {hasDraft && !open && (
        <Button variant="outline" className="gap-2 border-accent/30 text-accent hover:bg-accent/10" onClick={restoreDraft}>
          <Clock className="h-4 w-4" /> Resume Draft
        </Button>
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button className="gap-2" onClick={() => { setHasDraft(false); }}>
            <Plus className="h-4 w-4" /> New Application
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-card border-glass-border sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center justify-between">
              New Application
              {hasDraft && (
                <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20 font-normal">
                  Draft restored
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Product Category Tabs */}
          <Tabs value={category} onValueChange={handleCategoryChange} className="mt-2">
            <TabsList className="grid w-full grid-cols-4 bg-muted">
              <TabsTrigger value="retail" className="gap-1.5 text-xs"><User className="h-3.5 w-3.5" /> Individual</TabsTrigger>
              <TabsTrigger value="micro" className="gap-1.5 text-xs"><Store className="h-3.5 w-3.5" /> Micro</TabsTrigger>
              <TabsTrigger value="sme" className="gap-1.5 text-xs"><Landmark className="h-3.5 w-3.5" /> SME</TabsTrigger>
              <TabsTrigger value="farmer" className="gap-1.5 text-xs"><Sprout className="h-3.5 w-3.5" /> Farmer</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Category description banner */}
          <div className={`p-2.5 rounded-lg text-xs ${
            category === "retail" ? "bg-primary/5 border border-primary/15 text-primary" :
            category === "micro" ? "bg-accent/5 border border-accent/15 text-accent" :
            category === "farmer" ? "bg-success/5 border border-success/15 text-success" :
            "bg-success/5 border border-success/15 text-success"
          }`}>
            {category === "retail" && "Individual — Salaried employees, civil servants, personal loans. Focus: income stability, DTI, employment."}
            {category === "micro" && "Micro — Informal traders, market vendors, cross-border traders. Focus: daily sales, cash flow, Mukando savings."}
            {category === "sme" && "SME — Registered businesses with formal financials. Focus: turnover, margins, cash flow volatility, social media presence."}
            {category === "farmer" && "Farmer / Agri — Smallholder to commercial farmers. Focus: land tenure, crop diversification, irrigation, contract farming, season performance."}
          </div>

          <StepIndicator currentStep={step} steps={steps} />

          {renderCurrentStep()}

          {/* No country selected message */}
          {step > 0 && !config && (
            <div className="py-12 text-center">
              <Globe className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Please select a country in Step 1 first</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setStep(0)}>Go Back</Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-border/30">
            <Button variant="outline" onClick={prev} disabled={step === 0} className="gap-1.5 border-border">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={next} className="gap-1.5">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground">
                <CheckCircle2 className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit Application"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewApplicationWizard;
