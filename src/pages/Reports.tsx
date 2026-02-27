import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { BarChart3, TrendingUp, PieChart } from "lucide-react";

const Reports = () => (
  <DashboardLayout>
    <div className="mb-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Reports</h1>
      <p className="mt-1 text-sm text-muted-foreground">Portfolio analytics and performance insights</p>
    </div>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Score Distribution</h3>
        </div>
        <div className="flex items-end gap-1 h-32">
          {[15, 25, 40, 60, 80, 95, 85, 65, 45, 30].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-primary/30 hover:bg-primary/50 transition-colors" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>300</span><span>600</span><span>900</span></div>
      </GlassCard>
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-5 w-5 text-success" />
          <h3 className="font-display font-semibold text-foreground">Monthly Approvals</h3>
        </div>
        <div className="flex items-end gap-1 h-32">
          {[40, 55, 50, 65, 70, 80, 75, 85, 90, 88, 92, 95].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-success/30 hover:bg-success/50 transition-colors" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>Mar</span><span>Aug</span><span>Feb</span></div>
      </GlassCard>
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <PieChart className="h-5 w-5 text-warning" />
          <h3 className="font-display font-semibold text-foreground">Default Rates by Market</h3>
        </div>
        <div className="space-y-3 mt-4">
          {[
            { market: "Kenya", rate: 3.1 },
            { market: "Nigeria", rate: 5.8 },
            { market: "Ghana", rate: 4.2 },
            { market: "Rwanda", rate: 2.4 },
            { market: "Senegal", rate: 3.9 },
          ].map((m) => (
            <div key={m.market}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{m.market}</span>
                <span className="font-medium text-foreground">{m.rate}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div className="h-full rounded-full bg-warning" style={{ width: `${m.rate * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  </DashboardLayout>
);

export default Reports;
