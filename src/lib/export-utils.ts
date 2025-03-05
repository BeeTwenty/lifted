
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

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
