
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

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

  // Rest Time Settings
  const [restTimeSettings, setRestTimeSettings] = useState({
    strengthTraining: 90,
    cardio: 30,
    hiit: 20,
    flexibility: 15,
    general: 60
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

  // Update rest time settings mutation
  const updateRestTimeMutation = useMutation({
    mutationFn: async (data: typeof restTimeSettings) => {
      // This would normally update rest time settings in the database
      // For now, we're just simulating it
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Rest time settings updated",
        description: "The rest time settings were successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error updating rest time settings",
        description: error.message,
      });
    },
  });

  // Handle settings form submit
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(siteSettings);
  };

  // Handle rest time settings form submit
  const handleRestTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestTimeMutation.mutate(restTimeSettings);
  };

  // Handle settings input change
  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSiteSettings(prev => ({
      ...prev,
      [name]: name.includes('default') ? parseInt(value) : value
    }));
  };

  // Handle rest time slider change
  const handleRestTimeChange = (value: number[], workoutType: keyof typeof restTimeSettings) => {
    setRestTimeSettings(prev => ({
      ...prev,
      [workoutType]: value[0]
    }));
  };

  return (
    <Tabs defaultValue="general">
      <TabsList className="mb-4">
        <TabsTrigger value="general">General Settings</TabsTrigger>
        <TabsTrigger value="rest-times">Rest Time Settings</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
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
      </TabsContent>
      
      <TabsContent value="rest-times">
        <Card>
          <CardHeader>
            <CardTitle>Rest Time Settings</CardTitle>
            <CardDescription>
              Customize default rest times for different workout types.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRestTimeSubmit} className="space-y-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="strengthTraining">Strength Training</Label>
                    <span className="text-sm font-medium">{restTimeSettings.strengthTraining} seconds</span>
                  </div>
                  <Slider 
                    id="strengthTraining"
                    min={10} 
                    max={180} 
                    step={5} 
                    value={[restTimeSettings.strengthTraining]} 
                    onValueChange={(value) => handleRestTimeChange(value, 'strengthTraining')}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="cardio">Cardio</Label>
                    <span className="text-sm font-medium">{restTimeSettings.cardio} seconds</span>
                  </div>
                  <Slider 
                    id="cardio"
                    min={10} 
                    max={180} 
                    step={5} 
                    value={[restTimeSettings.cardio]} 
                    onValueChange={(value) => handleRestTimeChange(value, 'cardio')}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="hiit">HIIT</Label>
                    <span className="text-sm font-medium">{restTimeSettings.hiit} seconds</span>
                  </div>
                  <Slider 
                    id="hiit"
                    min={10} 
                    max={180} 
                    step={5} 
                    value={[restTimeSettings.hiit]} 
                    onValueChange={(value) => handleRestTimeChange(value, 'hiit')}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="flexibility">Flexibility & Stretching</Label>
                    <span className="text-sm font-medium">{restTimeSettings.flexibility} seconds</span>
                  </div>
                  <Slider 
                    id="flexibility"
                    min={10} 
                    max={180} 
                    step={5} 
                    value={[restTimeSettings.flexibility]} 
                    onValueChange={(value) => handleRestTimeChange(value, 'flexibility')}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="general">General (Default)</Label>
                    <span className="text-sm font-medium">{restTimeSettings.general} seconds</span>
                  </div>
                  <Slider 
                    id="general"
                    min={10} 
                    max={180} 
                    step={5} 
                    value={[restTimeSettings.general]} 
                    onValueChange={(value) => handleRestTimeChange(value, 'general')}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" className="flex items-center">
                  <Save className="mr-2 h-4 w-4" />
                  Save Rest Times
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default SettingsManager;
