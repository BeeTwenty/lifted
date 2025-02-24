
import { Card } from "@/components/ui/card";
import { Activity, Dumbbell, Timer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function WorkoutStats() {
  const { data: stats } = useQuery({
    queryKey: ["workoutStats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Get total workouts
      const { count: totalWorkouts } = await supabase
        .from("workouts")
        .select("*", { count: "exact" })
        .eq("user_id", user.id);

      // Get total duration
      const { data: workouts } = await supabase
        .from("workouts")
        .select("duration")
        .eq("user_id", user.id);
      
      const totalHours = workouts?.reduce((acc, curr) => acc + (curr.duration / 60), 0) || 0;

      // Get total exercises
      const { count: totalExercises } = await supabase
        .from("exercises")
        .select("*", { count: "exact" })
        .in("workout_id", workouts?.map(w => w.id) || []);

      return {
        totalWorkouts: totalWorkouts || 0,
        totalHours: Math.round(totalHours),
        totalExercises: totalExercises || 0,
      };
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-full">
            <Activity className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Workouts</p>
            <h4 className="text-2xl font-semibold">{stats?.totalWorkouts ?? "..."}</h4>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Timer className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Hours Trained</p>
            <h4 className="text-2xl font-semibold">{stats?.totalHours ?? "..."}</h4>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-success/10 rounded-full">
            <Dumbbell className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Exercises</p>
            <h4 className="text-2xl font-semibold">{stats?.totalExercises ?? "..."}</h4>
          </div>
        </div>
      </Card>
    </div>
  );
}
