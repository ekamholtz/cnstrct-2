
import { supabase } from "@/integrations/supabase/client";

/**
 * Initialize database functions required by the application
 */
export async function initializeDatabase() {
  try {
    console.log("Initializing database functions...");
    
    // Try to create the get_client_invoices function
    const { error } = await supabase.rpc('create_get_client_invoices_function');
    
    if (error) {
      // Ignore errors about function already existing
      if (!error.message.includes('already exists')) {
        console.error("Error creating client invoices function:", error);
      } else {
        console.log("Client invoices function already exists");
      }
    } else {
      console.log("Successfully created client invoices function");
    }
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}
