import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";

type RGB = [number, number, number];

const ShowcasePdfExport = () => {
  const [generating, setGenerating] = useState(false);

  const generatePdf = async () => {
    setGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210, H = 297;
      const ML = 16, MR = 16, MT = 18, MB = 16;
      const CW = W - ML - MR;
      let y = MT;
      let pageNum = 1;

      // ── Colors ──
      const bg: RGB = [20, 24, 36];
      const bgDark: RGB = [14, 17, 27];
      const cardBg: RGB = [28, 33, 48];
      const cardBgAlt: RGB = [35, 40, 58];
      const primary: RGB = [64, 201, 176];
      const primaryDark: RGB = [40, 140, 120];
      const accent: RGB = [217, 165, 32];
      const white: RGB = [225, 232, 245];
      const muted: RGB = [110, 120, 150];
      const success: RGB = [64, 184, 120];
      const warning: RGB = [217, 165, 32];
      const destructive: RGB = [220, 60, 60];
      const divider: RGB = [45, 50, 68];
      const glow: RGB = [40, 60, 55];

      const fillPage = () => { pdf.setFillColor(...bg); pdf.rect(0, 0, W, H, "F"); };

      const addFooter = () => {
        // Gradient footer bar
        pdf.setFillColor(...bgDark);
        pdf.rect(0, H - 14, W, 14, "F");
        pdf.setDrawColor(...primaryDark);
        pdf.setLineWidth(0.3);
        pdf.line(0, H - 14, W, H - 14);
        pdf.setFontSize(6);
        pdf.setTextColor(...muted);
        pdf.text(`AfricaOne Credit Intelligence Platform`, ML, H - 6);
        pdf.text(`Confidential  •  Page ${pageNum}`, W - MR, H - 6, { align: "right" });
      };

      const newPage = () => { addFooter(); pdf.addPage(); pageNum++; fillPage(); y = MT; };
      const ensureSpace = (need: number) => { if (y + need > H - MB - 14) newPage(); };

      // ── Visual Helpers ──

      const sectionHeader = (num: string, title: string, color: RGB = primary) => {
        ensureSpace(18);
        // Full-width colored header bar
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(ML, y, CW, 12, 2, 2, "F");
        // Darker overlay for depth
        pdf.setFillColor(0, 0, 0);
        pdf.setGState(new (pdf as any).GState({ opacity: 0.25 }));
        pdf.roundedRect(ML, y, CW, 12, 2, 2, "F");
        pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
        // Text
        pdf.setFontSize(12);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${num}  ${title}`, ML + 6, y + 8);
        y += 16;
      };

      const subSection = (title: string) => {
        ensureSpace(10);
        pdf.setFillColor(...primary);
        pdf.rect(ML, y, 3, 6, "F");
        pdf.setFontSize(10.5);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(title, ML + 7, y + 5);
        y += 10;
      };

      const bodyText = (text: string, maxW = CW) => {
        pdf.setFontSize(8);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(text, maxW);
        ensureSpace(lines.length * 3.5 + 1);
        pdf.text(lines, ML, y);
        y += lines.length * 3.5 + 2;
      };

      const bulletList = (items: string[], color: RGB = primary) => {
        for (const text of items) {
          ensureSpace(5);
          pdf.setFillColor(...color);
          pdf.circle(ML + 2.5, y - 0.8, 0.7, "F");
          pdf.setFontSize(7.5);
          pdf.setTextColor(...white);
          pdf.setFont("helvetica", "normal");
          const lines = pdf.splitTextToSize(text, CW - 8);
          pdf.text(lines, ML + 6, y);
          y += lines.length * 3.2 + 1;
        }
      };

      const featureCard = (x: number, yPos: number, w: number, h: number, title: string, desc: string, accentColor: RGB) => {
        // Card background
        pdf.setFillColor(...cardBg);
        pdf.roundedRect(x, yPos, w, h, 2.5, 2.5, "F");
        // Left accent stripe
        pdf.setFillColor(...accentColor);
        pdf.roundedRect(x, yPos, 2.5, h, 1.5, 1.5, "F");
        pdf.rect(x + 1.5, yPos, 1, h, "F"); // Fill corner gap
        // Title
        pdf.setFontSize(8.5);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(title, x + 7, yPos + 7);
        // Desc
        pdf.setFontSize(7);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(desc, w - 12);
        pdf.text(lines, x + 7, yPos + 12);
      };

      const progressBar = (x: number, yPos: number, w: number, pct: number, label: string, value: string, color: RGB) => {
        pdf.setFontSize(7);
        pdf.setTextColor(...muted);
        pdf.text(label, x, yPos);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(value, x + w, yPos, { align: "right" });
        // Track
        pdf.setFillColor(...divider);
        pdf.roundedRect(x, yPos + 2, w, 3, 1.5, 1.5, "F");
        // Fill
        pdf.setFillColor(...color);
        pdf.roundedRect(x, yPos + 2, w * pct / 100, 3, 1.5, 1.5, "F");
      };

      const statCircle = (cx: number, cy: number, r: number, pct: number, value: string, label: string, color: RGB) => {
        // Background ring
        pdf.setDrawColor(...divider);
        pdf.setLineWidth(2.5);
        pdf.circle(cx, cy, r, "S");
        // Colored arc (simulate with filled arc)
        pdf.setDrawColor(...color);
        pdf.setLineWidth(2.5);
        const startAngle = -90;
        const endAngle = startAngle + (360 * pct / 100);
        const steps = Math.ceil(pct / 2);
        for (let i = 0; i < steps; i++) {
          const a1 = (startAngle + (endAngle - startAngle) * i / steps) * Math.PI / 180;
          const a2 = (startAngle + (endAngle - startAngle) * (i + 1) / steps) * Math.PI / 180;
          pdf.line(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2));
        }
        // Center text
        pdf.setFontSize(11);
        pdf.setTextColor(...color);
        pdf.setFont("helvetica", "bold");
        pdf.text(value, cx, cy + 1.5, { align: "center" });
        // Label below
        pdf.setFontSize(6.5);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        pdf.text(label, cx, cy + r + 6, { align: "center" });
      };

      const badge = (text: string, x: number, yPos: number, color: RGB) => {
        pdf.setFontSize(6);
        pdf.setFont("helvetica", "bold");
        const tw = pdf.getTextWidth(text) + 5;
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(x, yPos - 2.5, tw, 4.5, 1.2, 1.2, "F");
        pdf.setTextColor(20, 24, 36);
        pdf.text(text, x + 2.5, yPos + 0.5);
        return tw;
      };

      const iconCircle = (cx: number, cy: number, r: number, color: RGB) => {
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.setGState(new (pdf as any).GState({ opacity: 0.15 }));
        pdf.circle(cx, cy, r, "F");
        pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
        pdf.setFillColor(...color);
        pdf.circle(cx, cy, r * 0.35, "F");
      };

      const pipelineArrow = (x1: number, x2: number, yPos: number) => {
        pdf.setDrawColor(...primary);
        pdf.setLineWidth(0.4);
        pdf.line(x1, yPos, x2, yPos);
        // Arrowhead
        pdf.setFillColor(...primary);
        pdf.triangle(x2, yPos, x2 - 1.5, yPos - 1, x2 - 1.5, yPos + 1, "F");
      };

      // ═══════════════════════════════════════════
      // PAGE 1: COVER
      // ═══════════════════════════════════════════
      fillPage();

      // Top gradient stripe
      for (let i = 0; i < 5; i++) {
        const opacity = 1 - i * 0.2;
        pdf.setFillColor(primary[0], primary[1], primary[2]);
        pdf.setGState(new (pdf as any).GState({ opacity }));
        pdf.rect(0, i * 1.2, W, 1.2, "F");
      }
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

      // Decorative glow circles
      pdf.setFillColor(...glow);
      pdf.setGState(new (pdf as any).GState({ opacity: 0.3 }));
      pdf.circle(W - 40, 60, 35, "F");
      pdf.circle(30, 200, 25, "F");
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

      y = 45;
      let bw = badge("PAN-AFRICAN CREDIT INTELLIGENCE", ML, y, primary);
      y += 12;

      pdf.setFontSize(36);
      pdf.setTextColor(...white);
      pdf.setFont("helvetica", "bold");
      pdf.text("AfricaOne", ML, y);
      y += 14;
      pdf.setFontSize(18);
      pdf.setTextColor(...primary);
      pdf.text("Platform Showcase", ML, y);
      y += 6;
      // Accent underline
      pdf.setFillColor(...primary);
      pdf.rect(ML, y, 45, 1, "F");
      y += 10;

      pdf.setFontSize(9.5);
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "normal");
      const tagline = "AI-Powered Credit Scoring, Document Intelligence, and Production-Grade Integrations for Africa's Financial Future.";
      const tagLines = pdf.splitTextToSize(tagline, CW * 0.7);
      pdf.text(tagLines, ML, y);
      y += tagLines.length * 4.5 + 10;

      // Stat circles row
      const circleY = y + 14;
      statCircle(ML + CW * 0.125, circleY, 11, 100, "12+", "Markets", primary);
      statCircle(ML + CW * 0.375, circleY, 11, 75, "300-900", "Score Range", accent);
      statCircle(ML + CW * 0.625, circleY, 11, 95, "< 2s", "Latency", success);
      statCircle(ML + CW * 0.875, circleY, 11, 80, "40+", "Integrations", warning);
      y = circleY + 24;

      // Decorative divider
      y += 8;
      pdf.setDrawColor(...primary);
      pdf.setLineWidth(0.5);
      pdf.line(ML, y, ML + 35, y);
      pdf.setFillColor(...primary);
      pdf.circle(ML + 37, y, 1, "F");
      y += 10;

      // Metadata box
      pdf.setFillColor(...cardBg);
      pdf.roundedRect(ML, y, CW, 20, 2, 2, "F");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...muted);
      pdf.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, ML + 6, y + 6);
      pdf.text("Classification: Confidential — For Authorized Recipients Only", ML + 6, y + 11);
      pdf.text("Version: 1.1  •  Model: WoE + IV Logistic Regression  •  PDO 20  •  Deno Edge Runtime", ML + 6, y + 16);

      addFooter();

      // ═══════════════════════════════════════════
      // PAGE 2: OVERVIEW
      // ═══════════════════════════════════════════
      newPage();
      sectionHeader("01", "PLATFORM OVERVIEW");

      bodyText("A neutral, multi-tenant platform that transforms credit underwriting with AI-driven insights tailored for thin-file borrowers in emerging African markets.");

      // 2x3 feature cards grid
      const fcW = (CW - 4) / 2;
      const fcH = 22;
      const features = [
        { t: "AI-First Scoring", d: "WoE/IV logistic regression with time-series analysis and bureau integration.", c: primary },
        { t: "Pan-African Coverage", d: "Localized ID types, wallets, bureaus across 12+ markets.", c: accent },
        { t: "Regulatory Compliant", d: "Built-in fairness auditing, bias monitoring, model transparency.", c: success },
        { t: "Smart OCR", d: "AI-powered extraction with 3-month period validation.", c: [100, 160, 255] as RGB },
        { t: "Production Integrations", d: "Sandbox → production pipeline with encrypted credential vault.", c: warning },
        { t: "Developer-First", d: "Sandbox API, interactive console, webhooks, SDK snippets.", c: destructive },
      ];
      for (let i = 0; i < features.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        if (col === 0) ensureSpace(fcH + 3);
        const fx = ML + col * (fcW + 4);
        const fy = y + row * 0;
        featureCard(fx, y, fcW, fcH, features[i].t, features[i].d, features[i].c);
        if (col === 1) y += fcH + 3;
      }
      y += 3;

      // Platform glance - horizontal stat boxes
      ensureSpace(28);
      pdf.setFillColor(...cardBgAlt);
      pdf.roundedRect(ML, y, CW, 22, 2, 2, "F");
      const glance = [
        { v: "Isolated", l: "Multi-Tenant" }, { v: "RLS+RBAC", l: "Security" }, { v: "99.9%", l: "Uptime" },
        { v: "Encrypted", l: "Storage" }, { v: "Audited", l: "Fairness" }, { v: "40+", l: "Entities" },
      ];
      const gw = CW / 6;
      glance.forEach((g, i) => {
        const gx = ML + i * gw;
        pdf.setFontSize(9);
        pdf.setTextColor(...primary);
        pdf.setFont("helvetica", "bold");
        pdf.text(g.v, gx + gw / 2, y + 9, { align: "center" });
        pdf.setFontSize(6);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        pdf.text(g.l, gx + gw / 2, y + 14, { align: "center" });
        // Separator
        if (i < 5) {
          pdf.setDrawColor(...divider);
          pdf.setLineWidth(0.15);
          pdf.line(gx + gw, y + 4, gx + gw, y + 18);
        }
      });
      y += 26;

      // ═══════════════════════════════════════════
      // AI SCORING
      // ═══════════════════════════════════════════
      sectionHeader("02", "AI-POWERED SCORING MODEL", accent);

      // Two-column layout: text left, visual right
      const colL = CW * 0.55;
      const colR = CW * 0.4;
      const colRx = ML + CW - colR;

      bodyText("WoE + IV logistic regression scorecard scaled to 300–900, enriched with time-series analysis and AI-generated insights.");

      // Left column: bullets
      const savedY = y;
      bulletList([
        "Base score 600, PDO 20 scaling",
        "Bureau scores weighted 30% when available",
        "PD with calibrated conversion",
        "5 risk bands (A–E) configurable",
        "Explainable reason codes",
        "Interactive Score Simulator",
      ]);

      // Right column: Score bands chart
      const bandsY = savedY;
      const bandData: [string, string, RGB, number][] = [
        ["A", "740–900", success, 95],
        ["B", "670–739", primary, 78],
        ["C", "580–669", warning, 60],
        ["D", "500–579", [217, 140, 50], 42],
        ["E", "300–499", destructive, 25],
      ];
      pdf.setFillColor(...cardBg);
      pdf.roundedRect(colRx - 2, bandsY - 3, colR + 4, 44, 2, 2, "F");
      pdf.setFontSize(7);
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "bold");
      pdf.text("SCORE BANDS", colRx + colR / 2, bandsY + 2, { align: "center" });

      let bandY = bandsY + 7;
      for (const [band, range, color, barPct] of bandData) {
        pdf.setFontSize(9);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(band, colRx + 2, bandY);
        // Bar
        const barMaxW = colR - 28;
        pdf.setFillColor(...divider);
        pdf.roundedRect(colRx + 10, bandY - 2.5, barMaxW, 3.5, 1, 1, "F");
        pdf.setFillColor(...color);
        pdf.roundedRect(colRx + 10, bandY - 2.5, barMaxW * barPct / 100, 3.5, 1, 1, "F");
        pdf.setFontSize(6.5);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        pdf.text(range, colRx + colR, bandY, { align: "right" });
        bandY += 7;
      }

      if (y < bandY + 4) y = bandY + 4;

      // Scoring architecture pipeline
      ensureSpace(24);
      pdf.setFillColor(...cardBgAlt);
      pdf.roundedRect(ML, y, CW, 18, 2, 2, "F");
      pdf.setFontSize(7);
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "bold");
      pdf.text("SCORING ARCHITECTURE", ML + 4, y + 5);

      const archSteps = ["Data Ingestion", "WoE Binning", "Logistic Reg.", "Band Assign.", "AI Insights"];
      const archW = (CW - 10) / archSteps.length;
      archSteps.forEach((s, i) => {
        const ax = ML + 5 + i * archW;
        iconCircle(ax + archW / 2 - 3, y + 10, 3, primary);
        pdf.setFontSize(6.5);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(s, ax + archW / 2 + 1, y + 12);
        if (i < archSteps.length - 1) {
          pipelineArrow(ax + archW - 4, ax + archW + 1, y + 10);
        }
      });
      y += 22;

      // Time-series section
      subSection("Time-Series Intelligence");
      bodyText("Analyzes temporal patterns in income, expenses, and payment behavior to detect trends traditional scorecards miss.");

      // Progress bars as visual
      ensureSpace(22);
      progressBar(ML, y, CW, 87, "Income Stability Coefficient", "0.87", success);
      y += 9;
      progressBar(ML, y, CW, 92, "Payment Trajectory Score", "92%", primary);
      y += 9;
      progressBar(ML, y, CW, 78, "Seasonal Pattern Detection", "Active", accent);
      y += 7;

      // ═══════════════════════════════════════════
      // FEATURES
      // ═══════════════════════════════════════════
      newPage();
      sectionHeader("03", "PLATFORM FEATURES");

      // Feature sections with icon dots + compact layout
      const featureSections = [
        {
          title: "Smart Document Intelligence",
          desc: "AI-powered OCR extracts structured financial data with mandatory 3-month period validation.",
          items: ["Gemini-powered extraction, 92%+ confidence", "3-month period validation", "Salary auto-mapping", "Category tagging", "Error flagging"],
          color: success,
        },
        {
          title: "Pan-African Market Coverage",
          desc: "Purpose-built for 12+ African markets with localized ID types, bureaus, wallets, currencies.",
          items: ["12+ countries configured", "Multi-currency (ZWL/USD)", "BVN, Huduma, Kebele, Ghana Card", "Regional bureaus & wallets", "Country-specific templates"],
          color: primary,
        },
        {
          title: "Fairness & Bias Monitoring",
          desc: "Continuous outcome monitoring across demographic dimensions for equitable access.",
          items: ["Gender, age, regional tracking", "≤5% disparity thresholds", "Transparent feature contributions", "Central bank compliance reports"],
          color: accent,
        },
        {
          title: "Psychometric Assessment",
          desc: "Optional borrower profiling via SMS/WhatsApp with in-branch sessions.",
          items: ["Remote SMS/WhatsApp delivery", "In-branch guided sessions", "Status: sent → completed", "Feeds into decisioning model"],
          color: [180, 100, 220] as RGB,
        },
        {
          title: "Grace AI Assistant",
          desc: "Contextual AI embedded in applications for real-time insights during review.",
          items: ["Natural language Q&A", "Score justification", "Policy recommendations", "Session persistence"],
          color: [100, 160, 255] as RGB,
        },
      ];

      for (let fi = 0; fi < featureSections.length; fi++) {
        const fs = featureSections[fi];
        ensureSpace(32);
        // Two-column: left card, right bullets
        const leftW = CW * 0.42;
        const rightW = CW * 0.52;
        const rightX = ML + CW - rightW;

        // Left: visual card
        pdf.setFillColor(...cardBg);
        pdf.roundedRect(ML, y, leftW, 28, 2, 2, "F");
        pdf.setFillColor(fs.color[0], fs.color[1], fs.color[2]);
        pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));
        pdf.roundedRect(ML, y, leftW, 28, 2, 2, "F");
        pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
        // Accent dot
        iconCircle(ML + 10, y + 8, 4, fs.color);
        pdf.setFontSize(9.5);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(fs.title, ML + 6, y + 17);
        pdf.setFontSize(7);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        const descLines = pdf.splitTextToSize(fs.desc, leftW - 12);
        pdf.text(descLines, ML + 6, y + 22);

        // Right: bullet points
        let by = y + 2;
        for (const item of fs.items) {
          pdf.setFillColor(...fs.color);
          pdf.circle(rightX + 2, by + 1, 0.6, "F");
          pdf.setFontSize(7.5);
          pdf.setTextColor(...white);
          pdf.setFont("helvetica", "normal");
          pdf.text(item, rightX + 5, by + 2);
          by += 5;
        }

        y += 32;
      }

      // ── Bias Audit Visual ──
      ensureSpace(24);
      pdf.setFillColor(...cardBgAlt);
      pdf.roundedRect(ML, y, CW, 20, 2, 2, "F");
      pdf.setFontSize(7);
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "bold");
      pdf.text("BIAS AUDIT RESULTS", ML + 4, y + 5);

      const biasData = [
        { dim: "Gender", gap: 2.1, color: success },
        { dim: "Age Group", gap: 3.8, color: primary },
        { dim: "Region", gap: 4.2, color: accent },
      ];
      const biasBW = (CW - 20) / 3;
      biasData.forEach((b, i) => {
        const bx = ML + 8 + i * biasBW;
        progressBar(bx, y + 9, biasBW - 10, 100 - b.gap * 10, b.dim, `${b.gap}% gap`, b.color);
      });
      y += 24;

      // ═══════════════════════════════════════════
      // INFRASTRUCTURE
      // ═══════════════════════════════════════════
      newPage();
      sectionHeader("04", "INTEGRATION INFRASTRUCTURE", success);

      bodyText("Complete pipeline from sandbox testing to production traffic with encrypted credential management, agentic AI setup, and secure API proxy layer.");
      y += 1;

      // 2x2 infrastructure cards
      const infraCards = [
        { t: "Credential Vault", d: "Encrypted server-side storage for API keys, OAuth secrets. Never exposed to frontend. Supports API-Key, OAuth2, Bearer.", c: warning },
        { t: "Production Promotion", d: "Automated sandbox → production. Pre-flight validation, credential checks, config cloning, rollback-safe.", c: success },
        { t: "API Proxy Gateway", d: "Secure edge function gateway. Server-side decryption, auto auth injection, ~50ms cold start.", c: primary },
        { t: "Agentic AI Setup", d: "Zero-code onboarding via streaming AI agent. 40+ entities, entity-specific test suites, drag-and-drop catalog.", c: accent },
      ];

      const icW = (CW - 4) / 2;
      const icH = 28;
      for (let i = 0; i < infraCards.length; i++) {
        const col = i % 2;
        if (col === 0) ensureSpace(icH + 3);
        const ix = ML + col * (icW + 4);
        featureCard(ix, y, icW, icH, infraCards[i].t, infraCards[i].d, infraCards[i].c);
        if (col === 1) y += icH + 3;
      }
      y += 2;

      // Credential visual mockup
      ensureSpace(26);
      pdf.setFillColor(...cardBg);
      pdf.roundedRect(ML, y, CW, 22, 2, 2, "F");
      pdf.setFontSize(7);
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "bold");
      pdf.text("CREDENTIAL VAULT PREVIEW", ML + 4, y + 5);

      const credRows = [
        ["API Key", "sk_live_••••••••3f9a", "Encrypted"],
        ["Client Secret", "cs_••••••••7b2e", "Encrypted"],
        ["Base URL", "https://api.cbz.co.zw/v1", "Verified"],
      ];
      credRows.forEach((cr, i) => {
        const ry = y + 9 + i * 4;
        pdf.setFontSize(6.5);
        pdf.setTextColor(...muted);
        pdf.text(cr[0], ML + 6, ry);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "normal");
        pdf.text(cr[1], ML + 40, ry);
        badge(cr[2], ML + CW - 30, ry, cr[2] === "Encrypted" ? success : primary);
      });
      y += 26;

      // End-to-End Pipeline
      ensureSpace(28);
      pdf.setFillColor(...cardBgAlt);
      pdf.roundedRect(ML, y, CW, 22, 2, 2, "F");
      pdf.setFontSize(7);
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "bold");
      pdf.text("END-TO-END INTEGRATION PIPELINE", ML + 4, y + 5);

      const pSteps = ["Select\nEntity", "AI\nConnect", "Sandbox\nTest", "Store\nCreds", "Promote", "Live\nTraffic"];
      const psW = (CW - 20) / pSteps.length;
      pSteps.forEach((s, i) => {
        const px = ML + 8 + i * psW;
        // Circle with number
        pdf.setFillColor(...primary);
        pdf.setGState(new (pdf as any).GState({ opacity: 0.15 }));
        pdf.circle(px + psW / 2, y + 11, 4.5, "F");
        pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
        pdf.setFontSize(8);
        pdf.setTextColor(...primary);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${i + 1}`, px + psW / 2, y + 12.5, { align: "center" });
        // Label
        pdf.setFontSize(5.5);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        const labelLines = s.split("\n");
        labelLines.forEach((l, li) => {
          pdf.text(l, px + psW / 2, y + 18 + li * 3, { align: "center" });
        });
        // Arrow
        if (i < pSteps.length - 1) {
          pipelineArrow(px + psW / 2 + 5, px + psW / 2 + psW - 5, y + 11);
        }
      });
      y += 26;

      // ═══════════════════════════════════════════
      // ADVANTAGES & COMPARISON
      // ═══════════════════════════════════════════
      newPage();
      sectionHeader("05", "COMPETITIVE ADVANTAGES");

      const advantages = [
        { t: "Thin-File Friendly", d: "Alternative data — mobile money, utilities, psychometrics, OCR — for first-time borrowers.", c: primary },
        { t: "Full Transparency", d: "WoE bins, coefficients, IV values, Score Simulator exposed for governance.", c: accent },
        { t: "Production Pipeline", d: "AI sandbox setup, encrypted credentials, one-click promotion, API proxy.", c: success },
        { t: "Enterprise Security", d: "RLS isolation, SHA-256 keys, encrypted credentials, RBAC roles.", c: destructive },
        { t: "One API, All Markets", d: "Single integration for 12+ countries. Platform handles localization.", c: [100, 160, 255] as RGB },
        { t: "Regulatory-First", d: "Fairness auditing, reason codes, audit trails for central bank approval.", c: warning },
        { t: "Grace AI Assistant", d: "Contextual AI in every application with persisted sessions.", c: [180, 100, 220] as RGB },
        { t: "Reloan Engine", d: "Payment history auto-improves scores for reloan approvals.", c: primary },
      ];

      // 2x4 compact cards
      const aW = (CW - 4) / 2;
      const aH = 18;
      for (let i = 0; i < advantages.length; i++) {
        const col = i % 2;
        if (col === 0) ensureSpace(aH + 3);
        const ax = ML + col * (aW + 4);
        featureCard(ax, y, aW, aH, advantages[i].t, advantages[i].d, advantages[i].c);
        if (col === 1) y += aH + 3;
      }
      y += 2;

      // Comparison table
      ensureSpace(55);
      pdf.setFillColor(...cardBg);
      pdf.roundedRect(ML, y, CW, 52, 2, 2, "F");

      // Header row
      pdf.setFillColor(...primary);
      pdf.setGState(new (pdf as any).GState({ opacity: 0.12 }));
      pdf.roundedRect(ML, y, CW / 2, 8, 2, 0, "F");
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primary);
      pdf.text("✓  AfricaOne", ML + 6, y + 5.5);
      pdf.setTextColor(...muted);
      pdf.text("—  Traditional", ML + CW / 2 + 6, y + 5.5);
      y += 10;

      const compL = [
        "Alternative data + bureau fusion", "Time-series income analysis", "AI-powered document OCR",
        "Real-time API scoring < 2s", "Pan-African localization", "Built-in fairness monitoring",
        "Encrypted credential vault", "Sandbox → Production pipeline", "Secure API proxy",
      ];
      const compR = [
        "Bureau-only dependency", "Static snapshot", "Manual document review",
        "Batch processing (hrs/days)", "Single-market config", "Compliance as afterthought",
        "Manual credential mgmt", "No sandbox", "Direct API key exposure",
      ];

      for (let i = 0; i < compL.length; i++) {
        pdf.setFontSize(7);
        pdf.setTextColor(...success);
        pdf.setFont("helvetica", "normal");
        pdf.text("✓", ML + 6, y);
        pdf.setTextColor(...white);
        pdf.text(compL[i], ML + 11, y);
        pdf.setTextColor(70, 75, 90);
        pdf.text("—", ML + CW / 2 + 6, y);
        pdf.text(compR[i], ML + CW / 2 + 11, y);
        // Alternating row bg
        if (i % 2 === 0) {
          pdf.setFillColor(...cardBgAlt);
          pdf.setGState(new (pdf as any).GState({ opacity: 0.3 }));
          pdf.rect(ML + 1, y - 2.5, CW - 2, 4.5, "F");
          pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
        }
        y += 4.5;
      }
      y += 4;

      // ═══════════════════════════════════════════
      // INTEGRATION & API
      // ═══════════════════════════════════════════
      newPage();
      sectionHeader("06", "INTEGRATION & DEVELOPER EXPERIENCE");

      bodyText("Full-fledged sandbox, interactive console, production promotion, and comprehensive API for seamless third-party integration.");

      // API Endpoints table
      subSection("API Endpoints");
      ensureSpace(38);

      pdf.setFillColor(...cardBg);
      pdf.roundedRect(ML, y, CW, 35, 2, 2, "F");

      const eps = [
        ["POST", "/v1/score", "Score a borrower application"],
        ["POST", "/v1/applications", "Create a new application"],
        ["POST", "/v1/documents", "Extract document data"],
        ["POST", "/integration-proxy", "Proxy to live entity APIs"],
        ["GET", "/v1/applications", "List all applications"],
        ["GET", "/v1/health", "Service health check"],
      ];

      let epY = y + 4;
      for (const [method, path, desc] of eps) {
        const methodColor: RGB = method === "POST" ? warning : success;
        badge(method, ML + 4, epY + 2, methodColor);
        pdf.setFontSize(8);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(path, ML + 24, epY + 2);
        pdf.setFontSize(7);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        pdf.text(desc, ML + 70, epY + 2);
        epY += 5.5;
      }
      y += 38;

      // Integration Flow
      subSection("Integration Flow");
      ensureSpace(24);
      pdf.setFillColor(...cardBgAlt);
      pdf.roundedRect(ML, y, CW, 20, 2, 2, "F");
      const fSteps = [
        ["1", "Gen. API Key"], ["2", "Test Sandbox"], ["3", "Webhooks"], ["4", "Store Creds"], ["5", "Go Live"],
      ];
      const fW = (CW - 10) / fSteps.length;
      fSteps.forEach(([num, label], i) => {
        const fx = ML + 5 + i * fW;
        pdf.setFillColor(...primary);
        pdf.circle(fx + fW / 2, y + 8, 4, "F");
        pdf.setFontSize(9);
        pdf.setTextColor(...bg);
        pdf.setFont("helvetica", "bold");
        pdf.text(num, fx + fW / 2, y + 10, { align: "center" });
        pdf.setFontSize(6);
        pdf.setTextColor(...white);
        pdf.text(label, fx + fW / 2, y + 16, { align: "center" });
        if (i < fSteps.length - 1) pipelineArrow(fx + fW / 2 + 5, fx + fW / 2 + fW - 5, y + 8);
      });
      y += 24;

      // Country coverage grid
      subSection("Entity Coverage by Country");
      const countries = [
        ["Zimbabwe", "CBZ Bank, EcoCash, ZESA, TransUnion, XDS, CRB Africa, Creditinfo, FinCheck"],
        ["Kenya", "M-Pesa, Equity Bank, KCB, TransUnion KE, Metropol, KPLC, CRB"],
        ["Ghana", "MTN MoMo, GCB, Ecobank, XDS Ghana, GWCL, ECG, GhIPSS"],
        ["Nigeria", "GTBank, Access Bank, CRC Bureau, First Central, NIBSS, Flutterwave"],
        ["Rwanda", "MTN Rwanda, BK, TransUnion RW, RURA, REG"],
        ["Uganda", "MTN Uganda, Stanbic, Compuscan, UMEME, NWSC"],
      ];

      const cCardW = (CW - 4) / 2;
      for (let i = 0; i < countries.length; i++) {
        const col = i % 2;
        if (col === 0) ensureSpace(16);
        const cx = ML + col * (cCardW + 4);
        // Card
        pdf.setFillColor(...cardBg);
        pdf.roundedRect(cx, y, cCardW, 14, 2, 2, "F");
        pdf.setFontSize(8);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(countries[i][0], cx + 5, y + 5);
        pdf.setFontSize(6.5);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        const elines = pdf.splitTextToSize(countries[i][1], cCardW - 10);
        pdf.text(elines, cx + 5, y + 10);
        if (col === 1) y += 17;
      }
      y += 4;

      // ═══════════════════════════════════════════
      // BACK COVER
      // ═══════════════════════════════════════════
      newPage();

      // Full decorative background
      pdf.setFillColor(...glow);
      pdf.setGState(new (pdf as any).GState({ opacity: 0.2 }));
      pdf.circle(W / 2, H / 2, 60, "F");
      pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));
      pdf.circle(W / 2 - 50, H / 2 + 40, 30, "F");
      pdf.circle(W / 2 + 50, H / 2 - 40, 25, "F");
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

      y = H / 2 - 35;

      pdf.setFontSize(28);
      pdf.setTextColor(...white);
      pdf.setFont("helvetica", "bold");
      pdf.text("Ready to Transform", W / 2, y, { align: "center" });
      y += 12;
      pdf.setFontSize(28);
      pdf.setTextColor(...primary);
      pdf.text("Credit Decisioning?", W / 2, y, { align: "center" });
      y += 14;

      pdf.setFontSize(10);
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "normal");
      pdf.text("Start scoring borrowers across Africa in minutes — not months.", W / 2, y, { align: "center" });
      y += 16;

      // Badge row
      const badges = [
        { t: "API-First", c: primary }, { t: "12+ Markets", c: accent },
        { t: "Compliant", c: success }, { t: "40+ Entities", c: warning },
      ];
      let totalW = 0;
      badges.forEach(b => { pdf.setFontSize(7); totalW += pdf.getTextWidth(b.t) + 9; });
      let bx = (W - totalW) / 2;
      badges.forEach(b => {
        pdf.setFontSize(7);
        const tw = badge(b.t, bx, y, b.c);
        bx += tw + 4;
      });

      y += 22;
      pdf.setDrawColor(...primary);
      pdf.setLineWidth(0.5);
      pdf.line(W / 2 - 25, y, W / 2 + 25, y);
      y += 10;

      pdf.setFontSize(8);
      pdf.setTextColor(...muted);
      pdf.text("AfricaOne Credit Intelligence Platform", W / 2, y, { align: "center" });
      y += 5;
      pdf.text("© 2026 All Rights Reserved", W / 2, y, { align: "center" });

      addFooter();
      pdf.save("AfricaOne-Platform-Showcase.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button onClick={generatePdf} disabled={generating} variant="outline"
      className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
      {generating ? (
        <><Loader2 className="h-4 w-4 animate-spin" />Generating PDF…</>
      ) : (
        <><Download className="h-4 w-4" />Download PDF</>
      )}
    </Button>
  );
};

export default ShowcasePdfExport;
