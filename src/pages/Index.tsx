
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Plus, Calendar, Award, History, LineChart, Settings, LogOut } from "lucide-react";
import { WorkoutCard } from "@/components/WorkoutCard";
import { WorkoutStats } from "@/components/WorkoutStats";
import { WorkoutPlayer } from "@/components/WorkoutPlayer";
import { CreateWorkoutDialog } from "@/components/CreateWorkoutDialog";
import { EditWorkoutDialog } from "@/components/EditWorkoutDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExerciseHistoryTracker } from "@/components/ExerciseHistoryTracker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WeightTracker } from "@/components/WeightTracker";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [dailyCalories, setDailyCalories] = useState<number>(2000);
  const [consumedCalories, setConsumedCalories] = useState<number>(0);
  const [editWorkoutId, setEditWorkoutId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on component mount
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (!user) {
          // Redirect unauthenticated users to auth page
          navigate("/auth");
        }
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
    fetchNutritionData();
  }, [navigate]);

  const fetchNutritionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("daily_calories")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching nutrition data:", error);
        return;
      }
      
      if (data && data.daily_calories) {
        setDailyCalories(data.daily_calories);
      }

      const today = new Date().toISOString().split('T')[0];

      const { data: foodLogs, error: foodError } = await supabase
        .from("food_logs")
        .select("calories")
        .eq("user_id", user.id)
        .eq("date", today);

      if (foodError) {
        console.error("Error fetching food logs:", foodError);
        return;
      }

      const totalCalories = foodLogs?.reduce((sum, item) => sum + item.calories, 0) || 0;
      setConsumedCalories(totalCalories);
    } catch (error) {
      console.error("Error fetching nutrition data:", error);
    }
  };

  const { data: profile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return {
        fullName: data.full_name,
        username: data.username,
        email: user.email
      };
    },
    enabled: !!user, // Only run query if user is logged in
  });

  const { data: routines, isLoading: isRoutinesLoading } = useQuery({
    queryKey: ["routines"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data: workouts, error } = await supabase
        .from("workouts")
        .select(`
          id,
          title,
          duration,
          exercises (count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return workouts.map(workout => ({
        id: workout.id,
        title: workout.title,
        exercises: workout.exercises[0].count,
        duration: workout.duration || 0,
      }));
    },
    enabled: !!user, // Only run query if user is logged in
  });

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Routine deleted",
        description: "Your routine has been deleted successfully."
      });

      queryClient.invalidateQueries({ queryKey: ["routines"] });
      queryClient.invalidateQueries({ queryKey: ["workoutStats"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting routine",
        description: error.message,
      });
    }
  };

  const handleEditWorkout = (id: string) => {
    setEditWorkoutId(id);
  };

  const displayName = profile?.fullName || profile?.username || profile?.email?.split('@')[0] || "there";

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container py-4 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold dark:text-white">Welcome back, {displayName}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Track your fitness journey</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex gap-2 items-center">
          <CreateWorkoutDialog />
          <Link to="/settings">
            <Button variant="outline" className="bg-primary/5 dark:bg-primary/10">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <ThemeToggle />
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <Tabs defaultValue="workouts" className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="workouts">
            <Dumbbell className="h-4 w-4 mr-2" /> Workouts
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Award className="h-4 w-4 mr-2" /> Stats
          </TabsTrigger>
          <TabsTrigger value="history">
            <LineChart className="h-4 w-4 mr-2" /> Exercise History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="workouts">
          <div className="grid grid-cols-1 gap-4 animate-fade-up">
            <section>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white">Your Routines</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isRoutinesLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
                  ))
                ) : routines?.length ? (
                  routines.map((routine) => (
                    <WorkoutCard
                      key={routine.id}
                      title={routine.title}
                      duration={routine.duration ? `${routine.duration} min` : ""}
                      exercises={routine.exercises}
                      onClick={() => setActiveWorkoutId(routine.id)}
                      onDelete={() => handleDeleteWorkout(routine.id)}
                      onEdit={() => handleEditWorkout(routine.id)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                    No routines yet. Start by creating your first workout routine!
                  </div>
                )}
              </div>
            </section>
          </div>
        </TabsContent>
        
        <TabsContent value="stats">
          <WorkoutStats />
        </TabsContent>
        
        <TabsContent value="history">
          <ExerciseHistoryTracker />
        </TabsContent>
      </Tabs>
{/* 
      <section className="py-4">
        <h2 className="text-2xl font-semibold mb-4 dark:text-white">Routines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isRoutinesLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
            ))
          ) : routines?.length ? (
            routines.map((routine) => (
              <WorkoutCard
                key={routine.id}
                title={routine.title}
                duration={routine.duration ? `${routine.duration} min` : ""}
                exercises={routine.exercises}
                onClick={() => setActiveWorkoutId(routine.id)}
                onDelete={() => handleDeleteWorkout(routine.id)}
                onEdit={() => handleEditWorkout(routine.id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              No routines yet. Start by creating your first workout routine!
            </div>
          )}
        </div>
      </section>
*/}
      <section className="py-4">
        <WeightTracker />
      </section>

      <WorkoutPlayer 
        workoutId={activeWorkoutId} 
        onClose={() => setActiveWorkoutId(null)} 
      />

      {editWorkoutId && (
        <EditWorkoutDialog
          workoutId={editWorkoutId}
          open={!!editWorkoutId}
          onOpenChange={(open) => {
            if (!open) setEditWorkoutId(null);
          }}
        />
      )}
    </div>
  );
};

export default Index;
