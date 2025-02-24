
import { Card } from "@/components/ui/card";
import { Activity, Dumbbell, Timer } from "lucide-react";

export function WorkoutStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-full">
            <Activity className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Workouts</p>
            <h4 className="text-2xl font-semibold">24</h4>
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
            <h4 className="text-2xl font-semibold">47</h4>
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
            <h4 className="text-2xl font-semibold">156</h4>
          </div>
        </div>
      </Card>
    </div>
  );
}
