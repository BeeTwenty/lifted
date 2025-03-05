
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF, exportToCSV, prepareWorkoutDataForExport, ExportOptions } from "@/lib/export-utils";

export function useWorkoutExport() {
  const [includeNotes, setIncludeNotes] = useState(true);
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: undefined,
    end: undefined,
  });
  const [exportType, setExportType] = useState<"csv" | "pdf">("csv");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to export your workout data.",
        });
        return;
      }

      // Prepare query to get completed workouts
      let query = supabase
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

      // Add date range filter if specified
      if (dateRange.start && dateRange.end) {
        const startDate = dateRange.start.toISOString();
        const endDate = dateRange.end.toISOString();
        query = query.gte("completed_at", startDate).lte("completed_at", endDate);
      }

      const { data: workoutData, error } = await query;

      if (error) throw error;

      if (!workoutData || workoutData.length === 0) {
        toast({
          title: "No data to export",
          description: "You don't have any completed workouts to export.",
        });
        return;
      }

      // Format workout data for export
      const formattedData = workoutData.map(workout => ({
        title: workout.workouts?.title || "Unknown",
        completed_at: workout.completed_at,
        duration: workout.duration,
        notes: workout.notes,
      }));

      // Prepare export options
      const options: ExportOptions = {
        includeNotes,
        dateRange: dateRange.start && dateRange.end ? {
          start: dateRange.start,
          end: dateRange.end,
        } : undefined,
      };

      // Prepare data for export
      const exportData = await prepareWorkoutDataForExport(formattedData, options);
      
      // Generate filename
      const timestamp = format(new Date(), "yyyy-MM-dd");
      const filename = `workout-data-${timestamp}`;
      
      // Export based on selected type
      if (exportType === "csv") {
        exportToCSV(exportData, filename);
      } else {
        exportToPDF(exportData, filename, "Your Workout History");
      }
      
      toast({
        title: "Export successful",
        description: `Your workout data has been exported as ${exportType.toUpperCase()}.`,
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error.message || "Failed to export workout data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    includeNotes,
    setIncludeNotes,
    dateRange,
    setDateRange,
    exportType,
    setExportType,
    isLoading,
    handleExport
  };
}
