
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Play, Pause, SkipForward, RotateCcw, CheckCircle, Timer, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "@/components/ui/image";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
  notes: string | null;
  rest_time: number | null;
  media_url?: string | null;
}

interface Workout {
  id: string;
  title: string;
  exercises: Exercise[];
  default_rest_time: number;
}

interface WorkoutPlayerProps {
  workoutId: string | null;
  onClose: () => void;
}

export const WorkoutPlayer = ({ workoutId, onClose }: WorkoutPlayerProps) => {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (workoutId) {
      fetchWorkout(workoutId);
    }
  }, [workoutId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isResting && restTimeRemaining > 0 && !isPaused) {
      timer = setTimeout(() => {
        setRestTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (isResting && restTimeRemaining <= 0) {
      setIsResting(false);
      nextSet();
    }
    
    return () => clearTimeout(timer);
  }, [isResting, restTimeRemaining, isPaused]);

  const fetchWorkout = async (id: string) => {
    setLoading(true);
    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .select("id, title, default_rest_time")
        .eq("id", id)
        .single();

      if (workoutError) throw workoutError;

      const { data: exercisesData, error: exercisesError } = await supabase
        .from("exercises")
        .select(`
          id, 
          name, 
          sets, 
          reps, 
          weight, 
          notes, 
          rest_time
        `)
        .eq("workout_id", id)
        .order("id");

      if (exercisesError) throw exercisesError;

      // Fetch media_url for all exercises
      const exercisesWithMedia = await Promise.all(
        exercisesData.map(async (exercise) => {
          const { data: templateData, error: templateError } = await supabase
            .from("exercise_templates")
            .select("media_url")
            .eq("name", exercise.name)
            .maybeSingle();

          if (templateError) console.error("Error fetching template:", templateError);
          
          return {
            ...exercise,
            media_url: templateData?.media_url || null
          };
        })
      );

      setWorkout({
        id: workoutData.id,
        title: workoutData.title,
        exercises: exercisesWithMedia,
        default_rest_time: workoutData.default_rest_time || 60
      });

      setCurrentExerciseIndex(0);
      setCurrentSetIndex(0);
      setCompleted(false);
      setIsResting(false);
      setRestTimeRemaining(0);
      setIsPaused(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading workout",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    // Additional logic if needed for tracking workout completion
    toast({
      title: "Workout completed!",
      description: "Great job completing your workout.",
    });
    onClose();
  };

  const currentExercise = workout?.exercises[currentExerciseIndex];
  const totalExercises = workout?.exercises.length || 0;
  const totalSets = currentExercise?.sets || 0;
  const progress = totalExercises > 0 
    ? ((currentExerciseIndex / totalExercises) * 100) + 
      ((currentSetIndex / totalSets) * (100 / totalExercises))
    : 0;

  const nextSet = () => {
    if (!workout || !currentExercise) return;
    
    if (currentSetIndex < currentExercise.sets - 1) {
      // Move to next set of current exercise
      setCurrentSetIndex(currentSetIndex + 1);
    } else {
      // Move to next exercise
      if (currentExerciseIndex < workout.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSetIndex(0);
      } else {
        // Workout completed
        setCompleted(true);
      }
    }
  };

  const startRest = () => {
    if (!workout || !currentExercise) return;
    
    const restTime = currentExercise.rest_time || workout.default_rest_time || 60;
    setRestTimeRemaining(restTime);
    setIsResting(true);
    setIsPaused(false);
  };

  const skipRest = () => {
    setIsResting(false);
    nextSet();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetWorkout = () => {
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    setCompleted(false);
    setIsResting(false);
    setRestTimeRemaining(0);
    setIsPaused(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  

  const renderMediaContent = () => {
    const mediaUrl = currentExercise?.media_url;
  
    if (!mediaUrl || mediaUrl.includes("fakeimg.pl")) {
      return (
        <div className="py-10 text-center">
          <img 
            src="https://fakeimg.pl/600x400/b36666/ffffff?text=No+Media&font=bebas" 
            alt="No Media Available"
            className="rounded-md w-full h-auto mx-auto"
          />
        </div>
      );
    }
  
    // Handle YouTube videos
    if (mediaUrl.includes("youtube.com") || mediaUrl.includes("youtu.be")) {
      let embedUrl = mediaUrl;
      if (mediaUrl.includes("watch?v=")) {
        const videoId = mediaUrl.split("watch?v=")[1].split("&")[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (mediaUrl.includes("youtu.be/")) {
        const videoId = mediaUrl.split("youtu.be/")[1];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
  
      return (
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <iframe
            src={embedUrl}
            title={currentExercise?.name || "Exercise demonstration"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-md w-full h-full"
          />
        </AspectRatio>
      );
    }
  
    // Handle direct MP4/WebM/Ogg videos
    if (mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
      return (
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <video 
            src={mediaUrl}
            controls
            className="rounded-md object-cover w-full h-full"
          />
        </AspectRatio>
      );
    }
  
    // Handle Images
    if (mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
      return (
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <img 
            src={mediaUrl} 
            alt={currentExercise?.name || "Exercise demonstration"} 
            className="rounded-md object-cover w-full h-full"
          />
        </AspectRatio>
      );
    }
  
    // If no valid media type, show placeholder
    return (
      <div className="py-10 text-center">
        <img 
          src="https://fakeimg.pl/600x400/b36666/ffffff?text=No+Media&font=bebas" 
          alt="No Media Available"
          className="rounded-md w-full h-auto mx-auto"
        />
      </div>
    );
  };
  

  return (
    <>
      <Dialog open={!!workoutId} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{workout?.title || "Workout"}</DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="py-10 text-center">Loading workout...</div>
          ) : completed ? (
            <div className="py-10 text-center space-y-4">
              <CheckCircle className="mx-auto h-16 w-16 text-primary" />
              <h2 className="text-2xl font-bold">Workout Complete!</h2>
              <p className="text-muted-foreground">Congratulations on finishing your workout.</p>
              <div className="pt-4">
                <Button onClick={handleComplete}>Finish</Button>
              </div>
            </div>
          ) : isResting ? (
            <div className="py-6 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Rest Time</h2>
                <div className="flex items-center justify-center space-x-2">
                  <Timer className="h-6 w-6 text-blue-500" />
                  <span className="text-3xl font-bold">{formatTime(restTimeRemaining)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Next: {currentExercise?.name} - Set {currentSetIndex + 1 >= currentExercise?.sets ? 1 : currentSetIndex + 2}
                  {currentSetIndex + 1 >= currentExercise?.sets && currentExerciseIndex < (workout?.exercises.length || 0) - 1 
                    ? ` of ${workout?.exercises[currentExerciseIndex + 1].name}`
                    : ''
                  }
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={togglePause}
                >
                  {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                </Button>
                <Button onClick={skipRest}>
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip Rest
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-6">
              <Progress value={progress} className="h-2" />
              
              <div className="space-y-4">
                <div className="text-center flex justify-center items-center gap-2">
                  <h2 className="text-xl font-semibold">{currentExercise?.name}</h2>
                  {currentExercise?.media_url && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => setShowMedia(true)}
                      title="Show exercise demonstration"
                    >
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  )}
                  <p className="text-muted-foreground">
                    Exercise {currentExerciseIndex + 1}/{totalExercises}
                  </p>
                </div>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold">{currentExercise?.reps}</div>
                    <div className="text-sm font-medium uppercase text-muted-foreground">Reps</div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between items-center px-2">
                  <div className="text-center">
                    <div className="text-lg font-medium">{currentSetIndex + 1}</div>
                    <div className="text-xs text-muted-foreground">Current Set</div>
                  </div>
                  <div className="h-2 w-2 bg-muted rounded-full"></div>
                  <div className="text-center">
                    <div className="text-lg font-medium">{currentExercise?.sets}</div>
                    <div className="text-xs text-muted-foreground">Total Sets</div>
                  </div>
                  <div className="h-2 w-2 bg-muted rounded-full"></div>
                  <div className="text-center">
                    {currentExercise?.weight ? (
                      <>
                        <div className="text-lg font-medium">{currentExercise.weight}</div>
                        <div className="text-xs text-muted-foreground">Weight (kg)</div>
                      </>
                    ) : (
                      <>
                        <div className="text-lg font-medium">—</div>
                        <div className="text-xs text-muted-foreground">No Weight</div>
                      </>
                    )}
                  </div>
                </div>
                
                {currentExercise?.notes && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="font-medium">Notes:</p>
                    <p>{currentExercise.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Button className="w-full" onClick={startRest}>
                  Complete Set & Rest ({formatTime(currentExercise?.rest_time || workout?.default_rest_time || 60)})
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={resetWorkout}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showMedia} onOpenChange={setShowMedia}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{currentExercise?.name || "Exercise Demonstration"}</DialogTitle>
          </DialogHeader>
          {renderMediaContent()}
        </DialogContent>
      </Dialog>
    </>
  );
};

