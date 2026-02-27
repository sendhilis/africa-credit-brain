import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import ScoreGauge from "@/components/ScoreGauge";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  FileCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const stats = [
  { label: "Total Applications", value: "12,847", change: "+12%", up: true, icon: FileCheck },
  { label: "Active Borrowers", value: "8,234", change: "+8%", up: true, icon: Users },
  { label: "Avg. Score", value: "672", change: "+3pts", up: true, icon: TrendingUp },
  { label: "Default Rate", value: "4.2%", change: "-0.3%", up: false, icon: AlertTriangle },
];

const recentApplications = [
  { id: "APP-2847", name: "Amara Diallo", country: "Senegal", product: "Micro-loan", score: 745, status: "Approved", band: "Band A" },
  { id: "APP-2846", name: "Kwame Mensah", country: "Ghana", product: "SME Working Capital", score: 580, status: "Review", band: "Band C" },
  { id: "APP-2845", name: "Fatima Abdi", country: "Kenya", product: "Nano-credit", score: 820, status: "Approved", band: "Band A" },
  { id: "APP-2844", name: "Jean Habimana", country: "Rwanda", product: "Retail Individual", score: 410, status: "Declined", band: "Band D" },
  { id: "APP-2843", name: "Ngozi Okafor", country: "Nigeria", product: "Micro-enterprise", score: 690, status: "Approved", band: "Band B" },
];

const getStatusColor = (status: string) => {
  if (status === "Approved") return "bg-success/20 text-success border-success/30";
  if (status === "Review") return "bg-warning/20 text-warning border-warning/30";
  return "bg-destructive/20 text-destructive border-destructive/30";
};

const Index = () => {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pan-African credit intelligence overview — All markets
        </p>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <GlassCard key={stat.label} className="animate-slide-up" >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1">
              {stat.up ? (
                <ArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-success" />
              )}
              <span className="text-xs font-medium text-success">{stat.change}</span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <GlassCard hover={false}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Recent Applications</h2>
              <a href="/applications" className="text-xs font-medium text-primary hover:underline">View all →</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">ID</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Borrower</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Country</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Score</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
                    <tr key={app.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-mono text-xs text-muted-foreground">{app.id}</td>
                      <td className="py-3 font-medium text-foreground">{app.name}</td>
                      <td className="py-3 text-muted-foreground">{app.country}</td>
                      <td className="py-3">
                        <span className="font-display font-semibold text-foreground">{app.score}</span>
                        <span className="ml-1 text-xs text-muted-foreground">{app.band}</span>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Score Distribution + Model Health */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Portfolio Score Health</h3>
            <div className="flex justify-center">
              <ScoreGauge score={672} band="Avg. Band B" size={200} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-display text-lg font-bold text-success">62%</p>
                <p className="text-[10px] uppercase text-muted-foreground">Low Risk</p>
              </div>
              <div>
                <p className="font-display text-lg font-bold text-warning">28%</p>
                <p className="text-[10px] uppercase text-muted-foreground">Medium</p>
              </div>
              <div>
                <p className="font-display text-lg font-bold text-destructive">10%</p>
                <p className="text-[10px] uppercase text-muted-foreground">High Risk</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Model Health</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">PSI Score</span>
                  <span className="font-medium text-success">0.08 — Stable</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className="h-full w-[92%] rounded-full bg-success" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">AUC-ROC</span>
                  <span className="font-medium text-primary">0.84</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className="h-full w-[84%] rounded-full bg-primary" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Calibration</span>
                  <span className="font-medium text-warning">Slight drift</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className="h-full w-[68%] rounded-full bg-warning" />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
