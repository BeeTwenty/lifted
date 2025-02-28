
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Utensils, Plus, Trash2 } from "lucide-react";

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
  const [newFood, setNewFood] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const addFoodItem = () => {
    if (!newFood.name || !newFood.calories) return;

    const foodItem: FoodItem = {
      id: Date.now().toString(),
      name: newFood.name,
      calories: parseFloat(newFood.calories),
      protein: parseFloat(newFood.protein) || 0,
      carbs: parseFloat(newFood.carbs) || 0,
      fat: parseFloat(newFood.fat) || 0,
    };

    setFoodItems([...foodItems, foodItem]);
    setNewFood({
      name: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    });
  };

  const removeFoodItem = (id: string) => {
    setFoodItems(foodItems.filter(item => item.id !== id));
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
            <div className="text-lg font-bold">{nutrition.totalProtein}g</div>
            <div className="text-xs text-gray-500">Protein</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="text-lg font-bold">{nutrition.totalCarbs}g</div>
            <div className="text-xs text-gray-500">Carbs</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded">
            <div className="text-lg font-bold">{nutrition.totalFat}g</div>
            <div className="text-xs text-gray-500">Fat</div>
          </div>
        </div>

        {/* Food Log */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Today's Food</h3>
          {foodItems.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-4">
              No food items tracked yet
            </div>
          ) : (
            <div className="space-y-2">
              {foodItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">
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
