
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

// Mapping of muscle names to SVG path IDs
const muscleMapping: Record<string, string[]> = {
  "Chest": ["chest-left", "chest-right"],
  "Back": ["back-upper", "back-lower"],
  "Shoulders": ["shoulder-left", "shoulder-right", "deltoid-left", "deltoid-right"],
  "Biceps": ["bicep-left", "bicep-right"],
  "Triceps": ["tricep-left", "tricep-right"],
  "Abs": ["abs"],
  "Legs": ["quad-left", "quad-right", "hamstring-left", "hamstring-right", "calf-left", "calf-right"],
  "Glutes": ["glute-left", "glute-right"],
  "Forearms": ["forearm-left", "forearm-right"],
  "Traps": ["traps"],
  "Lats": ["lat-left", "lat-right"],
  "Calves": ["calf-left", "calf-right"],
  "Quads": ["quad-left", "quad-right"],
  "Hamstrings": ["hamstring-left", "hamstring-right"],
};

export function TrainedMusclesVisualization() {
  // Fetch trained muscles for the current week
  const { data: trainedMuscles, isLoading, error } = useQuery({
    queryKey: ["trainedMuscles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const now = new Date();
      // Start week on Monday (1), not Sunday (0)
      const mondayOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
      const startOfWeekISO = mondayOfThisWeek.toISOString();

      // Get muscles trained this week
      const { data, error } = await supabase
        .rpc('get_trained_muscles_since', { start_date: startOfWeekISO });

      if (error) throw error;
      
      return data?.map((item: { muscle_name: string }) => item.muscle_name) || [];
    },
  });

  // Get all SVG path IDs that need to be highlighted
  const highlightedPaths = trainedMuscles?.flatMap(muscle => 
    muscleMapping[muscle] || []
  ) || [];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Muscles Trained This Week</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>Failed to load trained muscles data</AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-full max-w-[300px]">
              {/* Front view */}
              <svg viewBox="0 0 200 400" className="w-full">
                {/* Body outline */}
                <path d="M100,30 C130,30 150,50 150,80 C150,110 140,130 140,160 C140,190 150,220 150,250 C150,280 140,310 130,330 C120,350 110,370 100,390 C90,370 80,350 70,330 C60,310 50,280 50,250 C50,220 60,190 60,160 C60,130 50,110 50,80 C50,50 70,30 100,30 Z" 
                  fill="#f3f4f6" stroke="#000" strokeWidth="1" />
                
                {/* Head */}
                <circle cx="100" cy="20" r="15" fill="#f3f4f6" stroke="#000" strokeWidth="1" />

                {/* Chest - left */}
                <path id="chest-left" d="M80,100 C70,110 70,120 75,130 C80,140 90,145 100,145 L100,100 Z" 
                  fill={highlightedPaths.includes("chest-left") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Chest - right */}
                <path id="chest-right" d="M120,100 C130,110 130,120 125,130 C120,140 110,145 100,145 L100,100 Z" 
                  fill={highlightedPaths.includes("chest-right") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Abs */}
                <path id="abs" d="M90,145 L110,145 L110,190 L90,190 Z" 
                  fill={highlightedPaths.includes("abs") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Shoulder - left */}
                <path id="shoulder-left" d="M70,80 C60,85 55,90 50,100 C60,110 70,100 80,95 Z" 
                  fill={highlightedPaths.includes("shoulder-left") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Shoulder - right */}
                <path id="shoulder-right" d="M130,80 C140,85 145,90 150,100 C140,110 130,100 120,95 Z" 
                  fill={highlightedPaths.includes("shoulder-right") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Bicep - left */}
                <path id="bicep-left" d="M65,110 C55,120 50,130 55,150 C60,140 70,130 75,125 Z" 
                  fill={highlightedPaths.includes("bicep-left") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Bicep - right */}
                <path id="bicep-right" d="M135,110 C145,120 150,130 145,150 C140,140 130,130 125,125 Z" 
                  fill={highlightedPaths.includes("bicep-right") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Forearm - left */}
                <path id="forearm-left" d="M55,150 C50,160 45,170 50,190 C55,180 60,170 60,160 Z" 
                  fill={highlightedPaths.includes("forearm-left") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Forearm - right */}
                <path id="forearm-right" d="M145,150 C150,160 155,170 150,190 C145,180 140,170 140,160 Z" 
                  fill={highlightedPaths.includes("forearm-right") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Quad - left */}
                <path id="quad-left" d="M85,190 L70,250 L85,250 L95,190 Z" 
                  fill={highlightedPaths.includes("quad-left") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Quad - right */}
                <path id="quad-right" d="M115,190 L130,250 L115,250 L105,190 Z" 
                  fill={highlightedPaths.includes("quad-right") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Calf - left */}
                <path id="calf-left" d="M80,250 L75,310 L90,310 L85,250 Z" 
                  fill={highlightedPaths.includes("calf-left") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Calf - right */}
                <path id="calf-right" d="M120,250 L125,310 L110,310 L115,250 Z" 
                  fill={highlightedPaths.includes("calf-right") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
              </svg>
              
              {/* Back view (positioned to the right of front view) */}
              <svg viewBox="0 0 200 400" className="w-full mt-6">
                {/* Body outline */}
                <path d="M100,30 C130,30 150,50 150,80 C150,110 140,130 140,160 C140,190 150,220 150,250 C150,280 140,310 130,330 C120,350 110,370 100,390 C90,370 80,350 70,330 C60,310 50,280 50,250 C50,220 60,190 60,160 C60,130 50,110 50,80 C50,50 70,30 100,30 Z" 
                  fill="#f3f4f6" stroke="#000" strokeWidth="1" />
                
                {/* Head */}
                <circle cx="100" cy="20" r="15" fill="#f3f4f6" stroke="#000" strokeWidth="1" />
                
                {/* Traps */}
                <path id="traps" d="M80,50 L120,50 L115,80 L85,80 Z" 
                  fill={highlightedPaths.includes("traps") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Deltoid - left */}
                <path id="deltoid-left" d="M75,80 C65,85 55,95 60,110 C70,105 80,100 85,95 Z" 
                  fill={highlightedPaths.includes("deltoid-left") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Deltoid - right */}
                <path id="deltoid-right" d="M125,80 C135,85 145,95 140,110 C130,105 120,100 115,95 Z" 
                  fill={highlightedPaths.includes("deltoid-right") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Back upper */}
                <path id="back-upper" d="M85,80 L115,80 L120,120 L80,120 Z" 
                  fill={highlightedPaths.includes("back-upper") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Lat - left */}
                <path id="lat-left" d="M80,120 L65,150 L80,170 L90,150 Z" 
                  fill={highlightedPaths.includes("lat-left") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Lat - right */}
                <path id="lat-right" d="M120,120 L135,150 L120,170 L110,150 Z" 
                  fill={highlightedPaths.includes("lat-right") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Back lower */}
                <path id="back-lower" d="M80,170 L120,170 L115,190 L85,190 Z" 
                  fill={highlightedPaths.includes("back-lower") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Tricep - left */}
                <path id="tricep-left" d="M60,110 C55,120 50,140 55,150 C65,140 70,125 75,115 Z" 
                  fill={highlightedPaths.includes("tricep-left") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Tricep - right */}
                <path id="tricep-right" d="M140,110 C145,120 150,140 145,150 C135,140 130,125 125,115 Z" 
                  fill={highlightedPaths.includes("tricep-right") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Glute - left */}
                <path id="glute-left" d="M85,190 C75,200 70,220 80,230 C90,225 95,210 95,190 Z" 
                  fill={highlightedPaths.includes("glute-left") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Glute - right */}
                <path id="glute-right" d="M115,190 C125,200 130,220 120,230 C110,225 105,210 105,190 Z" 
                  fill={highlightedPaths.includes("glute-right") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Hamstring - left */}
                <path id="hamstring-left" d="M80,230 L70,280 L85,280 L90,230 Z" 
                  fill={highlightedPaths.includes("hamstring-left") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
                
                {/* Hamstring - right */}
                <path id="hamstring-right" d="M120,230 L130,280 L115,280 L110,230 Z" 
                  fill={highlightedPaths.includes("hamstring-right") ? "#ef4444" : "#f3f4f6"} 
                  stroke="#000" strokeWidth="1" />
              </svg>
            </div>
            
            <div className="text-sm text-gray-500 flex items-center gap-2 mt-2">
              <InfoIcon className="h-4 w-4" />
              <span>Red indicates muscles trained this week</span>
            </div>
            
            {trainedMuscles?.length === 0 && (
              <p className="text-center text-gray-500 mt-2">
                No muscles trained yet this week. Complete your workouts to see progress!
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
