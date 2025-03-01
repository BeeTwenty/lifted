
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExerciseTemplateCardProps {
  name: string;
  description: string;
  mediaUrl: string;
  targetMuscle: string;
  onAdd: (sets: number, reps: number, weight: number | null) => void;
}

// Function to check if the media URL is a YouTube link
const isYouTubeLink = (url: string): boolean => {
  return url.includes("youtube.com") || url.includes("youtu.be");
};

// Function to extract the YouTube video ID
const extractYouTubeID = (url: string): string | null => {
  const regex = /(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};


export function ExerciseTemplateCard({ name, description, mediaUrl, targetMuscle, onAdd }: ExerciseTemplateCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState<number | null>(null);

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        {mediaUrl ? (
          isYouTubeLink(mediaUrl) ? (
            <iframe 
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${extractYouTubeID(mediaUrl)}`}
              title="Exercise Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <img 
              src={mediaUrl} 
              alt={name} 
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-muted-foreground">No media available</p>
          </div>
        )}
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
            <Label htmlFor={`sets-${name}`} className="text-xs text-gray-500">Sets</Label>
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
            <Label htmlFor={`reps-${name}`} className="text-xs text-gray-500">Reps</Label>
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
            <Label htmlFor={`weight-${name}`} className="text-xs text-gray-500">Weight (kg)</Label>
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
