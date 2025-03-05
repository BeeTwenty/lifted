
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Download, FileDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF, exportToCSV, prepareWorkoutDataForExport, ExportOptions } from "@/lib/export-utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WorkoutExport() {
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Export Workout Data</CardTitle>
        <CardDescription>
          Download your workout history as CSV or PDF file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="export-type">Export Format</Label>
          <Select defaultValue={exportType} onValueChange={(value) => setExportType(value as "csv" | "pdf")}>
            <SelectTrigger id="export-type">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
              <SelectItem value="pdf">PDF Document</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Date Range (Optional)</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-full sm:w-[240px]",
                    !dateRange.start && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.start ? format(dateRange.start, "PPP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.start}
                  onSelect={(date) => setDateRange({ ...dateRange, start: date || undefined })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-full sm:w-[240px]",
                    !dateRange.end && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.end ? format(dateRange.end, "PPP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.end}
                  onSelect={(date) => setDateRange({ ...dateRange, end: date || undefined })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 py-2">
          <Checkbox 
            id="include-notes" 
            checked={includeNotes} 
            onCheckedChange={(checked) => setIncludeNotes(checked === true)}
          />
          <Label htmlFor="include-notes">Include workout notes</Label>
        </div>
        
        <Button 
          onClick={handleExport} 
          disabled={isLoading} 
          className="w-full sm:w-auto mt-2"
        >
          {isLoading ? (
            <span className="flex items-center">
              <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
              Exporting...
            </span>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export Workout Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
