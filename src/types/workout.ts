
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
  notes: string | null;
  rest_time?: number | null;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  description: string;
  target_muscle: string;
  media_url: string;
}
