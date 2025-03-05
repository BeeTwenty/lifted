
import { Play, Pause, SkipForward, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UseWorkoutPlayerReturn } from "@/hooks/useWorkoutPlayer";

interface RestTimerProps {
  playerState: UseWorkoutPlayerReturn;
}

export function RestTimer({ playerState }: RestTimerProps) {
  const { 
    restTimeRemaining, 
    isPaused, 
    formatTime, 
    togglePause, 
    skipRest,
    currentExercise,
    currentSetIndex,
    workout,
    currentExerciseIndex
  } = playerState;

  return (
    <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-lg sm:text-xl font-semibold">Rest Time</h2>
        <div className="flex items-center justify-center space-x-2">
          <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
          <span className="text-2xl sm:text-3xl font-bold">{formatTime(restTimeRemaining)}</span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Next: {currentExercise?.name} - Set {currentSetIndex + 1 >= currentExercise?.sets ? 1 : currentSetIndex + 2}
          {currentSetIndex + 1 >= currentExercise?.sets && currentExerciseIndex < (workout?.exercises.length || 0) - 1 
            ? ` of ${workout?.exercises[currentExerciseIndex + 1].name}`
            : ''
          }
        </p>
      </div>
      
      <div className="flex justify-center space-x-3 sm:space-x-4">
        <Button 
          variant="outline" 
          size="icon"
          className="h-9 w-9 sm:h-10 sm:w-10"
          onClick={togglePause}
        >
          {isPaused ? <Play className="h-4 w-4 sm:h-5 sm:w-5" /> : <Pause className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>
        <Button onClick={skipRest} className="text-sm sm:text-base">
          <SkipForward className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Skip Rest
        </Button>
      </div>
    </div>
  );
}
