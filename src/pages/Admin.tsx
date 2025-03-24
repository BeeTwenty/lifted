
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Users, 
  Database, 
  ArrowLeft,
  Shield,
  ImageOff,
  FilePlus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Import the component modules
import DatabaseManager from "@/components/admin/DatabaseManager";
import UserManager from "@/components/admin/UserManager";
import SettingsManager from "@/components/admin/SettingsManager";
import MissingMediaManager from "@/components/admin/MissingMediaManager";
import SuggestionsManager from "@/components/admin/SuggestionsManager";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("database");
  
  // Check if user is admin
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login if not authenticated
        navigate("/auth");
        throw new Error("Not authenticated");
      }

      // Get user's profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      
      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (adminError && adminError.code !== 'PGRST116') {
        // Not found error is fine, just means user isn't admin
        console.error("Error checking admin status:", adminError);
      }
      
      // Add admin status to the profile
      const isAdmin = !!adminData;
      
      if (!isAdmin) {
        // Redirect non-admin users
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have admin privileges to access this page.",
        });
        navigate("/");
        throw new Error("Not authorized");
      }
      
      return { ...profileData, isAdmin };
    },
  });

  useEffect(() => {
    // If there's an error with profile loading, show access denied
    if (profileError) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You need to be an admin to access this page.",
      });
      navigate("/");
    }
  }, [profileError, navigate, toast]);

  if (profileLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="container">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              className="mr-2"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="ml-2 text-3xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            <span className="text-sm font-medium">Admin Access</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="database" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="missing-media" className="flex items-center">
              <ImageOff className="h-4 w-4 mr-2" />
              Missing Media
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center">
              <FilePlus className="h-4 w-4 mr-2" />
              Suggestions
            </TabsTrigger>
          </TabsList>
          
          {/* Database Management Tab */}
          <TabsContent value="database" className="space-y-4">
            <DatabaseManager isAdmin={!!userProfile?.isAdmin} />
          </TabsContent>
          
          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <UserManager isAdmin={!!userProfile?.isAdmin} />
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <SettingsManager isAdmin={!!userProfile?.isAdmin} />
          </TabsContent>
          
          {/* Missing Media Tab */}
          <TabsContent value="missing-media" className="space-y-4">
            <MissingMediaManager isAdmin={!!userProfile?.isAdmin} />
          </TabsContent>
          <TabsContent value="suggestions" className="space-y-4">
            <SuggestionsManager isAdmin={!!userProfile?.isAdmin} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
