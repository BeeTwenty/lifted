
import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/WorkoutCard";
import { WorkoutStats } from "@/components/WorkoutStats";
import { Dumbbell, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const recentWorkouts = [
    { id: 1, title: "Full Body Workout", duration: "45 min", exercises: 8 },
    { id: 2, title: "Upper Body Focus", duration: "30 min", exercises: 6 },
    { id: 3, title: "Leg Day", duration: "40 min", exercises: 7 },
  ];

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
            {recentWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                title={workout.title}
                duration={workout.duration}
                exercises={workout.exercises}
                onClick={() => console.log(`Clicked workout ${workout.id}`)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
