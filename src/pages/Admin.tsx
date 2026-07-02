import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Building2, Globe, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import InstitutionOnboardingDialog from "@/components/admin/InstitutionOnboardingDialog";
import InstitutionUsersPanel from "@/components/admin/InstitutionUsersPanel";
import InstitutionSettingsDialog from "@/components/admin/InstitutionSettingsDialog";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [dumping, setDumping] = useState(false);

  const handleDumpDatabase = async () => {
    setDumping(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://vbzyihhaqtqpozrxvggr.supabase.co/functions/v1/db-dump`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      if (!res.ok) throw new Error(`Dump failed (${res.status})`);
      const blob = await res.blob();
      const a = document.createElement("a");
      const href = URL.createObjectURL(blob);
      a.href = href;
      a.download = `africaone-dump-${new Date().toISOString().slice(0,10)}.sql`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      toast.success("SQL dump downloaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDumping(false);
    }
  };

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
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleDumpDatabase} disabled={dumping}>
            {dumping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download SQL Dump
          </Button>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Building2 className="h-4 w-4" /> Onboard Institution
          </Button>
        </div>
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
                    <td className="py-3">
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedInstitution(inst); setSettingsOpen(true); }}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* User Management */}
      <div className="mt-6">
        <InstitutionUsersPanel />
      </div>

      <InstitutionOnboardingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchInstitutions}
      />

      <InstitutionSettingsDialog
        institution={selectedInstitution}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSuccess={fetchInstitutions}
      />
    </DashboardLayout>
  );
};

export default Admin;
