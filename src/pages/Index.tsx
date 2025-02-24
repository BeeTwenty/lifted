
import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/WorkoutCard";
import { WorkoutStats } from "@/components/WorkoutStats";
import { Dumbbell, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: recentWorkouts, isLoading } = useQuery({
    queryKey: ["recentWorkouts"],
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
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      return workouts.map(workout => ({
        id: workout.id,
        title: workout.title,
        duration: `${workout.duration} min`,
        exercises: workout.exercises[0].count,
      }));
    },
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

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold">Welcome back</h1>
            <p className="text-gray-500 mt-2">Track your fitness journey</p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-accent hover:bg-accent/90">
              <Dumbbell className="mr-2 h-4 w-4" />
              New Workout
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <section className="py-4">
          <WorkoutStats />
        </section>

        {/* Recent Workouts */}
        <section className="py-4">
          <h2 className="text-2xl font-semibold mb-4">Recent Workouts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
              ))
            ) : recentWorkouts?.length ? (
              recentWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  title={workout.title}
                  duration={workout.duration}
                  exercises={workout.exercises}
                  onClick={() => console.log(`Clicked workout ${workout.id}`)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No workouts yet. Start by creating your first workout!
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
