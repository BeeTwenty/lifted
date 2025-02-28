
import { Card } from "@/components/ui/card";
import { Utensils } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface NutritionStatProps {
  dailyCalories: number;
  consumedCalories: number;
}

export function NutritionStat({ dailyCalories, consumedCalories }: NutritionStatProps) {
  const calorieProgress = Math.min((consumedCalories / dailyCalories) * 100, 100);
  const caloriesRemaining = dailyCalories - consumedCalories;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <Utensils className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500">Calories Today</p>
          <div className="flex justify-between mt-1">
            <h4 className="text-2xl font-semibold">{consumedCalories} / {dailyCalories}</h4>
          </div>
          <Progress value={calorieProgress} className="h-2 mt-2" />
          <p className="text-xs text-gray-500 mt-1">
            {caloriesRemaining > 0
              ? `${caloriesRemaining} kcal remaining`
              : `${Math.abs(caloriesRemaining)} kcal over limit`}
          </p>
        </div>
      </div>
    </Card>
  );
}
