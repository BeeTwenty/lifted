
import { Card } from "@/components/ui/card";
import { Activity, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkoutCardProps {
  title: string;
  duration: string;
  exercises: number;
  onClick?: () => void;
  onDelete?: () => void;
}

export function WorkoutCard({ title, duration, exercises, onClick, onDelete }: WorkoutCardProps) {
  return (
    <Card 
      className="p-6 hover:shadow-lg transition-shadow animate-fade-up"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Activity size={16} />
              <span>{exercises} exercises</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={onClick}>
            <Play size={16} className="mr-1" />
            Start
          </Button>
          {onDelete && (
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}>
              <Trash2 size={16} className="mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
