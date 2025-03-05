
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export function AdminAccessButton() {
  const [showAdminSection, setShowAdminSection] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateFirstAdmin = async () => {
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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Not authenticated",
          description: "Please sign in first.",
        });
        return;
      }

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

      const { error: insertError } = await supabase
        .from("admins")
        .insert({ user_id: user.id });
      
      if (insertError) throw insertError;

      toast({
        title: "Admin Created",
        description: "You have been successfully set as the first admin user.",
      });
      
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

  const checkAndNavigateToAdmin = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Not authenticated",
          description: "Please sign in first.",
        });
        return;
      }

      const { data: adminRecord, error } = await supabase
        .from("admins")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (adminRecord) {
        // User is an admin, navigate to admin page
        navigate("/admin");
      } else {
        // User is not an admin, show admin creation option
        setShowAdminSection(true);
      }
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
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={checkAndNavigateToAdmin}
        disabled={loading}
      >
        <Shield className="h-4 w-4" />
        Admin Access
      </Button>
      
      {showAdminSection && (
        <Card>
          <CardHeader>
            <CardTitle>Initial Admin Setup</CardTitle>
            <CardDescription>
              This is used only once to create the first admin user.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              type="password"
              placeholder="Admin Key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
            />
            <Button
              type="button"
              className="w-full"
              onClick={handleCreateFirstAdmin}
              disabled={loading}
            >
              Create First Admin
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
