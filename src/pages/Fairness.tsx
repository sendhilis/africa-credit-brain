import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

const segments = [
  { segment: "Kenya — Micro-loan", approvalRate: "72%", defaultRate: "3.1%", auc: "0.86", fnrDisparity: "0.02", fair: true },
  { segment: "Nigeria — Nano-credit", approvalRate: "68%", defaultRate: "5.8%", auc: "0.81", fnrDisparity: "0.08", fair: false },
  { segment: "Ghana — SME", approvalRate: "55%", defaultRate: "4.2%", auc: "0.79", fnrDisparity: "0.04", fair: true },
  { segment: "Rwanda — Retail", approvalRate: "78%", defaultRate: "2.4%", auc: "0.88", fnrDisparity: "0.01", fair: true },
  { segment: "Senegal — Micro-loan", approvalRate: "65%", defaultRate: "3.9%", auc: "0.83", fnrDisparity: "0.06", fair: false },
];

const Fairness = () => (
  <DashboardLayout>
    <div className="mb-8 flex items-center gap-3">
      <Shield className="h-7 w-7 text-primary" />
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Fairness & Performance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor model equity and bias across segments</p>
      </div>
    </div>

    <GlassCard hover={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Segment", "Approval Rate", "Default Rate", "AUC", "FNR Disparity", "Fairness"].map((h) => (
                <th key={h} className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {segments.map((s) => (
              <tr key={s.segment} className="border-b border-border/50 last:border-0">
                <td className="py-3 font-medium text-foreground">{s.segment}</td>
                <td className="py-3 text-muted-foreground">{s.approvalRate}</td>
                <td className="py-3 text-muted-foreground">{s.defaultRate}</td>
                <td className="py-3 font-mono text-foreground">{s.auc}</td>
                <td className="py-3 font-mono text-foreground">{s.fnrDisparity}</td>
                <td className="py-3">
                  {s.fair ? (
                    <Badge variant="outline" className="bg-success/20 text-success border-success/30 gap-1">
                      <CheckCircle className="h-3 w-3" /> Pass
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30 gap-1">
                      <AlertTriangle className="h-3 w-3" /> Review
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  </DashboardLayout>
);

export default Fairness;
