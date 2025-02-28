
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
  notes: string | null;
}

interface WorkoutPlayerProps {
  workoutId: string | null;
  onClose: () => void;
}

export function WorkoutPlayer({ workoutId, onClose }: WorkoutPlayerProps) {
  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exerciseMedia, setExerciseMedia] = useState<string | null>(null);
  const { toast } = useToast();

  const currentExercise = exercises[currentExerciseIndex];

  useEffect(() => {
    if (workoutId) {
      fetchWorkoutDetails();
    }
  }, [workoutId]);

  const fetchWorkoutDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch workout details
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", workoutId)
        .single();
      
      if (workoutError) throw workoutError;
      setWorkout(workoutData);
      
      // Fetch exercises for this workout
      const { data: exerciseData, error: exercisesError } = await supabase
        .from("exercises")
        .select("*")
        .eq("workout_id", workoutId)
        .order("id");
      
      if (exercisesError) throw exercisesError;
      setExercises(exerciseData as Exercise[]);
      
      if (exerciseData && exerciseData.length > 0) {
        fetchExerciseMedia(exerciseData[0].name);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading workout",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseMedia = async (exerciseName: string) => {
    try {
      const { data, error } = await supabase
        .from("exercise_templates")
        .select("media_url")
        .ilike("name", exerciseName)
        .single();
      
      if (error) throw error;
      setExerciseMedia(data.media_url);
    } catch (error) {
      console.error("Error fetching exercise media:", error);
      setExerciseMedia(null);
    }
  };

  const handleNext = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      fetchExerciseMedia(exercises[currentExerciseIndex + 1].name);
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      fetchExerciseMedia(exercises[currentExerciseIndex - 1].name);
    }
  };

  if (!workoutId) return null;

  return (
    <Dialog open={!!workoutId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workout?.title || "Workout"}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-10">
            <p>No exercises found in this workout.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center text-sm text-muted-foreground">
              Exercise {currentExerciseIndex + 1} of {exercises.length}
            </div>
            
            {/* Exercise Media */}
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              {exerciseMedia ? (
                <img 
                  src={exerciseMedia} 
                  alt={currentExercise.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
            </div>
            
            {/* Exercise Details */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{currentExercise.name}</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{currentExercise.sets}</div>
                  <div className="text-sm text-muted-foreground">Sets</div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{currentExercise.reps}</div>
                  <div className="text-sm text-muted-foreground">Reps</div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">
                    {currentExercise.weight || "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">Weight (kg)</div>
                </div>
              </div>
              
              {currentExercise.notes && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Instructions:</h3>
                  <p className="text-sm">{currentExercise.notes}</p>
                </div>
              )}
            </div>
            
            {/* Navigation Controls */}
            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={handlePrevious}
                disabled={currentExerciseIndex === 0}
              >
                <ChevronLeft className="mr-1" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                onClick={onClose}
              >
                <X className="mr-1" />
                Exit
              </Button>
              
              <Button 
                onClick={handleNext}
                disabled={currentExerciseIndex === exercises.length - 1}
              >
                Next
                <ChevronRight className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
