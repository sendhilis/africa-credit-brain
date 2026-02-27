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
  Banknote, Shield, Wifi, Send, Clock, Loader2
} from "lucide-react";
import { countryConfigs, productTypes, type CountryConfig } from "./countryConfig";
import { useAuth } from "@/contexts/AuthContext";

type ProductCategory = "retail" | "micro" | "sme";
type PsychometricStatus = "not_started" | "link_sent" | "in_progress" | "completed" | "expired";

const STORAGE_KEY = "africaone_wizard_draft";

const STEPS = [
  { id: "borrower", label: "Borrower Info", icon: User },
  { id: "financial", label: "Financial Profile", icon: Banknote },
  { id: "altdata", label: "Alt-Data Consent", icon: Wifi },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "psychometric", label: "Psychometric", icon: Brain },
  { id: "review", label: "Review & Submit", icon: CheckCircle2 },
];

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
    // Expire drafts older than 24h
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

const StepIndicator = ({ currentStep, steps }: { currentStep: number; steps: typeof STEPS }) => (
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

  const config = useMemo(() => country ? countryConfigs[country] : null, [country]);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) setHasDraft(true);
  }, []);

  // Auto-save draft whenever form state changes (only while dialog is open)
  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      saveDraft({ step, category, country, formData, altDataConsents, documents, psychometricStatus, psychometricMethod });
    }, 500); // debounce
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

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Psychometric: Send link via SMS/WhatsApp
  const handleSendPsychometricLink = async () => {
    const phone = formData.psychometric_phone || formData.phone;
    if (!phone) {
      toast({ title: "Phone number required", description: "Enter the borrower's phone number to send the assessment link.", variant: "destructive" });
      return;
    }
    setSendingLink(true);
    // Simulate sending (in production this would call an edge function)
    await new Promise(r => setTimeout(r, 1500));
    setPsychometricStatus("link_sent");
    setPsychometricMethod("sms");
    updateField("psychometric_method", "sms");
    setSendingLink(false);
    toast({ title: "Assessment link sent", description: `Psychometric survey link sent to ${phone}. The borrower has 48 hours to complete it.` });
  };

  // Psychometric: Start in-branch
  const handleStartInBranch = () => {
    setPsychometricStatus("in_progress");
    setPsychometricMethod("in_branch");
    updateField("psychometric_method", "in_branch");
    toast({ title: "In-branch assessment started", description: "Guide the borrower through the psychometric questionnaire now." });
    // Simulate completion after a short time (demo)
    setTimeout(() => {
      setPsychometricStatus("completed");
      toast({ title: "Assessment completed", description: "Psychometric assessment has been recorded successfully." });
    }, 5000);
  };

  const { user } = useAuth();
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  // Fetch the logged-in user's institution
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
        location_detail: formData.county || formData.state || formData.region || formData.province || formData.district || null,
        business_name: category !== "retail" ? (formData.business_name || null) : null,
        business_registration: category !== "retail" ? (formData.business_reg || null) : null,
        business_type: category !== "retail" ? (formData.business_type || null) : null,
        years_in_operation: category !== "retail" && formData.years_operation ? parseInt(formData.years_operation) : null,
        sector: formData.sector || null,
        employees: formData.employees ? parseInt(formData.employees) : null,
        extra_data: {
          bank: formData.bank,
          account_number: formData.account_number,
          bank_years: formData.bank_years,
          avg_balance: formData.avg_balance,
        },
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

      // Create document extraction records and trigger OCR for each uploaded doc
      const docEntries = Object.entries(documents);
      if (docEntries.length > 0 && appResult?.id) {
        for (const [docType, storagePath] of docEntries) {
          // Try to move file from pending to application folder
          const newPath = `${institutionId}/${appResult.id}/${storagePath.split('/').pop()}`;
          const { error: moveErr } = await supabase.storage
            .from("application-documents")
            .move(storagePath, newPath);

          // Use whichever path the file is actually at
          const finalPath = moveErr ? storagePath : newPath;
          if (moveErr) {
            console.warn("File move failed, using original path:", moveErr.message);
          }

          // Create extraction record
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

          // Trigger OCR extraction (non-blocking)
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
    if (!v) {
      // Don't reset — draft is already saved
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
          <Tabs value={category} onValueChange={(v) => setCategory(v as ProductCategory)} className="mt-2">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="retail" className="gap-1.5 text-xs"><User className="h-3.5 w-3.5" /> Retail Individual</TabsTrigger>
              <TabsTrigger value="micro" className="gap-1.5 text-xs"><Building2 className="h-3.5 w-3.5" /> Micro-enterprise</TabsTrigger>
              <TabsTrigger value="sme" className="gap-1.5 text-xs"><Globe className="h-3.5 w-3.5" /> SME</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Step Indicator */}
          <StepIndicator currentStep={step} steps={STEPS} />

          {/* Step 1: Borrower Info */}
          {step === 0 && (
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

              <FieldGroup label="Personal Details">
                <Field label={category === "retail" ? "Full Name" : "Contact Person"}>
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

                  {config.additionalRetailFields.filter(f => ["county","state","region","province","district"].includes(f.key)).map(f => (
                    <FieldGroup key={f.key} label="Location Details">
                      <Field label={f.label}>
                        <Input placeholder={f.placeholder} className="bg-muted/50 border-border" value={formData[f.key] || ""} onChange={e => updateField(f.key, e.target.value)} />
                      </Field>
                    </FieldGroup>
                  ))}
                </>
              )}

              {config && category !== "retail" && (
                <FieldGroup label="Business Details">
                  <Field label="Business Name">
                    <Input placeholder="Registered business name" className="bg-muted/50 border-border" value={formData.business_name || ""} onChange={e => updateField("business_name", e.target.value)} />
                  </Field>
                  <Field label={config.businessRegistration.label}>
                    <Input placeholder={config.businessRegistration.placeholder} className="bg-muted/50 border-border" value={formData.business_reg || ""} onChange={e => updateField("business_reg", e.target.value)} />
                  </Field>
                  <Field label="Years in Operation">
                    <Input type="number" placeholder="2" className="bg-muted/50 border-border" value={formData.years_operation || ""} onChange={e => updateField("years_operation", e.target.value)} />
                  </Field>
                  <Field label="Business Type">
                    <Select value={formData.business_type || ""} onValueChange={v => updateField("business_type", v)}>
                      <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="limited">Limited Company</SelectItem>
                        <SelectItem value="cooperative">Cooperative / SACCO</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  {config.additionalBusinessFields.map(f => (
                    <Field key={f.key} label={f.label}>
                      <Input type={f.type} placeholder={f.placeholder} className="bg-muted/50 border-border" value={formData[f.key] || ""} onChange={e => updateField(f.key, e.target.value)} />
                    </Field>
                  ))}
                </FieldGroup>
              )}
            </div>
          )}

          {/* Step 2: Financial Profile */}
          {step === 1 && config && (
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
                      <SelectItem value="working_capital">Working Capital</SelectItem>
                      <SelectItem value="asset_purchase">Asset Purchase</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="housing">Housing / Rent</SelectItem>
                      <SelectItem value="personal">Personal / Consumption</SelectItem>
                      <SelectItem value="debt_consolidation">Debt Consolidation</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Collateral (if any)">
                  <Select value={formData.collateral || ""} onValueChange={v => updateField("collateral", v)}>
                    <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Unsecured)</SelectItem>
                      <SelectItem value="salary">Salary Assignment</SelectItem>
                      <SelectItem value="property">Property / Land</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="group_guarantee">Group Guarantee</SelectItem>
                      <SelectItem value="inventory">Inventory / Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>

              <FieldGroup label="Income & Expenses">
                {config.additionalRetailFields.filter(f => ["monthly_income","employer"].includes(f.key)).map(f => (
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
                {formData.existing_loans && formData.existing_loans !== "none" && (
                  <Field label={`Total Monthly Repayments (${config.currency})`}>
                    <Input type="number" placeholder="5000" className="bg-muted/50 border-border" value={formData.existing_repayments || ""} onChange={e => updateField("existing_repayments", e.target.value)} />
                  </Field>
                )}
              </FieldGroup>

              {country === "zimbabwe" && (
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
                  <Field label="USD Income (monthly, if any)">
                    <Input type="number" placeholder="200" className="bg-muted/50 border-border" value={formData.usd_income || ""} onChange={e => updateField("usd_income", e.target.value)} />
                  </Field>
                </FieldGroup>
              )}

              <FieldGroup label="Credit Bureau Score (if available)">
                <Field label="Bureau Score (300-900)" span2>
                  <Input type="number" placeholder="e.g. 720 — leave blank if not available" className="bg-muted/50 border-border" min={300} max={900} value={formData.bureau_score || ""} onChange={e => updateField("bureau_score", e.target.value)} />
                </Field>
                <p className="col-span-2 text-xs text-muted-foreground -mt-1">
                  If a Credit Bureau score is available, it receives <span className="font-semibold text-primary">primary weight (30%)</span> in the scoring model. Leave blank if the borrower has no bureau record.
                </p>
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
            </div>
          )}

          {/* Step 3: Alt-Data Consent */}
          {step === 2 && config && (
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
                    <p className="text-xs text-muted-foreground mt-0.5">Device type, SIM swap history, app usage patterns. Helps verify identity stability.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

           {/* Step 4: Documents */}
          {step === 3 && config && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Upload supporting documents for OCR extraction. Extracted data feeds directly into the scoring model.
              </p>

              {[
                { key: "bank_statement", icon: CreditCard, title: "Bank Statements (min. 3 months)", desc: "Must cover at least 3 consecutive months. Extracts: income flows, variability, recurring obligations. Documents covering less than 3 months will be rejected.", formats: "PDF, JPEG, PNG", accept: ".pdf,.jpg,.jpeg,.png" },
                { key: "utility_bill", icon: Banknote, title: "Utility Bills (min. 3 months)", desc: "Must cover at least 3 consecutive months. Electricity, water, or internet. Extracts: payment regularity, address verification. Single-month bills will be rejected.", formats: "PDF, JPEG", accept: ".pdf,.jpg,.jpeg" },
                ...(category !== "retail" ? [
                  { key: "trade_license", icon: Building2, title: config.businessRegistration.label, desc: "Business registration document. Extracts: registration date, activity codes, address.", formats: "PDF, JPEG", accept: ".pdf,.jpg,.jpeg" },
                  { key: "financial_statement", icon: FileText, title: "Financial Statements / Receipts", desc: "P&L, balance sheet, or sales receipts. Extracts: revenue, margins, cash position.", formats: "PDF, XLSX", accept: ".pdf,.xlsx,.xls" },
                ] : []),
                { key: "id_copy", icon: Shield, title: "ID Document Copy", desc: "Clear photo of the selected ID. Used for KYC verification and identity matching.", formats: "JPEG, PNG", accept: ".jpg,.jpeg,.png" },
              ].map(doc => (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDocuments(prev => {
                              const next = { ...prev };
                              delete next[doc.key];
                              return next;
                            })}
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            id={`file-${doc.key}`}
                            className="hidden"
                            accept={doc.accept}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file || !institutionId) return;
                              setUploadingDoc(doc.key);
                              try {
                                const filePath = `${institutionId}/pending/${doc.key}_${Date.now()}_${file.name}`;
                                const { error: uploadErr } = await supabase.storage
                                  .from("application-documents")
                                  .upload(filePath, file);
                                if (uploadErr) throw uploadErr;
                                setDocuments(prev => ({ ...prev, [doc.key]: filePath }));
                                toast({ title: "Document uploaded", description: `${doc.title} uploaded successfully. OCR extraction will run after submission.` });
                              } catch (err: any) {
                                console.error("Upload error:", err);
                                toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                              } finally {
                                setUploadingDoc(null);
                                e.target.value = "";
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs border-border"
                            disabled={uploadingDoc === doc.key}
                            onClick={() => document.getElementById(`file-${doc.key}`)?.click()}
                          >
                            {uploadingDoc === doc.key ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                            {uploadingDoc === doc.key ? "Uploading…" : "Upload"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 5: Psychometric Assessment */}
          {step === 4 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                A 5–10 minute behavioural micro-survey captures traits like conscientiousness, risk attitude, and financial planning horizon — feeding the scoring model as a separate feature block.
              </p>

              {/* Current Status */}
              {(() => {
                const statusConfig = PSYCHOMETRIC_STATUS_CONFIG[psychometricStatus];
                const StatusIcon = statusConfig.icon;
                return (
                  <div className={`p-4 rounded-lg border ${statusConfig.color}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${psychometricStatus === "in_progress" ? "animate-spin" : ""}`} />
                        <span className="text-sm font-medium">Assessment Status: {statusConfig.label}</span>
                      </div>
                      {psychometricMethod && (
                        <Badge variant="outline" className="text-xs border-border">
                          {psychometricMethod === "sms" ? "SMS / WhatsApp" : "In-Branch"}
                        </Badge>
                      )}
                    </div>
                    {psychometricStatus === "link_sent" && (
                      <p className="text-xs mt-2 opacity-80">
                        Link sent to {formData.psychometric_phone || formData.phone}. The borrower has 48 hours to complete the survey.
                      </p>
                    )}
                    {psychometricStatus === "in_progress" && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Assessment in progress…</span>
                          <span>Estimating completion</span>
                        </div>
                        <Progress value={60} className="h-1.5" />
                      </div>
                    )}
                    {psychometricStatus === "completed" && (
                      <p className="text-xs mt-2 opacity-80">
                        ✓ All psychometric traits captured. Scores will be included in the composite model.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Delivery options — only show if not started or expired */}
              {(psychometricStatus === "not_started" || psychometricStatus === "expired") && (
                <>
                  <FieldGroup label="Send Assessment">
                    <Field label="Phone for Assessment" span2>
                      <Input
                        placeholder={config?.phonePlaceholder || "+XXX XXX XXX XXXX"}
                        className="bg-muted/50 border-border"
                        value={formData.psychometric_phone || formData.phone || ""}
                        onChange={e => updateField("psychometric_phone", e.target.value)}
                      />
                    </Field>
                  </FieldGroup>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 cursor-pointer transition-colors text-center space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Smartphone className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="text-sm font-medium text-foreground">Send via SMS / WhatsApp</h4>
                      <p className="text-xs text-muted-foreground">Borrower completes remotely on their device</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5 text-xs border-border"
                        onClick={handleSendPsychometricLink}
                        disabled={sendingLink}
                      >
                        {sendingLink ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        {sendingLink ? "Sending…" : "Send Link"}
                      </Button>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 cursor-pointer transition-colors text-center space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                        <Brain className="h-6 w-6 text-success" />
                      </div>
                      <h4 className="text-sm font-medium text-foreground">Start In-Branch</h4>
                      <p className="text-xs text-muted-foreground">Field officer guides borrower through assessment</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5 text-xs border-border"
                        onClick={handleStartInBranch}
                      >
                        <ArrowRight className="h-3 w-3" /> Begin Now
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Resend option for link_sent */}
              {psychometricStatus === "link_sent" && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border" onClick={handleSendPsychometricLink} disabled={sendingLink}>
                    {sendingLink ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Resend Link
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border" onClick={handleStartInBranch}>
                    <Brain className="h-3 w-3" /> Switch to In-Branch
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                You can proceed without the psychometric score — the model will use available data. The assessment can be completed later and the score will update automatically.
              </p>

              <div className="space-y-2 p-3 rounded-lg bg-muted/20 border border-border/30">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Traits Measured</h4>
                <div className="flex flex-wrap gap-2">
                  {["Conscientiousness", "Risk Attitude", "Impulse Control", "Financial Planning", "Honesty / Integrity", "Time Preference"].map(trait => (
                    <Badge key={trait} variant="outline" className="text-xs bg-muted/50 border-border text-muted-foreground">{trait}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review & Submit */}
          {step === 5 && config && (
            <div className="space-y-5">
              <div className="space-y-3">
                {[
                  { label: "Category", value: category === "retail" ? "Retail Individual" : category === "micro" ? "Micro-enterprise" : "SME" },
                  { label: "Country", value: config.label },
                  { label: "Product", value: productTypes.find(p => p.value === formData.product)?.label || "—" },
                  { label: "Borrower", value: formData.name || "—" },
                  { label: "ID", value: `${config.idTypes.find(i => i.value === formData.id_type)?.label || "—"}: ${formData.id_number || "—"}` },
                  { label: "Phone", value: formData.phone || "—" },
                  { label: "Amount", value: formData.amount ? `${config.currencySymbol} ${Number(formData.amount).toLocaleString()}` : "—" },
                  { label: "Tenor", value: formData.tenor ? `${formData.tenor} months` : "—" },
                  { label: "Psychometric", value: PSYCHOMETRIC_STATUS_CONFIG[psychometricStatus].label },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>

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
                  On submit, AfricaOne will initiate: <span className="text-foreground font-medium">Bureau checks → Alt-data pull → Document OCR → Psychometric score → Composite Score</span>
                </p>
              </div>
            </div>
          )}

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
            {step < STEPS.length - 1 ? (
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
