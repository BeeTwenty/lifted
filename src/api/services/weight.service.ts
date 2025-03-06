
import { api } from "../config";
import type { Database } from "@/integrations/supabase/types";

type WeightRecord = Database["public"]["Tables"]["weight_records"]["Row"];

export const weightService = {
  async getWeightHistory() {
    const { data, error } = await api.supabase
      .from("weight_records")
      .select("*")
      .order("date", { ascending: true });

    if (error) throw error;
    return data;
  },

  async addWeightRecord(weight: number) {
    const { data, error } = await api.supabase
      .from("weight_records")
      .insert({ weight })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
