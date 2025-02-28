
import { Card } from "@/components/ui/card";
import { Activity, Timer, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkoutCardProps {
  title: string;
  duration: string;
  exercises: number;
  onClick?: () => void;
}

export function WorkoutCard({ title, duration, exercises, onClick }: WorkoutCardProps) {
  return (
    <Card 
      className="p-6 hover:shadow-lg transition-shadow animate-fade-up"
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
        <Button variant="outline" size="sm" onClick={onClick}>
          <Play size={16} className="mr-1" />
          Start
        </Button>
      </div>
    </Card>
  );
}
