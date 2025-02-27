
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create a Supabase client with the Auth context of the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });
    
    // Get the current user
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();
    
    if (getUserError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Get the requesting user's profile to verify permissions
    const { data: callerProfile, error: callerProfileError } = await supabase
      .from("profiles")
      .select("role, gc_account_id")
      .eq("id", user.id)
      .single();
      
    if (callerProfileError || !callerProfile) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Profile not found" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Only platform_admin and gc_admin can create users
    if (callerProfile.role !== "platform_admin" && callerProfile.role !== "gc_admin") {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Insufficient permissions" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Parse request body
    const { name, email, phone, role } = await req.json();
    
    if (!name || !email || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Validate that the role is valid
    if (role !== "gc_admin" && role !== "project_manager") {
      return new Response(
        JSON.stringify({ error: "Invalid role" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Generate a random password
    const password = Math.random().toString(36).slice(-10) + 
                   Math.random().toString(36).slice(-10).toUpperCase() + 
                   "!2#";
    
    // Create the user using the admin client
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        full_name: name,
        role,
      },
    });
    
    if (createUserError) {
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Update the profile with GC account ID and phone
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        phone_number: phone,
        gc_account_id: callerProfile.gc_account_id,
      })
      .eq("id", newUser.user.id);
    
    if (updateProfileError) {
      return new Response(
        JSON.stringify({ error: updateProfileError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // TODO: In a real app, send an email to the user with their temporary password
    
    return new Response(
      JSON.stringify({
        id: newUser.user.id,
        email: newUser.user.email,
        message: "User created successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    console.error("Error creating user:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
