
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ExerciseTemplateCardProps {
  name: string;
  description: string;
  mediaUrl: string;
  targetMuscle: string;
  onAdd: (sets: number, reps: number, weight: number | null) => void;
}

export function ExerciseTemplateCard({ name, description, mediaUrl, targetMuscle, onAdd }: ExerciseTemplateCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState<number | null>(null);

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative">
        <img 
          src={mediaUrl} 
          alt={`${name} demonstration`} 
          className="object-cover w-full h-full"
        />
      </div>
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground">{targetMuscle}</p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setShowDetails(!showDetails)}>
              <Info className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => onAdd(sets, reps, weight)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-2 text-sm text-gray-600">
            <p>{description}</p>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div>
            <label htmlFor={`sets-${name}`} className="text-xs text-gray-500 block">Sets</label>
            <Input
              id={`sets-${name}`}
              type="number"
              min="1"
              value={sets}
              onChange={(e) => setSets(Number(e.target.value))}
              className="h-8"
            />
          </div>
          <div>
            <label htmlFor={`reps-${name}`} className="text-xs text-gray-500 block">Reps</label>
            <Input
              id={`reps-${name}`}
              type="number"
              min="1"
              value={reps}
              onChange={(e) => setReps(Number(e.target.value))}
              className="h-8"
            />
          </div>
          <div>
            <label htmlFor={`weight-${name}`} className="text-xs text-gray-500 block">Weight (kg)</label>
            <Input
              id={`weight-${name}`}
              type="number"
              min="0"
              value={weight || ""}
              onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : null)}
              className="h-8"
              placeholder="Optional"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
