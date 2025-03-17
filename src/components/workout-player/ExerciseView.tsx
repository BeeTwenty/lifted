
import { RotateCcw, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExerciseMedia } from "./ExerciseMedia";
import { UseWorkoutPlayerReturn } from "@/hooks/useWorkoutPlayer";
import { Badge } from "@/components/ui/badge";

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
    p2fEnabled,
    isLastSet,
    setEditedWeight,
    setIsEditingWeight,
    updateExerciseWeight,
    startRest,
    resetWorkout,
    formatTime,
    displayWeight
  } = playerState;

  return (
    <div className="py-2 sm:py-6 space-y-3 sm:space-y-6">
      <Progress value={progress} className="h-1.5 sm:h-2" />
      
      <div className="space-y-2 sm:space-y-4">
        <div className="text-center flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <h2 className="text-base sm:text-xl font-semibold">{currentExercise?.name}</h2>
            <ExerciseMedia exercise={currentExercise} />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Exercise {currentExerciseIndex + 1}/{totalExercises}
          </p>
        </div>
        
        <Card>
          <CardContent className="p-2 sm:p-4 text-center">
            <div className="text-xl sm:text-3xl font-bold">{currentExercise?.reps}</div>
            <div className="text-2xs sm:text-sm font-medium uppercase text-muted-foreground">Reps</div>
          </CardContent>
        </Card>
        
        <div className="flex justify-between items-center px-1 sm:px-2">
          <div className="text-center">
            <div className="text-sm sm:text-lg font-medium">{currentSetIndex + 1}</div>
            <div className="text-2xs text-muted-foreground">Current Set</div>
          </div>
          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-muted rounded-full"></div>
          <div className="text-center">
            <div className="text-sm sm:text-lg font-medium">{currentExercise?.sets}</div>
            <div className="text-2xs text-muted-foreground">Total Sets</div>
          </div>
          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-muted rounded-full"></div>
          <div className="text-center relative">
            {isEditingWeight ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <Input
                  type="number"
                  value={editedWeight || 0}
                  onChange={(e) => setEditedWeight(Number(e.target.value))}
                  className="w-14 sm:w-20 h-6 sm:h-8 text-center text-xs sm:text-sm px-1"
                  min="0"
                  step="0.5"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 sm:h-8 sm:w-8 p-0.5 sm:p-1" 
                  onClick={updateExerciseWeight}
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="text-sm sm:text-lg font-medium flex items-center gap-1">
                  {displayWeight()}
                  {p2fEnabled && isLastSet && (
                    <Badge variant="outline" className="text-2xs px-1 py-0 bg-primary/10">
                      P2F
                    </Badge>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 sm:h-6 sm:w-6 p-0 sm:p-0.5" 
                    onClick={() => setIsEditingWeight(true)}
                  >
                    <Edit2 className="h-2 w-2 sm:h-3 sm:w-3" />
                  </Button>
                </div>
                <div className="text-2xs text-muted-foreground">Weight (kg)</div>
              </>
            )}
          </div>
        </div>
        
        {currentExercise?.notes && (
          <div className="rounded-md bg-muted p-1.5 sm:p-3 text-2xs sm:text-sm">
            <p className="font-medium">Notes:</p>
            <p>{currentExercise.notes}</p>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Button className="w-full text-xs sm:text-base py-1.5 h-auto sm:h-10" onClick={startRest}>
          Complete Set & Rest ({formatTime(currentExercise?.rest_time || 60)})
        </Button>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="flex-1 text-xs sm:text-sm py-1 h-auto sm:h-9"
            onClick={resetWorkout}
          >
            <RotateCcw className="mr-1 sm:mr-2 h-2.5 w-2.5 sm:h-4 sm:w-4" />
            Reset
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 text-xs sm:text-sm py-1 h-auto sm:h-9"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
