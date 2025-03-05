
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkoutPlayer } from "@/hooks/useWorkoutPlayer";
import { ExerciseView } from "./workout-player/ExerciseView";
import { RestTimer } from "./workout-player/RestTimer";
import { WorkoutComplete } from "./workout-player/WorkoutComplete";
import { useIsMobile } from "@/hooks/use-mobile";

interface WorkoutPlayerProps {
  workoutId: string | null;
  onClose: () => void;
}

export const WorkoutPlayer = ({ workoutId, onClose }: WorkoutPlayerProps) => {
  const playerState = useWorkoutPlayer(workoutId, onClose);
  const { loading, completed, isResting } = playerState;
  const isMobile = useIsMobile();

  return (
    <Dialog open={!!workoutId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`sm:max-w-[500px] max-w-full ${isMobile ? 'p-3' : 'p-4'} sm:p-6 rounded-lg`}>
        <DialogHeader className="pb-1 sm:pb-2">
          <DialogTitle className="text-center sm:text-left text-base sm:text-xl">
            {playerState.workout?.title || "Workout"}
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-4 sm:py-10 text-center text-sm sm:text-base">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
            <p>Loading workout...</p>
          </div>
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
