import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Building2, Globe, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import InstitutionOnboardingDialog from "@/components/admin/InstitutionOnboardingDialog";

interface Institution {
  id: string;
  name: string;
  country: string;
  products: number;
  status: string;
}

const Admin = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchInstitutions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("institutions").select("*").order("created_at", { ascending: false });
    if (data) setInstitutions(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchInstitutions(); }, [fetchInstitutions]);

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage institutions, users, and platform settings</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Building2 className="h-4 w-4" /> Onboard Institution
        </Button>
      </div>

      <GlassCard hover={false}>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Institutions</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Institution", "Country", "Products", "Status", ""].map((h) => (
                    <th key={h} className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {institutions.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No institutions found.</td></tr>
                ) : institutions.map((inst) => (
                  <tr key={inst.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-medium text-foreground">{inst.name}</td>
                    <td className="py-3 text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" />{inst.country}</td>
                    <td className="py-3 text-muted-foreground">{inst.products}</td>
                    <td className="py-3">
                      <Badge variant="outline" className={
                        inst.status === "Active" ? "bg-success/20 text-success border-success/30" : "bg-warning/20 text-warning border-warning/30"
                      }>
                        {inst.status}
                      </Badge>
                    </td>
                    <td className="py-3"><Button size="sm" variant="ghost"><Settings className="h-4 w-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <InstitutionOnboardingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchInstitutions}
      />
    </DashboardLayout>
  );
};

export default Admin;
