import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format, isSameDay, isWithinInterval, differenceInDays, addDays, endOfWeek, startOfWeek } from "date-fns";

// Type for CSV export options
export type ExportOptions = {
  includeNotes?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
};

// Function to export workout data to CSV
export const exportToCSV = (data: any[], filename: string) => {
  // Convert data to CSV format
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((item) => 
    Object.values(item)
      .map((value) => {
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value;
      })
      .join(",")
  );
  
  const csvContent = [headers, ...rows].join("\n");
  
  // Create a blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to export workout data to PDF
export const exportToPDF = (data: any[], filename: string, title: string) => {
  // @ts-ignore - jsPDF has types but autotable is an extension
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on ${format(new Date(), "PP")}`, 14, 30);
  
  // Format data for autotable
  const headers = Object.keys(data[0]);
  const rows = data.map((item) => Object.values(item));
  
  // @ts-ignore - autotable is added to jsPDF prototype
  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 40,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [66, 66, 66] }
  });
  
  // Save the PDF
  doc.save(`${filename}.pdf`);
};

// Function to prepare workout data for export
export const prepareWorkoutDataForExport = async (
  workouts: any[],
  options: ExportOptions = {}
) => {
  return workouts.map((workout) => {
    const formattedData: Record<string, any> = {
      Title: workout.title,
      Date: format(new Date(workout.completed_at), "PP"),
      Duration: `${workout.duration} min`,
      Exercises: workout.exercise_count || "N/A",
    };
    
    if (options.includeNotes && workout.notes) {
      formattedData["Notes"] = workout.notes;
    }
    
    return formattedData;
  });
};

// Function to calculate the current streak from workout history
export const calculateCurrentStreak = (completedWorkouts: { completed_at: string }[]): number => {
  if (!completedWorkouts || completedWorkouts.length === 0) return 0;
  
  // Sort workouts by date in descending order (newest first)
  const sortedWorkouts = [...completedWorkouts].sort(
    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  );
  
  const today = new Date();
  const latestWorkoutDate = new Date(sortedWorkouts[0].completed_at);
  
  // If the latest workout is more than a day old, streak is broken
  if (differenceInDays(today, latestWorkoutDate) > 1) {
    return 0;
  }
  
  // Initialize streak counter
  let streak = 1;
  let currentDate = latestWorkoutDate;
  let dateToCheck = addDays(currentDate, -1); // Start checking the day before
  
  // Go through sorted workouts to find consecutive days
  for (let i = 1; i < sortedWorkouts.length; i++) {
    const workoutDate = new Date(sortedWorkouts[i].completed_at);
    
    // If this workout happened on the date we're checking
    if (isSameDay(workoutDate, dateToCheck)) {
      streak++;
      dateToCheck = addDays(dateToCheck, -1); // Move to the previous day
    } else if (differenceInDays(currentDate, workoutDate) > 1) {
      // If there's a gap larger than 1 day, the streak is broken
      break;
    }
  }
  
  return streak;
};

// Function to calculate weekly streak (consecutive weeks with at least one workout)
export const calculateWeeklyStreak = (completedWorkouts: { completed_at: string }[]): number => {
  if (!completedWorkouts || completedWorkouts.length === 0) return 0;
  
  // Sort workouts by date in descending order (newest first)
  const sortedWorkouts = [...completedWorkouts].sort(
    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  );
  
  // Track which weeks have workouts
  const weeksWithWorkouts = new Set<string>();
  
  // Add all workout weeks to the set
  sortedWorkouts.forEach(workout => {
    const date = new Date(workout.completed_at);
    const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    weeksWithWorkouts.add(weekStart);
  });
  
  // Convert to array and sort
  const sortedWeeks = Array.from(weeksWithWorkouts).sort().reverse();
  
  if (sortedWeeks.length === 0) return 0;
  
  // Get the current week
  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  
  // If the latest week with workout is not the current week, return 0
  if (sortedWeeks[0] !== currentWeekStart) {
    return 0;
  }
  
  // Count consecutive weeks
  let streak = 1;
  for (let i = 1; i < sortedWeeks.length; i++) {
    const currentWeek = new Date(sortedWeeks[i-1]);
    const prevWeek = new Date(sortedWeeks[i]);
    
    // Check if the weeks are consecutive
    if (differenceInDays(currentWeek, prevWeek) <= 14) { // Allow up to 14 days to account for week boundaries
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};
