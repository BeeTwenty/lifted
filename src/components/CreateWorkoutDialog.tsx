
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExerciseTemplateCard } from "./ExerciseTemplateCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Dumbbell, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExerciseTemplate {
  id: string;
  name: string;
  description: string;
  media_url: string;
  target_muscle: string;
}

interface SelectedExercise extends ExerciseTemplate {
  sets: number;
  reps: number;
  weight: number | null;
  rest_time: number; // In seconds
}

export function CreateWorkoutDialog() {
  const [title, setTitle] = useState("");
  const { toast } = useToast();
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [defaultRestTime, setDefaultRestTime] = useState(60); // Default rest time in seconds

  const { data: exerciseTemplates, isLoading } = useQuery({
    queryKey: ["exerciseTemplates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_templates")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as ExerciseTemplate[];
    },
  });

  const filteredExercises = exerciseTemplates?.filter(exercise => {
    if (!searchQuery) return false; // Don't show anything if no search
    
    const lowerCaseSearch = searchQuery.toLowerCase();
    return (
      exercise.name.toLowerCase().includes(lowerCaseSearch) ||
      exercise.target_muscle.toLowerCase().includes(lowerCaseSearch) ||
      exercise.description.toLowerCase().includes(lowerCaseSearch)
    );
  });

  const handleCreateWorkout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Create workout
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          title,
          user_id: user.id,
          duration: 0, // This will be updated as exercises are completed
          default_rest_time: defaultRestTime, // Store default rest time for the workout
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Add exercises to workout with customized sets, reps, weight, and rest time
      const exercisesData = selectedExercises.map(exercise => ({
        workout_id: workout.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        notes: exercise.description,
        rest_time: exercise.rest_time, // Store the rest time for each exercise
      }));

      const { error: exercisesError } = await supabase
        .from("exercises")
        .insert(exercisesData);

      if (exercisesError) throw exercisesError;

      toast({
        title: "Routine created",
        description: "Your new workout routine has been created successfully.",
      });

      setTitle("");
      setSelectedExercises([]);
      setSearchQuery("");
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating routine",
        description: error.message,
      });
    }
  };

  const formatRestTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} sec`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 
        ? `${minutes} min ${remainingSeconds} sec` 
        : `${minutes} min`;
    }
  };

  const updateExerciseRestTime = (id: string, rest_time: number) => {
    setSelectedExercises(prev => 
      prev.map(exercise => 
        exercise.id === id ? { ...exercise, rest_time } : exercise
      )
    );
  };

  const handleUpdateAllRestTimes = () => {
    setSelectedExercises(prev => 
      prev.map(exercise => ({ ...exercise, rest_time: defaultRestTime }))
    );
    toast({
      title: "Rest times updated",
      description: "Applied the default rest time to all exercises."
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90">
          <Dumbbell className="mr-2 h-4 w-4" />
          New Routine
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Routine</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Input
              placeholder="Routine Title (e.g., Upper Body, Leg Day)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="default-rest-time">Default Rest Time Between Sets</Label>
            <div className="flex items-center gap-4">
              <Select
                value={defaultRestTime.toString()}
                onValueChange={(value) => setDefaultRestTime(parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select rest time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="45">45 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="90">1.5 minutes</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                  <SelectItem value="180">3 minutes</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                </SelectContent>
              </Select>
              {selectedExercises.length > 0 && (
                <Button variant="outline" onClick={handleUpdateAllRestTimes}>
                  Apply to all exercises
                </Button>
              )}
            </div>
          </div>
          
          {selectedExercises.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Selected Exercises</h3>
              <div className="space-y-2">
                {selectedExercises.map((exercise) => (
                  <div key={exercise.id} className="flex flex-col p-3 bg-muted rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{exercise.name}</span>
                        <div className="text-sm text-muted-foreground">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.weight ? ` × ${exercise.weight}kg` : ''}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedExercises(prev => prev.filter(e => e.id !== exercise.id))}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Label htmlFor={`rest-time-${exercise.id}`} className="text-sm">
                        Rest time between sets: {formatRestTime(exercise.rest_time)}
                      </Label>
                      <Select
                        value={exercise.rest_time.toString()}
                        onValueChange={(value) => updateExerciseRestTime(exercise.id, parseInt(value))}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Select rest time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="45">45 seconds</SelectItem>
                          <SelectItem value="60">1 minute</SelectItem>
                          <SelectItem value="90">1.5 minutes</SelectItem>
                          <SelectItem value="120">2 minutes</SelectItem>
                          <SelectItem value="180">3 minutes</SelectItem>
                          <SelectItem value="300">5 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-medium">Search For Exercises</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, muscle group, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : searchQuery ? (
              filteredExercises && filteredExercises.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {filteredExercises.map((template) => (
                    <ExerciseTemplateCard
                      key={template.id}
                      name={template.name}
                      description={template.description}
                      mediaUrl={template.media_url}
                      targetMuscle={template.target_muscle}
                      onAdd={(sets, reps, weight) => {
                        if (!selectedExercises.find(e => e.id === template.id)) {
                          setSelectedExercises(prev => [...prev, {
                            ...template,
                            sets,
                            reps,
                            weight,
                            rest_time: defaultRestTime // Use the default rest time
                          }]);
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 mt-4">
                  No exercises found matching "{searchQuery}". Try a different search.
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500 mt-4">
                Enter a search term to find exercises
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorkout}
              disabled={!title || selectedExercises.length === 0}
            >
              Create Routine
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
