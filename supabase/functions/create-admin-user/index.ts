import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create the user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: "sendhilis@gmail.com",
      password: "Qwerty@9123",
      email_confirm: true,
      user_metadata: { display_name: "SK" },
    });

    if (createError) {
      // If user already exists, get the user
      if (createError.message.includes("already been registered")) {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        const existingUser = users.find((u) => u.email === "sendhilis@gmail.com");
        if (!existingUser) throw new Error("User not found");

        // Assign admin role
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: existingUser.id, role: "admin", institution_id: existingUser.id },
            { onConflict: "user_id,role" }
          );

        return new Response(
          JSON.stringify({ message: "Existing user assigned admin role", userId: existingUser.id, roleError }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw createError;
    }

    const userId = userData.user.id;

    // Assign admin role - we need an institution first
    // Check if there's an existing institution or create one
    const { data: institutions } = await supabase.from("institutions").select("id").limit(1);
    
    let institutionId: string;
    if (institutions && institutions.length > 0) {
      institutionId = institutions[0].id;
    } else {
      const { data: newInst, error: instError } = await supabase
        .from("institutions")
        .insert({ name: "Default Institution", country: "Kenya", status: "active" })
        .select("id")
        .single();
      if (instError) throw instError;
      institutionId = newInst.id;
    }

    // Update profile with institution
    await supabase
      .from("profiles")
      .update({ institution_id: institutionId })
      .eq("user_id", userId);

    // Assign admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "admin", institution_id: institutionId },
        { onConflict: "user_id,role" }
      );

    if (roleError) throw roleError;

    return new Response(
      JSON.stringify({ message: "Admin user created successfully", userId, institutionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
