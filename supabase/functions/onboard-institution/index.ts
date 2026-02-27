import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller has admin role
    const { data: hasAdmin } = await adminClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!hasAdmin) throw new Error("Only admins can onboard institutions");

    const body = await req.json();
    const { institution_name, country, admin_email, admin_display_name, admin_password } = body;

    if (!institution_name || !country || !admin_email || !admin_password) {
      throw new Error("Missing required fields");
    }

    // 1. Create institution
    const { data: institution, error: instErr } = await adminClient
      .from("institutions")
      .insert({ name: institution_name, country, status: "onboarding" })
      .select()
      .single();
    if (instErr) throw instErr;

    // 2. Create admin user via auth.admin
    const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { display_name: admin_display_name || admin_email },
    });
    if (authErr) throw authErr;

    const newUserId = authData.user.id;

    // 3. Link profile to institution
    const { error: profileErr } = await adminClient
      .from("profiles")
      .update({ institution_id: institution.id })
      .eq("user_id", newUserId);
    if (profileErr) throw profileErr;

    // 4. Assign admin role
    const { error: roleErr } = await adminClient
      .from("user_roles")
      .insert({ user_id: newUserId, institution_id: institution.id, role: "admin" });
    if (roleErr) throw roleErr;

    return new Response(
      JSON.stringify({
        success: true,
        institution_id: institution.id,
        institution_name: institution.name,
        admin_user_id: newUserId,
        admin_email,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
