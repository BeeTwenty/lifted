
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Save, Clock, ListPlus, Pencil, Dumbbell, BarChart4, XCircle } from "lucide-react";

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
        <Button className="w-full sm:w-auto flex items-center gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-5 w-5" /> Create Routine
        </Button>
      </DialogTrigger>
      <DialogContent className={`w-full max-w-[95vw] sm:max-w-[600px] rounded-lg p-${isMobile ? '4' : '6'}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Dumbbell className="h-5 w-5" /> Create New Routine
            </DialogTitle>
            <DialogDescription>Plan your workout by adding exercises and details.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[65vh] overflow-y-auto">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label htmlFor="title" className="flex items-center gap-2 text-base">
                    <Pencil className="h-4 w-4" /> Routine Name
                  </Label>
                  <Input id="title" {...register("title", { required: "Title is required" })} placeholder="e.g., Upper Body Workout" />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>

                <div>
                  <Label htmlFor="duration" className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4" /> Duration (minutes)
                  </Label>
                  <Input id="duration" type="number" {...register("duration", { required: "Duration is required" })} placeholder="30" />
                  {errors.duration && <p className="text-sm text-destructive">{errors.duration.message}</p>}
                </div>

                <div>
                  <Label className="text-base">Rest Time Between Sets ({defaultRestTime}s)</Label>
                  <Slider min={10} max={180} step={5} value={[defaultRestTime]} onValueChange={(value) => setDefaultRestTime(value[0])} />
                </div>

                <div>
                  <Label htmlFor="notes" className="flex items-center gap-2 text-base">
                    <ListPlus className="h-4 w-4" /> Notes (optional)
                  </Label>
                  <Textarea id="notes" {...register("notes")} placeholder="Any additional notes about the workout..." className="resize-none h-24" />
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 space-y-4">
              <h3 className="flex items-center text-lg font-medium">
                <BarChart4 className="h-5 w-5" /> Exercises <Badge className="ml-2">{exercises.length}</Badge>
              </h3>
              {/* Exercise Input Component (Placeholder) */}
              <Button onClick={() => 
  setExercises([
    ...exercises, 
    { 
      id: (exercises.length + 1).toString(), // Convert number to string
      name: "New Exercise", 
      sets: 3, 
      reps: 12, 
      rest_time: defaultRestTime,
      weight: 0, // Default weight
      notes: ""  // Default notes
    }
  ])
}>
  Add Exercise
</Button>


              {exercises.length > 0 && (
                <ScrollArea className="h-auto max-h-[200px]">
                  <div className="space-y-2">
                    {exercises.map((exercise, index) => (
                      <Card key={exercise.id} className="border-gray-200 dark:border-gray-700">
                        <CardContent className="p-3 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <div className="font-medium">{exercise.name}</div>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 flex gap-2">
                              <span className="bg-secondary/10 p-1 px-2 rounded-md">{exercise.sets} × {exercise.reps}</span>
                              <span className="bg-secondary/10 p-1 px-2 rounded-md flex items-center">
                                <Clock className="h-3 w-3 mr-1 opacity-70" /> {exercise.rest_time}s
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setExercises(exercises.filter((_, i) => i !== index))} className="text-destructive hover:text-destructive/90">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto gap-1.5">
              {loading ? <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent"></div> : <Save className="h-5 w-5" />} Create Routine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}