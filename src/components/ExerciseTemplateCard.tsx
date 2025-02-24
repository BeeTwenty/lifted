
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ExerciseTemplateCardProps {
  name: string;
  description: string;
  mediaUrl: string;
  targetMuscle: string;
  onAdd: () => void;
}

export function ExerciseTemplateCard({ name, description, mediaUrl, targetMuscle, onAdd }: ExerciseTemplateCardProps) {
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
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Card>
  );
}
