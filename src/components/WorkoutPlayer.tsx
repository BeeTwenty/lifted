import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronRight, X, Save, CheckCircle, Timer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";

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
  const [editedSets, setEditedSets] = useState<number>(0);
  const [editedReps, setEditedReps] = useState<number>(0);
  const [editedWeight, setEditedWeight] = useState<number | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const intervalRef = useRef<number | null>(null);

  const currentExercise = exercises[currentExerciseIndex];

  useEffect(() => {
    if (workoutId) {
      fetchWorkoutDetails();
    }
  }, [workoutId]);

  useEffect(() => {
    if (currentExercise) {
      setEditedSets(currentExercise.sets);
      setEditedReps(currentExercise.reps);
      setEditedWeight(currentExercise.weight);
    }
  }, [currentExercise]);

  useEffect(() => {
    if (workout && !isActive) {
      setIsActive(true);
    }
  }, [workout]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const fetchWorkoutDetails = async () => {
    try {
      setLoading(true);
      
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", workoutId)
        .single();
      
      if (workoutError) throw workoutError;
      setWorkout(workoutData);
      
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

  const isYouTubeLink = (url: string): boolean => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  const extractYouTubeID = (url: string): string | null => {
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleNext = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      saveCurrentExerciseChanges().then(() => {
        setCurrentExerciseIndex(prev => prev + 1);
        fetchExerciseMedia(exercises[currentExerciseIndex + 1].name);
      });
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      saveCurrentExerciseChanges().then(() => {
        setCurrentExerciseIndex(prev => prev - 1);
        fetchExerciseMedia(exercises[currentExerciseIndex - 1].name);
      });
    }
  };

  const saveCurrentExerciseChanges = async () => {
    if (!currentExercise) return Promise.resolve();
    
    if (
      editedSets !== currentExercise.sets ||
      editedReps !== currentExercise.reps ||
      editedWeight !== currentExercise.weight
    ) {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("exercises")
          .update({
            sets: editedSets,
            reps: editedReps,
            weight: editedWeight
          })
          .eq("id", currentExercise.id);
        
        if (error) throw error;
        
        setExercises(exercises.map(ex => 
          ex.id === currentExercise.id 
            ? { ...ex, sets: editedSets, reps: editedReps, weight: editedWeight } 
            : ex
        ));
        
        toast({
          title: "Exercise updated",
          description: "Your changes have been saved.",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error saving changes",
          description: error.message,
        });
      } finally {
        setSaving(false);
      }
    }
    
    return Promise.resolve();
  };

  const handleSave = () => {
    saveCurrentExerciseChanges();
  };

  const handleFinishWorkout = async () => {
    try {
      setSaving(true);
      
      await saveCurrentExerciseChanges();
      
      setIsActive(false);
      
      const durationInMinutes = Math.ceil(timer / 60);
      
      const { error } = await supabase
        .from("workouts")
        .update({ duration: durationInMinutes })
        .eq("id", workoutId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["workoutStats"] });
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      
      toast({
        title: "Workout completed",
        description: `You finished the workout in ${formatTime(timer)}!`,
      });
      
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error finishing workout",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!workoutId) return null;

  return (
    <Dialog open={!!workoutId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{workout?.title || "Workout"}</span>
            <div className="flex items-center gap-2 text-sm font-normal">
              <Timer className="h-4 w-4" />
              <span>{formatTime(timer)}</span>
            </div>
          </DialogTitle>
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
            
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              {exerciseMedia ? (
                isYouTubeLink(exerciseMedia) ? (
                  <iframe 
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${extractYouTubeID(exerciseMedia)}`}
                    title="Exercise Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <img 
                    src={exerciseMedia} 
                    alt={currentExercise.name} 
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No media available</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{currentExercise.name}</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label htmlFor="edit-sets" className="text-sm font-medium">Sets</label>
                  <Input
                    id="edit-sets"
                    type="number"
                    value={editedSets}
                    min={1}
                    onChange={(e) => setEditedSets(parseInt(e.target.value) || 1)}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="edit-reps" className="text-sm font-medium">Reps</label>
                  <Input
                    id="edit-reps"
                    type="number"
                    value={editedReps}
                    min={1}
                    onChange={(e) => setEditedReps(parseInt(e.target.value) || 1)}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="edit-weight" className="text-sm font-medium">Weight (kg)</label>
                  <Input
                    id="edit-weight"
                    type="number"
                    value={editedWeight || ""}
                    min={0}
                    placeholder="Optional"
                    onChange={(e) => setEditedWeight(e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full"
                  />
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
              
              {currentExercise.notes && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Instructions:</h3>
                  <p className="text-sm">{currentExercise.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={handlePrevious}
                disabled={currentExerciseIndex === 0}
              >
                <ChevronLeft className="mr-1" />
                Previous
              </Button>
              
              {currentExerciseIndex === exercises.length - 1 ? (
                <Button 
                  variant="default" 
                  className="bg-green-600 hover:bg-green-700" 
                  onClick={handleFinishWorkout}
                  disabled={isSaving}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finish Workout
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                >
                  Next
                  <ChevronRight className="ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
