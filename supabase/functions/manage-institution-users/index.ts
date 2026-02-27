import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller is admin
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only admins can manage users");

    // Get caller's institution
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("institution_id")
      .eq("user_id", caller.id)
      .single();
    if (!callerProfile?.institution_id) throw new Error("Admin not linked to an institution");

    const body = await req.json();
    const { action } = body;

    // ACTION: list — return all users in the caller's institution
    if (action === "list") {
      const { data: roles, error } = await adminClient
        .from("user_roles")
        .select("user_id, role")
        .eq("institution_id", callerProfile.institution_id);
      if (error) throw error;

      // Fetch profiles for these users
      const userIds = roles?.map((r: any) => r.user_id) || [];
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      // Fetch emails from auth
      const usersWithDetails = [];
      for (const role of roles || []) {
        const profile = profiles?.find((p: any) => p.user_id === role.user_id);
        const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(role.user_id);
        usersWithDetails.push({
          user_id: role.user_id,
          email: authUser?.email || "unknown",
          display_name: profile?.display_name || authUser?.email || "Unknown",
          role: role.role,
          created_at: authUser?.created_at,
        });
      }

      return new Response(JSON.stringify({ users: usersWithDetails }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: invite — create a new user and assign role
    if (action === "invite") {
      const { email, password, display_name, role } = body;
      if (!email || !password || !role) throw new Error("Missing required fields: email, password, role");

      const validRoles = ["credit_officer", "underwriter", "viewer"];
      if (!validRoles.includes(role)) throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);

      // Create auth user
      const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: display_name || email },
      });
      if (authErr) throw authErr;

      const newUserId = authData.user.id;

      // Link profile to institution
      const { error: profileErr } = await adminClient
        .from("profiles")
        .update({ institution_id: callerProfile.institution_id })
        .eq("user_id", newUserId);
      if (profileErr) throw profileErr;

      // Assign role
      const { error: roleErr } = await adminClient
        .from("user_roles")
        .insert({
          user_id: newUserId,
          institution_id: callerProfile.institution_id,
          role,
        });
      if (roleErr) throw roleErr;

      return new Response(
        JSON.stringify({
          success: true,
          user_id: newUserId,
          email,
          role,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: update_role — change a user's role
    if (action === "update_role") {
      const { user_id, new_role } = body;
      if (!user_id || !new_role) throw new Error("Missing user_id or new_role");

      const validRoles = ["admin", "credit_officer", "underwriter", "viewer"];
      if (!validRoles.includes(new_role)) throw new Error(`Invalid role`);

      // Prevent self-demotion
      if (user_id === caller.id) throw new Error("Cannot change your own role");

      const { error } = await adminClient
        .from("user_roles")
        .update({ role: new_role })
        .eq("user_id", user_id)
        .eq("institution_id", callerProfile.institution_id);
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, user_id, new_role }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: remove — remove user from institution
    if (action === "remove") {
      const { user_id } = body;
      if (!user_id) throw new Error("Missing user_id");
      if (user_id === caller.id) throw new Error("Cannot remove yourself");

      // Remove role
      const { error: roleErr } = await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("institution_id", callerProfile.institution_id);
      if (roleErr) throw roleErr;

      // Unlink profile from institution
      const { error: profileErr } = await adminClient
        .from("profiles")
        .update({ institution_id: null })
        .eq("user_id", user_id);
      if (profileErr) throw profileErr;

      return new Response(
        JSON.stringify({ success: true, user_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
