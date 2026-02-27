import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Brain, GitBranch } from "lucide-react";
import { useState } from "react";

const products = [
  { name: "Micro-loan", model: "FairGBM v2.1", countries: ["Kenya", "Rwanda", "Ghana"], approveThreshold: 650, reviewThreshold: 500, auc: 0.84 },
  { name: "Nano-credit", model: "FairGBM v2.1", countries: ["Kenya", "Nigeria", "Senegal"], approveThreshold: 600, reviewThreshold: 450, auc: 0.81 },
  { name: "SME Working Capital", model: "LightGBM + LR", countries: ["Nigeria", "Ghana"], approveThreshold: 700, reviewThreshold: 550, auc: 0.79 },
  { name: "Retail Individual", model: "FairGBM v2.1", countries: ["All markets"], approveThreshold: 620, reviewThreshold: 480, auc: 0.86 },
];

const Models = () => {
  const [approveScore, setApproveScore] = useState([650]);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Models & Policies</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure scoring models, thresholds, and product policies</p>
      </div>

      {/* Active Models */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-display font-semibold text-foreground">FairGBM v2.1</h3>
              <p className="text-xs text-muted-foreground">Primary model · Fairness-constrained GBDT</p>
            </div>
            <Badge className="ml-auto bg-success/20 text-success border-success/30" variant="outline">Active</Badge>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>AUC-ROC</span><span className="font-medium text-foreground">0.84</span></div>
            <div className="flex justify-between"><span>Gini Coefficient</span><span className="font-medium text-foreground">0.68</span></div>
            <div className="flex justify-between"><span>Features</span><span className="font-medium text-foreground">142</span></div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <GitBranch className="h-5 w-5 text-warning" />
            <div>
              <h3 className="font-display font-semibold text-foreground">Logistic Regression Challenger</h3>
              <p className="text-xs text-muted-foreground">Baseline model · Stability checks</p>
            </div>
            <Badge className="ml-auto bg-warning/20 text-warning border-warning/30" variant="outline">Challenger</Badge>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>AUC-ROC</span><span className="font-medium text-foreground">0.78</span></div>
            <div className="flex justify-between"><span>Gini Coefficient</span><span className="font-medium text-foreground">0.56</span></div>
            <div className="flex justify-between"><span>Features</span><span className="font-medium text-foreground">38</span></div>
          </div>
        </GlassCard>
      </div>

      {/* Product Policies */}
      <GlassCard hover={false}>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Product Policies</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Product", "Model", "Markets", "Auto-Approve ≥", "Review ≥", "AUC"].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.name} className="border-b border-border/50 last:border-0">
                  <td className="py-3 font-medium text-foreground">{p.name}</td>
                  <td className="py-3 text-muted-foreground text-xs">{p.model}</td>
                  <td className="py-3 text-xs text-muted-foreground">{p.countries.join(", ")}</td>
                  <td className="py-3 font-display font-semibold text-success">{p.approveThreshold}</td>
                  <td className="py-3 font-display font-semibold text-warning">{p.reviewThreshold}</td>
                  <td className="py-3 font-mono text-xs text-foreground">{p.auc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Policy Editor Preview */}
      <GlassCard className="mt-6">
        <h3 className="mb-4 font-display font-semibold text-foreground">Policy Editor — Micro-loan</h3>
        <div className="space-y-6">
          <div>
            <Label className="text-xs text-muted-foreground">Auto-Approve Threshold: {approveScore[0]}</Label>
            <Slider value={approveScore} onValueChange={setApproveScore} min={300} max={900} step={10} className="mt-2" />
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>300</span><span>900</span></div>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="defaults" />
            <Label htmlFor="defaults" className="text-sm text-muted-foreground">Block borrowers with active default trade lines</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="bureau" defaultChecked />
            <Label htmlFor="bureau" className="text-sm text-muted-foreground">Require bureau check before scoring</Label>
          </div>
        </div>
      </GlassCard>
    </DashboardLayout>
  );
};

export default Models;
