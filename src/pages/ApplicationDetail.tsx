import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import ScoreJustification from "@/components/application/ScoreJustification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Brain, Loader2, CheckCircle2, XCircle, RotateCcw,
  Send, Banknote, User, Building2, FileText, Shield, Clock
} from "lucide-react";

type AppStatus = "draft" | "submitted" | "review" | "approved" | "declined" | "disbursed";

interface FullApplication {
  id: string;
  app_code: string;
  country: string;
  product_type: string | null;
  product_category: string;
  status: AppStatus;
  score: number | null;
  score_band: string | null;
  probability_of_default: number | null;
  reason_codes: any;
  scored_at: string | null;
  requested_amount: number | null;
  currency: string | null;
  tenor_months: number | null;
  purpose: string | null;
  collateral: string | null;
  monthly_income: number | null;
  monthly_expenses: number | null;
  monthly_rent: number | null;
  dependents: number | null;
  existing_loans: string | null;
  employer: string | null;
  monthly_revenue: number | null;
  usd_income: number | null;
  usd_revenue: number | null;
  export_income_pct: number | null;
  alt_data_consents: any;
  documents: any;
  psychometric_status: string | null;
  psychometric_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  borrower: {
    full_name: string;
    gender: string | null;
    date_of_birth: string | null;
    marital_status: string | null;
    id_type: string | null;
    id_number: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    location_detail: string | null;
    business_name: string | null;
    business_type: string | null;
    sector: string | null;
    years_in_operation: number | null;
    employees: number | null;
  } | null;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  draft: { color: "bg-muted/50 text-muted-foreground border-border", label: "Draft" },
  submitted: { color: "bg-accent/15 text-accent border-accent/30", label: "Submitted" },
  review: { color: "bg-warning/15 text-warning border-warning/30", label: "Under Review" },
  approved: { color: "bg-success/15 text-success border-success/30", label: "Approved" },
  declined: { color: "bg-destructive/15 text-destructive border-destructive/30", label: "Declined" },
  disbursed: { color: "bg-primary/15 text-primary border-primary/30", label: "Disbursed" },
};

const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm text-foreground font-medium">{value || "—"}</span>
  </div>
);

