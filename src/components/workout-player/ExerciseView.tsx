
import { RotateCcw, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExerciseMedia } from "./ExerciseMedia";
import { UseWorkoutPlayerReturn } from "@/hooks/useWorkoutPlayer";

interface ExerciseViewProps {
  playerState: UseWorkoutPlayerReturn;
  onClose: () => void;
}

export function ExerciseView({ playerState, onClose }: ExerciseViewProps) {
  const {
    currentExercise,
    progress,
    currentExerciseIndex,
    currentSetIndex,
    totalExercises,
    totalSets,
    editedWeight,
    isEditingWeight,
    setEditedWeight,
    setIsEditingWeight,
    updateExerciseWeight,
    startRest,
    resetWorkout,
    formatTime
  } = playerState;

  return (
    <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
      <Progress value={progress} className="h-2" />
      
      <div className="space-y-3 sm:space-y-4">
        <div className="text-center flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <h2 className="text-lg sm:text-xl font-semibold">{currentExercise?.name}</h2>
            <ExerciseMedia exercise={currentExercise} />
          </div>
          <p className="text-sm text-muted-foreground">
            Exercise {currentExerciseIndex + 1}/{totalExercises}
          </p>
        </div>
        
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold">{currentExercise?.reps}</div>
            <div className="text-xs sm:text-sm font-medium uppercase text-muted-foreground">Reps</div>
          </CardContent>
        </Card>
        
        <div className="flex justify-between items-center px-1 sm:px-2">
          <div className="text-center">
            <div className="text-base sm:text-lg font-medium">{currentSetIndex + 1}</div>
            <div className="text-xs text-muted-foreground">Current Set</div>
          </div>
          <div className="h-2 w-2 bg-muted rounded-full"></div>
          <div className="text-center">
            <div className="text-base sm:text-lg font-medium">{currentExercise?.sets}</div>
            <div className="text-xs text-muted-foreground">Total Sets</div>
          </div>
          <div className="h-2 w-2 bg-muted rounded-full"></div>
          <div className="text-center relative">
            {isEditingWeight ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <Input
                  type="number"
                  value={editedWeight || 0}
                  onChange={(e) => setEditedWeight(Number(e.target.value))}
                  className="w-16 sm:w-20 h-7 sm:h-8 text-center text-sm"
                  min="0"
                  step="0.5"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 sm:h-8 sm:w-8" 
                  onClick={updateExerciseWeight}
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="text-base sm:text-lg font-medium flex items-center gap-1">
                  {currentExercise?.weight || 0}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 sm:h-6 sm:w-6" 
                    onClick={() => setIsEditingWeight(true)}
                  >
                    <Edit2 className="h-2 w-2 sm:h-3 sm:w-3" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">Weight (kg)</div>
              </>
            )}
          </div>
        </div>
        
        {currentExercise?.notes && (
          <div className="rounded-md bg-muted p-2 sm:p-3 text-xs sm:text-sm">
            <p className="font-medium">Notes:</p>
            <p>{currentExercise.notes}</p>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Button className="w-full text-sm sm:text-base" onClick={startRest}>
          Complete Set & Rest ({formatTime(currentExercise?.rest_time || 60)})
        </Button>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="flex-1 text-sm"
            onClick={resetWorkout}
          >
            <RotateCcw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Reset
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 text-sm"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
