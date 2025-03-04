
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface TransferOwnershipBody {
  currentOwnerId: string;
  newOwnerId: string;
  gcAccountId: string;
}

serve(async (req) => {
  // Create a Supabase client with the auth context of the logged in user
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    }
  );

  // Get the current session
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    });
  }

  const currentUserId = session.user.id;

  // Get the request body
  const { currentOwnerId, newOwnerId, gcAccountId } = await req.json() as TransferOwnershipBody;

  // Verify the requesting user is the current owner
  if (currentUserId !== currentOwnerId) {
    return new Response(
      JSON.stringify({ error: "Only the current owner can transfer ownership" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 403,
      }
    );
  }

  // Verify the current user is actually the owner of the GC account
  const { data: currentOwnerCheck, error: currentOwnerError } = await supabaseClient
    .from("gc_accounts")
    .select("owner_id")
    .eq("id", gcAccountId)
    .single();

  if (currentOwnerError || !currentOwnerCheck || currentOwnerCheck.owner_id !== currentOwnerId) {
    return new Response(
      JSON.stringify({ error: "You are not the current owner of this GC account" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 403,
      }
    );
  }

  // Verify the new owner is a GC admin in the same account
  const { data: newOwner, error: newOwnerError } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", newOwnerId)
    .eq("gc_account_id", gcAccountId)
    .single();

  if (newOwnerError || !newOwner || newOwner.role !== "gc_admin") {
    return new Response(
      JSON.stringify({ error: "The specified user is not a GC admin in this account" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  }

  // Update the GC account owner
  const { error: updateOwnerError } = await supabaseClient
    .from("gc_accounts")
    .update({ owner_id: newOwnerId })
    .eq("id", gcAccountId);

  if (updateOwnerError) {
    return new Response(
      JSON.stringify({ error: "Failed to update ownership status" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: "Ownership transferred successfully" }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }
  );
});
