import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Mock data generators ──
function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockScore() {
  const score = randomBetween(380, 850);
  const pd = parseFloat((1 / (1 + Math.exp((score - 600) / 80))).toFixed(4));
  let band: string, decision: string;
  if (score >= 740) { band = "A"; decision = "APPROVE"; }
  else if (score >= 670) { band = "B"; decision = "APPROVE"; }
  else if (score >= 580) { band = "C"; decision = "REVIEW"; }
  else if (score >= 500) { band = "D"; decision = "REVIEW"; }
  else { band = "E"; decision = "DECLINE"; }

  return {
    score, band, pd, decision,
    reason_codes: [
      { code: "R01", factor: "Debt-to-Income Ratio", impact: score > 670 ? "positive" : "negative" },
      { code: "R02", factor: "Payment History", impact: score > 580 ? "positive" : "negative" },
      { code: "R03", factor: "Income Stability", impact: "neutral" },
    ],
    model_version: "v1.1-sandbox",
    scored_at: new Date().toISOString(),
  };
}

function generateMockApplication(payload: any) {
  const id = `sandbox-${crypto.randomUUID().slice(0, 8)}`;
  return {
    id,
    app_code: `APP-${randomBetween(1000, 9999)}`,
    status: "submitted",
    borrower_id: payload.borrower_id || `BRW-${randomBetween(10000, 99999)}`,
    country: payload.country || "KE",
    product_category: payload.product || "micro",
    requested_amount: payload.amount || 50000,
    tenor_months: payload.tenor_months || 12,
    currency: payload.currency || "KES",
    created_at: new Date().toISOString(),
    _sandbox: true,
  };
}

function generateMockDocumentResult(payload: any) {
  return {
    extraction_id: `sandbox-ext-${crypto.randomUUID().slice(0, 8)}`,
    document_type: payload.document_type || "bank_statement",
    extraction_status: "completed",
    is_valid: true,
    period_months: 3,
    meets_period_requirement: true,
    confidence_score: 0.92,
    extracted_data: {
      account_holder_name: "Jane Sandbox",
      bank_name: "Sandbox Bank",
      currency: payload.currency || "KES",
      total_credits: randomBetween(100000, 500000),
      total_debits: randomBetween(80000, 400000),
      average_monthly_income: randomBetween(30000, 150000),
      average_monthly_expenses: randomBetween(20000, 120000),
      statement_period: { start_date: "2025-10-01", end_date: "2025-12-31" },
    },
    _sandbox: true,
  };
}

// ── Route handler ──
const ROUTES: Record<string, Record<string, (body: any) => any>> = {
  "POST /v1/score": {
    handler: (body: any) => generateMockScore(),
  },
  "POST /v1/applications": {
    handler: (body: any) => generateMockApplication(body),
  },
  "POST /v1/documents": {
    handler: (body: any) => generateMockDocumentResult(body),
  },
  "GET /v1/score": {
    handler: (_body: any) => generateMockScore(),
  },
  "GET /v1/health": {
    handler: () => ({ status: "healthy", environment: "sandbox", latency_ms: randomBetween(12, 85), timestamp: new Date().toISOString() }),
  },
  "GET /v1/applications": {
    handler: () => ({
      data: Array.from({ length: 5 }, (_, i) => generateMockApplication({ borrower_id: `BRW-${10000 + i}` })),
      total: 5,
      page: 1,
    }),
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse the API key from x-api-key header
    const apiKey = req.headers.get("x-api-key") || "";
    const url = new URL(req.url);
    
    // The path after /sandbox-api becomes the API endpoint
    // e.g. /sandbox-api/v1/score → /v1/score  
    const pathParts = url.pathname.split("/sandbox-api");
    const apiPath = pathParts.length > 1 ? pathParts[1] : url.searchParams.get("path") || "/v1/health";
    
    // Strip ID suffix for parameterized routes like /v1/score/abc123
    const normalizedPath = apiPath.replace(/\/[a-f0-9-]{8,}$/, "");
    const routeKey = `${req.method} ${normalizedPath}`;

    let body: any = {};
    if (req.method === "POST") {
      try { body = await req.json(); } catch { body = {}; }
    }

    // Validate API key if provided
    let apiKeyId: string | null = null;
    let institutionId: string | null = null;

    if (apiKey) {
      const prefix = apiKey.substring(0, 12);
      const { data: keyRecord } = await supabase
        .from("api_keys")
        .select("id, institution_id, environment, is_active")
        .eq("key_prefix", prefix)
        .eq("is_active", true)
        .single();

      if (keyRecord) {
        if (keyRecord.environment !== "sandbox") {
          return new Response(JSON.stringify({
            error: "LIVE_KEY_IN_SANDBOX",
            message: "You are using a live API key in the sandbox environment. Use a sandbox key (sk_sandbox_...).",
          }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        apiKeyId = keyRecord.id;
        institutionId = keyRecord.institution_id;

        // Update last_used_at
        await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);
      }
    }

    // Find route handler
    const route = ROUTES[routeKey];
    let statusCode = 200;
    let responseBody: any;

    if (route) {
      responseBody = route.handler(body);
    } else {
      statusCode = 404;
      responseBody = {
        error: "NOT_FOUND",
        message: `Endpoint ${req.method} ${apiPath} not found. Available endpoints: ${Object.keys(ROUTES).join(", ")}`,
        available_endpoints: Object.keys(ROUTES),
      };
    }

    const latencyMs = Date.now() - startTime;

    // Log the request
    if (institutionId) {
      await supabase.from("api_request_logs").insert({
        institution_id: institutionId,
        api_key_id: apiKeyId,
        environment: "sandbox",
        method: req.method,
        endpoint: apiPath,
        request_body: req.method === "POST" ? body : null,
        response_body: responseBody,
        status_code: statusCode,
        latency_ms: latencyMs,
      });
    }

    return new Response(JSON.stringify(responseBody), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Sandbox": "true", "X-Latency-Ms": String(latencyMs) },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
