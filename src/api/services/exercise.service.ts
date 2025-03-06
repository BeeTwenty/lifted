
import { api } from "../config";
import type { Database } from "@/integrations/supabase/types";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

export const exerciseService = {
  async getExerciseTemplates() {
    const { data, error } = await api.supabase
      .from("exercise_templates")
      .select("*");

    if (error) throw error;
    return data;
  },

  async getExerciseHistory(exerciseName: string) {
    const { data: workoutIds, error: workoutIdsError } = await api.supabase
      .from("workouts")
      .select("id");
      
    if (workoutIdsError) throw workoutIdsError;
    
    if (!workoutIds || workoutIds.length === 0) {
      return [];
    }

    const { data: exercisesData, error: exercisesError } = await api.supabase
      .from("exercises")
      .select(`
        name,
        weight,
        reps,
        sets,
        workout_id
      `)
      .eq("name", exerciseName)
      .in("workout_id", workoutIds.map(w => w.id));

    if (exercisesError) throw exercisesError;
    return exercisesData;
  },
};
