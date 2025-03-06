
import { api } from "../config";
import type { Database } from "@/integrations/supabase/types";

type Workout = Database["public"]["Tables"]["workouts"]["Row"];
type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

export const workoutService = {
  async getWorkouts() {
    const { data, error } = await api.supabase
      .from("workouts")
      .select(`
        *,
        exercises (count)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getWorkoutById(id: string) {
    const { data, error } = await api.supabase
      .from("workouts")
      .select(`
        *,
        exercises (*)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createWorkout(workout: Omit<Workout, "id" | "created_at">) {
    const { data, error } = await api.supabase
      .from("workouts")
      .insert(workout)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteWorkout(id: string) {
    const { error } = await api.supabase
      .from("workouts")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
