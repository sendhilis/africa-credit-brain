import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple XOR-based obfuscation with a server-side key
// In production, use Supabase Vault or a proper KMS
const ENCRYPTION_KEY = "africaone-credit-brain-2026-enc";

function xorEncrypt(text: string, key: string): string {
  const encoded = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(encoded.length);
  for (let i = 0; i < encoded.length; i++) {
    result[i] = encoded[i] ^ keyBytes[i % keyBytes.length];
  }
  return btoa(String.fromCharCode(...result));
}

function xorDecrypt(encoded: string, key: string): string {
  const data = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return new TextDecoder().decode(result);
}

export { xorEncrypt, xorDecrypt, ENCRYPTION_KEY };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("institution_id")
      .eq("user_id", userId)
      .single();
    if (!profile?.institution_id) throw new Error("No institution found");

    const body = await req.json();
    const { integration_id, endpoint_path, method = "GET", payload } = body;

    if (!integration_id || !endpoint_path) {
      throw new Error("integration_id and endpoint_path required");
    }

    // Fetch integration config
    const { data: config } = await adminClient
      .from("integration_configs")
      .select("*")
      .eq("id", integration_id)
      .eq("institution_id", profile.institution_id)
      .eq("environment", "production")
      .single();

    if (!config) throw new Error("Production integration not found");
    if (config.status !== "connected") throw new Error("Integration not active in production");

    // Decrypt credentials
    const encryptedCreds = config.credentials_encrypted as Record<string, string>;
    if (!encryptedCreds || Object.keys(encryptedCreds).length === 0) {
      throw new Error("No credentials configured for this integration");
    }

    const decryptedCreds: Record<string, string> = {};
    for (const [key, val] of Object.entries(encryptedCreds)) {
      try {
        decryptedCreds[key] = xorDecrypt(val as string, ENCRYPTION_KEY);
      } catch {
        decryptedCreds[key] = val as string;
      }
    }

    // Build the target URL
    const baseUrl = (config.api_base_url || "").replace(/\/$/, "");
    if (!baseUrl) throw new Error("No API base URL configured");
    const targetUrl = `${baseUrl}${endpoint_path}`;

    // Build auth headers based on credential type
    const proxyHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    // Auto-detect auth pattern
    if (decryptedCreds.api_key) {
      proxyHeaders["X-API-Key"] = decryptedCreds.api_key;
    }
    if (decryptedCreds.api_secret) {
      proxyHeaders["X-API-Secret"] = decryptedCreds.api_secret;
    }
    if (decryptedCreds.client_id && decryptedCreds.client_secret) {
      // OAuth2 client credentials — encode as Basic auth
      const basicAuth = btoa(`${decryptedCreds.client_id}:${decryptedCreds.client_secret}`);
      proxyHeaders["Authorization"] = `Basic ${basicAuth}`;
    }
    if (decryptedCreds.bearer_token) {
      proxyHeaders["Authorization"] = `Bearer ${decryptedCreds.bearer_token}`;
    }
    if (decryptedCreds.merchant_id) {
      proxyHeaders["X-Merchant-ID"] = decryptedCreds.merchant_id;
    }
    if (decryptedCreds.subscriber_code) {
      proxyHeaders["X-Subscriber-Code"] = decryptedCreds.subscriber_code;
    }

    // Make the real API call
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: proxyHeaders,
    };
    if (method.toUpperCase() !== "GET" && payload) {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const latencyMs = Date.now() - startTime;

    let responseBody: any;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("json")) {
      responseBody = await response.json();
    } else {
      responseBody = { raw: await response.text() };
    }

    // Log the request
    await adminClient.from("api_request_logs").insert({
      institution_id: profile.institution_id,
      environment: "production",
      method: method.toUpperCase(),
      endpoint: endpoint_path,
      request_body: method.toUpperCase() !== "GET" ? payload : null,
      response_body: responseBody,
      status_code: response.status,
      latency_ms: latencyMs,
    });

    return new Response(JSON.stringify({
      status: response.status,
      latency_ms: latencyMs,
      data: responseBody,
      entity: config.entity_name,
      endpoint: endpoint_path,
    }), {
      status: response.ok ? 200 : response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
