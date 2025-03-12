
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

// Helper hook to provide consistent user authentication across the app
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log("useAuth - getCurrentUser:", user ? "User found" : "No user found", 
          user ? { id: user.id, email: user.email } : null);
        setUser(user);
      } catch (error) {
        console.error('Error getting current user:', error);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();

    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("useAuth - Auth state changed:", _event, 
        session?.user ? { id: session.user.id, email: session.user.email } : "No session found");
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { user, loading };
}
