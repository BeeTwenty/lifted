
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Download } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useWorkoutExport } from "@/hooks/useWorkoutExport";

export function WorkoutExport() {
  const {
    includeNotes,
    setIncludeNotes,
    dateRange,
    setDateRange,
    exportType,
    setExportType,
    isLoading,
    handleExport
  } = useWorkoutExport();

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
