import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch application with borrower
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("*, borrower:borrowers!applications_borrower_id_fkey(*)")
      .eq("id", application_id)
      .single();

    if (appErr || !app) throw new Error(appErr?.message || "Application not found");

    const borrower = app.borrower;

    // Build the prompt with all available data
    const prompt = `You are a credit risk scoring engine for African lending markets. Analyze this loan application and produce a credit score and detailed factor breakdown.

APPLICATION DATA:
- Country: ${app.country}
- Product Category: ${app.product_category}
- Product Type: ${app.product_type || "N/A"}
- Requested Amount: ${app.requested_amount || "N/A"} ${app.currency || ""}
- Tenor: ${app.tenor_months || "N/A"} months
- Purpose: ${app.purpose || "N/A"}
- Collateral: ${app.collateral || "N/A"}

BORROWER PROFILE:
- Name: ${borrower?.full_name || "N/A"}
- Gender: ${borrower?.gender || "N/A"}
- Date of Birth: ${borrower?.date_of_birth || "N/A"}
- Marital Status: ${borrower?.marital_status || "N/A"}
- ID Type: ${borrower?.id_type || "N/A"}
- Phone: ${borrower?.phone || "N/A"}
- Location: ${borrower?.location_detail || "N/A"}, ${borrower?.address || "N/A"}

FINANCIAL PROFILE:
- Monthly Income: ${app.monthly_income || "N/A"} ${app.currency || ""}
- Monthly Expenses: ${app.monthly_expenses || "N/A"} ${app.currency || ""}
- Monthly Rent: ${app.monthly_rent || "N/A"} ${app.currency || ""}
- Dependents: ${app.dependents || "N/A"}
- Existing Loans: ${app.existing_loans || "None"}
- Employer: ${app.employer || "N/A"}
${app.product_category !== "retail" ? `
BUSINESS PROFILE:
- Business Name: ${borrower?.business_name || "N/A"}
- Business Type: ${borrower?.business_type || "N/A"}
- Sector: ${borrower?.sector || "N/A"}
- Years in Operation: ${borrower?.years_in_operation || "N/A"}
- Employees: ${borrower?.employees || "N/A"}
- Monthly Revenue: ${app.monthly_revenue || "N/A"} ${app.currency || ""}
- USD Revenue: ${app.usd_revenue || "N/A"}
- Export Income %: ${app.export_income_pct || "N/A"}
` : ""}
ALT-DATA CONSENTS: ${JSON.stringify(app.alt_data_consents || {})}
DOCUMENTS SUBMITTED: ${JSON.stringify(app.documents || [])}
PSYCHOMETRIC STATUS: ${app.psychometric_status || "N/A"}

Produce your assessment using the suggest_score tool.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You are a credit risk scoring engine. Always use the suggest_score tool to return structured results. Score range is 300-900. Be realistic and nuanced based on the data available.",
            },
            { role: "user", content: prompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_score",
                description:
                  "Return structured credit score assessment with factor breakdown",
                parameters: {
                  type: "object",
                  properties: {
                    score: {
                      type: "integer",
                      description: "Credit score between 300-900",
                    },
                    score_band: {
                      type: "string",
                      enum: [
                        "Very Poor",
                        "Poor",
                        "Fair",
                        "Good",
                        "Very Good",
                        "Excellent",
                      ],
                    },
                    probability_of_default: {
                      type: "number",
                      description:
                        "Estimated probability of default between 0 and 1",
                    },
                    recommendation: {
                      type: "string",
                      enum: ["approve", "review", "decline"],
                    },
                    reason_codes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          code: { type: "string" },
                          description: { type: "string" },
                          impact: {
                            type: "string",
                            enum: ["positive", "negative", "neutral"],
                          },
                        },
                        required: ["code", "description", "impact"],
                        additionalProperties: false,
                      },
                    },
                    factors: {
                      type: "array",
                      description:
                        "Factor breakdown showing contribution to the score. Weights should sum to 100.",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          weight: {
                            type: "number",
                            description: "Weight percentage (0-100)",
                          },
                          score: {
                            type: "number",
                            description:
                              "Factor score 0-100 (100=best)",
                          },
                          description: { type: "string" },
                        },
                        required: ["name", "weight", "score", "description"],
                        additionalProperties: false,
                      },
                    },
                    summary: {
                      type: "string",
                      description:
                        "2-3 sentence executive summary of the risk assessment",
                    },
                  },
                  required: [
                    "score",
                    "score_band",
                    "probability_of_default",
                    "recommendation",
                    "reason_codes",
                    "factors",
                    "summary",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "suggest_score" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned from AI");

    const result = JSON.parse(toolCall.function.arguments);

    // Update the application with the score
    const { error: updateErr } = await supabase
      .from("applications")
      .update({
        score: result.score,
        score_band: result.score_band,
        probability_of_default: result.probability_of_default,
        reason_codes: result.reason_codes,
        scored_at: new Date().toISOString(),
        status: app.status === "submitted" ? "review" : app.status,
      })
      .eq("id", application_id);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true, ...result }), {
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
