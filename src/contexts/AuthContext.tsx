
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
    // We'll only use localStorage for anonymous users
    // For logged-in users, we'll always check the database
    if (!user) {
      const storedHasUsed = localStorage.getItem('hasUsedFreeGeneration');
      if (storedHasUsed) {
        setHasUsedFreeGeneration(true);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkSubscriptionStatus(session.user.id);
        checkGenerationUsage(session.user.id);
      }
      
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          checkSubscriptionStatus(session.user.id);
          checkGenerationUsage(session.user.id);
        } else {
          setHasActiveSubscription(false);
          
          // Don't reset hasUsedFreeGeneration here as we want to preserve
          // trial status for anonymous users across sessions
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSubscriptionStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking subscription status:', error);
        setHasActiveSubscription(false);
        return;
      }

      if (data && data.is_active && new Date(data.expires_at) > new Date()) {
        setHasActiveSubscription(true);
        console.log('User has active subscription until:', data.expires_at);
      } else {
        setHasActiveSubscription(false);
      }
    } catch (error) {
      console.error('Error in checkSubscriptionStatus:', error);
      setHasActiveSubscription(false);
    }
  };

  const checkGenerationUsage = async (userId: string) => {
    try {
      // Important: We'll reset the local state first, then check the DB
      // This ensures we don't show "trial used" incorrectly
      setHasUsedFreeGeneration(false);
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking user subscriptions:', error);
        return;
      }

      // If the user has a record and is_subscribed is false,
      // they've used their free generation
      if (data && data.is_subscribed === false) {
        console.log("User has used their free generation:", userId);
        setHasUsedFreeGeneration(true);
      } else if (!data) {
        // If no record exists, this is a new user who hasn't used their trial
        console.log("New user detected who hasn't used their free generation:", userId);
        setHasUsedFreeGeneration(false);
      } else {
        console.log("User has not used their free generation or is subscribed");
        setHasUsedFreeGeneration(false);
      }
    } catch (error) {
      console.error('Error in checkGenerationUsage:', error);
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
