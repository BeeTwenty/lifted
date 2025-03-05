
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

      const { data, error } = await supabase
        .from("exercises")
        .select("name")
        .filter("workout_id", "in", (
          supabase
            .from("workouts")
            .select("id")
            .eq("user_id", user.id)
        ))
        .order("name")
        .limit(100);

      if (error) throw error;

      // Get unique exercise names
      const uniqueExercises = [...new Set(data.map(item => item.name))];
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

      const { data, error } = await supabase
        .from("exercises")
        .select(`
          name as exercise_name,
          weight,
          reps,
          sets,
          workouts(title, completed_workouts(completed_at))
        `)
        .eq("name", exerciseName)
        .filter("workout_id", "in", (
          supabase
            .from("workouts")
            .select("id")
            .eq("user_id", user.id)
        ))
        .order("workouts.completed_workouts.completed_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Format the data for display
      const formattedHistory = data
        .filter(record => record.workouts && record.workouts.completed_workouts && record.workouts.completed_workouts.length > 0)
        .map(record => ({
          exercise_name: record.exercise_name,
          weight: record.weight || 0,
          reps: record.reps,
          sets: record.sets,
          date: format(new Date(record.workouts.completed_workouts[0].completed_at), 'MMM dd, yyyy'),
          workout_title: record.workouts.title
        }));

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
