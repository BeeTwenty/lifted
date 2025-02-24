
import { Card } from "@/components/ui/card";
import { Activity, Timer } from "lucide-react";

interface WorkoutCardProps {
  title: string;
  duration: string;
  exercises: number;
  onClick?: () => void;
}

export function WorkoutCard({ title, duration, exercises, onClick }: WorkoutCardProps) {
  return (
    <Card 
      onClick={onClick}
      className="p-6 hover:shadow-lg transition-shadow cursor-pointer animate-fade-up"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Timer size={16} />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity size={16} />
              <span>{exercises} exercises</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
