import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateApiKey(environment: string): string {
  const prefix = environment === "sandbox" ? "sk_sandbox_" : "sk_live_";
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = prefix;
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Get user's institution
    const { data: profile } = await adminClient
      .from("profiles")
      .select("institution_id")
      .eq("user_id", user.id)
      .single();
    if (!profile?.institution_id) throw new Error("No institution found");

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { environment = "sandbox", label = "Default Key" } = body;
      const rawKey = generateApiKey(environment);
      const keyHash = await hashKey(rawKey);
      const keyPrefix = rawKey.substring(0, 12);

      const { data: newKey, error } = await adminClient
        .from("api_keys")
        .insert({
          institution_id: profile.institution_id,
          key_prefix: keyPrefix,
          key_hash: keyHash,
          environment,
          label,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      return new Response(JSON.stringify({
        ...newKey,
        raw_key: rawKey, // Only returned once on creation
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list") {
      const { data: keys, error } = await adminClient
        .from("api_keys")
        .select("*")
        .eq("institution_id", profile.institution_id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return new Response(JSON.stringify(keys), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke") {
      const { key_id } = body;
      if (!key_id) throw new Error("key_id required");

      const { error } = await adminClient
        .from("api_keys")
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq("id", key_id)
        .eq("institution_id", profile.institution_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "logs") {
      const { limit = 50 } = body;
      const { data: logs, error } = await adminClient
        .from("api_request_logs")
        .select("*")
        .eq("institution_id", profile.institution_id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      return new Response(JSON.stringify(logs), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Webhook management
    if (action === "webhook_create") {
      const { url, events = ["score.completed", "application.created"], environment = "sandbox" } = body;
      if (!url) throw new Error("url required");

      const secret = `whsec_${generateApiKey("webhook").slice(8)}`;
      const { data: webhook, error } = await adminClient
        .from("webhook_configs")
        .insert({
          institution_id: profile.institution_id,
          url,
          events,
          environment,
          secret,
        })
        .select()
        .single();
      if (error) throw error;

      return new Response(JSON.stringify(webhook), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "webhook_list") {
      const { data: webhooks, error } = await adminClient
        .from("webhook_configs")
        .select("*")
        .eq("institution_id", profile.institution_id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return new Response(JSON.stringify(webhooks), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "webhook_delete") {
      const { webhook_id } = body;
      if (!webhook_id) throw new Error("webhook_id required");

      const { error } = await adminClient
        .from("webhook_configs")
        .delete()
        .eq("id", webhook_id)
        .eq("institution_id", profile.institution_id);
      if (error) throw error;

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
