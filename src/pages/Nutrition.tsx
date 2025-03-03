import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FoodTracker } from "@/components/FoodTracker";

const Nutrition = () => {
  const { toast } = useToast();
  const [dailyCalories, setDailyCalories] = useState<number>(2000);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNutritionData();
  }, []);

  const fetchNutritionData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Get user's saved calorie target if it exists
      const { data, error } = await supabase
        .from("profiles")
        .select("daily_calories")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data && data.daily_calories) {
        setDailyCalories(data.daily_calories);
      }
    } catch (error: any) {
      console.error("Error fetching nutrition data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold">Nutrition Tracker</h1>
            <p className="text-gray-500 mt-2">Manage your daily calories and macros</p>
          </div>
          <Link to="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
          </div>
        ) : (
          <div className="">
            <FoodTracker dailyCalories={dailyCalories} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Nutrition;
