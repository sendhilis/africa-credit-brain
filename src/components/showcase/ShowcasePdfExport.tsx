import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";

const ShowcasePdfExport = () => {
  const [generating, setGenerating] = useState(false);

  const generatePdf = async () => {
    setGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210, H = 297;
      const ML = 18, MR = 18, MT = 20, MB = 20;
      const CW = W - ML - MR;
      let y = MT;
      let pageNum = 1;

      // ── Colors ──
      const bg: [number, number, number] = [20, 24, 36];
      const cardBg: [number, number, number] = [30, 35, 52];
      const primary: [number, number, number] = [64, 201, 176];
      const accent: [number, number, number] = [217, 165, 32];
      const white: [number, number, number] = [220, 228, 240];
      const muted: [number, number, number] = [120, 130, 160];
      const success: [number, number, number] = [64, 184, 120];
      const warning: [number, number, number] = [217, 165, 32];
      const destructive: [number, number, number] = [220, 60, 60];
      const divider: [number, number, number] = [50, 55, 75];

      const fillPage = () => {
        pdf.setFillColor(...bg);
        pdf.rect(0, 0, W, H, "F");
      };

      const addFooter = () => {
        pdf.setFontSize(6.5);
        pdf.setTextColor(...muted);
        pdf.text(`AfricaOne Credit Intelligence Platform  •  Confidential  •  Page ${pageNum}`, W / 2, H - 8, { align: "center" });
        // Bottom accent line
        pdf.setDrawColor(...primary);
        pdf.setLineWidth(0.3);
        pdf.line(ML, H - 12, W - MR, H - 12);
      };

      const newPage = () => {
        addFooter();
        pdf.addPage();
        pageNum++;
        fillPage();
        y = MT;
      };

      const ensureSpace = (need: number) => {
        if (y + need > H - MB) newPage();
      };

      const heading = (text: string, size: number, color: [number, number, number] = white) => {
        ensureSpace(size * 0.6 + 4);
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
        pdf.setFont("helvetica", "bold");
        pdf.text(text, ML, y);
        y += size * 0.45 + 2;
      };

      const subheading = (text: string) => {
        ensureSpace(10);
        pdf.setFontSize(9);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(text, CW);
        pdf.text(lines, ML, y);
        y += lines.length * 4 + 3;
      };

      const bodyText = (text: string, indent = 0) => {
        pdf.setFontSize(8.5);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(text, CW - indent);
        ensureSpace(lines.length * 3.8 + 2);
        pdf.text(lines, ML + indent, y);
        y += lines.length * 3.8 + 1.5;
      };

      const bulletPoint = (text: string, color: [number, number, number] = primary) => {
        ensureSpace(5);
        pdf.setFillColor(...color);
        pdf.circle(ML + 3, y - 1, 0.8, "F");
        pdf.setFontSize(8);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(text, CW - 10);
        pdf.text(lines, ML + 7, y);
        y += lines.length * 3.5 + 1.5;
      };

      const sectionDivider = () => {
        ensureSpace(8);
        y += 3;
        pdf.setDrawColor(...divider);
        pdf.setLineWidth(0.2);
        pdf.line(ML, y, W - MR, y);
        y += 5;
      };

      const cardBox = (x: number, yPos: number, w: number, h: number) => {
        pdf.setFillColor(...cardBg);
        pdf.roundedRect(x, yPos, w, h, 2, 2, "F");
        pdf.setDrawColor(...divider);
        pdf.setLineWidth(0.2);
        pdf.roundedRect(x, yPos, w, h, 2, 2, "S");
      };

      const badge = (text: string, x: number, yPos: number, color: [number, number, number]) => {
        pdf.setFontSize(6.5);
        const tw = pdf.getTextWidth(text) + 6;
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(x, yPos - 3, tw, 5, 1.5, 1.5, "F");
        pdf.setTextColor(...bg);
        pdf.setFont("helvetica", "bold");
        pdf.text(text, x + 3, yPos);
      };

      const statBox = (x: number, yPos: number, w: number, value: string, label: string) => {
        cardBox(x, yPos, w, 22);
        pdf.setFontSize(16);
        pdf.setTextColor(...primary);
        pdf.setFont("helvetica", "bold");
        pdf.text(value, x + w / 2, yPos + 10, { align: "center" });
        pdf.setFontSize(7);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        pdf.text(label, x + w / 2, yPos + 17, { align: "center" });
      };

      // ═══════════════════════════════════════════
      // PAGE 1: COVER
      // ═══════════════════════════════════════════
      fillPage();

      // Top accent bar
      pdf.setFillColor(...primary);
      pdf.rect(0, 0, W, 3, "F");

      // Logo area
      y = 50;
      badge("PAN-AFRICAN CREDIT INTELLIGENCE", ML, y, primary);
      y += 14;

      pdf.setFontSize(32);
      pdf.setTextColor(...white);
      pdf.setFont("helvetica", "bold");
      pdf.text("AfricaOne", ML, y);
      y += 12;
      pdf.setFontSize(20);
      pdf.setTextColor(...primary);
      pdf.text("Platform Showcase", ML, y);
      y += 14;

      pdf.setFontSize(10);
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "normal");
      const tagline = "AI-Powered Credit Scoring, Document Intelligence, and Production-Grade Integrations for Africa's Financial Future.";
      const tagLines = pdf.splitTextToSize(tagline, CW);
      pdf.text(tagLines, ML, y);
      y += tagLines.length * 5 + 12;

      // Key stats row
      const sw = (CW - 9) / 4;
      statBox(ML, y, sw, "12+", "African Markets");
      statBox(ML + sw + 3, y, sw, "300–900", "Score Range");
      statBox(ML + (sw + 3) * 2, y, sw, "< 2s", "Scoring Latency");
      statBox(ML + (sw + 3) * 3, y, sw, "40+", "Entity Integrations");
      y += 30;

      // Decorative line
      pdf.setDrawColor(...primary);
      pdf.setLineWidth(0.5);
      pdf.line(ML, y, ML + 40, y);
      y += 10;

      // Metadata
      pdf.setFontSize(8);
      pdf.setTextColor(...muted);
      pdf.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, ML, y);
      y += 5;
      pdf.text("Classification: Confidential — For Authorized Recipients Only", ML, y);
      y += 5;
      pdf.text("Version: 1.1  •  Model: WoE + IV Logistic Regression  •  PDO 20", ML, y);

      addFooter();

      // ═══════════════════════════════════════════
      // PAGE 2: OVERVIEW
      // ═══════════════════════════════════════════
      newPage();
      heading("1. Platform Overview", 18, primary);
      y += 2;
      subheading("A neutral, multi-tenant platform that transforms credit underwriting with AI-driven insights tailored for thin-file borrowers in emerging African markets.");

      const overviewItems = [
        { title: "AI-First Scoring", desc: "WoE/IV logistic regression with time-series analysis and bureau integration for explainable, accurate decisions." },
        { title: "Pan-African Coverage", desc: "Localized ID types, mobile wallets, bureaus, and currencies across 12+ markets — one integration for the continent." },
        { title: "Regulatory Compliant", desc: "Built-in fairness auditing, bias monitoring, and full model transparency for central bank compliance." },
        { title: "Smart OCR", desc: "AI-powered document extraction with mandatory 3-month period validation for bank statements and utility bills." },
        { title: "Production-Ready Integrations", desc: "Full sandbox → production promotion pipeline with encrypted credential vault and secure API proxy for live traffic." },
        { title: "Developer-First", desc: "Full sandbox environment, interactive API console, webhook callbacks, and SDK snippets in Python, Node.js, and cURL." },
      ];

      for (const item of overviewItems) {
        ensureSpace(16);
        pdf.setFontSize(10);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(`▸ ${item.title}`, ML + 2, y);
        y += 4.5;
        pdf.setFontSize(8);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(item.desc, CW - 8);
        pdf.text(lines, ML + 6, y);
        y += lines.length * 3.5 + 4;
      }

      sectionDivider();
      heading("Platform at a Glance", 12);
      y += 2;

      const glanceItems = [
        ["Multi-Tenant", "Isolated"], ["Security", "RLS + RBAC"], ["Uptime", "99.9%"],
        ["Storage", "Encrypted"], ["Fairness", "Audited"], ["Integrations", "40+ Entities"],
      ];
      const gw = (CW - 15) / 6;
      glanceItems.forEach((g, i) => {
        const gx = ML + i * (gw + 3);
        pdf.setFontSize(9);
        pdf.setTextColor(...primary);
        pdf.setFont("helvetica", "bold");
        pdf.text(g[1], gx + gw / 2, y + 4, { align: "center" });
        pdf.setFontSize(6.5);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        pdf.text(g[0], gx + gw / 2, y + 9, { align: "center" });
      });
      y += 16;

      // ═══════════════════════════════════════════
      // PAGE 3: AI SCORING
      // ═══════════════════════════════════════════
      newPage();
      heading("2. AI-Powered Scoring Model", 18, primary);
      badge("CORE ENGINE", ML, y, accent);
      y += 8;
      subheading("A statistically validated WoE + IV logistic regression scorecard scaled to a 300–900 range, enriched with time-series analysis and AI-generated qualitative insights.");

      heading("Scoring Engine", 13);
      bodyText("The scoring model uses Weight of Evidence (WoE) binning and Information Value (IV) feature selection to build an interpretable logistic regression scorecard. Each feature's contribution is transparent and auditable.");
      y += 2;
      const scoringPoints = [
        "Base score 600, Points-to-Double-Odds (PDO) 20 scaling",
        "Credit Bureau scores weighted at 30% when available",
        "Probability of Default (PD) with calibrated conversion",
        "5 risk bands (A–E) with configurable policy thresholds",
        "Explainable reason codes for every decision",
        "Interactive Score Simulator for what-if analysis",
      ];
      scoringPoints.forEach(p => bulletPoint(p));

      sectionDivider();

      // Score bands visual
      heading("Score Bands", 12);
      const bands: [string, string, [number, number, number], number][] = [
        ["A", "740–900", success, 160],
        ["B", "670–739", primary, 130],
        ["C", "580–669", warning, 100],
        ["D", "500–579", [217, 140, 50], 70],
        ["E", "300–499", destructive, 42],
      ];

      for (const [band, range, color, barW] of bands) {
        ensureSpace(7);
        pdf.setFontSize(10);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(band, ML + 2, y);
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(ML + 12, y - 3, barW * (CW - 50) / 160, 4, 1, 1, "F");
        pdf.setFontSize(7.5);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        pdf.text(range, W - MR, y, { align: "right" });
        y += 7;
      }

      sectionDivider();
      heading("Time-Series Intelligence", 13);
      bodyText("Beyond static snapshots, AfricaOne analyzes temporal patterns in income, expenses, and payment behavior to detect trends that traditional scorecards miss.");
      y += 2;
      [
        "Income stability coefficient from 12-month salary data",
        "Payment trajectory scoring for existing loan history",
        "Seasonal pattern recognition for agricultural borrowers",
        "Auto-enrichment from OCR-extracted bank statement data",
      ].forEach(p => bulletPoint(p));

      // ═══════════════════════════════════════════
      // FEATURES
      // ═══════════════════════════════════════════
      newPage();
      heading("3. Platform Features", 18, primary);
      y += 2;

      // Document Intelligence
      heading("Smart Document Intelligence", 13);
      bodyText("AI-powered OCR extracts structured financial data from bank statements and utility bills, automatically validating document type and enforcing a minimum 3-month coverage period.");
      y += 1;
      [
        "Gemini-powered extraction with 92%+ confidence",
        "Mandatory 3-month period validation",
        "Salary deposit auto-mapping to income history",
        "Additional document upload with category tagging",
        "Invalid documents flagged with specific error reasons",
      ].forEach(p => bulletPoint(p));
      sectionDivider();

      // Pan-African
      heading("Pan-African Market Coverage", 13);
      bodyText("Purpose-built for African financial markets with localized configurations for ID types, credit bureaus, mobile money wallets, utilities, and regulatory requirements.");
      y += 1;
      [
        "12+ countries with complete local configurations",
        "Multi-currency support including dual-currency markets (e.g. ZWL/USD)",
        "Local ID types: BVN, Huduma Namba, Kebele ID, Ghana Card, etc.",
        "Regional bureau and mobile wallet integrations",
        "Country-specific balance sheet templates",
      ].forEach(p => bulletPoint(p));
      sectionDivider();

      // Fairness
      heading("Fairness & Bias Monitoring", 13);
      bodyText("Continuous monitoring of model outcomes across demographic dimensions ensures equitable credit access and regulatory compliance.");
      y += 1;
      [
        "Gender, age, and regional disparity tracking",
        "Configurable disparity thresholds (default ≤5%)",
        "Transparent feature contributions for audit trails",
        "Central bank compliance-ready reporting",
      ].forEach(p => bulletPoint(p));
      sectionDivider();

      // Psychometric
      heading("Psychometric Assessment", 13);
      bodyText("Optional borrower psychometric profiling via SMS or WhatsApp, with in-branch sessions for walk-in applicants.");
      y += 1;
      [
        "Remote assessment via SMS / WhatsApp link",
        "In-branch session with guided prompts",
        "Granular status tracking: sent → in-progress → completed",
        "Scores fed directly into the decisioning model",
      ].forEach(p => bulletPoint(p));
      sectionDivider();

      // Grace
      heading("Grace AI Assistant", 13);
      bodyText("An AI-powered contextual assistant embedded within each application, providing real-time insights and recommendations to credit officers during review.");
      y += 1;
      [
        "Natural language Q&A about any application",
        "Score justification and risk factor explanation",
        "Policy recommendation based on institution rules",
        "Session persistence for audit trail",
      ].forEach(p => bulletPoint(p));

      // ═══════════════════════════════════════════
      // INFRASTRUCTURE
      // ═══════════════════════════════════════════
      newPage();
      heading("4. Integration Infrastructure", 18, primary);
      badge("PRODUCTION-READY", ML, y, success);
      y += 8;
      subheading("A complete pipeline from sandbox testing to production traffic with encrypted credential management, agentic AI setup, and a secure API proxy layer.");

      heading("Credential Vault & Encryption", 13);
      bodyText("Secure storage for API keys, OAuth secrets, and certificates. Credentials are encrypted server-side and never exposed to the frontend.");
      y += 1;
      [
        "XOR obfuscation with environment-scoped encryption keys",
        "Per-entity credential isolation by institution",
        "Base URL and endpoint path auto-detection from registry",
        "Masked display in admin UI — full values never leave the server",
        "Support for API-Key, OAuth2 Client Credentials, and Bearer tokens",
      ].forEach(p => bulletPoint(p));
      sectionDivider();

      heading("Production Promotion Flow", 13);
      bodyText("Automated sandbox-to-production promotion that validates test results, verifies encrypted credentials, and clones configurations to the live environment.");
      y += 1;
      [
        "Pre-flight validation: sandbox tests must pass before promotion",
        "Credential verification: encrypted keys must be stored before go-live",
        "Config cloning: sandbox settings replicated to production environment",
        "Status tracking: LIVE badge and production count metrics in catalog",
        "Rollback-safe: sandbox config preserved independently",
      ].forEach(p => bulletPoint(p));
      sectionDivider();

      heading("API Proxy Gateway", 13);
      bodyText("A secure edge function that serves as the single gateway for all production API calls to external financial institutions.");
      y += 1;
      [
        "Server-side credential decryption — zero client exposure",
        "Auto-detection of auth type: X-API-Key, OAuth2 Basic, Bearer",
        "Request/response passthrough with latency tracking",
        "Per-institution endpoint routing based on stored config",
        "Deno edge function with ~50ms cold start",
      ].forEach(p => bulletPoint(p));
      sectionDivider();

      heading("Agentic AI Integration Setup", 13);
      bodyText("Zero-code integration onboarding powered by a streaming AI agent. Connect to banks, credit bureaus, MNOs, and utilities through a conversational interface.");
      y += 1;
      [
        "Natural language 'connect' and 'test' commands",
        "Entity-specific sandbox test suites (USSD STK, KYC pull, etc.)",
        "Real-time streaming progress with step-by-step observation",
        "40+ pre-configured entities across 6 countries",
        "Drag-and-drop entity catalog with status indicators",
      ].forEach(p => bulletPoint(p));

      // ═══════════════════════════════════════════
      // PIPELINE DIAGRAM
      // ═══════════════════════════════════════════
      ensureSpace(40);
      sectionDivider();
      heading("End-to-End Integration Pipeline", 12);
      y += 2;

      const pipeSteps = ["Select Entity", "AI Connect", "Sandbox Test", "Store Creds", "Promote", "Live Traffic"];
      const stepW = (CW - (pipeSteps.length - 1) * 2) / pipeSteps.length;
      pipeSteps.forEach((s, i) => {
        const sx = ML + i * (stepW + 2);
        cardBox(sx, y, stepW, 14);
        pdf.setFontSize(6.5);
        pdf.setTextColor(...primary);
        pdf.setFont("helvetica", "bold");
        pdf.text(s, sx + stepW / 2, y + 9, { align: "center" });
        if (i < pipeSteps.length - 1) {
          pdf.setFontSize(8);
          pdf.setTextColor(...muted);
          pdf.text("→", sx + stepW + 1, y + 8, { align: "center" });
        }
      });
      y += 20;

      // ═══════════════════════════════════════════
      // COMPETITIVE ADVANTAGES
      // ═══════════════════════════════════════════
      newPage();
      heading("5. Competitive Advantages", 18, primary);
      y += 2;

      const advantages = [
        { title: "Thin-File Friendly", desc: "Leverages alternative data signals — mobile money, utility payments, psychometric assessments, OCR-extracted data — to score first-time borrowers and informal sector workers." },
        { title: "Full Model Transparency", desc: "WoE bins, feature coefficients, IV values, and an interactive Score Simulator are exposed for governance and regulatory explainability." },
        { title: "Production-Grade Integration Pipeline", desc: "Automated lifecycle: AI sandbox setup, entity-specific tests, encrypted credential storage, one-click promotion, and secure API proxy for live traffic across 40+ entities." },
        { title: "Enterprise-Grade Security", desc: "RLS isolation, SHA-256 hashed API keys, server-side encrypted credentials, encrypted storage buckets, and RBAC (admin, credit officer, underwriter, viewer)." },
        { title: "One Integration, All Markets", desc: "A single API covers 12+ countries. Country-specific ID types, bureau providers, currencies, and regulatory rules are handled by the platform." },
        { title: "Regulatory-First Design", desc: "Fairness auditing, model transparency, reason codes, and complete audit trails baked in — generating the exact artifacts African regulators require." },
        { title: "Grace AI Assistant", desc: "Contextual AI embedded in every application — real-time insights, score justifications, risk explanations, and persisted sessions for compliance." },
        { title: "Reloan & Upgrade Engine", desc: "Payment history tracking automatically improves future scores, enabling automated reloan approvals and credit limit upgrades." },
      ];

      for (const adv of advantages) {
        ensureSpace(18);
        pdf.setFontSize(10);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(`▸ ${adv.title}`, ML + 2, y);
        y += 4.5;
        pdf.setFontSize(8);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(adv.desc, CW - 8);
        pdf.text(lines, ML + 6, y);
        y += lines.length * 3.5 + 5;
      }

      // ═══════════════════════════════════════════
      // COMPARISON TABLE
      // ═══════════════════════════════════════════
      sectionDivider();
      heading("AfricaOne vs. Traditional Scoring", 13);
      y += 2;

      const compLeft = [
        "Alternative data + bureau fusion",
        "Time-series income analysis",
        "AI-powered document OCR",
        "Real-time API scoring < 2s",
        "Pan-African localization",
        "Built-in fairness monitoring",
        "Encrypted credential vault",
        "Sandbox → Production pipeline",
        "Secure API proxy for live traffic",
      ];
      const compRight = [
        "Bureau-only data dependency",
        "Static point-in-time snapshot",
        "Manual document review",
        "Batch processing (hours/days)",
        "Single-market configuration",
        "Compliance as afterthought",
        "Manual credential management",
        "No sandbox environment",
        "Direct API key exposure",
      ];

      const halfW = CW / 2 - 4;

      ensureSpace(10);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primary);
      pdf.text("✓  AfricaOne", ML, y);
      pdf.setTextColor(...muted);
      pdf.text("—  Traditional", ML + halfW + 8, y);
      y += 6;

      for (let i = 0; i < compLeft.length; i++) {
        ensureSpace(6);
        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...success);
        pdf.text("✓", ML + 2, y);
        pdf.setTextColor(...white);
        pdf.text(compLeft[i], ML + 7, y);
        pdf.setTextColor(80, 85, 100);
        pdf.text("—", ML + halfW + 10, y);
        pdf.text(compRight[i], ML + halfW + 15, y);
        y += 5;
      }

      // ═══════════════════════════════════════════
      // INTEGRATION & API
      // ═══════════════════════════════════════════
      newPage();
      heading("6. Integration & Developer Experience", 18, primary);
      y += 2;
      subheading("Full-fledged sandbox, interactive console, production promotion, and comprehensive API for seamless third-party integration.");

      heading("API Endpoints", 12);
      y += 1;

      const endpoints = [
        ["POST", "/v1/score", "Score a borrower application"],
        ["POST", "/v1/applications", "Create a new application"],
        ["POST", "/v1/documents", "Extract document data"],
        ["POST", "/integration-proxy", "Proxy to live entity APIs"],
        ["GET", "/v1/applications", "List all applications"],
        ["GET", "/v1/health", "Service health check"],
      ];

      for (const [method, path, desc] of endpoints) {
        ensureSpace(7);
        const methodColor: [number, number, number] = method === "POST" ? warning : success;
        badge(method, ML + 2, y, methodColor);
        pdf.setFontSize(8);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(path, ML + 22, y);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        pdf.text(desc, ML + 68, y);
        y += 7;
      }

      sectionDivider();

      heading("Integration Flow", 12);
      y += 2;
      const flowSteps = [
        ["1", "Generate API Key", "Sandbox or Live"],
        ["2", "Test in Sandbox", "Interactive console"],
        ["3", "Configure Webhooks", "Event callbacks"],
        ["4", "Store Credentials", "Encrypted vault"],
        ["5", "Go Live", "Production promote"],
      ];

      const flowW = (CW - (flowSteps.length - 1) * 2) / flowSteps.length;
      ensureSpace(22);
      flowSteps.forEach(([num, label, sub], i) => {
        const fx = ML + i * (flowW + 2);
        cardBox(fx, y, flowW, 20);
        pdf.setFontSize(12);
        pdf.setTextColor(...primary);
        pdf.setFont("helvetica", "bold");
        pdf.text(num, fx + flowW / 2, y + 8, { align: "center" });
        pdf.setFontSize(6);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(label, fx + flowW / 2, y + 13, { align: "center" });
        pdf.setFontSize(5.5);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        pdf.text(sub, fx + flowW / 2, y + 17, { align: "center" });
      });
      y += 28;

      sectionDivider();

      heading("Entity Coverage by Country", 12);
      y += 2;

      const countries = [
        ["🇿🇼 Zimbabwe", "CBZ Bank, EcoCash, ZESA, TransUnion, XDS, CRB Africa, Creditinfo, FinCheck"],
        ["🇰🇪 Kenya", "M-Pesa, Equity Bank, KCB, TransUnion KE, Metropol, KPLC, CRB"],
        ["🇬🇭 Ghana", "MTN MoMo, GCB, Ecobank, XDS Ghana, GWCL, ECG, GhIPSS"],
        ["🇳🇬 Nigeria", "GTBank, Access Bank, CRC Bureau, First Central, NIBSS, Flutterwave"],
        ["🇷🇼 Rwanda", "MTN Rwanda, BK, TransUnion RW, RURA, REG"],
        ["🇺🇬 Uganda", "MTN Uganda, Stanbic, Compuscan, UMEME, NWSC"],
      ];

      for (const [country, entities] of countries) {
        ensureSpace(12);
        pdf.setFontSize(9);
        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "bold");
        pdf.text(country, ML + 2, y);
        y += 4;
        pdf.setFontSize(7.5);
        pdf.setTextColor(...muted);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(entities, CW - 8);
        pdf.text(lines, ML + 6, y);
        y += lines.length * 3.5 + 4;
      }

      // ═══════════════════════════════════════════
      // BACK COVER
      // ═══════════════════════════════════════════
      newPage();

      y = H / 2 - 30;

      pdf.setFontSize(24);
      pdf.setTextColor(...white);
      pdf.setFont("helvetica", "bold");
      pdf.text("Ready to Transform", W / 2, y, { align: "center" });
      y += 10;
      pdf.text("Credit Decisioning?", W / 2, y, { align: "center" });
      y += 14;

      pdf.setFontSize(11);
      pdf.setTextColor(...muted);
      pdf.setFont("helvetica", "normal");
      pdf.text("Start scoring borrowers across Africa in minutes — not months.", W / 2, y, { align: "center" });
      y += 16;

      // Feature badges
      const badgeLabels = [
        { text: "API-First", color: primary },
        { text: "12+ Markets", color: accent },
        { text: "Compliant", color: success },
        { text: "40+ Entities", color: warning },
      ];
      const totalBadgeW = badgeLabels.length * 30 + (badgeLabels.length - 1) * 4;
      let bx = (W - totalBadgeW) / 2;
      for (const b of badgeLabels) {
        badge(b.text, bx, y, b.color);
        bx += 34;
      }

      y += 20;
      pdf.setDrawColor(...primary);
      pdf.setLineWidth(0.5);
      pdf.line(W / 2 - 20, y, W / 2 + 20, y);
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
    <Button
      onClick={generatePdf}
      disabled={generating}
      variant="outline"
      className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
    >
      {generating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating PDF…
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  );
};

export default ShowcasePdfExport;
