// Local dependency file for Supabase Edge Functions
// This helps avoid network issues during deployment

export { serve } from "std/http/server"; // Use key from deno.json
export { createClient } from "@supabase/supabase-js"; // Use key from deno.json
export { default as Stripe } from "stripe"; // Use key from deno.json
