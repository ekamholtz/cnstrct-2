
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

  // Verify the current user is actually the owner
  const { data: currentOwner, error: currentOwnerError } = await supabaseClient
    .from("profiles")
    .select("is_owner")
    .eq("id", currentOwnerId)
    .eq("gc_account_id", gcAccountId)
    .single();

  if (currentOwnerError || !currentOwner || !currentOwner.is_owner) {
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

  // Update the current owner - remove owner status
  const { error: removeOwnerError } = await supabaseClient
    .from("profiles")
    .update({ is_owner: false })
    .eq("id", currentOwnerId);

  if (removeOwnerError) {
    return new Response(
      JSON.stringify({ error: "Failed to update current owner status" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  // Update the new owner - set as owner
  const { error: setNewOwnerError } = await supabaseClient
    .from("profiles")
    .update({ is_owner: true })
    .eq("id", newOwnerId);

  if (setNewOwnerError) {
    // Rollback if there was an error
    await supabaseClient
      .from("profiles")
      .update({ is_owner: true })
      .eq("id", currentOwnerId);

    return new Response(
      JSON.stringify({ error: "Failed to set new owner status" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  // Update the gc_account
  const { error: updateGcAccountError } = await supabaseClient
    .from("gc_accounts")
    .update({ creator_id: newOwnerId })
    .eq("id", gcAccountId);

  if (updateGcAccountError) {
    return new Response(
      JSON.stringify({ error: "Failed to update GC account, but ownership was transferred" }),
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
