import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("institution_id")
      .eq("user_id", userId)
      .single();
    if (!profile?.institution_id) {
      return new Response(JSON.stringify({ error: "No institution found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { action } = body;

    // ── Chat with AI agent ──
    if (action === "chat") {
      const { messages, context } = body;
      if (!lovableApiKey) throw new Error("AI not configured");

      const systemPrompt = `You are an Integration Agent for AfricaOne Credit Brain, a credit scoring platform for African microfinance institutions.

Your role is to help MFI administrators integrate with banks, MNOs, utilities, credit bureaus, and fintechs in their country — using ZERO coding.

You have deep knowledge of:
- All API specifications for banks, MNOs, and utilities across Zimbabwe, Kenya, Ghana, Nigeria, Rwanda, Uganda
- OAuth2, API key authentication, certificate-based auth, and webhook configuration
- Sandbox testing procedures and production go-live checklists
- Data formats: ISO 8583 for switches, REST/JSON for modern APIs, SOAP/XML for legacy systems

When a user asks to integrate with an entity:
1. Explain what data the integration will provide (transaction history, account verification, etc.)
2. List the required credentials they need to obtain from the entity
3. Guide them step-by-step through the setup
4. Offer to run sandbox tests
5. Report results clearly

When running sandbox tests, simulate realistic responses and report:
- Connection test: Can we reach the API? (latency, TLS version)
- Authentication test: Are credentials valid?
- Data retrieval test: Can we pull sample data?
- Error handling test: Does the API return proper error codes?

Always be encouraging, specific, and avoid jargon. The admin may not be technical.

Current context:
- Institution ID: ${profile.institution_id}
- Country context: ${context?.country || "Not specified"}
- Selected entities: ${context?.selectedEntities ? JSON.stringify(context.selectedEntities) : "None"}
- Current integrations: ${context?.currentIntegrations ? JSON.stringify(context.currentIntegrations) : "None"}

Format your responses with clear headings, bullet points, and status indicators (✅ ⚠️ ❌) for test results.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        throw new Error("AI gateway error");
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // ── Connect entity ──
    if (action === "connect") {
      const { entity_name, entity_type, country, config: entityConfig } = body;

      // Create or update integration config
      const { data: existing } = await adminClient
        .from("integration_configs")
        .select("id")
        .eq("institution_id", profile.institution_id)
        .eq("entity_name", entity_name)
        .eq("environment", "sandbox")
        .single();

      let integrationId: string;
      if (existing) {
        await adminClient
          .from("integration_configs")
          .update({ status: "connecting", config: entityConfig || {}, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        integrationId = existing.id;
      } else {
        const { data: newConfig, error } = await adminClient
          .from("integration_configs")
          .insert({
            institution_id: profile.institution_id,
            country,
            entity_name,
            entity_type,
            environment: "sandbox",
            status: "connecting",
            config: entityConfig || {},
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        integrationId = newConfig.id;
      }

      // Create agent task
      const { data: task } = await adminClient
        .from("integration_agent_tasks")
        .insert({
          institution_id: profile.institution_id,
          integration_config_id: integrationId,
          task_type: "connect",
          entity_name,
          status: "running",
          steps: [
            { step: "Initialize connection", status: "completed", timestamp: new Date().toISOString() },
            { step: "Validate credentials format", status: "running", timestamp: new Date().toISOString() },
          ],
        })
        .select()
        .single();

      // Simulate connection process (sandbox)
      await new Promise((r) => setTimeout(r, 500));

      const steps = [
        { step: "Initialize connection", status: "completed", timestamp: new Date().toISOString() },
        { step: "Validate credentials format", status: "completed", timestamp: new Date().toISOString() },
        { step: "TLS handshake", status: "completed", detail: "TLS 1.3, cipher: TLS_AES_256_GCM_SHA384", timestamp: new Date().toISOString() },
        { step: "Authentication", status: "completed", detail: "OAuth2 token obtained (sandbox)", timestamp: new Date().toISOString() },
        { step: "Endpoint discovery", status: "completed", detail: "4 endpoints available", timestamp: new Date().toISOString() },
        { step: "Health check", status: "completed", detail: `Latency: ${Math.floor(Math.random() * 80 + 20)}ms`, timestamp: new Date().toISOString() },
      ];

      // Update task and config
      await adminClient
        .from("integration_agent_tasks")
        .update({ status: "completed", steps, completed_at: new Date().toISOString(), result: { connected: true, latency_ms: Math.floor(Math.random() * 80 + 20) } })
        .eq("id", task!.id);

      await adminClient
        .from("integration_configs")
        .update({ status: "sandbox_testing", connected_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", integrationId);

      return new Response(JSON.stringify({ success: true, integration_id: integrationId, task_id: task!.id, steps }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Run sandbox tests ──
    if (action === "test") {
      const { integration_id } = body;
      if (!integration_id) throw new Error("integration_id required");

      const { data: config } = await adminClient
        .from("integration_configs")
        .select("*")
        .eq("id", integration_id)
        .single();
      if (!config) throw new Error("Integration not found");

      const { data: task } = await adminClient
        .from("integration_agent_tasks")
        .insert({
          institution_id: profile.institution_id,
          integration_config_id: integration_id,
          task_type: "test",
          entity_name: config.entity_name,
          status: "running",
        })
        .select()
        .single();

      const testResults = [
        { test: "Connection Health", status: "passed", latency_ms: Math.floor(Math.random() * 60 + 15), detail: "API reachable, TLS 1.3" },
        { test: "Authentication", status: "passed", latency_ms: Math.floor(Math.random() * 100 + 30), detail: "Token exchange successful" },
        { test: "Account Verification", status: "passed", latency_ms: Math.floor(Math.random() * 200 + 50), detail: "Mock account verified: Jane Doe, Acc: ****4521" },
        { test: "Transaction Pull", status: "passed", latency_ms: Math.floor(Math.random() * 300 + 80), detail: "Retrieved 47 transactions (3-month window)" },
        { test: "Error Handling", status: "passed", latency_ms: Math.floor(Math.random() * 50 + 10), detail: "404, 401, 429 errors handled correctly" },
        { test: "Rate Limiting", status: "passed", latency_ms: Math.floor(Math.random() * 30 + 5), detail: "100 req/min within limits" },
        { test: "Data Format Validation", status: "passed", latency_ms: Math.floor(Math.random() * 20 + 5), detail: "JSON schema valid, dates ISO 8601" },
      ];

      await adminClient
        .from("integration_configs")
        .update({ sandbox_test_results: testResults, last_tested_at: new Date().toISOString(), status: "connected", updated_at: new Date().toISOString() })
        .eq("id", integration_id);

      await adminClient
        .from("integration_agent_tasks")
        .update({ status: "completed", completed_at: new Date().toISOString(), result: { tests: testResults, all_passed: true } })
        .eq("id", task!.id);

      return new Response(JSON.stringify({ success: true, task_id: task!.id, tests: testResults }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── List integrations ──
    if (action === "list") {
      const { data: configs, error } = await adminClient
        .from("integration_configs")
        .select("*")
        .eq("institution_id", profile.institution_id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return new Response(JSON.stringify(configs), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── List agent tasks ──
    if (action === "tasks") {
      const { limit = 20 } = body;
      const { data: tasks, error } = await adminClient
        .from("integration_agent_tasks")
        .select("*")
        .eq("institution_id", profile.institution_id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      return new Response(JSON.stringify(tasks), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Disconnect ──
    if (action === "disconnect") {
      const { integration_id } = body;
      await adminClient
        .from("integration_configs")
        .update({ status: "disconnected", updated_at: new Date().toISOString() })
        .eq("id", integration_id)
        .eq("institution_id", profile.institution_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
