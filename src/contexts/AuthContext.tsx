
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  user: any;
  loading: boolean;
  signOut: () => Promise<void>;
  hasActiveSubscription: boolean;
  hasUsedFreeGeneration: boolean;
  setHasUsedFreeGeneration: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [hasUsedFreeGeneration, setHasUsedFreeGeneration] = useState(false);

  useEffect(() => {
    // Load from localStorage on initial mount
    const storedHasUsed = localStorage.getItem('hasUsedFreeGeneration');
    if (storedHasUsed) {
      setHasUsedFreeGeneration(true);
    }

    // Check if the user is authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkSubscriptionStatus(session.user.id);
        checkGenerationUsage(session.user.id);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          checkSubscriptionStatus(session.user.id);
          checkGenerationUsage(session.user.id);
        } else {
          setHasActiveSubscription(false);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSubscriptionStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status, expires_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking subscription status:', error);
      setHasActiveSubscription(false);
      return;
    }

    if (data && data.status === 'active' && new Date(data.expires_at) > new Date()) {
      setHasActiveSubscription(true);
    } else {
      setHasActiveSubscription(false);
    }
  };

  const checkGenerationUsage = async (userId: string) => {
    const { data, error } = await supabase
      .from('recipe_generations')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error checking recipe generations:', error);
      return;
    }

    if (data && data.length > 0) {
      setHasUsedFreeGeneration(true);
      localStorage.setItem('hasUsedFreeGeneration', 'true');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    loading,
    signOut,
    hasActiveSubscription,
    hasUsedFreeGeneration,
    setHasUsedFreeGeneration
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
