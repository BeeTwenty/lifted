
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
  notes: string | null;
  rest_time?: number | null;
  order?: number;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  description: string;
  target_muscle: string;
  media_url: string;
}

// Add new types for weight tracking
export interface WeightRecord {
  id: string;
  user_id: string;
  weight: number;
  date: string;
  notes?: string | null;
}

export interface UserProfile {
  id?: string;
  username?: string;
  avatar_url?: string;
  full_name?: string;
  daily_calories?: number;
  workout_goal?: number;
  hour_goal?: number;
  height?: number;
  updated_at?: string;
}
