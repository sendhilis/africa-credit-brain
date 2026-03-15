import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import jsPDF from "jspdf";

type RGB = [number, number, number];

const OnePagerPdfExport = () => {
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210, H = 297;
      const ML = 12, MR = 12;
      const CW = W - ML - MR;

      // ── Palette ──
      const bg: RGB = [16, 20, 32];
      const bgCard: RGB = [24, 29, 44];
      const bgCardAlt: RGB = [30, 36, 54];
      const primary: RGB = [64, 201, 176];
      const primaryDim: RGB = [40, 130, 112];
      const accent: RGB = [230, 175, 30];
      const white: RGB = [230, 236, 248];
      const muted: RGB = [120, 130, 158];
      const success: RGB = [64, 184, 120];
      const warning: RGB = [217, 165, 32];
      const divider: RGB = [40, 46, 66];

      // ── Helpers ──
      const setC = (c: RGB) => { pdf.setTextColor(...c); };
      const setF = (c: RGB) => { pdf.setFillColor(...c); };
      const rr = (x: number, y: number, w: number, h: number, r: number, c: RGB) => {
        setF(c); pdf.roundedRect(x, y, w, h, r, r, "F");
      };
      const pill = (x: number, y: number, text: string, fg: RGB, bg2: RGB) => {
        pdf.setFontSize(5.5); pdf.setFont("helvetica", "bold");
        const tw = pdf.getTextWidth(text);
        rr(x, y, tw + 5, 5.5, 2.5, bg2);
        setC(fg); pdf.text(text, x + 2.5, y + 3.8);
        return tw + 7;
      };

      // ══════════════════════════════════════════════
      // FULL PAGE BACKGROUND
      // ══════════════════════════════════════════════
      setF(bg); pdf.rect(0, 0, W, H, "F");

      // Decorative top-right glow (subtle solid tints)
      setF([22, 34, 32]); pdf.circle(W + 10, -10, 80, "F");
      setF([24, 22, 18]); pdf.circle(-20, H + 10, 70, "F");

      let y = 10;

      // ══════════════════════════════════════════════
      // HEADER BAR
      // ══════════════════════════════════════════════
      // Gradient header strip
      for (let i = 0; i < 38; i++) {
        const t = i / 38;
        const r = Math.round(primary[0] * (1 - t) + 20 * t);
        const g = Math.round(primary[1] * (1 - t) + 60 * t);
        const b = Math.round(primary[2] * (1 - t) + 55 * t);
        pdf.setFillColor(r, g, b);
        pdf.rect(0, y + i * 0.5, W, 0.5, "F");
      }

      // Logo circle
      setF([50, 70, 65]);
      pdf.circle(ML + 8, y + 10, 8, "F");

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      setC([16, 20, 32]);
      pdf.text("A1", ML + 5.5, y + 12);

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      setC([255, 255, 255]);
      pdf.text("AfricaOne", ML + 20, y + 9);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      setC([200, 220, 215]);
      pdf.text("Credit Intelligence Platform  •  Bulk License Overview", ML + 20, y + 14.5);

      // Right side — badge
      pdf.setFontSize(5.5);
      pdf.setFont("helvetica", "bold");
      rr(W - MR - 28, y + 5, 28, 7, 3, [255, 255, 255] as RGB);
      pdf.setGState(new (jsPDF as any).GState({ opacity: 0.9 }));
      setC([16, 20, 32]);
      pdf.text("ENTERPRISE LICENSE", W - MR - 26, y + 9.5);
      pdf.setGState(new (jsPDF as any).GState({ opacity: 1 }));

      y += 24;

      // ══════════════════════════════════════════════
      // HERO SECTION — Value Prop
      // ══════════════════════════════════════════════
      rr(ML, y, CW, 28, 3, bgCard);
      // Left accent bar
      rr(ML, y, 1.5, 28, 0.5, primary);

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      setC(white);
      pdf.text("Pan-African Credit Scoring — One Platform, 54 Markets", ML + 8, y + 9);

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      setC(muted);
      const heroLines = pdf.splitTextToSize(
        "AfricaOne combines AI-driven scorecards, alternative data integrations, and regulatory-grade fairness tooling into a single deployable platform. Purpose-built for lenders, MFIs, and fintechs operating across Africa.",
        CW - 14
      );
      pdf.text(heroLines, ML + 8, y + 15);

      y += 32;

      // ══════════════════════════════════════════════
      // STATS ROW — 5 stat boxes
      // ══════════════════════════════════════════════
      const stats = [
        { val: "54", label: "Markets", color: primary },
        { val: "40+", label: "Integrations", color: accent },
        { val: "96%", label: "Accuracy", color: success },
        { val: "<2s", label: "Score Latency", color: primary },
        { val: "100%", label: "Explainable", color: warning },
      ];
      const statW = (CW - 4 * 3) / 5;
      stats.forEach((s, i) => {
        const sx = ML + i * (statW + 3);
        rr(sx, y, statW, 20, 2.5, bgCard);
        // Top accent line
        setF(s.color); pdf.rect(sx + 4, y + 1, statW - 8, 0.8, "F");
        pdf.setFontSize(14); pdf.setFont("helvetica", "bold"); setC(s.color);
        pdf.text(s.val, sx + statW / 2, y + 11, { align: "center" });
        pdf.setFontSize(5.5); pdf.setFont("helvetica", "normal"); setC(muted);
        pdf.text(s.label, sx + statW / 2, y + 16, { align: "center" });
      });

      y += 25;

      // ══════════════════════════════════════════════
      // CORE CAPABILITIES — 2x3 Grid
      // ══════════════════════════════════════════════
      pdf.setFontSize(9); pdf.setFont("helvetica", "bold"); setC(primary);
      pdf.text("CORE CAPABILITIES", ML, y + 1);
      setF(divider); pdf.rect(ML + 42, y - 1, CW - 42, 0.3, "F");
      y += 5;

      const caps = [
        { icon: "AI", title: "AI Credit Scoring", desc: "WoE/IV scorecards with psychometric overlays, bureau fusion, and alternative data signals.", color: primary },
        { icon: "📄", title: "Document Intelligence", desc: "OCR extraction from payslips, bank statements, and balance sheets with field-level confidence.", color: accent },
        { icon: "⚖️", title: "Fairness & Compliance", desc: "Demographic parity testing, bias audits, and regulatory-grade model transparency reports.", color: success },
        { icon: "🔗", title: "40+ Integrations", desc: "Credit bureaus, MNOs, revenue authorities, and banks across 12+ African countries.", color: primary },
        { icon: "🤖", title: "Grace AI Assistant", desc: "Natural language credit analysis with contextual scoring explanations and recommendations.", color: accent },
        { icon: "🔒", title: "Enterprise Security", desc: "XOR-encrypted credential vault, RLS-enforced multi-tenancy, and SOC2-ready audit trails.", color: warning },
      ];
      const capW = (CW - 4 * 2) / 3;
      const capH = 28;
      caps.forEach((c, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = ML + col * (capW + 4);
        const cy = y + row * (capH + 3);
        rr(cx, cy, capW, capH, 2.5, bgCard);
        // Color dot
        setF(c.color); pdf.circle(cx + 6, cy + 6, 2.5, "F");
        pdf.setFontSize(5); pdf.setFont("helvetica", "bold"); setC([16, 20, 32]);
        pdf.text(c.icon.length <= 2 ? c.icon : "", cx + 4.8, cy + 7.2);

        pdf.setFontSize(7); pdf.setFont("helvetica", "bold"); setC(white);
        pdf.text(c.title, cx + 12, cy + 7);
        pdf.setFontSize(5.5); pdf.setFont("helvetica", "normal"); setC(muted);
        const lines = pdf.splitTextToSize(c.desc, capW - 14);
        pdf.text(lines, cx + 5, cy + 13);
      });

      y += (capH + 3) * 2 + 4;

      // ══════════════════════════════════════════════
      // INTEGRATION PIPELINE — Visual Diagram
      // ══════════════════════════════════════════════
      pdf.setFontSize(9); pdf.setFont("helvetica", "bold"); setC(primary);
      pdf.text("END-TO-END PIPELINE", ML, y + 1);
      setF(divider); pdf.rect(ML + 46, y - 1, CW - 46, 0.3, "F");
      y += 5;

      rr(ML, y, CW, 22, 3, bgCard);

      const steps = [
        { label: "Data Ingest", sub: "Bureau • MNO • Bank" },
        { label: "AI Scoring", sub: "WoE + Psychometrics" },
        { label: "Risk Band", sub: "A → E Classification" },
        { label: "Decision", sub: "Auto / Manual Review" },
        { label: "Monitor", sub: "PSI • AUC • Drift" },
      ];
      const stepW = (CW - 20) / 5;
      steps.forEach((s, i) => {
        const sx = ML + 8 + i * stepW;
        const sy = y + 4;

        // Circle
        rr(sx + stepW / 2 - 4, sy, 8, 8, 4, i === 1 ? primary : bgCardAlt);
        pdf.setFontSize(7); pdf.setFont("helvetica", "bold");
        setC(i === 1 ? [16, 20, 32] : primary);
        pdf.text(String(i + 1), sx + stepW / 2 - 1, sy + 5.5);

        // Arrow
        if (i < steps.length - 1) {
          setF(divider);
          pdf.rect(sx + stepW / 2 + 5, sy + 3.5, stepW - 10, 0.6, "F");
          // arrowhead
          setF(primaryDim);
          pdf.triangle(
            sx + stepW - 3, sy + 2,
            sx + stepW - 3, sy + 5.8,
            sx + stepW, sy + 3.8, "F"
          );
        }

        pdf.setFontSize(6); pdf.setFont("helvetica", "bold"); setC(white);
        pdf.text(s.label, sx + stepW / 2, sy + 12, { align: "center" });
        pdf.setFontSize(4.5); pdf.setFont("helvetica", "normal"); setC(muted);
        pdf.text(s.sub, sx + stepW / 2, sy + 15.5, { align: "center" });
      });

      y += 27;

      // ══════════════════════════════════════════════
      // MARKET COVERAGE — Score bands visual
      // ══════════════════════════════════════════════
      pdf.setFontSize(9); pdf.setFont("helvetica", "bold"); setC(primary);
      pdf.text("MARKET COVERAGE & SCORING", ML, y + 1);
      setF(divider); pdf.rect(ML + 56, y - 1, CW - 56, 0.3, "F");
      y += 5;

      // Left: Countries grid
      const leftW = CW * 0.48;
      const rightW = CW * 0.48;
      const gap = CW - leftW - rightW;

      rr(ML, y, leftW, 32, 2.5, bgCard);

      const countries = [
        { name: "Kenya", entities: 8 },
        { name: "Nigeria", entities: 7 },
        { name: "Ghana", entities: 6 },
        { name: "South Africa", entities: 5 },
        { name: "Rwanda", entities: 4 },
        { name: "Senegal", entities: 4 },
        { name: "Tanzania", entities: 3 },
        { name: "Uganda", entities: 3 },
      ];
      pdf.setFontSize(6); pdf.setFont("helvetica", "bold"); setC(white);
      pdf.text("Active Markets", ML + 4, y + 5);

      countries.forEach((c, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = ML + 4 + col * (leftW / 2);
        const cy = y + 9 + row * 5.5;
        pdf.setFontSize(5.5); pdf.setFont("helvetica", "normal"); setC(white);
        pdf.text(c.name, cx, cy);
        // Bar
        const barMax = leftW / 2 - 22;
        const barW = (c.entities / 8) * barMax;
        rr(cx + 20, cy - 2.5, barMax, 3, 1.5, bgCardAlt);
        rr(cx + 20, cy - 2.5, barW, 3, 1.5, primaryDim);
        pdf.setFontSize(4.5); setC(muted);
        pdf.text(`${c.entities}`, cx + 20 + barMax + 2, cy);
      });

      // Right: Score bands
      rr(ML + leftW + gap, y, rightW, 32, 2.5, bgCard);
      const rx = ML + leftW + gap + 4;
      pdf.setFontSize(6); pdf.setFont("helvetica", "bold"); setC(white);
      pdf.text("Score Distribution Bands", rx, y + 5);

      const bands = [
        { band: "A", range: "750–900", pct: 35, color: success },
        { band: "B", range: "650–749", pct: 28, color: primary },
        { band: "C", range: "500–649", pct: 22, color: warning },
        { band: "D", range: "350–499", pct: 10, color: [220, 130, 50] as RGB },
        { band: "E", range: "200–349", pct: 5, color: [220, 60, 60] as RGB },
      ];
      bands.forEach((b, i) => {
        const by = y + 9 + i * 4.5;
        pdf.setFontSize(5.5); pdf.setFont("helvetica", "bold"); setC(b.color);
        pdf.text(b.band, rx, by);
        pdf.setFont("helvetica", "normal"); setC(muted);
        pdf.text(b.range, rx + 5, by);
        const barMax = rightW - 32;
        rr(rx + 20, by - 2.5, barMax, 3, 1.5, bgCardAlt);
        rr(rx + 20, by - 2.5, (b.pct / 35) * barMax, 3, 1.5, b.color);
        pdf.setFontSize(4.5); setC(white);
        pdf.text(`${b.pct}%`, rx + 20 + barMax + 2, by);
      });

      y += 37;

      // ══════════════════════════════════════════════
      // LICENSING TIERS — 3 columns
      // ══════════════════════════════════════════════
      pdf.setFontSize(9); pdf.setFont("helvetica", "bold"); setC(primary);
      pdf.text("BULK LICENSE TIERS", ML, y + 1);
      setF(divider); pdf.rect(ML + 42, y - 1, CW - 42, 0.3, "F");
      y += 5;

      const tiers = [
        { name: "Starter", seats: "5–20", price: "$8K", period: "/seat/yr", features: ["Core scoring engine", "3 country modules", "Email support", "Sandbox API access"], highlight: false },
        { name: "Growth", seats: "21–100", price: "$5.5K", period: "/seat/yr", features: ["All 54 markets", "Grace AI assistant", "Priority SLA", "Custom model tuning"], highlight: true },
        { name: "Enterprise", seats: "100+", price: "Custom", period: "", features: ["White-label option", "Dedicated CSM", "On-prem deployment", "SLA: 99.95%"], highlight: false },
      ];
      const tierW = (CW - 2 * 4) / 3;
      const tierH = 38;
      tiers.forEach((t, i) => {
        const tx = ML + i * (tierW + 4);
        if (t.highlight) {
          // Glow border
          rr(tx - 0.5, y - 0.5, tierW + 1, tierH + 1, 3, primaryDim);
        }
        rr(tx, y, tierW, tierH, 2.5, t.highlight ? bgCardAlt : bgCard);

        if (t.highlight) {
          pill(tx + tierW - 22, y + 2, "POPULAR", [16, 20, 32], accent);
        }

        pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); setC(white);
        pdf.text(t.name, tx + 5, y + 7);
        pdf.setFontSize(5); pdf.setFont("helvetica", "normal"); setC(muted);
        pdf.text(`${t.seats} seats`, tx + 5, y + 11);

        pdf.setFontSize(14); pdf.setFont("helvetica", "bold"); setC(t.highlight ? primary : white);
        pdf.text(t.price, tx + 5, y + 19);
        pdf.setFontSize(5); pdf.setFont("helvetica", "normal"); setC(muted);
        pdf.text(t.period, tx + 5 + pdf.getTextWidth(t.price) + 1, y + 19);

        t.features.forEach((f, fi) => {
          pdf.setFontSize(5); setC(primary);
          pdf.text("✓", tx + 5, y + 24 + fi * 3.5);
          pdf.setFont("helvetica", "normal"); setC(muted);
          pdf.text(f, tx + 9, y + 24 + fi * 3.5);
        });
      });

      y += tierH + 5;

      // ══════════════════════════════════════════════
      // FOOTER — CTA + Contact
      // ══════════════════════════════════════════════
      // Gradient footer bar
      for (let i = 0; i < 20; i++) {
        const t = i / 20;
        const r = Math.round(primary[0] * 0.3 * (1 - t) + bg[0] * t);
        const g = Math.round(primary[1] * 0.3 * (1 - t) + bg[1] * t);
        const b2 = Math.round(primary[2] * 0.3 * (1 - t) + bg[2] * t);
        pdf.setFillColor(r, g, b2);
        pdf.rect(0, H - 18 + i * 0.9, W, 0.9, "F");
      }

      pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); setC(white);
      pdf.text("Ready to scale credit intelligence across Africa?", ML, H - 10);

      pdf.setFontSize(6); pdf.setFont("helvetica", "normal"); setC(muted);
      pdf.text("sales@africaone.ai  •  africaone.ai/enterprise  •  Schedule a demo →", ML, H - 5.5);

      // Confidential badge
      pdf.setFontSize(4.5); pdf.setFont("helvetica", "bold"); setC(muted);
      pdf.text("CONFIDENTIAL  •  © 2026 AfricaOne", W - MR, H - 5.5, { align: "right" });

      pdf.save("AfricaOne-One-Pager-Bulk-License.pdf");
    } catch (err) {
      console.error("One-pager PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button onClick={generate} disabled={generating} variant="outline"
      className="gap-2 border-accent/30 text-accent hover:bg-accent/10">
      {generating ? (
        <><Loader2 className="h-4 w-4 animate-spin" />Generating…</>
      ) : (
        <><FileDown className="h-4 w-4" />One-Pager PDF</>
      )}
    </Button>
  );
};

export default OnePagerPdfExport;
