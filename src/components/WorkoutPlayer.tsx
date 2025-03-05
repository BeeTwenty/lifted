
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkoutPlayer } from "@/hooks/useWorkoutPlayer";
import { ExerciseView } from "./workout-player/ExerciseView";
import { RestTimer } from "./workout-player/RestTimer";
import { WorkoutComplete } from "./workout-player/WorkoutComplete";

interface WorkoutPlayerProps {
  workoutId: string | null;
  onClose: () => void;
}

export const WorkoutPlayer = ({ workoutId, onClose }: WorkoutPlayerProps) => {
  const playerState = useWorkoutPlayer(workoutId, onClose);
  const { loading, completed, isResting } = playerState;

  return (
    <Dialog open={!!workoutId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-w-[95%] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-center sm:text-left">{playerState.workout?.title || "Workout"}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-6 sm:py-10 text-center">Loading workout...</div>
        ) : completed ? (
          <WorkoutComplete playerState={playerState} />
        ) : isResting ? (
          <RestTimer playerState={playerState} />
        ) : (
          <ExerciseView playerState={playerState} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
};