const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [app, setApp] = useState<FullApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [scorecardDetail, setScorecardDetail] = useState<any>(null);

  const fetchApp = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*, borrower:borrowers!applications_borrower_id_fkey(*)")
      .eq("id", id)
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setApp(data as any);
      // Fetch latest scorecard result if scored
      if (data?.scored_at) {
        const { data: scData } = await supabase
          .from("scorecard_results")
          .select("*")
          .eq("application_id", id!)
          .order("scored_at", { ascending: false })
          .limit(1)
          .single();
        if (scData) setScorecardDetail(scData);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchApp(); }, [id]);

  const handleRunScore = async () => {
    if (!app) return;
    setScoring(true);
    try {
      const { data, error } = await supabase.functions.invoke("score-application", {
        body: { application_id: app.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setScoreResult(data);
      toast({ title: "Scoring complete", description: `Score: ${data.score} (${data.score_band})` });
      await fetchApp(); // This also fetches scorecard_results
    } catch (err: any) {
      toast({ title: "Scoring failed", description: err.message, variant: "destructive" });
    } finally {
      setScoring(false);
    }
  };

  const handleStatusChange = async (newStatus: AppStatus) => {
    if (!app) return;
    setUpdating(true);
    try {
      const updates: any = { status: newStatus };
      if (actionNotes) {
        updates.notes = (app.notes ? app.notes + "\n\n" : "") +
          `[${new Date().toLocaleString()}] Status → ${newStatus}: ${actionNotes}`;
      }
      const { error } = await supabase
        .from("applications")
        .update(updates)
        .eq("id", app.id);
      if (error) throw error;
      toast({ title: "Status updated", description: `Application moved to ${newStatus}` });
      setActionNotes("");
      await fetchApp();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!app) {
    return (
      <DashboardLayout>
        <div className="text-center py-24 text-muted-foreground">Application not found.</div>
      </DashboardLayout>
    );
  }

  const sc = statusConfig[app.status] || statusConfig.draft;
  const hasScore = app.score !== null;
  const displayScore = scoreResult || (hasScore ? {
    score: app.score!,
    score_band: app.score_band || "N/A",
    probability_of_default: app.probability_of_default || 0,
    recommendation: app.status === "approved" ? "approve" : app.status === "declined" ? "decline" : "review",
    reason_codes: Array.isArray(app.reason_codes) ? app.reason_codes : [],
    factors: scorecardDetail?.feature_contributions || [],
    summary: scorecardDetail?.summary || "",
    model_version: scorecardDetail?.model_version,
    woe_details: scorecardDetail?.woe_details,
    time_series_features: scorecardDetail?.time_series_features,
    ai_insights: scorecardDetail?.ai_insights,
  } : null);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-3 gap-1 text-muted-foreground" onClick={() => navigate("/applications")}>
          <ArrowLeft className="h-4 w-4" /> Back to Applications
        </Button>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{app.app_code}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {app.borrower?.full_name || "Unknown Borrower"} · {app.country} · {app.product_type || app.product_category}
            </p>
          </div>
          <Badge variant="outline" className={`text-sm ${sc.color}`}>{sc.label}</Badge>
        </div>
      </div>

      {/* Action Bar */}
      <GlassCard hover={false} className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleRunScore}
            disabled={scoring}
            className="gap-2"
          >
            {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            {scoring ? "Running Model..." : hasScore ? "Re-Score" : "Run Credit Score"}
          </Button>

          {(app.status === "review" || app.status === "submitted") && (
            <>
              <Button
                variant="outline"
                className="gap-2 border-success/30 text-success hover:bg-success/10"
                onClick={() => handleStatusChange("approved")}
                disabled={updating}
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => handleStatusChange("declined")}
                disabled={updating}
              >
                <XCircle className="h-4 w-4" /> Decline
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-accent/30 text-accent hover:bg-accent/10"
                onClick={() => handleStatusChange("submitted")}
                disabled={updating}
              >
                <RotateCcw className="h-4 w-4" /> Request More Info
              </Button>
            </>
          )}

          {app.status === "approved" && (
            <Button
              variant="outline"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => handleStatusChange("disbursed")}
              disabled={updating}
            >
              <Banknote className="h-4 w-4" /> Mark Disbursed
            </Button>
          )}

          {app.status === "declined" && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleStatusChange("review")}
              disabled={updating}
            >
              <RotateCcw className="h-4 w-4" /> Reopen for Review
            </Button>
          )}
        </div>

        {/* Notes input */}
        <div className="mt-3">
          <Textarea
            placeholder="Add notes for this action (optional)..."
            className="bg-muted/50 border-border text-sm"
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            rows={2}
          />
        </div>
      </GlassCard>

      {/* Score Justification */}
      {displayScore && displayScore.factors?.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Score Justification
          </h2>
          <ScoreJustification
            score={displayScore.score}
            scoreBand={displayScore.score_band}
            probabilityOfDefault={displayScore.probability_of_default}
            recommendation={displayScore.recommendation}
            reasonCodes={displayScore.reason_codes}
            factors={displayScore.factors}
            summary={displayScore.summary}
            scoredAt={app.scored_at || new Date().toISOString()}
            modelVersion={displayScore.model_version}
            woeDetails={displayScore.woe_details}
            timeSeriesFeatures={displayScore.time_series_features}
            aiInsights={displayScore.ai_insights}
          />
        </div>
      )}

      {/* Application Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Borrower Info */}
        <GlassCard hover={false}>
          <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Borrower
          </h3>
          <InfoRow label="Name" value={app.borrower?.full_name} />
          <InfoRow label="Gender" value={app.borrower?.gender} />
          <InfoRow label="Date of Birth" value={app.borrower?.date_of_birth} />
          <InfoRow label="Marital Status" value={app.borrower?.marital_status} />
          <InfoRow label="ID Type" value={app.borrower?.id_type} />
          <InfoRow label="ID Number" value={app.borrower?.id_number} />
          <InfoRow label="Phone" value={app.borrower?.phone} />
          <InfoRow label="Email" value={app.borrower?.email} />
          <InfoRow label="Address" value={app.borrower?.address} />
          <InfoRow label="Location" value={app.borrower?.location_detail} />
        </GlassCard>

        {/* Loan Details */}
        <GlassCard hover={false}>
          <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-primary" /> Loan Details
          </h3>
          <InfoRow label="Amount" value={app.requested_amount ? `${app.currency || ""} ${app.requested_amount.toLocaleString()}` : null} />
          <InfoRow label="Tenor" value={app.tenor_months ? `${app.tenor_months} months` : null} />
          <InfoRow label="Purpose" value={app.purpose} />
          <InfoRow label="Collateral" value={app.collateral} />
          <InfoRow label="Product" value={app.product_type || app.product_category} />
          <InfoRow label="Country" value={app.country} />
          <InfoRow label="Bureau Score" value={(app as any).bureau_score ? `${(app as any).bureau_score} / 900` : "Not available"} />
          <InfoRow label="Created" value={new Date(app.created_at).toLocaleDateString()} />
        </GlassCard>

        {/* Financial Profile */}
        <GlassCard hover={false}>
          <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Financial Profile
          </h3>
          <InfoRow label="Monthly Income" value={app.monthly_income ? `${app.currency || ""} ${app.monthly_income.toLocaleString()}` : null} />
          <InfoRow label="Monthly Expenses" value={app.monthly_expenses ? `${app.currency || ""} ${app.monthly_expenses.toLocaleString()}` : null} />
          <InfoRow label="Monthly Rent" value={app.monthly_rent ? `${app.currency || ""} ${app.monthly_rent.toLocaleString()}` : null} />
          <InfoRow label="Dependents" value={app.dependents} />
          <InfoRow label="Existing Loans" value={app.existing_loans} />
          <InfoRow label="Employer" value={app.employer} />
          {app.product_category !== "retail" && (
            <>
              <InfoRow label="Monthly Revenue" value={app.monthly_revenue ? `${app.currency || ""} ${app.monthly_revenue.toLocaleString()}` : null} />
              <InfoRow label="Export Income %" value={app.export_income_pct ? `${app.export_income_pct}%` : null} />
            </>
          )}
        </GlassCard>

        {/* Business Info (if not retail) */}
        {app.product_category !== "retail" && app.borrower && (
          <GlassCard hover={false}>
            <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Business Info
            </h3>
            <InfoRow label="Business Name" value={app.borrower.business_name} />
            <InfoRow label="Type" value={app.borrower.business_type} />
            <InfoRow label="Sector" value={app.borrower.sector} />
            <InfoRow label="Years Operating" value={app.borrower.years_in_operation} />
            <InfoRow label="Employees" value={app.borrower.employees} />
          </GlassCard>
        )}

        {/* Documents */}
        <GlassCard hover={false}>
          <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Documents
          </h3>
          {Array.isArray(app.documents) && app.documents.length > 0 ? (
            app.documents.map((doc: any, i: number) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-foreground">{doc.type || doc.filename}</span>
                <Badge variant="outline" className="text-xs ml-auto">Mock</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No documents attached</p>
          )}
        </GlassCard>

        {/* Alt-Data & Psychometric */}
        <GlassCard hover={false}>
          <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Alt-Data & Psychometric
          </h3>
          <InfoRow label="Psychometric Status" value={app.psychometric_status} />
          <InfoRow label="Psychometric Method" value={app.psychometric_method} />
          {app.alt_data_consents && typeof app.alt_data_consents === "object" && (
            <>
              <p className="text-xs text-muted-foreground mt-2 mb-1">Consents:</p>
              {Object.entries(app.alt_data_consents).map(([key, val]) => (
                <div key={key} className="flex justify-between py-1 text-xs">
                  <span className="text-muted-foreground">{key}</span>
                  <Badge variant="outline" className={val ? "bg-success/10 text-success border-success/20" : "bg-muted/50 text-muted-foreground border-border"}>
                    {val ? "Granted" : "Denied"}
                  </Badge>
                </div>
              ))}
            </>
          )}
        </GlassCard>
      </div>

      {/* Notes */}
      {app.notes && (
        <GlassCard hover={false}>
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Activity Notes</h3>
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{app.notes}</pre>
        </GlassCard>
      )}
    </DashboardLayout>
  );
};

export default ApplicationDetail;
