
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { profileService } from "@/api/services/profile.service";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  isProSubscriber: boolean;
};

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  loading: true,
  isProSubscriber: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProSubscriber, setIsProSubscriber] = useState(false);
  const navigate = useNavigate();

  const checkProStatus = async () => {
    if (!session) {
      setIsProSubscriber(false);
      return;
    }
    
    try {
      const status = await profileService.checkSubscriptionStatus();
      setIsProSubscriber(status === "pro");
      console.log("Pro status:", status === "pro" ? "Pro" : "Basic");
    } catch (error) {
      console.error("Error checking pro status:", error);
      setIsProSubscriber(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      
      // Check pro status when session is loaded
      if (session) {
        checkProStatus();
      }
      
      // Redirect to auth page if no session and not already on auth page
      if (!session && window.location.pathname !== '/auth') {
        navigate('/auth');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      
      // Check pro status when auth state changes
      if (session) {
        checkProStatus();
      }
      
      // Redirect to auth page if no session and not already on auth page
      if (!session && window.location.pathname !== '/auth') {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ session, loading, isProSubscriber }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
