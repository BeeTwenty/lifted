
// Database functions for workout completions

export const setupWorkoutFunctions = async (supabase: any) => {
  // Create function to record completed workouts
  await supabase.rpc('create_record_completed_workout_function');
  
  // Create function to get completed workouts since a date
  await supabase.rpc('create_get_completed_workouts_function');
};
