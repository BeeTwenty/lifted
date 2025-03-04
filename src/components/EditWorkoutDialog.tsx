
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Save, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ExerciseTemplate } from "@/types/workout";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExerciseSearch } from "@/components/ExerciseSearch";

interface EditWorkoutDialogProps {
  workoutId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rest_time?: number;
  notes?: string;
}

interface Workout {
  id: string;
  title: string;
  duration: number;
  notes?: string;
  exercises: Exercise[];
}

export function EditWorkoutDialog({ workoutId, open, onOpenChange }: EditWorkoutDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  
  useEffect(() => {
    if (open && workoutId) {
      fetchWorkoutDetails();
      fetchExerciseTemplates();
    }
  }, [workoutId, open]);

  const fetchExerciseTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("exercise_templates")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error("Error fetching exercise templates:", error.message);
    }
  };

  const fetchWorkoutDetails = async () => {
    try {
      setIsLoading(true);
      
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .select("id, title, duration, notes")
        .eq("id", workoutId)
        .single();
      
      if (workoutError) throw workoutError;
      
      const { data: exercisesData, error: exercisesError } = await supabase
        .from("exercises")
        .select("id, name, sets, reps, weight, rest_time, notes")
        .eq("workout_id", workoutId);
      
      if (exercisesError) throw exercisesError;
      
      setWorkout({
        ...workoutData,
        exercises: exercisesData || []
      });
    } catch (error: any) {
      console.error("Error fetching workout details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load workout details"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkout = async () => {
    if (!workout) return;
    
    try {
      const { error: workoutError } = await supabase
        .from("workouts")
        .update({
          title: workout.title,
          duration: workout.duration,
          notes: workout.notes
        })
        .eq("id", workout.id);
      
      if (workoutError) throw workoutError;
      
      // Handle exercises - delete, update, insert as needed
      for (const exercise of workout.exercises) {
        if (exercise.id.startsWith('new-')) {
          // New exercise to insert
          const { error } = await supabase
            .from("exercises")
            .insert({
              workout_id: workout.id,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              rest_time: exercise.rest_time,
              notes: exercise.notes
            });
          
          if (error) throw error;
        } else {
          // Existing exercise to update
          const { error } = await supabase
            .from("exercises")
            .update({
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              rest_time: exercise.rest_time,
              notes: exercise.notes
            })
            .eq("id", exercise.id);
          
          if (error) throw error;
        }
      }
      
      toast({
        title: "Workout updated",
        description: "Your workout has been updated successfully."
      });
      
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating workout:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update workout"
      });
    }
  };

  const handleExerciseChange = (index: number, field: keyof Exercise, value: any) => {
    if (!workout) return;
    
    const newExercises = [...workout.exercises];
    newExercises[index] = {
      ...newExercises[index],
      [field]: field === 'sets' || field === 'reps' || field === 'weight' || field === 'rest_time'
        ? Number(value)
        : value
    };
    
    setWorkout({
      ...workout,
      exercises: newExercises
    });
  };

  const addNewExercise = () => {
    if (!workout) return;
    
    const newExercise: Exercise = {
      id: `new-${Date.now()}`,
      name: "",
      sets: 3,
      reps: 10,
      weight: 0,
      rest_time: 60
    };
    
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, newExercise]
    });
  };

  const addTemplateExercise = (template: ExerciseTemplate) => {
    if (!workout) return;
    
    const newExercise: Exercise = {
      id: `new-${Date.now()}`,
      name: template.name,
      sets: 3,
      reps: 10,
      weight: 0,
      rest_time: 60,
      notes: template.description
    };
    
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, newExercise]
    });
    
    toast({
      title: "Exercise added",
      description: `${template.name} has been added to your workout`
    });
  };

  const removeExercise = async (index: number) => {
    if (!workout) return;
    
    const exerciseToRemove = workout.exercises[index];
    const newExercises = workout.exercises.filter((_, i) => i !== index);
    
    setWorkout({
      ...workout,
      exercises: newExercises
    });
    
    // If it's an existing exercise (not a new one), delete it from the database
    if (!exerciseToRemove.id.startsWith('new-')) {
      try {
        const { error } = await supabase
          .from("exercises")
          .delete()
          .eq("id", exerciseToRemove.id);
        
        if (error) throw error;
        
        queryClient.invalidateQueries({ queryKey: ["routines"] });
      } catch (error: any) {
        console.error("Error deleting exercise:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete exercise"
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Workout</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : workout ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workoutTitle">Workout Title</Label>
                <Input
                  id="workoutTitle"
                  value={workout.title}
                  onChange={(e) => setWorkout({ ...workout, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workoutDuration">Duration (minutes)</Label>
                <Input
                  id="workoutDuration"
                  type="number"
                  min="1"
                  value={workout.duration}
                  onChange={(e) => setWorkout({ ...workout, duration: Number(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workoutNotes">Notes (optional)</Label>
              <Textarea
                id="workoutNotes"
                value={workout.notes || ""}
                onChange={(e) => setWorkout({ ...workout, notes: e.target.value })}
                placeholder="Any notes about this workout..."
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Exercises</h3>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Search className="h-4 w-4 mr-2" />
                        Add From Templates
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <div className="p-4">
                        <h4 className="font-medium mb-2">Search Exercise Templates</h4>
                        <ExerciseSearch 
                          templates={templates} 
                          onSelectTemplate={addTemplateExercise}
                          placeholder="Search by name or muscle..."
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Button onClick={addNewExercise} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manual
                  </Button>
                </div>
              </div>
              
              {workout.exercises.length === 0 ? (
                <div className="text-center py-4 text-gray-500 border rounded-md">
                  No exercises yet. Add your first exercise!
                </div>
              ) : (
                <div className="space-y-4">
                  {workout.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="border p-4 rounded-md space-y-4 dark:border-gray-700">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">Exercise {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`exercise-name-${index}`}>Exercise Name</Label>
                          <Input
                            id={`exercise-name-${index}`}
                            value={exercise.name}
                            onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor={`exercise-sets-${index}`}>Sets</Label>
                            <Input
                              id={`exercise-sets-${index}`}
                              type="number"
                              min="1"
                              value={exercise.sets}
                              onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`exercise-reps-${index}`}>Reps</Label>
                            <Input
                              id={`exercise-reps-${index}`}
                              type="number"
                              min="1"
                              value={exercise.reps}
                              onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`exercise-weight-${index}`}>Weight (kg)</Label>
                          <Input
                            id={`exercise-weight-${index}`}
                            type="number"
                            min="0"
                            step="0.5"
                            value={exercise.weight || 0}
                            onChange={(e) => handleExerciseChange(index, 'weight', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`exercise-rest-${index}`}>Rest Time (seconds)</Label>
                          <Input
                            id={`exercise-rest-${index}`}
                            type="number"
                            min="0"
                            value={exercise.rest_time || 60}
                            onChange={(e) => handleExerciseChange(index, 'rest_time', e.target.value)}
                          />
                        </div>
                        
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor={`exercise-notes-${index}`}>Notes</Label>
                          <Textarea
                            id={`exercise-notes-${index}`}
                            value={exercise.notes || ""}
                            onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                            placeholder="Any notes about this exercise..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-red-500">
            Failed to load workout details. Please try again.
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={updateWorkout} disabled={isLoading || !workout}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
