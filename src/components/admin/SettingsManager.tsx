
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface SettingsManagerProps {
  isAdmin: boolean;
}

const SettingsManager = ({ isAdmin }: SettingsManagerProps) => {
  const { toast } = useToast();
  
  // Site Settings
  const [siteSettings, setSiteSettings] = useState({
    siteName: "Fitness Tracker",
    defaultDailyCalories: 2000,
    defaultWorkoutGoal: 5,
    defaultHourGoal: 10
  });

  // Update site settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof siteSettings) => {
      // This would normally update site settings in the database
      // For now, we're just simulating it
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "The site settings were successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error updating settings",
        description: error.message,
      });
    },
  });

  // Handle settings form submit
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(siteSettings);
  };

  // Handle settings input change
  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSiteSettings(prev => ({
      ...prev,
      [name]: name.includes('default') ? parseInt(value) : value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Settings</CardTitle>
        <CardDescription>
          Manage global application settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSettingsSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="siteName" className="md:text-right">
                Site Name
              </Label>
              <Input
                id="siteName"
                name="siteName"
                value={siteSettings.siteName}
                onChange={handleSettingsChange}
                className="md:col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultDailyCalories" className="md:text-right">
                Default Daily Calories
              </Label>
              <Input
                id="defaultDailyCalories"
                name="defaultDailyCalories"
                type="number"
                value={siteSettings.defaultDailyCalories}
                onChange={handleSettingsChange}
                className="md:col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultWorkoutGoal" className="md:text-right">
                Default Workout Goal (per week)
              </Label>
              <Input
                id="defaultWorkoutGoal"
                name="defaultWorkoutGoal"
                type="number"
                value={siteSettings.defaultWorkoutGoal}
                onChange={handleSettingsChange}
                className="md:col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultHourGoal" className="md:text-right">
                Default Hour Goal (per week)
              </Label>
              <Input
                id="defaultHourGoal"
                name="defaultHourGoal"
                type="number"
                value={siteSettings.defaultHourGoal}
                onChange={handleSettingsChange}
                className="md:col-span-3"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" className="flex items-center">
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SettingsManager;
