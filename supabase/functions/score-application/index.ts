import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { assessGabonAffordability, gabonIndicativeScore, isGabon } from "../_shared/gabon-credit.ts";

import { calculateAge, computeBusinessStability, runDataSanityChecks, runScorecard, type IncomeRecord, type PaymentRecord } from "../_shared/scorecard.ts";
import { redactPII } from "../_shared/scoring-privacy.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { application_id } = await req.json();
    if (!application_id) throw new Error("application_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const token = req.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
    const caller = token ? (await supabase.auth.getUser(token)).data.user : null;
    if (!caller) return Response.json({ error: "Sign in to score an application." }, { status: 401, headers: corsHeaders });
    const { data: institution } = await supabase.rpc("user_institution_id", { _user_id: caller.id });
    const { data: role } = institution ? await supabase.from("user_roles").select("role")
      .eq("user_id", caller.id).eq("institution_id", institution).in("role", ["admin", "credit_officer", "underwriter"]).limit(1).maybeSingle() : { data: null };
    if (!role) return Response.json({ error: "You do not have permission to score this application." }, { status: 403, headers: corsHeaders });

    // Fetch application with borrower
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("*, borrower:borrowers!applications_borrower_id_fkey(*)")
      .eq("id", application_id)
      .eq("institution_id", institution)
      .single();

    if (appErr || !app) throw new Error(appErr?.message || "Application not found");

    const borrower = app.borrower;
    if (!borrower || borrower.institution_id !== institution) {
      return Response.json({ error: "Application not found in your institution." }, { status: 404, headers: corsHeaders });
    }

    if (isGabon(app.country)) {
      const assessment = assessGabonAffordability(app.product_category, {
        monthly_income: app.monthly_income, monthly_expenses: app.monthly_expenses, rent: app.monthly_rent,
        monthly_revenue: app.monthly_revenue, avg_monthly_revenue_6m: app.monthly_revenue,
        ...(borrower.extra_data || {}),
      });
      const indicative = app.currency === "XAF" ? gabonIndicativeScore(assessment) : null;
      if (!indicative) return Response.json({
        error: app.currency !== "XAF" ? "Gabon scoring requires XAF amounts." : `Complete the Gabon affordability inputs: ${assessment.missing.join("; ")}.`,
      }, { headers: corsHeaders });

      const reasonCodes = [
        { code: "GA01", description: `Debt service coverage: ${assessment.dscr?.toFixed(2)}× (${indicative.coveragePoints >= 0 ? "+" : ""}${indicative.coveragePoints} points).`, impact: indicative.coveragePoints > 0 ? "positive" : indicative.coveragePoints < 0 ? "negative" : "neutral" },
        ...(assessment.timingRisk ? [{ code: "GA02", description: `Proposed payment starts before expected farm receipts (${indicative.timingPoints} points).`, impact: "negative" }] : []),
      ];
      const result = {
        score: indicative.score, score_band: "Indicative", probability_of_default: null, recommendation: "review",
        reason_codes: reasonCodes, model_version: "gabon-affordability-v1",
      };
      const { error } = await supabase.from("applications").update({
        score: result.score, score_band: result.score_band, probability_of_default: null,
        reason_codes: reasonCodes, scored_at: new Date().toISOString(), status: app.status === "submitted" ? "review" : app.status,
      }).eq("id", application_id).eq("institution_id", institution);
      if (error) throw error;
      return Response.json({ success: true, ...result }, { headers: corsHeaders });
    }

    // Fetch time-series data and OCR extractions in parallel
    const [paymentRes, incomeRes, ocrRes] = await Promise.all([
      supabase
        .from("payment_history")
        .select("status, days_past_due, amount_due, amount_paid, due_date")
        .eq("borrower_id", app.borrower_id)
        .eq("institution_id", institution)
        .order("due_date", { ascending: true }),
      supabase
        .from("income_history")
        .select("income_amount, period_start, period_end")
        .eq("borrower_id", app.borrower_id)
        .eq("institution_id", institution)
        .order("period_start", { ascending: true }),
      supabase
        .from("document_extractions")
        .select("document_type, extracted_data, extraction_status, confidence_score")
        .eq("application_id", application_id)
        .eq("institution_id", institution)
        .eq("extraction_status", "completed"),
    ]);

    const declaredApp = { ...app };

    // Enrich application data with OCR extractions before scoring
    const ocrExtractions = ocrRes.data || [];
    const bankExtraction = ocrExtractions.find((e: any) => e.document_type === "bank_statement");
    const posExtraction = ocrExtractions.find((e: any) => e.document_type === "pos_statement");
    const financialExtraction = ocrExtractions.find((e: any) => e.document_type === "financial_statement");

    // Track which OCR source provided income data
    let ocrIncomeSource: string | null = null;

    if (bankExtraction?.extracted_data) {
      const bd = bankExtraction.extracted_data;
      if (bd.average_monthly_income && (!app.monthly_income || bankExtraction.confidence_score > 0.7)) {
        app.monthly_income = bd.average_monthly_income;
        ocrIncomeSource = "bank_statement";
      }
      if (bd.average_monthly_expenses && (!app.monthly_expenses || bankExtraction.confidence_score > 0.7)) {
        app.monthly_expenses = bd.average_monthly_expenses;
      }

      // Enrich income history from OCR salary deposits
      const existingIncomeCount = (incomeRes.data || []).length;
      if (bd.salary_deposits?.length > 0 && existingIncomeCount < 3) {
        const ocrIncomeRecords: IncomeRecord[] = bd.salary_deposits.map((dep: any) => ({
          income_amount: dep.amount,
          period_start: dep.date,
          period_end: dep.date,
        }));
        if (incomeRes.data) {
          incomeRes.data.push(...ocrIncomeRecords);
        } else {
          (incomeRes as any).data = ocrIncomeRecords;
        }
        console.log(`Enriched income history with ${ocrIncomeRecords.length} OCR salary deposits`);
      }

      if (bd.statement_period) {
        console.log(`Bank statement period: ${bd.statement_period.start_date} to ${bd.statement_period.end_date}`);
      }
    }

    // ── POS / Till Statement enrichment ──
    // For cash-based traders without bank statements, POS data is the primary income signal
    if (posExtraction?.extracted_data && posExtraction.confidence_score >= 0.5) {
      const pd = posExtraction.extracted_data;
      console.log(`POS extraction found: total_credits=${pd.total_credits}, avg_monthly_income=${pd.average_monthly_income}`);

      // ── Normalize POS income by statement period length ──
      // A single-day POS snapshot should NOT be treated as monthly income
      let posPeriodDays = 30; // default assumption
      let periodConfidenceDiscount = 1.0;
      if (pd.statement_period?.start_date && pd.statement_period?.end_date) {
        const start = new Date(pd.statement_period.start_date);
        const end = new Date(pd.statement_period.end_date);
        posPeriodDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        console.log(`POS statement covers ${posPeriodDays} day(s): ${pd.statement_period.start_date} → ${pd.statement_period.end_date}`);
      }

      // Apply confidence discount based on data window:
      //   30+ days → full confidence (1.0)
      //   7-29 days → proportional (days/30)
      //   1-6 days → heavy discount (days/30 * 0.5) — single-day extrapolation is unreliable
      if (posPeriodDays >= 30) {
        periodConfidenceDiscount = 1.0;
      } else if (posPeriodDays >= 7) {
        periodConfidenceDiscount = posPeriodDays / 30;
      } else {
        periodConfidenceDiscount = (posPeriodDays / 30) * 0.5;
      }
      console.log(`POS period confidence discount: ${periodConfidenceDiscount.toFixed(3)} (${posPeriodDays} days)`);

      // Extrapolate to monthly: (total_credits / days) * 30, then apply discount
      const rawPosIncome = pd.total_credits || pd.average_monthly_income || 0;
      let normalizedMonthlyIncome: number;
      if (posPeriodDays < 30 && pd.total_credits) {
        // Extrapolate daily rate to monthly, then discount for uncertainty
        const dailyRate = pd.total_credits / posPeriodDays;
        normalizedMonthlyIncome = Math.round(dailyRate * 30 * periodConfidenceDiscount);
        console.log(`POS income normalized: daily=${dailyRate.toFixed(0)} × 30 × ${periodConfidenceDiscount.toFixed(3)} = ${normalizedMonthlyIncome}`);
      } else {
        normalizedMonthlyIncome = Math.round(rawPosIncome * periodConfidenceDiscount);
      }

      if (normalizedMonthlyIncome > 0 && !ocrIncomeSource) {
        if (!app.monthly_income || app.monthly_income === 0) {
          app.monthly_income = normalizedMonthlyIncome;
          ocrIncomeSource = "pos_statement";
          console.log(`Set monthly_income from POS (normalized): ${normalizedMonthlyIncome} (raw: ${rawPosIncome})`);
        }
        if (!app.monthly_revenue || app.monthly_revenue === 0) {
          app.monthly_revenue = normalizedMonthlyIncome;
        }
      }

      // POS expenses — also normalize by period
      const rawPosExpenses = pd.total_debits || pd.average_monthly_expenses || 0;
      if (rawPosExpenses > 0 && (!app.monthly_expenses || app.monthly_expenses === 0)) {
        const normalizedExpenses = posPeriodDays < 30
          ? Math.round((rawPosExpenses / posPeriodDays) * 30 * periodConfidenceDiscount)
          : Math.round(rawPosExpenses * periodConfidenceDiscount);
        app.monthly_expenses = normalizedExpenses;
      }

      // Enrich borrower extra_data with POS-derived business signals
      const extraData = borrower?.extra_data || {};

      if (pd.total_credits > 0) {
        extraData._pos_total_credits = pd.total_credits;
        extraData._pos_confidence = posExtraction.confidence_score * periodConfidenceDiscount;
        extraData._pos_has_data = true;
        extraData._pos_period_days = posPeriodDays;
        extraData._pos_period_discount = periodConfidenceDiscount;
      }

      if (pd.transaction_count && pd.transaction_count > 5) {
        extraData._pos_transaction_count = pd.transaction_count;
      }

      if (borrower) {
        borrower.extra_data = extraData;
      }
    }

    // ── EcoCash / Mobile Money enrichment ──
    const ecocashExtraction = ocrExtractions.find((e: any) =>
      (e.document_type === "ecocash_statement" || e.document_type === "mobile_money") && e.extraction_status === "completed"
    );
    if (ecocashExtraction?.extracted_data && ecocashExtraction.confidence_score >= 0.5) {
      const ed = ecocashExtraction.extracted_data;
      console.log(`EcoCash extraction found: total_credits=${ed.total_credits}, avg_monthly_income=${ed.average_monthly_income}`);

      // Normalize by statement period length (same logic as POS)
      let ecoPeriodDays = 30;
      let ecoConfDiscount = 1.0;
      if (ed.statement_period?.start_date && ed.statement_period?.end_date) {
        const start = new Date(ed.statement_period.start_date);
        const end = new Date(ed.statement_period.end_date);
        ecoPeriodDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        console.log(`EcoCash statement covers ${ecoPeriodDays} day(s): ${ed.statement_period.start_date} → ${ed.statement_period.end_date}`);
      }
      if (ecoPeriodDays >= 30) {
        ecoConfDiscount = 1.0;
      } else if (ecoPeriodDays >= 7) {
        ecoConfDiscount = ecoPeriodDays / 30;
      } else {
        ecoConfDiscount = (ecoPeriodDays / 30) * 0.5;
      }
      console.log(`EcoCash period confidence discount: ${ecoConfDiscount.toFixed(3)} (${ecoPeriodDays} days)`);

      const rawEcoIncome = ed.total_credits || ed.average_monthly_income || 0;
      let normalizedEcoIncome: number;
      if (ecoPeriodDays < 30 && ed.total_credits) {
        const dailyRate = ed.total_credits / ecoPeriodDays;
        normalizedEcoIncome = Math.round(dailyRate * 30 * ecoConfDiscount);
        console.log(`EcoCash income normalized: daily=${dailyRate.toFixed(0)} × 30 × ${ecoConfDiscount.toFixed(3)} = ${normalizedEcoIncome}`);
      } else {
        normalizedEcoIncome = Math.round(rawEcoIncome * ecoConfDiscount);
      }

      // If we already have POS-derived income, use higher of the two (triangulated)
      // EcoCash often captures the full business flow including POS settlements
      if (normalizedEcoIncome > 0) {
        if (!app.monthly_income || app.monthly_income === 0) {
          app.monthly_income = normalizedEcoIncome;
          ocrIncomeSource = "ecocash_statement";
          console.log(`Set monthly_income from EcoCash (normalized): ${normalizedEcoIncome}`);
        } else if (ocrIncomeSource === "pos_statement" && normalizedEcoIncome > app.monthly_income) {
          // EcoCash captures broader business flow — use it if it's higher and covers more days
          if (ecoPeriodDays > 1) {
            console.log(`Upgrading income from POS (${app.monthly_income}) to EcoCash (${normalizedEcoIncome}) — broader coverage (${ecoPeriodDays} days vs POS)`);
            app.monthly_income = normalizedEcoIncome;
            ocrIncomeSource = "ecocash_statement";
          }
        }
        if (!app.monthly_revenue || app.monthly_revenue === 0 || (ocrIncomeSource === "ecocash_statement")) {
          app.monthly_revenue = normalizedEcoIncome;
        }
      }

      // EcoCash expenses — for traders, debits are mostly COGS (supplier payments), not personal expenses
      // Only use non-supplier debits for expense enrichment to avoid inflating DTI
      const rawEcoExpenses = ed.total_debits || ed.average_monthly_expenses || 0;
      if (rawEcoExpenses > 0 && ed.recurring_obligations) {
        // Separate personal/household expenses from business supplier payments
        const supplierKeywords = ["supplier", "wholesale", "stock", "produce", "cooking oil", "beverages", "sugar", "rice", "groceries", "maize"];
        const bankTransferKeywords = ["ecocash to bank", "bank transfer"];
        
        let personalExpenses = 0;
        let businessCOGS = 0;
        for (const ob of ed.recurring_obligations) {
          const desc = (ob.description || "").toLowerCase();
          const isSupplier = supplierKeywords.some(kw => desc.includes(kw));
          const isBankTransfer = bankTransferKeywords.some(kw => desc.includes(kw));
          if (isSupplier || isBankTransfer) {
            businessCOGS += ob.amount || 0;
          } else {
            personalExpenses += ob.amount || 0;
          }
        }
        
        // Normalize personal expenses by period
        const normalizedPersonalExpenses = ecoPeriodDays < 30
          ? Math.round((personalExpenses / ecoPeriodDays) * 30 * ecoConfDiscount)
          : Math.round(personalExpenses * ecoConfDiscount);
        
        console.log(`EcoCash expense split: personal=${personalExpenses}, COGS=${businessCOGS}, normalized personal=${normalizedPersonalExpenses}`);
        
        // Only use personal expenses for DTI (not business COGS)
        if (normalizedPersonalExpenses > 0 && (!app.monthly_expenses || app.monthly_expenses === 0)) {
          app.monthly_expenses = normalizedPersonalExpenses;
          console.log(`Set monthly_expenses from EcoCash (personal only): ${normalizedPersonalExpenses}`);
        }
        
        // Store COGS separately for business analysis
        const extraData2 = borrower?.extra_data || {};
        extraData2._ecocash_business_cogs = businessCOGS;
        extraData2._ecocash_personal_expenses = personalExpenses;
        if (borrower) borrower.extra_data = extraData2;
      }

      // Enrich borrower extra_data with EcoCash signals
      const extraData = borrower?.extra_data || {};
      extraData._ecocash_total_credits = ed.total_credits;
      extraData._ecocash_total_debits = ed.total_debits;
      extraData._ecocash_confidence = ecocashExtraction.confidence_score * ecoConfDiscount;
      extraData._ecocash_has_data = true;
      extraData._ecocash_period_days = ecoPeriodDays;
      extraData._ecocash_period_discount = ecoConfDiscount;

      // Salary deposits from EcoCash → income history enrichment
      if (ed.salary_deposits?.length > 0) {
        const ecoIncomeRecords = ed.salary_deposits.map((dep: any) => ({
          income_amount: dep.amount,
          period_start: dep.date,
          period_end: dep.date,
        }));
        if (incomeRes.data) {
          incomeRes.data.push(...ecoIncomeRecords);
        } else {
          (incomeRes as any).data = ecoIncomeRecords;
        }
        console.log(`Enriched income history with ${ecoIncomeRecords.length} EcoCash deposits`);
      }

      if (borrower) {
        borrower.extra_data = extraData;
      }
    }

    if (financialExtraction?.extracted_data) {
      const fd = financialExtraction.extracted_data;
      if (fd.monthly_revenue_estimate && !app.monthly_revenue) {
        app.monthly_revenue = fd.monthly_revenue_estimate;
      }
    }

    console.log(`Pre-scoring: monthly_income=${app.monthly_income}, monthly_revenue=${app.monthly_revenue}, monthly_expenses=${app.monthly_expenses}, source=${ocrIncomeSource}`);

    // Run the scorecard
    const result = runScorecard({
      app,
      borrower,
      paymentHistory: (paymentRes.data || []) as PaymentRecord[],
      incomeHistory: (incomeRes.data || []) as IncomeRecord[],
    });

    // ── Data Sanity / Consistency Checks ──
    const businessStabilityVal = computeBusinessStability(borrower, borrower?.extra_data || {});
    const dataSanity = runDataSanityChecks(
      declaredApp,
      borrower,
      borrower?.extra_data || {},
      ocrExtractions,
      result.bread_basket,
      businessStabilityVal,
      result.time_series_features.payment_history,
      result.time_series_features.income_stability,
    );
    console.log(`Data Sanity Checks completed: ${dataSanity.flags.length} flags, consistency=${dataSanity.consistency_score}`);

    // ── AI Insights Layer ──────────────────────────────────────
    let aiInsights = null;
    try {
      const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
      const bureauContext = result.bureau_score_used
        ? `- Credit Bureau Score: ${app.bureau_score}`
        : `- Credit Bureau Score: NOT AVAILABLE (scoring relied on application data only)`;

      const aiPrompt = `You are a senior credit risk analyst reviewing a statistical scorecard output for an African lending market application. Provide qualitative insights that the model cannot capture.

SCORECARD OUTPUT:
- Final Score: ${result.score} (${result.score_band})
- Probability of Default: ${(result.probability_of_default * 100).toFixed(1)}%
- Recommendation: ${result.recommendation}
- Model Version: ${result.model_version}
${bureauContext}

FACTOR CONTRIBUTIONS:
${result.woe_details.map((w: any) => `- ${w.feature}: Raw=${w.raw_value}, Bin="${w.bin}", WoE=${w.woe}, Points=${w.points_contribution}`).join("\n")}

TIME-SERIES:
- Payment History: ${JSON.stringify(result.time_series_features.payment_history)}
- Income Stability: ${JSON.stringify(result.time_series_features.income_stability)}

APPLICATION CONTEXT:
- Country: ${app.country}, Product: ${app.product_category}/${app.product_type || "N/A"}
- Loan: ${app.requested_amount} ${app.currency || ""} over ${app.tenor_months} months
- Collateral declared: ${app.collateral && app.collateral.trim() && app.collateral.toLowerCase() !== "none" ? "Yes" : "No"}
- Borrower age (years): ${borrower.date_of_birth && Number.isFinite(Date.parse(borrower.date_of_birth)) ? calculateAge(borrower.date_of_birth) : "Unknown"}
${app.product_category !== "retail" ? `- Years in operation: ${borrower.years_in_operation ?? "N/A"}` : ""}

OCR DOCUMENT EXTRACTIONS:
${ocrExtractions.length > 0 ? ocrExtractions.map((e: any) => `- ${e.document_type}: ${JSON.stringify(redactPII(e.extracted_data))}`).join("\n") : "No OCR extractions available"}

DATA SANITY / CONSISTENCY CHECKS (Consistency Score: ${dataSanity.consistency_score}/100):
${dataSanity.flags.length > 0 ? dataSanity.flags.map((f: any) => `- [${f.severity.toUpperCase()}] ${f.check}: ${f.finding} (Declared: ${f.declared_value}, Evidence: ${f.evidence_value}, Source: ${f.source})`).join("\n") : "No inconsistencies detected — all data points are internally consistent."}

IMPORTANT: Pay special attention to the data sanity flags above. If there are WARNING or CRITICAL flags, these indicate potential data falsification or inconsistencies between what the borrower declared and what the documentary evidence shows. Factor these into your risk assessment and flag them prominently.

Use the provide_insights tool to return your analysis.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a senior credit risk analyst. Analyze the statistical scorecard output and provide actionable insights on factors the model may miss. Be specific and data-driven." },
            { role: "user", content: aiPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "provide_insights",
              description: "Return structured AI insights on the credit score",
              parameters: {
                type: "object",
                properties: {
                  score_adjustment: {
                    type: "object",
                    properties: {
                      direction: { type: "string", enum: ["increase", "decrease", "maintain"] },
                      magnitude: { type: "string", enum: ["minor", "moderate", "significant"] },
                      adjusted_score: { type: "integer", description: "Suggested adjusted score (300-900)" },
                      rationale: { type: "string", description: "Why the score should be adjusted" },
                    },
                    required: ["direction", "magnitude", "adjusted_score", "rationale"],
                    additionalProperties: false,
                  },
                  risk_flags: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        flag: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high"] },
                        detail: { type: "string" },
                      },
                      required: ["flag", "severity", "detail"],
                      additionalProperties: false,
                    },
                  },
                  mitigants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        factor: { type: "string" },
                        detail: { type: "string" },
                      },
                      required: ["factor", "detail"],
                      additionalProperties: false,
                    },
                  },
                  data_gaps: {
                    type: "array",
                    items: { type: "string" },
                    description: "Missing data that could improve scoring accuracy",
                  },
                  narrative: {
                    type: "string",
                    description: "2-4 sentence expert narrative summarizing the AI analysis",
                  },
                },
                required: ["score_adjustment", "risk_flags", "mitigants", "data_gaps", "narrative"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "provide_insights" } },
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          aiInsights = JSON.parse(toolCall.function.arguments);
        }
      } else {
        const errStatus = aiResponse.status;
        console.error("AI insights error:", errStatus);
        if (errStatus === 429 || errStatus === 402) {
          aiInsights = { error: errStatus === 429 ? "Rate limited" : "Credits exhausted", narrative: "AI insights unavailable due to rate limiting. Scorecard results are unaffected." };
        }
      }
    } catch (aiErr) {
      console.error("AI insights failed (non-blocking):", aiErr);
      aiInsights = { error: "AI analysis unavailable", narrative: "AI insights could not be generated. The statistical scorecard score remains valid." };
    }

    // Save results to both applications and scorecard_results
    const [updateRes, insertRes] = await Promise.all([
      supabase
        .from("applications")
        .update({
          score: result.score,
          score_band: result.score_band,
          probability_of_default: result.probability_of_default,
          reason_codes: result.reason_codes,
          scored_at: new Date().toISOString(),
          status: app.status === "submitted" ? "review" : app.status,
        })
        .eq("id", application_id).eq("institution_id", institution),
      supabase
        .from("scorecard_results")
        .insert({
          application_id,
          model_version: result.model_version,
          base_score: result.base_score,
          final_score: result.score,
          probability_of_default: result.probability_of_default,
          score_band: result.score_band,
          recommendation: result.recommendation,
          feature_contributions: result.factors,
          woe_details: result.woe_details,
          time_series_features: result.time_series_features,
          summary: result.summary,
          ai_insights: aiInsights,
          bread_basket: result.bread_basket || null,
          data_sanity: dataSanity,
        }),
    ]);

    if (updateRes.error) throw updateRes.error;
    if (insertRes.error) console.error("Scorecard result insert error:", insertRes.error);

    return new Response(JSON.stringify({ success: true, ...result, ai_insights: aiInsights, data_sanity: dataSanity }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-application error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
