import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import NewApplicationWizard from "@/components/application/NewApplicationWizard";

interface ApplicationRow {
  id: string;
  app_code: string;
  country: string;
  product_type: string | null;
  product_category: string;
  score: number | null;
  status: string;
  created_at: string;
  borrower: { full_name: string } | null;
}

const getStatusColor = (status: string) => {
  if (status === "approved") return "bg-success/20 text-success border-success/30";
  if (status === "review" || status === "submitted") return "bg-warning/20 text-warning border-warning/30";
  if (status === "declined") return "bg-destructive/20 text-destructive border-destructive/30";
  return "bg-muted/50 text-muted-foreground border-border";
};

const Applications = () => {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("id, app_code, country, product_type, product_category, score, status, created_at, borrower:borrowers!applications_borrower_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setRows(data.map((d: any) => ({ ...d, borrower: d.borrower ?? null })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchApplications(); }, []);

  const filtered = rows.filter(a =>
    !search ||
    (a.borrower?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    a.app_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage borrower applications across all markets</p>
        </div>
        <NewApplicationWizard />
      </div>

      <GlassCard hover={false} className="mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or country..."
              className="bg-muted/50 pl-9 border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 border-border bg-muted/50" onClick={fetchApplications}>
            <Filter className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </GlassCard>

      <GlassCard hover={false}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["ID", "Borrower", "Country", "Product", "Score", "Status", "Date"].map((h) => (
                    <th key={h} className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No applications found. Create one to get started.</td></tr>
                ) : filtered.map((app) => (
                  <tr key={app.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer">
                    <td className="py-3 font-mono text-xs text-muted-foreground">{app.app_code}</td>
                    <td className="py-3 font-medium text-foreground">{app.borrower?.full_name || "—"}</td>
                    <td className="py-3 text-muted-foreground">{app.country}</td>
                    <td className="py-3 text-muted-foreground">{app.product_type || app.product_category}</td>
                    <td className="py-3 font-display font-semibold text-foreground">{app.score ?? "—"}</td>
                    <td className="py-3">
                      <Badge variant="outline" className={getStatusColor(app.status)}>{app.status}</Badge>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </DashboardLayout>
  );
};

export default Applications;
