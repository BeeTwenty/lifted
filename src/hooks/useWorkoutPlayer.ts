
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
  notes: string | null;
  rest_time: number | null;
  media_url?: string | null;
}

interface Workout {
  id: string;
  title: string;
  exercises: Exercise[];
  default_rest_time: number;
  duration: number;
}

export function useWorkoutPlayer(workoutId: string | null, onClose: () => void) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [workoutNotes, setWorkoutNotes] = useState<string>("");
  const [editedWeight, setEditedWeight] = useState<number | null>(null);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (workoutId) {
      fetchWorkout(workoutId);
      setStartTime(new Date());
    }
  }, [workoutId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isResting && restTimeRemaining > 0 && !isPaused) {
      timer = setTimeout(() => {
        setRestTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (isResting && restTimeRemaining <= 0) {
      setIsResting(false);
      nextSet();
    }
    
    return () => clearTimeout(timer);
  }, [isResting, restTimeRemaining, isPaused]);

  useEffect(() => {
    if (workout && workout.exercises.length > 0) {
      const currentExercise = workout.exercises[currentExerciseIndex];
      if (currentExercise) {
        setEditedWeight(currentExercise.weight);
      }
    }
  }, [currentExerciseIndex, workout]);

  const fetchWorkout = async (id: string) => {
    setLoading(true);
    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .select("id, title, default_rest_time, duration")
        .eq("id", id)
        .single();

      if (workoutError) throw workoutError;

      const { data: exercisesData, error: exercisesError } = await supabase
        .from("exercises")
        .select(`
          id, 
          name, 
          sets, 
          reps, 
          weight, 
          notes, 
          rest_time
        `)
        .eq("workout_id", id)
        .order("id");

      if (exercisesError) throw exercisesError;

      const exercisesWithMedia = await Promise.all(
        exercisesData.map(async (exercise) => {
          const { data: templateData, error: templateError } = await supabase
            .from("exercise_templates")
            .select("media_url")
            .eq("name", exercise.name)
            .maybeSingle();

          if (templateError) console.error("Error fetching template:", templateError);
          
          return {
            ...exercise,
            media_url: templateData?.media_url || null
          };
        })
      );

      setWorkout({
        id: workoutData.id,
        title: workoutData.title,
        exercises: exercisesWithMedia,
        default_rest_time: workoutData.default_rest_time || 60,
        duration: workoutData.duration
      });

      setCurrentExerciseIndex(0);
      setCurrentSetIndex(0);
      setCompleted(false);
      setIsResting(false);
      setRestTimeRemaining(0);
      setIsPaused(false);
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

  const handleComplete = async () => {
    if (!workout || !startTime) return;
    
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Updated to include notes
      const { error } = await supabase
        .from("completed_workouts")
        .insert({
          user_id: user.id,
          workout_id: workout.id,
          duration: durationMinutes,
          notes: workoutNotes || null
        });
        
      if (error) throw error;
      
      // Also insert workout_muscles records
      const { data: exercisesData } = await supabase
        .from("exercises")
        .select("name")
        .eq("workout_id", workout.id);
        
      if (exercisesData && exercisesData.length > 0) {
        // Get unique exercise names
        const exerciseNames = [...new Set(exercisesData.map(e => e.name))];
        
        // Get target muscles for these exercises
        const { data: templateData } = await supabase
          .from("exercise_templates")
          .select("target_muscle")
          .in("name", exerciseNames)
          .not("target_muscle", "is", null);
          
        if (templateData && templateData.length > 0) {
          // Get unique muscle names
          const muscleNames = [...new Set(templateData.map(t => t.target_muscle))];
          
          // Insert workout_muscles records
          for (const muscleName of muscleNames) {
            if (muscleName) {
              await supabase
                .from("workout_muscles")
                .insert({
                  workout_id: workout.id,
                  muscle_name: muscleName
                });
            }
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["workoutStats"] });
      
      toast({
        title: "Workout completed!",
        description: `Great job completing your workout in ${durationMinutes} minutes.`,
      });
    } catch (error: any) {
      console.error("Error recording workout completion:", error);
      toast({
        variant: "destructive",
        title: "Error recording completion",
        description: error.message,
      });
    }
    
    onClose();
  };

  const updateExerciseWeight = async () => {
    if (!workout || editedWeight === null) return;
    
    try {
      const exercise = workout.exercises[currentExerciseIndex];
      
      const { error } = await supabase
        .from("exercises")
        .update({ weight: editedWeight })
        .eq("id", exercise.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedExercises = [...workout.exercises];
      updatedExercises[currentExerciseIndex] = {
        ...updatedExercises[currentExerciseIndex],
        weight: editedWeight
      };
      
      setWorkout({
        ...workout,
        exercises: updatedExercises
      });
      
      setIsEditingWeight(false);
      
      toast({
        title: "Weight updated",
        description: `Set weight to ${editedWeight} kg for ${exercise.name}`,
      });
    } catch (error: any) {
      console.error("Error updating weight:", error);
      toast({
        variant: "destructive",
        title: "Error updating weight",
        description: error.message,
      });
    }
  };

  const nextSet = () => {
    if (!workout || !currentExercise) return;
    
    if (currentSetIndex < currentExercise.sets - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
    } else {
      if (currentExerciseIndex < workout.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSetIndex(0);
      } else {
        setCompleted(true);
      }
    }
  };

  const startRest = () => {
    if (!workout || !currentExercise) return;
    
    const restTime = currentExercise.rest_time || workout.default_rest_time || 60;
    setRestTimeRemaining(restTime);
    setIsResting(true);
    setIsPaused(false);
  };

  const skipRest = () => {
    setIsResting(false);
    nextSet();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetWorkout = () => {
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    setCompleted(false);
    setIsResting(false);
    setRestTimeRemaining(0);
    setIsPaused(false);
    setStartTime(new Date());
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentExercise = workout?.exercises[currentExerciseIndex];
  const totalExercises = workout?.exercises.length || 0;
  const totalSets = currentExercise?.sets || 0;
  const progress = totalExercises > 0 
    ? ((currentExerciseIndex / totalExercises) * 100) + 
      ((currentSetIndex / totalSets) * (100 / totalExercises))
    : 0;

  return {
    workout,
    loading,
    completed,
    currentExercise,
    currentExerciseIndex,
    currentSetIndex,
    isResting,
    restTimeRemaining,
    isPaused,
    progress,
    workoutNotes,
    editedWeight,
    isEditingWeight,
    totalExercises,
    totalSets,
    handleComplete,
    updateExerciseWeight,
    nextSet,
    startRest,
    skipRest,
    togglePause,
    resetWorkout,
    formatTime,
    setWorkoutNotes,
    setEditedWeight,
    setIsEditingWeight
  };
}

export type UseWorkoutPlayerReturn = ReturnType<typeof useWorkoutPlayer>;
export type { Exercise, Workout };
