import { AdminAccessButton } from "@/components/AdminAccessButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, ChevronLeft, Info, LogOut, Moon, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useTheme } from "@/components/ThemeProvider";

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .max(30, {
      message: "Username must not be longer than 30 characters.",
    }),
  email: z
    .string()
    .email({
      message: "Please enter a valid email address.",
    }),
  bio: z.string().max(160).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }
        
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
          
        if (error) throw error;
        
        setUserData({
          ...data,
          email: user.email,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching profile",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate, toast]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      email: "",
      bio: "",
    },
    values: userData ? {
      username: userData.username || "",
      email: userData.email || "",
      bio: userData.bio || "",
    } : undefined,
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }
      
      const { error } = await supabase
        .from("profiles")
        .update({
          username: data.username,
          bio: data.bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
        
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => navigate("/")}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="grid gap-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Manage your public profile information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Your username" {...field} />
                          </FormControl>
                          <FormDescription>
                            This is your public display name.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Your email" {...field} disabled />
                          </FormControl>
                          <FormDescription>
                            Your email address is managed through your authentication provider.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about yourself" 
                              className="resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Brief description for your profile. Max 160 characters.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={loading}>
                      Save changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Manage your account settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="destructive" 
                  className="w-full sm:w-auto"
                  onClick={handleSignOut}
                  disabled={loading}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the app looks and feels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <span className="font-medium">Dark mode</span>
                      <span className="text-sm text-gray-500">
                        Switch between light and dark mode
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4" />
                      <Switch 
                        id="dark-mode" 
                        checked={theme === "dark"}
                        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                      />
                      <Moon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="font-medium">Theme</label>
                  <Select 
                    value={theme} 
                    onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    Select your preferred theme or use system settings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure how you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-md p-4 bg-muted/20">
                  <div className="flex gap-2 items-center text-muted-foreground mb-2">
                    <Info className="h-4 w-4" />
                    <p className="text-sm font-medium">Notifications Coming Soon</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The notification system is currently under development. Check back soon for updates!
                  </p>
                </div>
              
                <div className="space-y-4 opacity-60 pointer-events-none">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="font-medium">Workout reminders</label>
                      <p className="text-sm text-gray-500">
                        Receive reminders for scheduled workouts
                      </p>
                    </div>
                    <Switch id="workout-notifications" defaultChecked disabled />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="font-medium">Progress updates</label>
                      <p className="text-sm text-gray-500">
                        Get notified about your fitness progress
                      </p>
                    </div>
                    <Switch id="progress-notifications" defaultChecked disabled />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="font-medium">New features</label>
                      <p className="text-sm text-gray-500">
                        Learn about new app features and updates
                      </p>
                    </div>
                    <Switch id="feature-notifications" disabled />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Add API Key Manager */}
        <section>
          <ApiKeyManager />
        </section>
      </div>
      
      {/* Add the Admin Access section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Admin Access</h2>
        <div className="max-w-md">
          <AdminAccessButton />
        </div>
      </div>
    </div>
  );
};

export default Settings;
