
import { Card } from "@/components/ui/card";
import { Activity, Timer, Flame, Calendar, Lock, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { startOfWeek } from "date-fns";
import { calculateCurrentStreak, calculateWeeklyStreak } from "@/lib/export-utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type CompletedWorkout = {
  id: string;
  workout_id: string;
  duration: number;
  completed_at: string;
};

export function WorkoutStats() {
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    checkProStatus();
  }, []);

  const checkProStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      setIsPro(data?.status === "pro");
    } catch (error: any) {
      console.error("Error checking pro status:", error.message);
    }
  };

  // Fetch user profile and workout stats
  const { data: userStats } = useQuery({
    queryKey: ["workoutStats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Get user profile to fetch goals
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("workout_goal, hour_goal")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const now = new Date();
      // Start week on Monday (1), not Sunday (0)
      const mondayOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
      const startOfWeekISO = mondayOfThisWeek.toISOString();

      // Get completed workouts this week
      const { data: completedWorkouts, error: completedError } = await supabase
        .rpc('get_completed_workouts_since', { start_date: startOfWeekISO });

      if (completedError) throw completedError;

      // Get all completed workouts for streak calculation
      const { data: allCompletedWorkouts, error: allCompletedError } = await supabase
        .from("completed_workouts")
        .select("completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      if (allCompletedError) throw allCompletedError;

      const totalWorkouts = completedWorkouts?.length || 0;
      // Calculate total hours from minutes and round to whole number
      const totalHours = completedWorkouts ? 
        Math.round(completedWorkouts.reduce((acc: number, curr: CompletedWorkout) => acc + (curr.duration / 60), 0)) : 0;

      // Calculate streaks
      const currentStreak = calculateCurrentStreak(allCompletedWorkouts || []);
      const weeklyStreak = calculateWeeklyStreak(allCompletedWorkouts || []);

      return {
        totalWorkouts,
        totalHours,
        workoutGoal: profile?.workout_goal || 5,
        hourGoal: profile?.hour_goal || 10,
        currentStreak,
        weeklyStreak
      };
    },
    enabled: isPro, // Only fetch data if user is Pro
  });

  const workoutGoal = userStats?.workoutGoal || 5;
  const hourGoal = userStats?.hourGoal || 10;
  
  const workoutProgress = Math.min(((userStats?.totalWorkouts || 0) / workoutGoal) * 100, 100);
  const workoutsRemaining = Math.max(workoutGoal - (userStats?.totalWorkouts || 0), 0);

  const hourProgress = Math.min(((userStats?.totalHours || 0) / hourGoal) * 100, 100);
  const hoursRemaining = Math.max(hourGoal - (userStats?.totalHours || 0), 0);

  // If not pro, show pro upgrade message
  if (!isPro) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
            <Lock className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Pro Feature</h3>
          <p className="mb-4 text-muted-foreground">
            Detailed workout statistics are available exclusively for Pro subscribers.
            Upgrade to Pro to track your workout progress, streaks, and achievements.
          </p>
          <Button asChild>
            <Link to="/?tab=subscription">
              <CreditCard className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-6 w-full">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-full">
            <Activity className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">Workouts This Week</p>
            <h4 className="text-2xl font-semibold">{userStats?.totalWorkouts ?? "0"} / {workoutGoal}</h4>
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
            <h4 className="text-2xl font-semibold">{userStats?.totalHours ?? "0"} / {hourGoal}</h4>
            <Progress value={hourProgress} className="h-2 mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              {hoursRemaining > 0 ? `${hoursRemaining} hours remaining` : `Goal reached!`}
            </p>
          </div>
        </div>
      </Card>

      {/* Daily Streak Card */}
      <Card className="p-6 w-full">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-full">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">Daily Streak</p>
            <h4 className="text-2xl font-semibold">{userStats?.currentStreak ?? "0"} days</h4>
            <p className="text-xs text-gray-500 mt-1">
              {userStats?.currentStreak ? 
                `You've worked out ${userStats.currentStreak} days in a row!` : 
                "Start your streak by completing a workout today!"}
            </p>
          </div>
        </div>
      </Card>

      {/* Weekly Streak Card */}
      <Card className="p-6 w-full">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">Weekly Streak</p>
            <h4 className="text-2xl font-semibold">{userStats?.weeklyStreak ?? "0"} weeks</h4>
            <p className="text-xs text-gray-500 mt-1">
              {userStats?.weeklyStreak ? 
                `You've worked out for ${userStats.weeklyStreak} consecutive weeks!` : 
                "Complete at least one workout this week to start your weekly streak!"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
