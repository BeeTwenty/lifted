
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Shield } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [showAdminSection, setShowAdminSection] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Check your email for the confirmation link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  // This is a special function to bootstrap the first admin
  // The adminKey should be a secret value known only to administrators
  // In a production app, this would be done through a secure backend process
  const handleCreateFirstAdmin = async () => {
    // For demo purposes, we're using a simple key check
    // In production, use a proper secure method
    if (adminKey !== "admin123") {
      toast({
        variant: "destructive",
        title: "Invalid Admin Key",
        description: "The admin key you entered is not valid.",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Not authenticated",
          description: "Please sign in first.",
        });
        return;
      }

      // First, check if any admins exist (to prevent overriding)
      const { data: existingAdmins, error: checkError } = await supabase
        .from("admins")
        .select("*")
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (existingAdmins && existingAdmins.length > 0) {
        toast({
          variant: "destructive",
          title: "Admin already exists",
          description: "An admin account already exists in the system.",
        });
        return;
      }

      // Insert the current user as an admin
      const { error: insertError } = await supabase
        .from("admins")
        .insert({ user_id: user.id });
      
      if (insertError) throw insertError;

      toast({
        title: "Admin Created",
        description: "You have been successfully set as the first admin user.",
      });
      
      // Navigate to admin panel
      navigate("/admin");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to FitTracker Pro</h1>
          <p className="text-gray-500 mt-2">Sign in or create an account to continue</p>
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              Sign In
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleEmailSignUp}
              disabled={loading}
            >
              Sign Up
            </Button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <Mail className="mr-2 h-4 w-4" />
          Google
        </Button>

        <div className="pt-4">
          <Button
            type="button"
            variant="ghost"
            className="text-xs text-gray-500 hover:text-gray-700 w-full flex justify-center"
            onClick={() => setShowAdminSection(!showAdminSection)}
          >
            {showAdminSection ? "Hide Admin Options" : "Admin Options"}
          </Button>
          
          {showAdminSection && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50">
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-sm font-medium">Initial Admin Setup</h3>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  This is used only once to create the first admin user. You must be signed in first.
                </p>
                <Input 
                  type="password"
                  placeholder="Admin Key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  variant="outline"
                  onClick={handleCreateFirstAdmin}
                  disabled={loading}
                >
                  Create First Admin
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
