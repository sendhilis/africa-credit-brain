import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Hard-coded list of public tables from schema (safer than pg introspection via REST)
    const tables = [
      "institutions", "profiles", "user_roles", "borrowers", "applications",
      "scorecard_results", "document_extractions", "payment_history", "income_history",
      "grace_chat_sessions", "grace_chat_messages",
      "api_keys", "api_request_logs", "webhook_configs",
      "integration_configs", "integration_agent_tasks",
    ];

    const parts: string[] = [];
    parts.push(`-- Africa One SQL Dump`);
    parts.push(`-- Generated: ${new Date().toISOString()}`);
    parts.push(`-- Data-only INSERT statements for public schema tables`);
    parts.push(`-- Restore into a target DB where the schema already exists.`);
    parts.push(`SET session_replication_role = replica;\n`);

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        parts.push(`-- SKIPPED ${table}: ${error.message}\n`);
        continue;
      }
      parts.push(`-- ============ ${table} (${data?.length ?? 0} rows) ============`);
      if (!data || data.length === 0) { parts.push(""); continue; }
      const cols = Object.keys(data[0]);
      const colList = cols.map((c) => `"${c}"`).join(", ");
      for (const row of data) {
        const values = cols.map((c) => esc((row as Record<string, unknown>)[c])).join(", ");
        parts.push(`INSERT INTO public."${table}" (${colList}) VALUES (${values});`);
      }
      parts.push("");
    }

    parts.push(`SET session_replication_role = DEFAULT;`);
    const sql = parts.join("\n");

    return new Response(sql, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="africaone-dump-${new Date().toISOString().slice(0,10)}.sql"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
