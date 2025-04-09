
// Updated dependencies for Stripe webhook function
export { serve } from "https://deno.land/std@0.208.0/http/server.ts";
export { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
export { default as Stripe } from "https://esm.sh/stripe@14.10.0";
