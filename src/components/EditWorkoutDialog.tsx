
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Save, Search, Clock, Pencil, ListPlus, Dumbbell, BarChart4, MoveUp, MoveDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ExerciseTemplate } from "@/types/workout";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExerciseSearch } from "@/components/ExerciseSearch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

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
  order?: number;
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
  const [isSaving, setIsSaving] = useState(false);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const [editMode, setEditMode] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (open && workoutId) {
      fetchWorkoutDetails();
      fetchExerciseTemplates();
    }
    return () => {
      setEditMode(null);
    };
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
        .select("id, name, sets, reps, weight, rest_time, notes, order")
        .eq("workout_id", workoutId)
        .order('order', { ascending: true, nullsFirst: false });
      
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
      setIsSaving(true);
      
      const { error: workoutError } = await supabase
        .from("workouts")
        .update({
          title: workout.title,
          duration: workout.duration,
          notes: workout.notes
        })
        .eq("id", workout.id);
      
      if (workoutError) throw workoutError;
      
      // Process each exercise - updating existing ones, adding new ones, and setting order
      for (const [index, exercise] of workout.exercises.entries()) {
        if (exercise.id.startsWith('new-')) {
          const { error } = await supabase
            .from("exercises")
            .insert({
              workout_id: workout.id,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              rest_time: exercise.rest_time,
              notes: exercise.notes,
              order: index
            });
          
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("exercises")
            .update({
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              rest_time: exercise.rest_time,
              notes: exercise.notes,
              order: index  // Update order based on current position
            })
            .eq("id", exercise.id);
          
          if (error) throw error;
        }
      }
      
      toast({
        title: "Workout updated",
        description: "Your routine has been updated successfully."
      });
      
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating workout:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update routine"
      });
    } finally {
      setIsSaving(false);
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
      rest_time: 60,
      order: workout.exercises.length
    };
    
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, newExercise]
    });

    // Automatically enter edit mode for the new exercise
    setEditMode(`new-${Date.now()}`);
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
      notes: template.description,
      order: workout.exercises.length
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

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (!workout) return;
    
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === workout.exercises.length - 1)
    ) {
      return; // Can't move further in this direction
    }
    
    const newExercises = [...workout.exercises];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the exercises
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    
    setWorkout({
      ...workout,
      exercises: newExercises
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[700px] ${isMobile ? 'p-3' : ''} max-w-[95vw]`}>
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Dumbbell className="h-5 w-5" /> 
            Edit Routine
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : workout ? (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-6 pb-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="workoutTitle" className="flex items-center text-base">
                        <Pencil className="mr-1.5 h-4 w-4" />
                        Routine Name
                      </Label>
                      <Input
                        id="workoutTitle"
                        value={workout.title}
                        onChange={(e) => setWorkout({ ...workout, title: e.target.value })}
                        className="border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workoutDuration" className="flex items-center text-base">
                        <Clock className="mr-1.5 h-4 w-4" />
                        Duration (minutes)
                      </Label>
                      <Input
                        id="workoutDuration"
                        type="number"
                        min="1"
                        value={workout.duration}
                        onChange={(e) => setWorkout({ ...workout, duration: Number(e.target.value) })}
                        className="border-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="workoutNotes" className="flex items-center text-base">
                      <ListPlus className="mr-1.5 h-4 w-4" />
                      Notes (optional)
                    </Label>
                    <Textarea
                      id="workoutNotes"
                      value={workout.notes || ""}
                      onChange={(e) => setWorkout({ ...workout, notes: e.target.value })}
                      placeholder="Any notes about this workout..."
                      className="max-h-[100px] border-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center">
                  <BarChart4 className="mr-1.5 h-4.5 w-4.5" />
                  Exercises <Badge variant="outline" className="ml-2">{workout.exercises.length}</Badge>
                </h3>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline" className="border-primary/20 bg-primary/5">
                        <Search className="h-3.5 w-3.5 mr-1.5" />
                        From Templates
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <div className="p-3">
                        <h4 className="font-medium mb-3">Search Exercise Templates</h4>
                        <ExerciseSearch 
                          templates={templates} 
                          onSelectTemplate={addTemplateExercise}
                          placeholder="Search by name or muscle..."
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Button onClick={addNewExercise} size="sm" variant="default">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Exercise
                  </Button>
                </div>
              </div>
              
              {workout.exercises.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-md">
                  <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No exercises yet. Add your first exercise!</p>
                </div>
              ) : (
                <div className="space-y-4 pr-1">
                  {workout.exercises.map((exercise, index) => (
                    <Card key={exercise.id} className={`overflow-hidden border ${editMode === exercise.id ? 'border-primary border-2' : 'border-gray-200 dark:border-gray-700'}`}>
                      <CardContent className="p-0">
                        <div className="flex justify-between items-start p-4 bg-secondary/10">
                          <div className="flex items-center">
                            <Badge variant="outline" className="mr-2 bg-background">#{index + 1}</Badge>
                            <h4 className="font-medium">{exercise.name || "New Exercise"}</h4>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveExercise(index, 'up')}
                              disabled={index === 0}
                              className="h-8 text-gray-500"
                            >
                              <MoveUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveExercise(index, 'down')}
                              disabled={index === workout.exercises.length - 1}
                              className="h-8 text-gray-500"
                            >
                              <MoveDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditMode(editMode === exercise.id ? null : exercise.id)}
                              className="h-8 text-primary hover:text-primary/90 hover:bg-primary/10"
                            >
                              {editMode === exercise.id ? "Done" : "Edit"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExercise(index)}
                              className="h-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        
                        {editMode === exercise.id ? (
                          <div className="p-4 space-y-4 bg-background">
                            <div className="space-y-2">
                              <Label htmlFor={`exercise-name-${index}`}>Exercise Name</Label>
                              <Input
                                id={`exercise-name-${index}`}
                                value={exercise.name}
                                onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                                className="border-primary/20 focus:border-primary"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`exercise-sets-${index}`}>Sets</Label>
                                <Input
                                  id={`exercise-sets-${index}`}
                                  type="number"
                                  min="1"
                                  value={exercise.sets}
                                  onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                                  className="border-primary/20 focus:border-primary"
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
                                  className="border-primary/20 focus:border-primary"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`exercise-weight-${index}`}>Weight (kg)</Label>
                                <Input
                                  id={`exercise-weight-${index}`}
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={exercise.weight || 0}
                                  onChange={(e) => handleExerciseChange(index, 'weight', e.target.value)}
                                  className="border-primary/20 focus:border-primary"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`exercise-rest-${index}`}>Rest Time ({exercise.rest_time || 60} sec)</Label>
                                <Slider 
                                  id={`exercise-rest-${index}`}
                                  min={10} 
                                  max={180} 
                                  step={5} 
                                  value={[exercise.rest_time || 60]}
                                  onValueChange={(value) => handleExerciseChange(index, 'rest_time', value[0])}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`exercise-notes-${index}`}>Notes</Label>
                              <Textarea
                                id={`exercise-notes-${index}`}
                                value={exercise.notes || ""}
                                onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                                placeholder="Any notes about this exercise..."
                                className="max-h-[80px] border-primary/20 focus:border-primary"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 space-y-2">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="bg-secondary/10 p-2 rounded">
                                <p className="text-muted-foreground">Sets</p>
                                <p className="font-medium">{exercise.sets}</p>
                              </div>
                              <div className="bg-secondary/10 p-2 rounded">
                                <p className="text-muted-foreground">Reps</p>
                                <p className="font-medium">{exercise.reps}</p>
                              </div>
                              <div className="bg-secondary/10 p-2 rounded">
                                <p className="text-muted-foreground">Weight</p>
                                <p className="font-medium">{exercise.weight || 0} kg</p>
                              </div>
                            </div>
                            <div className="flex items-center text-sm mt-2">
                              <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              <span>{exercise.rest_time || 60} sec rest</span>
                            </div>
                            {exercise.notes && (
                              <div className="text-sm mt-2 text-muted-foreground border-t pt-2">
                                {exercise.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
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
        
        <DialogFooter className="mt-6 sm:mt-8">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={updateWorkout} disabled={isLoading || !workout || isSaving} className="gap-1.5">
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
