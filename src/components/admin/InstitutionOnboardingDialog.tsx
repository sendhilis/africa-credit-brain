import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, User, CheckCircle2, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { countryConfigs } from "@/components/application/countryConfig";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const steps = [
  { id: 1, title: "Institution Details", icon: Building2 },
  { id: 2, title: "Admin User", icon: User },
  { id: 3, title: "Confirm & Create", icon: CheckCircle2 },
];

const countryOptions = Object.entries(countryConfigs).map(([key, cfg]) => ({
  value: key,
  label: cfg.label,
}));

const InstitutionOnboardingDialog = ({ open, onOpenChange, onSuccess }: Props) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ institution_name: string; admin_email: string } | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    institution_name: "",
    country: "",
    admin_email: "",
    admin_display_name: "",
    admin_password: "",
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const canProceed = () => {
    if (step === 1) return form.institution_name.trim() && form.country;
    if (step === 2) return form.admin_email.trim() && form.admin_password.length >= 6;
    return true;
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("onboard-institution", {
        body: form,
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to onboard institution");
      }

      setResult({ institution_name: res.data.institution_name, admin_email: res.data.admin_email });
      setStep(4); // success state
      toast({ title: "Institution onboarded", description: `${res.data.institution_name} is ready.` });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Onboarding failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setForm({ institution_name: "", country: "", admin_email: "", admin_display_name: "", admin_password: "" });
      setResult(null);
    }, 300);
  };

  const selectedCountryLabel = countryOptions.find((c) => c.value === form.country)?.label;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Onboard New Institution</DialogTitle>
          <DialogDescription>Set up a new institution with an initial admin user.</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        {step <= 3 && (
          <div className="flex items-center gap-2 my-2">
            {steps.map((s) => {
              const StepIcon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center justify-center h-8 w-8 rounded-full border-2 shrink-0 transition-colors ${
                    isActive ? "border-primary bg-primary text-primary-foreground" :
                    isDone ? "border-success bg-success/20 text-success" :
                    "border-border bg-muted text-muted-foreground"
                  }`}>
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.title}
                  </span>
                  {s.id < 3 && <div className="flex-1 h-px bg-border" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Step 1: Institution */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inst-name">Institution Name</Label>
              <Input
                id="inst-name"
                placeholder="e.g. MicroFin Capital Ltd"
                value={form.institution_name}
                onChange={(e) => update("institution_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={form.country} onValueChange={(v) => update("country", v)}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {countryOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Admin user */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Admin Display Name</Label>
              <Input
                id="admin-name"
                placeholder="e.g. John Doe"
                value={form.admin_display_name}
                onChange={(e) => update("admin_display_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@institution.com"
                value={form.admin_email}
                onChange={(e) => update("admin_email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-pass">Temporary Password</Label>
              <Input
                id="admin-pass"
                type="password"
                placeholder="Min 6 characters"
                value={form.admin_password}
                onChange={(e) => update("admin_password", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">The admin should change this on first login.</p>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Review the details below before creating.</p>
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Institution</span>
                <span className="text-sm font-medium text-foreground">{form.institution_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Country</span>
                <Badge variant="outline">{selectedCountryLabel}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Admin Email</span>
                <span className="text-sm font-medium text-foreground">{form.admin_email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Admin Name</span>
                <span className="text-sm font-medium text-foreground">{form.admin_display_name || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Initial Role</span>
                <Badge className="bg-primary/15 text-primary border-primary/30">admin</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && result && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-display text-lg font-semibold text-foreground">{result.institution_name}</p>
              <p className="text-sm text-muted-foreground">Successfully onboarded</p>
              <p className="text-xs text-muted-foreground mt-2">
                Admin user <span className="font-medium text-foreground">{result.admin_email}</span> can now log in.
              </p>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex items-center justify-between pt-2">
          {step > 1 && step <= 3 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : <div />}
          
          {step < 3 && (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-1">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleCreate} disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Institution
            </Button>
          )}
          {step === 4 && (
            <Button onClick={handleClose} className="ml-auto">Done</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstitutionOnboardingDialog;
