
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ChevronDown, LineChart, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ExerciseHistoryRecord {
  exercise_name: string;
  weight: number;
  reps: number;
  sets: number;
  date: string;
  workout_title: string;
}

export function ExerciseHistoryTracker() {
  const [exercises, setExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [history, setHistory] = useState<ExerciseHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "chart">("chart");
  const { toast } = useToast();

  useEffect(() => {
    fetchExerciseNames();
  }, []);

  useEffect(() => {
    if (selectedExercise) {
      fetchExerciseHistory(selectedExercise);
    }
  }, [selectedExercise]);

  const fetchExerciseNames = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Simplified query to just get distinct exercise names from exercises table
      const { data, error } = await supabase
        .from("exercises")
        .select("name")
        .eq("workout_id", supabase.from("workouts").select("id").eq("user_id", user.id))
        .limit(50);

      if (error) throw error;

      // Get unique exercise names
      const uniqueExercises = [...new Set(data?.map(item => item.name) || [])];
      setExercises(uniqueExercises);
      
      // Select the first exercise by default if available
      if (uniqueExercises.length > 0 && !selectedExercise) {
        setSelectedExercise(uniqueExercises[0]);
      }
    } catch (error: any) {
      console.error("Error fetching exercise names:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load exercise names"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExerciseHistory = async (exerciseName: string) => {
    setIsHistoryLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // First get the exercises data
      const { data: exercisesData, error: exercisesError } = await supabase
        .from("exercises")
        .select(`
          name,
          weight,
          reps,
          sets,
          workout_id
        `)
        .eq("name", exerciseName);

      if (exercisesError) throw exercisesError;
      
      if (!exercisesData || exercisesData.length === 0) {
        setHistory([]);
        setIsHistoryLoading(false);
        return;
      }

      // Get all workout_ids from the exercises
      const workoutIds = exercisesData.map(ex => ex.workout_id);

      // Get workout details and completed dates
      const { data: workoutsData, error: workoutsError } = await supabase
        .from("workouts")
        .select(`
          id,
          title,
          completed_workouts (
            completed_at
          )
        `)
        .in("id", workoutIds);

      if (workoutsError) throw workoutsError;

      // Map the data together
      const formattedHistory: ExerciseHistoryRecord[] = [];
      
      for (const workout of workoutsData || []) {
        // Skip if no completed workouts
        if (!workout.completed_workouts || workout.completed_workouts.length === 0) {
          continue;
        }
        
        // Find matching exercise
        const exercise = exercisesData.find(e => e.workout_id === workout.id);
        if (!exercise) continue;
        
        // Add to history
        formattedHistory.push({
          exercise_name: exercise.name,
          weight: exercise.weight || 0,
          reps: exercise.reps,
          sets: exercise.sets,
          date: format(new Date(workout.completed_workouts[0].completed_at), 'MMM dd, yyyy'),
          workout_title: workout.title
        });
      }

      setHistory(formattedHistory);
    } catch (error: any) {
      console.error("Error fetching exercise history:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load exercise history"
      });
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Format data for the chart
  const chartData = history.map(record => ({
    date: record.date,
    weight: record.weight,
    volume: record.weight * record.sets * record.reps
  })).reverse();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <History className="mr-2 h-5 w-5" />
          Exercise History Tracker
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === "chart" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("chart")}
          >
            <LineChart className="h-4 w-4 mr-1" />
            Chart
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <ChevronDown className="h-4 w-4 mr-1" />
            Table
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Exercise</label>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedExercise}
                onValueChange={setSelectedExercise}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an exercise" />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map((exercise) => (
                    <SelectItem key={exercise} value={exercise}>
                      {exercise}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {isHistoryLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No history available for this exercise.
              <p className="mt-2 text-sm">Complete workouts with this exercise to see your progress over time.</p>
            </div>
          ) : viewMode === "chart" ? (
            <div className="h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="weight" name="Weight (kg)" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="volume" name="Volume (weight × sets × reps)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Workout</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>Sets</TableHead>
                    <TableHead>Reps</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record, i) => (
                    <TableRow key={i}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.workout_title}</TableCell>
                      <TableCell>{record.weight || 0}</TableCell>
                      <TableCell>{record.sets}</TableCell>
                      <TableCell>{record.reps}</TableCell>
                      <TableCell className="text-right">
                        {(record.weight || 0) * record.sets * record.reps}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
