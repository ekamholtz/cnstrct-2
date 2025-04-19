// Simple hello-world Edge Function
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

serve((req) => {
  console.log("Hello world function called!");
  return new Response("Hello World!", {
    headers: { "Content-Type": "text/plain" }
  });
});
