
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Utensils, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export function FoodTracker({ dailyCalories }: { dailyCalories: number }) {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [newFood, setNewFood] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  useEffect(() => {
    fetchFoodLogs();
  }, []);

  const fetchFoodLogs = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];

      // Fetch food logs for today
      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today);

      if (error) throw error;

      if (data) {
        setFoodItems(data.map(item => ({
          id: item.id,
          name: item.name,
          calories: item.calories,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fat: item.fat || 0,
        })));
      }
    } catch (error: any) {
      console.error("Error fetching food logs:", error);
      toast({
        variant: "destructive",
        title: "Failed to load food data",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addFoodItem = async () => {
    try {
      if (!newFood.name || !newFood.calories) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const foodItem = {
        user_id: user.id,
        name: newFood.name,
        calories: parseInt(newFood.calories),
        protein: parseFloat(newFood.protein) || null,
        carbs: parseFloat(newFood.carbs) || null,
        fat: parseFloat(newFood.fat) || null,
      };

      const { data, error } = await supabase
        .from("food_logs")
        .insert(foodItem)
        .select()
        .single();

      if (error) throw error;

      setFoodItems([...foodItems, {
        id: data.id,
        name: data.name,
        calories: data.calories,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
      }]);

      setNewFood({
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
      });

      toast({
        title: "Food added",
        description: `${foodItem.name} has been added to your food log.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding food",
        description: error.message,
      });
    }
  };

  const removeFoodItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("food_logs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFoodItems(foodItems.filter(item => item.id !== id));
      
      toast({
        title: "Food removed",
        description: "Item has been removed from your food log.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error removing food",
        description: error.message,
      });
    }
  };

  const calculateNutrition = (): NutritionSummary => {
    return foodItems.reduce(
      (sum, item) => ({
        totalCalories: sum.totalCalories + item.calories,
        totalProtein: sum.totalProtein + item.protein,
        totalCarbs: sum.totalCarbs + item.carbs,
        totalFat: sum.totalFat + item.fat,
      }),
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
    );
  };

  const nutrition = calculateNutrition();
  const caloriesRemaining = dailyCalories - nutrition.totalCalories;
  const calorieProgress = (nutrition.totalCalories / dailyCalories) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5" />
          Food Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calories Progress */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Daily Calories</span>
            <span className="text-sm">
              {nutrition.totalCalories} / {dailyCalories} kcal
            </span>
          </div>
          <Progress value={Math.min(calorieProgress, 100)} />
          <div className="text-sm text-right">
            {caloriesRemaining > 0
              ? `${caloriesRemaining} kcal remaining`
              : `${Math.abs(caloriesRemaining)} kcal over limit`}
          </div>
        </div>

        {/* Macronutrients Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-lg font-bold dark:text-gray-700">{nutrition.totalProtein}g</div>
            <div className="text-xs text-gray-500">Protein</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="text-lg font-bold dark:text-gray-700">{nutrition.totalCarbs}g</div>
            <div className="text-xs text-gray-500">Carbs</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded">
            <div className="text-lg font-bold dark:text-gray-700">{nutrition.totalFat}g</div>
            <div className="text-xs text-gray-500">Fat</div>
          </div>
        </div>

        {/* Food Log */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Today's Food</h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : foodItems.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-4">
              No food items tracked yet
            </div>
          ) : (
            <div className="space-y-2">
              {foodItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded  dark:bg-gray-800"
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-black">
                      {item.calories} kcal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFoodItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Food Form */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium">Add Food</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label htmlFor="food-name" className="text-xs">Food Name</Label>
              <Input
                id="food-name"
                value={newFood.name}
                onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                placeholder="e.g. Chicken Breast"
              />
            </div>
            <div>
              <Label htmlFor="calories" className="text-xs">Calories (kcal)</Label>
              <Input
                id="calories"
                type="number"
                value={newFood.calories}
                onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })}
                placeholder="165"
              />
            </div>
            <div>
              <Label htmlFor="protein" className="text-xs">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={newFood.protein}
                onChange={(e) => setNewFood({ ...newFood, protein: e.target.value })}
                placeholder="31"
              />
            </div>
            <div>
              <Label htmlFor="carbs" className="text-xs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={newFood.carbs}
                onChange={(e) => setNewFood({ ...newFood, carbs: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="fat" className="text-xs">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                value={newFood.fat}
                onChange={(e) => setNewFood({ ...newFood, fat: e.target.value })}
                placeholder="3.6"
              />
            </div>
          </div>
          <Button onClick={addFoodItem} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Food
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
