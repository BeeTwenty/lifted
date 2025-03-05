
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
    <div className="py-3 sm:py-10 text-center space-y-2 sm:space-y-4">
      <CheckCircle className="mx-auto h-10 w-10 sm:h-16 sm:w-16 text-primary" />
      <h2 className="text-lg sm:text-2xl font-bold">Workout Complete!</h2>
      <p className="text-xs sm:text-sm text-muted-foreground">Congratulations on finishing your workout.</p>
      
      <div className="space-y-1.5 sm:space-y-2 text-left">
        <Label htmlFor="workout-notes" className="text-xs sm:text-sm">Add notes about this workout (optional)</Label>
        <Textarea 
          id="workout-notes"
          placeholder="How did it feel? Any issues or progress?"
          value={workoutNotes}
          onChange={(e) => setWorkoutNotes(e.target.value)}
          className="min-h-[60px] sm:min-h-[100px] text-xs sm:text-sm"
        />
      </div>
      
      <div className="pt-1.5 sm:pt-4">
        <Button 
          onClick={handleComplete} 
          className="text-xs sm:text-base py-1.5 h-auto sm:h-10"
        >
          Finish & Save
        </Button>
      </div>
    </div>
  );
}
