
import { api } from "../config";
import type { Database } from "@/integrations/supabase/types";

type FoodLog = Database["public"]["Tables"]["food_logs"]["Row"];

export const foodService = {
  async getTodaysFoodLogs() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await api.supabase
      .from("food_logs")
      .select("*")
      .eq("date", today);

    if (error) throw error;
    return data;
  },

  async addFoodLog(food: Omit<FoodLog, "id" | "created_at">) {
    const { data, error } = await api.supabase
      .from("food_logs")
      .insert(food)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFoodLog(id: string) {
    const { error } = await api.supabase
      .from("food_logs")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
