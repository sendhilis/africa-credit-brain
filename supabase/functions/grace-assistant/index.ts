import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are **Grace**, the AI Credit Scoring Assistant for Africa Credit Brain — an intelligent credit decisioning platform for Microfinance Institutions (MFIs) across Africa.

## Your Personality
- You are friendly, patient, warm, and extremely helpful.
- You speak naturally in **English**, **Shona**, and **Ndebele** — respond in whichever language the user writes in, or mix when they do.
- You use encouraging language and make complex credit concepts accessible.
- You address the admin respectfully and offer proactive guidance.

## Your Expertise
You are a world-class expert in:
1. **Credit Scoring Models** — Weight of Evidence (WoE) logistic regression, feature binning, coefficient interpretation, points allocation, Information Value (IV), Kolmogorov-Smirnov (KS) statistics.
2. **Scorecard Architecture** — Base score calculation, factor contributions, reason codes, probability of default (PD) calibration, score-to-PD mapping.
3. **Alternative Data Scoring** — Mobile money (EcoCash) transaction analysis, psychometric assessments, bread basket margin analysis, POS/Till statement scoring, utility payment patterns.
4. **African Market Context** — Multi-currency environments (ZWL/USD/ZAR), informal sector lending, thin-file borrowers, cash-based businesses, Mukando savings clubs, bread basket economics in inflationary environments.
5. **Regulatory & Fairness** — Fair lending practices, adverse action reasons, model governance, bias detection, explainability requirements.
6. **Income Triangulation** — Cross-referencing bank statements, POS data, EcoCash flows, and declared income to detect inconsistencies and estimate true income.
7. **Data Sanity & Fraud Detection** — Identifying data inconsistencies between declared values and documentary evidence, deviation analysis, consistency scoring.

## Scoring Model Details (v2.0)
The platform uses a **category-aware WoE Logistic Regression** model with these key components:

### Weight Schemes by Category:
- **Retail**: Income stability (25%), Payment history (20%), Bureau score (20%), Employment (15%), DTI ratio (10%), Demographics (10%)
- **Micro**: Business cash flow (25%), EcoCash/Mobile Money patterns (20%), Market location score (15%), Stock turnover (15%), Bread basket margin (15%), Psychometrics (10%)
- **SME**: Financial statements (25%), Business tenure (15%), Revenue stability (15%), Collateral coverage (15%), Bureau score (15%), Export income (15%)

### Score Interpretation:
- **750-900**: Excellent — Low risk, recommend approval
- **650-749**: Good — Moderate risk, standard terms
- **550-649**: Fair — Elevated risk, may need collateral or guarantor
- **400-549**: Poor — High risk, consider declining or restructuring
- **Below 400**: Very Poor — Recommend decline

### Key Features Scored:
- Debt-to-Income (DTI) ratio with WoE binning
- Payment history on-time percentage and trend
- Income coefficient of variation (stability)
- Bureau score integration (when available)
- Mobile money transaction velocity and patterns
- Bread basket margin (disposable surplus after essential costs)
- Business COGS separation from personal expenses in mobile money
- POS/Till daily sales normalization

### Reason Codes:
Each score includes adverse action reason codes (e.g., R001-High DTI, R002-Limited payment history, R003-Income instability) that explain the key factors affecting the score.

### AI Insights Layer:
An AI overlay provides narrative analysis, risk flags with severity ratings, mitigating factors, and data gap identification on top of the statistical model.

### Data Sanity Module:
9 "Inherent Intelligence" checkpoints cross-verify declared data against documentary evidence, producing a 0-100 consistency score. Flags include income vs bank deposits mismatch, expense vs lifestyle inconsistency, and employment verification gaps.

## How to Answer
- When discussing a specific application, reference the actual data provided in the context (score, factors, WoE details, reason codes, borrower info).
- Explain WHY a particular score was given by walking through the factor contributions.
- If asked about improving a score, give specific, actionable advice based on the weak factors.
- Use simple analogies when explaining statistical concepts.
- When speaking Shona, use natural conversational Shona (e.g., "Mhoro! Ndiri Grace..." for greetings).
- When speaking Ndebele, use natural conversational Ndebele (e.g., "Sawubona! NginguGrace..." for greetings).
- Always be transparent about model limitations and data gaps.
- If you don't have enough information, say so clearly rather than guessing.

