
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

// Mapping of muscle names to areas in the new minimal diagram
const muscleMapping: Record<string, string[]> = {
  "Chest": ["chest"],
  "Back": ["upper-back", "lower-back"],
  "Shoulders": ["shoulders"],
  "Biceps": ["arms"],
  "Triceps": ["arms"],
  "Abs": ["abs"],
  "Legs": ["legs"],
  "Glutes": ["glutes"],
  "Forearms": ["arms"],
  "Traps": ["shoulders"],
  "Lats": ["upper-back"],
  "Calves": ["legs"],
  "Quads": ["legs"],
  "Hamstrings": ["legs"],
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

  // Get all muscle areas that need to be highlighted
  const highlightedAreas = trainedMuscles?.flatMap(muscle => 
    muscleMapping[muscle] || []
  ) || [];

  // Create a set for faster lookups
  const highlightedSet = new Set(highlightedAreas);

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Trained This Week</CardTitle>
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
            <div className="relative w-full max-w-[200px]">
              {/* Clean, minimal body outline based on the image */}
              <svg viewBox="0 0 100 200" className="w-full">
                {/* Background */}
                <rect x="0" y="0" width="100" height="200" fill="#1A1F2C" rx="10" ry="10" />
                
                {/* Title */}
                <text x="50" y="15" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">Trained This Week</text>
                
                {/* Body outline - simplified version */}
                <g fill="none" stroke="white" strokeWidth="1">
                  {/* Head */}
                  <circle 
                    cx="50" 
                    cy="30" 
                    r="10" 
                    fill="none" 
                  />
                  
                  {/* Shoulders */}
                  <path 
                    id="shoulders" 
                    d="M35,45 H65" 
                    strokeWidth="2"
                    stroke={highlightedSet.has("shoulders") ? "#ef4444" : "white"}
                  />
                  
                  {/* Arms */}
                  <path 
                    id="arms" 
                    d="M35,45 V80 M65,45 V80" 
                    strokeWidth="2"
                    stroke={highlightedSet.has("arms") ? "#ef4444" : "white"}
                  />
                  
                  {/* Chest */}
                  <path 
                    id="chest" 
                    d="M35,45 L50,55 L65,45" 
                    strokeWidth="2"
                    stroke={highlightedSet.has("chest") ? "#ef4444" : "white"}
                  />
                  
                  {/* Upper back */}
                  <path 
                    id="upper-back" 
                    d="M40,55 H60" 
                    strokeWidth="2"
                    stroke={highlightedSet.has("upper-back") ? "#ef4444" : "white"}
                  />
                  
                  {/* Abs */}
                  <path 
                    id="abs" 
                    d="M50,55 V90" 
                    strokeWidth="2"
                    stroke={highlightedSet.has("abs") ? "#ef4444" : "white"}
                  />
                  
                  {/* Lower back */}
                  <path 
                    id="lower-back" 
                    d="M40,70 H60" 
                    strokeWidth="2"
                    stroke={highlightedSet.has("lower-back") ? "#ef4444" : "white"}
                  />
                  
                  {/* Torso outline */}
                  <path 
                    d="M35,45 V90 H65 V45" 
                    stroke="white" 
                    strokeWidth="1" 
                    fill="none"
                  />
                  
                  {/* Legs */}
                  <path 
                    id="legs" 
                    d="M40,90 V150 M60,90 V150" 
                    strokeWidth="2"
                    stroke={highlightedSet.has("legs") ? "#ef4444" : "white"}
                  />
                  
                  {/* Glutes */}
                  <path 
                    id="glutes" 
                    d="M40,100 H60" 
                    strokeWidth="2"
                    stroke={highlightedSet.has("glutes") ? "#ef4444" : "white"}
                  />
                  
                  {/* Pelvis */}
                  <path 
                    d="M35,90 L50,100 L65,90" 
                    stroke="white" 
                    strokeWidth="1" 
                    fill="none"
                  />
                </g>
              </svg>
            </div>
            
            {!isLoading && trainedMuscles?.length === 0 && (
              <p className="text-center text-gray-500 mt-2 text-sm">
                No muscles trained yet this week.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
