
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
    <div className="py-6 space-y-6">
      <Progress value={progress} className="h-2" />
      
      <div className="space-y-4">
        <div className="text-center flex justify-center items-center gap-2">
          <h2 className="text-xl font-semibold">{currentExercise?.name}</h2>
          <ExerciseMedia exercise={currentExercise} />
          <p className="text-muted-foreground">
            Exercise {currentExerciseIndex + 1}/{totalExercises}
          </p>
        </div>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{currentExercise?.reps}</div>
            <div className="text-sm font-medium uppercase text-muted-foreground">Reps</div>
          </CardContent>
        </Card>
        
        <div className="flex justify-between items-center px-2">
          <div className="text-center">
            <div className="text-lg font-medium">{currentSetIndex + 1}</div>
            <div className="text-xs text-muted-foreground">Current Set</div>
          </div>
          <div className="h-2 w-2 bg-muted rounded-full"></div>
          <div className="text-center">
            <div className="text-lg font-medium">{currentExercise?.sets}</div>
            <div className="text-xs text-muted-foreground">Total Sets</div>
          </div>
          <div className="h-2 w-2 bg-muted rounded-full"></div>
          <div className="text-center relative">
            {isEditingWeight ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={editedWeight || 0}
                  onChange={(e) => setEditedWeight(Number(e.target.value))}
                  className="w-20 h-8 text-center"
                  min="0"
                  step="0.5"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={updateExerciseWeight}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="text-lg font-medium flex items-center gap-1">
                  {currentExercise?.weight || 0}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setIsEditingWeight(true)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">Weight (kg)</div>
              </>
            )}
          </div>
        </div>
        
        {currentExercise?.notes && (
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium">Notes:</p>
            <p>{currentExercise.notes}</p>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Button className="w-full" onClick={startRest}>
          Complete Set & Rest ({formatTime(currentExercise?.rest_time || 60)})
        </Button>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={resetWorkout}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
