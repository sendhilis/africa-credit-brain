import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Clock, Database, Smartphone, Zap, Building2 } from "lucide-react";

const integrations = [
  { name: "Credit Bureau Kenya (CRB)", type: "Bureau", country: "Kenya", status: "Connected", icon: Database },
  { name: "Credit Bureau Rwanda", type: "Bureau", country: "Rwanda", status: "Connected", icon: Database },
  { name: "Credit Bureau Nigeria (CRC)", type: "Bureau", country: "Nigeria", status: "Pending", icon: Database },
  { name: "M-Pesa Wallet API", type: "Mobile Wallet", country: "Kenya", status: "Connected", icon: Smartphone },
  { name: "MTN Mobile Money", type: "Mobile Wallet", country: "Ghana", status: "Connected", icon: Smartphone },
  { name: "Orange Money", type: "Mobile Wallet", country: "Senegal", status: "Error", icon: Smartphone },
  { name: "Kenya Power Utility", type: "Utility", country: "Kenya", status: "Connected", icon: Zap },
  { name: "Umeme Uganda", type: "Utility", country: "Uganda", status: "Pending", icon: Zap },
  { name: "Equity Bank", type: "Bank", country: "Kenya", status: "Connected", icon: Building2 },
];

const getStatusPill = (status: string) => {
  if (status === "Connected") return <Badge variant="outline" className="bg-success/20 text-success border-success/30 gap-1"><Wifi className="h-3 w-3" /> Connected</Badge>;
  if (status === "Pending") return <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30 gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
  return <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30 gap-1"><WifiOff className="h-3 w-3" /> Error</Badge>;
};

const Integrations = () => (
  <DashboardLayout>
    <div className="mb-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Integrations</h1>
      <p className="mt-1 text-sm text-muted-foreground">Data source connectors across African markets</p>
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {integrations.map((intg) => (
        <GlassCard key={intg.name}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <intg.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground text-sm">{intg.name}</h3>
              <p className="text-xs text-muted-foreground">{intg.type} · {intg.country}</p>
              <div className="mt-2">{getStatusPill(intg.status)}</div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  </DashboardLayout>
);

export default Integrations;
