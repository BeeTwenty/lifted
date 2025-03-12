
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
  status?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripeProductId: string;
  stripePriceId: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  created_at?: string;
  stripe_payment_id?: string;
  stripe_customer_id?: string;
}
