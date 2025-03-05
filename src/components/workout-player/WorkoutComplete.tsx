
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UseWorkoutPlayerReturn } from "@/hooks/useWorkoutPlayer";

interface WorkoutCompleteProps {
  playerState: UseWorkoutPlayerReturn;
}

export function WorkoutComplete({ playerState }: WorkoutCompleteProps) {
  const { workoutNotes, setWorkoutNotes, handleComplete } = playerState;

  return (
    <div className="py-10 text-center space-y-4">
      <CheckCircle className="mx-auto h-16 w-16 text-primary" />
      <h2 className="text-2xl font-bold">Workout Complete!</h2>
      <p className="text-muted-foreground">Congratulations on finishing your workout.</p>
      
      <div className="space-y-2 text-left">
        <Label htmlFor="workout-notes">Add notes about this workout (optional)</Label>
        <Textarea 
          id="workout-notes"
          placeholder="How did it feel? Any issues or progress?"
          value={workoutNotes}
          onChange={(e) => setWorkoutNotes(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      
      <div className="pt-4">
        <Button onClick={handleComplete}>Finish & Save</Button>
      </div>
    </div>
  );
}
