import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Users, Building2, Globe } from "lucide-react";

const institutions = [
  { name: "MicroFinance Kenya Ltd", country: "Kenya", users: 12, products: 3, status: "Active" },
  { name: "QuickCash Nigeria", country: "Nigeria", users: 8, products: 2, status: "Active" },
  { name: "Umoja Lending Rwanda", country: "Rwanda", users: 5, products: 2, status: "Active" },
  { name: "FinBridge Ghana", country: "Ghana", users: 3, products: 1, status: "Onboarding" },
];

const Admin = () => (
  <DashboardLayout>
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage institutions, users, and platform settings</p>
      </div>
      <Button className="gap-2"><Building2 className="h-4 w-4" /> Onboard Institution</Button>
    </div>

    <GlassCard hover={false}>
      <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Institutions</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Institution", "Country", "Users", "Products", "Status", ""].map((h) => (
                <th key={h} className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {institutions.map((inst) => (
              <tr key={inst.name} className="border-b border-border/50 last:border-0">
                <td className="py-3 font-medium text-foreground">{inst.name}</td>
                <td className="py-3 text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" />{inst.country}</td>
                <td className="py-3 text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{inst.users}</td>
                <td className="py-3 text-muted-foreground">{inst.products}</td>
                <td className="py-3">
                  <Badge variant="outline" className={inst.status === "Active" ? "bg-success/20 text-success border-success/30" : "bg-warning/20 text-warning border-warning/30"}>
                    {inst.status}
                  </Badge>
                </td>
                <td className="py-3"><Button size="sm" variant="ghost"><Settings className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  </DashboardLayout>
);

export default Admin;
