
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Create an auth context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true
});

// Create a provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log("useAuth - Auth state changed:", event, 
        currentSession?.user ? { id: currentSession.user.id, email: currentSession.user.email } : "No session found");
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      
      // Additional logging for debugging
      if (event === 'SIGNED_IN') {
        console.log("User signed in successfully");
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out");
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Auth token refreshed");
      } else if (event === 'USER_UPDATED') {
        console.log("User data updated");
      }
    });

    // THEN check for existing session
    const checkCurrentUser = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("useAuth - getCurrentUser:", currentSession?.user ? "User found" : "No user found", 
          currentSession?.user ? { id: currentSession.user.id, email: currentSession.user.email } : null);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('Error getting current user:', error);
        setLoading(false);
      }
    };

    checkCurrentUser();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Export the hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
