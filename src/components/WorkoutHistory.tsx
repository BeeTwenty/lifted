
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { History, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CompletedWorkout {
  id: string;
  workout_id: string;
  workout_title: string;
  duration: number;
  completed_at: string;
  notes: string | null;
}

export function WorkoutHistory() {
  const [history, setHistory] = useState<CompletedWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<CompletedWorkout | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editedNote, setEditedNote] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkoutHistory();
  }, []);

  const fetchWorkoutHistory = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get completed workouts with related workout titles
      const { data: completedWorkouts, error } = await supabase
        .from("completed_workouts")
        .select(`
          id,
          workout_id,
          duration,
          completed_at,
          notes,
          workouts (
            title
          )
        `)
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      if (error) throw error;

      // Format the data
      const formattedHistory = completedWorkouts.map(workout => ({
        id: workout.id,
        workout_id: workout.workout_id,
        workout_title: workout.workouts?.title || "Unknown Workout",
        duration: workout.duration,
        completed_at: workout.completed_at,
        notes: workout.notes
      }));

      setHistory(formattedHistory);
    } catch (error: any) {
      console.error("Error fetching workout history:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load workout history"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openNoteDialog = (workout: CompletedWorkout) => {
    setSelectedWorkout(workout);
    setEditedNote(workout.notes || "");
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedWorkout) return;
    
    try {
      const { error } = await supabase
        .from("completed_workouts")
        .update({ notes: editedNote })
        .eq("id", selectedWorkout.id);
        
      if (error) throw error;
      
      // Update local state
      setHistory(prev => prev.map(workout => 
        workout.id === selectedWorkout.id 
          ? { ...workout, notes: editedNote } 
          : workout
      ));
      
      setIsNoteDialogOpen(false);
      toast({
        title: "Notes saved",
        description: "Your workout notes have been updated"
      });
    } catch (error: any) {
      console.error("Error saving note:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notes"
      });
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            Workout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No workout history available.
              <p className="mt-2 text-sm">Complete workouts to see your history here.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Workout</TableHead>
                    <TableHead>Duration (min)</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((workout) => (
                    <TableRow key={workout.id}>
                      <TableCell>
                        {format(new Date(workout.completed_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{workout.workout_title}</TableCell>
                      <TableCell>{workout.duration}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center gap-1" 
                          onClick={() => openNoteDialog(workout)}
                        >
                          <FileText className="h-4 w-4" />
                          {workout.notes ? "View/Edit Notes" : "Add Notes"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Workout Notes - {selectedWorkout?.workout_title} 
              ({selectedWorkout ? format(new Date(selectedWorkout.completed_at), 'MMM dd, yyyy') : ''})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={editedNote}
              onChange={(e) => setEditedNote(e.target.value)}
              placeholder="Add notes about this workout..."
              className="min-h-[150px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleSaveNote}>Save Notes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
