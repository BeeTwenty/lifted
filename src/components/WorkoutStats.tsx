import { Card } from "@/components/ui/card";
import { Activity, Timer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

export function WorkoutStats() {
  const weeklyWorkoutGoal = 5; // Weekly goal for workouts
  const weeklyHourGoal = 10; // Weekly goal for workout hours

  const { data: stats } = useQuery({
    queryKey: ["workoutStats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfWeekISO = startOfWeek.toISOString();

      const { count: totalWorkouts } = await supabase
        .from("workouts")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .gte("created_at", startOfWeekISO);

      const { data: workouts } = await supabase
        .from("workouts")
        .select("id, duration")
        .eq("user_id", user.id)
        .gte("created_at", startOfWeekISO);

      const totalHours = workouts?.reduce((acc, curr) => acc + (curr.duration / 60), 0) || 0;

      return {
        totalWorkouts: totalWorkouts || 0,
        totalHours: Math.round(totalHours),
      };
    },
  });

  const workoutProgress = Math.min((stats?.totalWorkouts / weeklyWorkoutGoal) * 100, 100);
  const workoutsRemaining = Math.max(weeklyWorkoutGoal - (stats?.totalWorkouts || 0), 0);

  const hourProgress = Math.min((stats?.totalHours / weeklyHourGoal) * 100, 100);
  const hoursRemaining = Math.max(weeklyHourGoal - (stats?.totalHours || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card className="p-6 w-full">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-red-100 rounded-full">
        <Activity className="w-6 h-6 text-red-500" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">Workouts This Week</p>
        <h4 className="text-2xl font-semibold">{stats?.totalWorkouts ?? "0"} / {weeklyWorkoutGoal}</h4>
        <Progress value={workoutProgress} className="h-2 mt-2" />
        <p className="text-xs text-gray-500 mt-1">
          {workoutsRemaining > 0 ? `${workoutsRemaining} workouts remaining` : `Goal reached!`}
        </p>
      </div>
    </div>
  </Card>

  <Card className="p-6 w-full">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-gray-100 rounded-full">
        <Timer className="w-6 h-6 text-gray-500" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">Hours This Week</p>
        <h4 className="text-2xl font-semibold">{stats?.totalHours ?? "0"} / {weeklyHourGoal}</h4>
        <Progress value={hourProgress} className="h-2 mt-2" />
        <p className="text-xs text-gray-500 mt-1">
          {hoursRemaining > 0 ? `${hoursRemaining} hours remaining` : `Goal reached!`}
        </p>
      </div>
    </div>
  </Card>

  <Card className="p-6 w-full">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-blue-100 rounded-full">
        <Activity className="w-6 h-6 text-blue-500" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">Calories Today</p>
        <h4 className="text-2xl font-semibold">132 / 2738</h4>
        <Progress value={5} className="h-2 mt-2" />
        <p className="text-xs text-gray-500 mt-1">2606 kcal remaining</p>
      </div>
    </div>
  </Card>
</div>

  );
}
