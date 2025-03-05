
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Save, Clock, ListPlus, Pencil, Dumbbell, BarChart4 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Exercise, ExerciseTemplate } from "@/types/workout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { v4 as uuidv4 } from "uuid";
import { Slider } from "@/components/ui/slider";
import { ExerciseSearch } from "@/components/ExerciseSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ExerciseInputProps {
  onAddExercise: (exercise: Exercise) => void;
  defaultRestTime: number;
  templates: ExerciseTemplate[];
}

const ExerciseInput = ({ onAddExercise, defaultRestTime, templates }: ExerciseInputProps) => {
  const [name, setName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [restTime, setRestTime] = useState(defaultRestTime);
  const [activeTab, setActiveTab] = useState("manual");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleAddExercise = () => {
    if (!name) {
      toast({
        variant: "destructive",
        title: "Exercise name required",
        description: "Please enter a name for the exercise."
      });
      return;
    }

    if (!sets || !reps) {
      toast({
        variant: "destructive",
        title: "Sets and reps required",
        description: "Please specify sets and reps for the exercise."
      });
      return;
    }

    const exercise: Exercise = {
      id: uuidv4(),
      name,
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: weight ? parseFloat(weight) : null,
      notes: notes || null,
      rest_time: restTime,
    };

    onAddExercise(exercise);

    setName("");
    setSets("3");
    setReps("10");
    setWeight("");
    setNotes("");
  };

  const handleSelectTemplate = (template: ExerciseTemplate) => {
    setName(template.name);
    setNotes(template.description || "");
    setActiveTab("manual");
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <h4 className="text-base font-medium">Add New Exercise</h4>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="manual" className="flex items-center gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" />
              Templates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Exercise Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Bench Press"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="sets">Sets</Label>
                  <Input
                    id="sets"
                    type="number"
                    placeholder="3"
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reps">Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    placeholder="10"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg, optional)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="e.g., 60"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rest-time">Rest Time ({restTime} seconds)</Label>
                <Slider 
                  id="rest-time"
                  min={10} 
                  max={180} 
                  step={5} 
                  defaultValue={[defaultRestTime]} 
                  value={[restTime]}
                  onValueChange={(value) => setRestTime(value[0])}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="max-h-[100px] border-primary/20 focus:border-primary"
              />
            </div>
            <Button type="button" onClick={handleAddExercise} className="w-full">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Exercise
            </Button>
          </TabsContent>
          
          <TabsContent value="templates" className="mt-0">
            <ExerciseSearch 
              templates={templates} 
              onSelectTemplate={handleSelectTemplate} 
              placeholder="Search exercises..."
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export const CreateWorkoutDialog = () => {
  const [open, setOpen] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const [defaultRestTime, setDefaultRestTime] = useState(60);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      duration: "30",
      notes: "",
    }
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchExerciseTemplates();
      reset();
      setExercises([]);
      setDefaultRestTime(60);
    }
  };

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

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter(exercise => exercise.id !== id));
  };

  const onSubmit = async (data: any) => {
    if (exercises.length === 0) {
      toast({
        variant: "destructive",
        title: "Add exercises",
        description: "Your workout needs at least one exercise."
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          title: data.title,
          duration: parseInt(data.duration),
          notes: data.notes || null,
          user_id: user.id,
          default_rest_time: defaultRestTime
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      const exercisesWithWorkoutId = exercises.map(exercise => ({
        ...exercise,
        workout_id: workoutData.id
      }));

      const { error: exercisesError } = await supabase
        .from("exercises")
        .insert(exercisesWithWorkoutId);

      if (exercisesError) throw exercisesError;

      toast({
        title: "Workout created",
        description: "Your workout has been created successfully."
      });

      queryClient.invalidateQueries({ queryKey: ["routines"] });
      queryClient.invalidateQueries({ queryKey: ["workoutStats"] });
      
      setOpen(false);
      reset();
      setExercises([]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating workout",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary/90 hover:bg-primary">
          <Plus className="mr-2 h-4 w-4" />
          Create Routine
        </Button>
      </DialogTrigger>
      <DialogContent className={`sm:max-w-[600px] ${isMobile ? 'p-3' : 'p-6'}`}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Dumbbell className="h-5 w-5" />
              Create New Routine
            </DialogTitle>
            <DialogDescription>
              Design a custom workout with the exercises you want.
            </DialogDescription>
          </DialogHeader>
          <div className={`grid gap-5 ${isMobile ? 'max-h-[65vh]' : 'max-h-[70vh]'} overflow-y-auto p-1`}>
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="flex items-center text-base">
                        <Pencil className="mr-1.5 h-4 w-4" />
                        Routine Name
                      </Label>
                      <Input
                        id="title"
                        {...register("title", { required: "Title is required" })}
                        placeholder="e.g., Upper Body Workout"
                        className="border-primary/20 focus:border-primary"
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive">{errors.title.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="flex items-center text-base">
                        <Clock className="mr-1.5 h-4 w-4" />
                        Duration (minutes)
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        {...register("duration", { required: "Duration is required" })}
                        placeholder="30"
                        className="border-primary/20 focus:border-primary"
                      />
                      {errors.duration && (
                        <p className="text-sm text-destructive">{errors.duration.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default-rest" className="flex items-center text-base">
                      Rest Time Between Sets ({defaultRestTime} seconds)
                    </Label>
                    <Slider 
                      id="default-rest"
                      min={10} 
                      max={180} 
                      step={5} 
                      defaultValue={[60]} 
                      value={[defaultRestTime]}
                      onValueChange={(value) => setDefaultRestTime(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center text-base">
                      <ListPlus className="mr-1.5 h-4 w-4" />
                      Notes (optional)
                    </Label>
                    <Textarea
                      id="notes"
                      {...register("notes")}
                      placeholder="Any additional notes about the workout..."
                      className="max-h-[100px] border-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-1" />

            <div className="space-y-4">
              <h3 className="font-medium flex items-center text-lg">
                <BarChart4 className="mr-1.5 h-4.5 w-4.5" />
                Exercises <Badge variant="outline" className="ml-2">{exercises.length}</Badge>
              </h3>
              
              <ExerciseInput 
                onAddExercise={(exercise) => setExercises([...exercises, exercise])} 
                defaultRestTime={defaultRestTime} 
                templates={templates} 
              />
              
              {exercises.length > 0 && (
                <div className="mt-4">
                  <ScrollArea className={`${exercises.length > 3 ? 'h-[200px]' : ''}`}>
                    <div className="space-y-2 pr-4">
                      {exercises.map((exercise, index) => (
                        <Card key={exercise.id} className="border-gray-200 dark:border-gray-700">
                          <CardContent className="p-3 flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="mr-1">#{index + 1}</Badge>
                                <div className="font-medium">{exercise.name}</div>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-2">
                                <span className="bg-secondary/10 p-1 px-2 rounded-sm">
                                  {exercise.sets} × {exercise.reps}
                                </span>
                                {exercise.weight ? (
                                  <span className="bg-secondary/10 p-1 px-2 rounded-sm">
                                    {exercise.weight}kg
                                  </span>
                                ) : null}
                                <span className="bg-secondary/10 p-1 px-2 rounded-sm flex items-center">
                                  <Clock className="h-3 w-3 mr-1 opacity-70" />
                                  {exercise.rest_time}s
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExercise(exercise.id)}
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              Remove
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto gap-1.5">
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Routine
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
