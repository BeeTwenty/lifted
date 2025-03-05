
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalorieCalculator } from "@/components/CalorieCalculator"; // Import Calorie Calculator

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCalorieCalculator, setShowCalorieCalculator] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    dailyCalories: 2000,
    workoutGoal: 5,
    hourGoal: 10,
    height: 170,
    age: 30,
  });

  // Fetch user profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, username, daily_calories, workout_goal, hour_goal, height, age")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Update form when profile data is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || "",
        username: profile.username || "",
        dailyCalories: profile.daily_calories || 2000,
        workoutGoal: profile.workout_goal || 5,
        hourGoal: profile.hour_goal || 10,
        height: profile.height || 170,
        age: profile.age || 30,
      });
    }
  }, [profile]);

  // Function to handle saving settings
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.fullName,
          username: data.username,
          daily_calories: data.dailyCalories,
          workout_goal: data.workoutGoal,
          hour_goal: data.hourGoal,
          height: data.height,
          age: data.age,
        })
        .eq("id", user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast({
        title: "Settings updated",
        description: "Your profile settings have been updated successfully."
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error updating settings",
        description: error.message
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-900 py-8">
      <div className="container max-w-2xl">
        <div className="mb-6 flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2 dark:text-white"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold dark:text-white">Settings</h1>
        </div>

        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Profile Settings</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="dark:text-gray-300">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Your full name"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="dark:text-gray-300">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Your username"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="dark:text-gray-300">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  placeholder="30"
                  min="1"
                  max="120"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="dark:text-gray-300">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                  placeholder="170"
                  min="50"
                  max="250"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
{/* 
              <div className="space-y-2">
                <Label htmlFor="dailyCalories" className="dark:text-gray-300">Daily Calorie Target</Label>
                <Input
                  id="dailyCalories"
                  type="number"
                  value={formData.dailyCalories}
                  onChange={(e) => setFormData({ ...formData, dailyCalories: Number(e.target.value) })}
                  placeholder="2000"
                  min="500"
                  max="10000"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Set your daily calorie target for nutrition tracking
                </p>
              </div>
*/}
              <div className="space-y-2">
                <Label htmlFor="workoutGoal" className="dark:text-gray-300">Weekly Workout Goal</Label>
                <Input
                  id="workoutGoal"
                  type="number"
                  value={formData.workoutGoal}
                  onChange={(e) => setFormData({ ...formData, workoutGoal: Number(e.target.value) })}
                  placeholder="5"
                  min="1"
                  max="30"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourGoal" className="dark:text-gray-300">Weekly Workout Hours Goal</Label>
                <Input
                  id="hourGoal"
                  type="number"
                  value={formData.hourGoal}
                  onChange={(e) => setFormData({ ...formData, hourGoal: Number(e.target.value) })}
                  placeholder="10"
                  min="1"
                  max="50"
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            
              {/* Toggle Calorie Calculator 
              <div className="space-y-2">
              <Button 
  type="button" // Prevents form submission
  variant="outline" 
  onClick={() => setShowCalorieCalculator(!showCalorieCalculator)}
  className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
>
  {showCalorieCalculator ? "Hide" : "Show"} Calorie Calculator
</Button>


                {showCalorieCalculator && (
                  <div className="mt-4 p-4 border rounded-lg dark:border-gray-700">
                    <CalorieCalculator 
                      onCalculate={(calories: number) => {
                        setFormData(prev => ({ ...prev, dailyCalories: calories }));
                      }} 
                    />
                  </div>
                )}
              </div>
              */}
            </CardContent>

            {/* Save Button (Always Visible) */}
            <CardFooter className="flex justify-end">
              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Settings"}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default Settings;