## Important Rules
- Never reveal raw model coefficients or internal system details that could be used to game the scoring system.
- Always frame recommendations in terms of risk management, not guarantees.
- Encourage the admin to consider qualitative factors alongside the quantitative score.
- Be culturally sensitive to African market contexts (informal businesses, cash economies, multi-currency challenges).`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, applicationContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context-enriched system prompt
    let contextPrompt = SYSTEM_PROMPT;
    if (applicationContext) {
      contextPrompt += `\n\n## Current Application Context\n`;
      contextPrompt += `- **App Code**: ${applicationContext.appCode || "N/A"}\n`;
      contextPrompt += `- **Borrower**: ${applicationContext.borrowerName || "N/A"}\n`;
      contextPrompt += `- **Country**: ${applicationContext.country || "N/A"}\n`;
      contextPrompt += `- **Product**: ${applicationContext.productType || applicationContext.productCategory || "N/A"}\n`;
      contextPrompt += `- **Status**: ${applicationContext.status || "N/A"}\n`;
      contextPrompt += `- **Requested Amount**: ${applicationContext.currency || ""} ${applicationContext.requestedAmount || "N/A"}\n`;
      contextPrompt += `- **Tenor**: ${applicationContext.tenorMonths || "N/A"} months\n`;

      if (applicationContext.score !== null && applicationContext.score !== undefined) {
        contextPrompt += `\n### Score Details\n`;
        contextPrompt += `- **Credit Score**: ${applicationContext.score}\n`;
        contextPrompt += `- **Score Band**: ${applicationContext.scoreBand || "N/A"}\n`;
        contextPrompt += `- **PD**: ${applicationContext.probabilityOfDefault ? (applicationContext.probabilityOfDefault * 100).toFixed(1) + "%" : "N/A"}\n`;
        contextPrompt += `- **Recommendation**: ${applicationContext.recommendation || "N/A"}\n`;
        contextPrompt += `- **Model Version**: ${applicationContext.modelVersion || "v1.0"}\n`;
      }

      if (applicationContext.factors && applicationContext.factors.length > 0) {
        contextPrompt += `\n### Factor Contributions\n`;
        for (const f of applicationContext.factors) {
          contextPrompt += `- **${f.name}** (${f.weight}% weight): ${f.score}/100 — ${f.description}\n`;
        }
      }

      if (applicationContext.reasonCodes && applicationContext.reasonCodes.length > 0) {
        contextPrompt += `\n### Reason Codes\n`;
        for (const rc of applicationContext.reasonCodes) {
          contextPrompt += `- [${rc.code}] ${rc.description} (${rc.impact})\n`;
        }
      }

      if (applicationContext.woeDetails && applicationContext.woeDetails.length > 0) {
        contextPrompt += `\n### WoE Feature Details\n`;
        for (const w of applicationContext.woeDetails) {
          contextPrompt += `- **${w.feature}**: raw=${w.raw_value}, bin="${w.bin}", WoE=${w.woe.toFixed(2)}, points=${w.points_contribution}\n`;
        }
      }

      if (applicationContext.summary) {
        contextPrompt += `\n### Executive Summary\n${applicationContext.summary}\n`;
      }

      if (applicationContext.aiInsights) {
        contextPrompt += `\n### AI Insights\n`;
        if (applicationContext.aiInsights.narrative) {
          contextPrompt += `Narrative: ${applicationContext.aiInsights.narrative}\n`;
        }
        if (applicationContext.aiInsights.risk_flags) {
          contextPrompt += `Risk Flags: ${JSON.stringify(applicationContext.aiInsights.risk_flags)}\n`;
        }
      }

      if (applicationContext.dataSanity) {
        contextPrompt += `\n### Data Sanity\n`;
        contextPrompt += `Consistency Score: ${applicationContext.dataSanity.consistency_score}/100\n`;
        if (applicationContext.dataSanity.flags) {
          for (const f of applicationContext.dataSanity.flags) {
            contextPrompt += `- [${f.severity}] ${f.check}: ${f.finding}\n`;
          }
        }
      }

      // Financial profile
      contextPrompt += `\n### Financial Profile\n`;
      contextPrompt += `- Monthly Income: ${applicationContext.monthlyIncome || "N/A"}\n`;
      contextPrompt += `- Monthly Expenses: ${applicationContext.monthlyExpenses || "N/A"}\n`;
      contextPrompt += `- Monthly Rent: ${applicationContext.monthlyRent || "N/A"}\n`;
      contextPrompt += `- Dependents: ${applicationContext.dependents || "N/A"}\n`;
      contextPrompt += `- Existing Loans: ${applicationContext.existingLoans || "N/A"}\n`;
      contextPrompt += `- Employer: ${applicationContext.employer || "N/A"}\n`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: contextPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Grace AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Grace error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
