
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mapping of muscle names to muscle groups in the wger SVGs
// This includes both English names and possible Latin/technical names
const muscleMapping: Record<string, string[]> = {
  // English names
  "Chest": ["chest"],
  "Back": ["back"],
  "Shoulders": ["shoulders", "deltoids"],
  "Biceps": ["biceps"],
  "Triceps": ["triceps"],
  "Abs": ["abs"],
  "Legs": ["quads", "hamstrings", "calves"],
  "Glutes": ["glutes"],
  "Forearms": ["forearms"],
  "Traps": ["trapezius"],
  "Lats": ["lats"],
  "Calves": ["calves"],
  "Quads": ["quads"],
  "Hamstrings": ["hamstrings"],
  
  // Latin/technical names that might be in the database
  "Pectoralis major": ["chest"],
  "Latissimus dorsi": ["back", "lats"],
  "Deltoideus": ["shoulders", "deltoids"],
  "Biceps brachii": ["biceps"],
  "Triceps brachii": ["triceps"],
  "Rectus abdominis": ["abs"],
  "Quadriceps femoris": ["quads", "legs"],
  "Biceps femoris": ["hamstrings", "legs"],
  "Gastrocnemius": ["calves", "legs"],
  "Gluteus maximus": ["glutes"],
  "Brachioradialis": ["forearms"],
  "Trapezius": ["traps", "back"],
  "Erector spinae": ["back"],
  "Soleus": ["calves", "legs"],
  "Vastus lateralis": ["quads", "legs"],
  "Vastus medialis": ["quads", "legs"],
  "Rectus femoris": ["quads", "legs"],
  "Adductor magnus": ["legs"],
  "Semitendinosus": ["hamstrings", "legs"],
  "Semimembranosus": ["hamstrings", "legs"]
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

      if (error) {
        console.error("Error fetching trained muscles:", error);
        throw error;
      }
      
      // Log the received data for debugging
      console.log("Trained muscles data received:", data);
      
      return data?.map((item: { muscle_name: string }) => item.muscle_name) || [];
    },
  });

  // Log the processed trainedMuscles for debugging
  console.log("Processed trained muscles:", trainedMuscles);

  // Get all muscle areas that need to be highlighted
  const highlightedAreas = trainedMuscles?.flatMap(muscle => 
    muscleMapping[muscle] || []
  ) || [];

  // Log the areas that should be highlighted
  console.log("Areas to highlight:", highlightedAreas);

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
          <ScrollArea className="h-[300px]">
            <Tabs defaultValue="front" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="front">Front View</TabsTrigger>
                <TabsTrigger value="back">Back View</TabsTrigger>
              </TabsList>
              <TabsContent value="front" className="mt-2">
                <div className="relative w-full flex justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="200"
                    height="300"
                    viewBox="0 0 200 356"
                    className="muscular-system-svg"
                  >
                    {/* Base muscular system front */}
                    <image
                      href="https://wger.de/static/images/muscles/muscular_system_front.svg"
                      width="100%"
                      height="100%"
                    />
                    
                    {/* Highlighted muscles - these would be overlays with red color */}
                    {highlightedSet.has("chest") && (
                      <path
                        d="M76.2,102.9c-2.2,2.1-3,5.8-4.6,8.6c-4.1,6.7-3.9,14.9-2.1,22.2c0.6,2.4,0.5,5.8,3.3,6.4 c6.1-0.2,11.1-6.3,17.2-6.2c2.4-0.3,6.2,2.4,7.9,0.1c4.5-6.3,3.3-14.6,3.2-21.9c-0.2-3-2.4-5.6-4.3-7.9 C92.3,100.4,81,97.5,76.2,102.9z M124.1,102.9c2.2,2.1,3,5.8,4.6,8.6c4.1,6.7,3.9,14.9,2.1,22.2c-0.6,2.4-0.5,5.8-3.3,6.4 c-6.1-0.2-11.1-6.3-17.2-6.2c-2.4-0.3-6.2,2.4-7.9,0.1c-4.5-6.3-3.3-14.6-3.2-21.9c0.2-3,2.4-5.6,4.3-7.9 C108,100.4,119.3,97.5,124.1,102.9z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("abs") && (
                      <path
                        d="M88.8,144.2c-2.5,2.9-8.4,2.8-10.9,5.7c-1.2,2.9-0.9,6.8-0.1,9.8c2.8,6.3,7.5,13.2,9.9,19.7 c-0.7,5.1,4.7,9.3,9.6,8.6c1.7-0.1,3.4-0.1,5.1,0c5,0.7,10.3-3.5,9.7-8.6c2.3-6.4,7-13.3,9.8-19.5c0.8-3,1.2-7,0-9.9 c-2.5-3-8.5-2.9-11-5.8c-6.5-1.2-13.6-2.6-19.5,1.3C90.5,143.8,89.7,144,88.8,144.2z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("shoulders") && (
                      <path
                        d="M66.1,78.5c-4,8.4-13.8,12.9-20.6,19.3c-1.9,4.3-6.5,7.7-5,12.7c5.5,9.8,6.9,21.2,9.8,31.9 c0.9,5,6.3,3.4,10.2,2.2c6.1-2.1,9.9-7.7,15.6-10.4c2.6-0.9,2.7-4.1,2.7-6.5c-0.5-7.4-0.5-15,1.3-22.2c1.5-5,5.5-8.9,8.1-13.5 c1.9-3.9-0.4-8.1-0.3-12.2C82.8,75.8,72.1,73.4,66.1,78.5z M155.1,97.9c-6.8-6.4-16.5-10.9-20.6-19.3c-6-5.1-16.7-2.7-21.8,1.3 c-0.1,4.1-2.2,8.3-0.3,12.2c2.6,4.6,6.6,8.5,8.1,13.5c1.8,7.2,1.9,14.7,1.3,22.2c0,2.3,0.1,5.6,2.7,6.5c5.7,2.7,9.5,8.3,15.6,10.4 c3.9,1.2,9.3,2.8,10.2-2.2c2.9-10.7,4.3-22.1,9.8-31.9C161.6,105.6,157,102.2,155.1,97.9z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("biceps") && (
                      <path
                        d="M33.1,135.6c-1.6,5.2-7.6,6-12.2,7.5c-3,1.3-6,3.8-5.9,7.3c0.3,10.3,1.9,20.6,5.7,30.2 c1.5,3.6,5.8,3.5,9.1,3.1c3.9-1.7,7.9-3.4,11.2-6.1c3.2-3.1,2.8-8,3.5-12.1c1.5-7.2,3.8-14.2,6.9-20.8c0.6-2.4,2.7-5.1,1-7.5 c-3.6-3.8-7.8-7.7-13.3-7.9C36.8,129.4,33.7,132.6,33.1,135.6z M168.2,143.1c-4.6-1.5-10.7-2.3-12.2-7.5 c-0.6-3-3.7-6.2-6.9-6.3c-5.5,0.3-9.7,4.1-13.3,7.9c-1.7,2.3,0.4,5.1,1,7.5c3.1,6.6,5.4,13.6,6.9,20.8c0.7,4.1,0.2,9,3.5,12.1 c3.3,2.8,7.3,4.4,11.2,6.1c3.3,0.4,7.6,0.5,9.1-3.1c3.8-9.6,5.4-19.9,5.7-30.2C174.2,146.9,171.2,144.4,168.2,143.1z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("forearms") && (
                      <path
                        d="M194.1,169.1c-2.5-1.1-5.5-1-7.8,0.5c-2.6,1.6-5.2,3.8-8.3,3.4c-3.5-0.1-5.5,3.6-6.3,6.5 c-4.4,10.3-8.9,20.5-14.3,30.3c-1.2,2.8-5.7,4.3-4.3,7.8c4.8,5.5,11.7,8.6,18.5,11.3c2.7,0.9,5.5-0.6,7.5-2.3 c6.4-6.5,9.3-15.6,13.6-23.5c2.8-5.6,5.3-11.4,6.7-17.5C200.6,179.2,198.3,171.2,194.1,169.1z M20.7,217.6 c2.4,1.7,5.2,3.2,8,2.3c6.7-2.7,13.7-5.8,18.5-11.3c1.4-3.5-3.1-5-4.3-7.8c-5.5-9.8-9.9-20-14.3-30.3c-0.9-2.9-2.8-6.6-6.3-6.5 c-3.1,0.4-5.7-1.8-8.3-3.4c-2.3-1.5-5.3-1.6-7.8-0.5c-4.2,2.1-6.5,10.1-5.3,14.5c1.5,6.1,3.9,11.9,6.7,17.5 C11.4,202,14.3,211.1,20.7,217.6z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("quads") && (
                      <path
                        d="M112.6,188.1c-3.1-4.3-10.1-7.6-14.9-3.9c-7,0.9-13.3,4.8-19.5,8c-8.1,4.7-7.1,15.5-10,23.6 c-3.5,11.6-3.9,23.8-6,35.7c0,2.8,0.7,6.1-1.5,8.3c-1.7,1.5-2.1,2.9-1.3,5c1.3,3.5,5.3,4.8,8.4,6.4c8.1,4.1,15.7,9,23.9,12.7 c3.6,1.6,7.5,0.5,9.3-3c5.2-9.5,10-19.2,14.6-29c1.5-3.3,3.2-6.5,3.7-10.1c0.9-10.2,1.3-20.5,1.5-30.7c0.1-3.4-0.1-6.9-1.5-10 C117.7,196.5,114.8,192.4,112.6,188.1z M122.8,192.1c-1.5,3.1-1.7,6.6-1.5,10c0.2,10.2,0.5,20.5,1.5,30.7 c0.5,3.6,2.1,6.8,3.7,10.1c4.5,9.8,9.4,19.4,14.6,29c1.8,3.5,5.7,4.6,9.3,3c8.2-3.7,15.8-8.6,23.9-12.7c3.1-1.6,7-2.9,8.4-6.4 c0.9-2.1,0.5-3.5-1.3-5c-2.2-2.2-1.5-5.5-1.5-8.3c-2.1-11.9-2.5-24.1-6-35.7c-2.9-8.1-1.9-18.9-10-23.6c-6.1-3.2-12.5-7.1-19.5-8 c-4.8-3.7-11.8-0.4-14.9,3.9C125.2,192.4,122.3,196.5,122.8,192.1z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                  </svg>
                </div>
              </TabsContent>
              <TabsContent value="back" className="mt-2">
                <div className="relative w-full flex justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="200"
                    height="300"
                    viewBox="0 0 200 356"
                    className="muscular-system-svg"
                  >
                    {/* Base muscular system back */}
                    <image
                      href="https://wger.de/static/images/muscles/muscular_system_back.svg"
                      width="100%"
                      height="100%"
                    />
                    
                    {/* Highlighted muscles - back view */}
                    {highlightedSet.has("back") && (
                      <path
                        d="M70.4,112.3c-5,1.5-10.5,1.4-15.6,0c-4.4-1.5-6.4-6.3-9.6-9.4c-2.5-1.1-5-2.2-7.5-3.3c-2.7,1.4-3.3,4.8-3.4,7.6 c0,12.3,0.7,24.7-0.8,36.9c-1.2,5.5,3.3,9.7,6.8,13.2c4.7,4.7,11,7.1,17.3,8.6c3.8,0.9,6.4-2.9,9.7-4.4c2.5-1.4,5.4-0.1,7.9-1.5 c2.7-1.3,5.9-1.3,8.6,0c2.5,1.4,5.4,0.1,7.9,1.5c3.3,1.5,5.9,5.3,9.7,4.4c6.3-1.5,12.6-3.9,17.3-8.6c3.5-3.5,8-7.6,6.8-13.2 c-1.5-12.2-0.8-24.6-0.8-36.9c-0.1-2.8-0.7-6.2-3.4-7.6c-2.5,1.1-5,2.2-7.5,3.3c-3.2,3.1-5.2,7.9-9.6,9.4c-5.1,1.4-10.6,1.5-15.6,0 c-2-0.6-3.9-1.8-5.6-3.2C74.3,110.5,72.4,111.7,70.4,112.3z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("lats") && (
                      <path
                        d="M31.8,94.4c-2.8,2.8-3.4,6.9-4.7,10.6c-2,5.1-1,10.7-1.2,16c0.7,5.3-1.3,10.9,1.5,15.8c2.2,3.7,5.8,6.1,8.6,9.2 c1.9,3,2.7,6.6,4.8,9.4c1.6,1.6,2.6,4.7,5.1,4.5c2.7-1.5,3.8-4.6,5-7.3c1.6-3.9,2.5-8.1,3-12.3c0.5-6.6,3.2-12.9,4.7-19.4 c0.7-3.1,0.9-6.3,1.4-9.5c-2.6-1.3-5.3-2.7-7.3-4.9c-3.9-4.4-9.5-5.7-14.8-7.1C35.4,98.8,33.4,96.8,31.8,94.4z M162.4,105 c-1.2-3.6-1.8-7.8-4.7-10.5c-1.6,2.3-3.6,4.4-6.1,5.1c-5.3,1.4-10.9,2.7-14.8,7.1c-2,2.2-4.7,3.6-7.3,4.9c0.4,3.2,0.7,6.4,1.4,9.5 c1.5,6.5,4.2,12.8,4.7,19.4c0.4,4.2,1.4,8.4,3,12.3c1.1,2.7,2.3,5.8,5,7.3c2.5,0.2,3.5-2.9,5.1-4.5c2.1-2.9,2.9-6.4,4.8-9.4 c2.8-3.1,6.4-5.5,8.6-9.2c2.8-4.9,0.7-10.5,1.5-15.8C163.4,115.7,164.4,110.1,162.4,105z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("trapezius") && (
                      <path
                        d="M91.4,48.5c-2.5,1.5-3.5,4.3-5.4,6.3c-4.9,5.3-7,13.1-13.9,16.2c-4.4,0.5-7.6,4.2-12,4.4 c-2.7,0.1-5.4-1.4-8-0.4c-1.9,1.7-3.9,3.3-5.8,5c-1.9,1.9-3.8,3.9-5.2,6.2c-1.2,1.4-1.2,3.8,0.4,4.7c2.5,1.2,5,2.5,7.6,3.5 c5.6,1.9,11.7,2,17.5,1c2.4-0.3,4.5-1.7,6.6-2.8c3.2-2.5,7.8-3.2,10.7-6.1c5-2.5,8.7-6.8,12.3-10.9c2.6-2.6,3.4-6.8,2.3-10.1 c0.7-4,1.9-8.1,1.3-12.2C98.7,48.8,93.9,47.3,91.4,48.5z M108.6,48.5c2.5,1.5,3.5,4.3,5.4,6.3c4.9,5.3,7,13.1,13.9,16.2 c4.4,0.5,7.6,4.2,12,4.4c2.7,0.1,5.4-1.4,8-0.4c1.9,1.7,3.9,3.3,5.8,5c1.9,1.9,3.8,3.9,5.2,6.2c1.2,1.4,1.2,3.8-0.4,4.7 c-2.5,1.2-5,2.5-7.6,3.5c-5.6,1.9-11.7,2-17.5,1c-2.4-0.3-4.5-1.7-6.6-2.8c-3.2-2.5-7.8-3.2-10.7-6.1c-5-2.5-8.7-6.8-12.3-10.9 c-2.6-2.6-3.4-6.8-2.3-10.1c-0.7-4-1.9-8.1-1.3-12.2C101.3,48.8,106.1,47.3,108.6,48.5z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("triceps") && (
                      <path
                        d="M35.2,95.7c-4.5,0.8-8.4,3.5-11.7,6.6c-2.1,3.3-4.9,6.1-6.5,9.7c-2.5,6.2-0.8,13.1-1.5,19.6 c-1.5,8.5-4.2,16.8-4.8,25.5c-0.5,2.8,1.1,5.7,3.6,7.1c3.6,2.1,7.6,3.4,11.5,4.9c3.8,0.9,7.6-1.3,10.2-3.8c2.3-2.2,2.9-5.4,4.3-8.1 c1.1-4.5,0.8-9.2,1.4-13.7c0.4-4.8,1.5-9.4,2.5-14c1.1-5.1,2.9-10,3.9-15.1c0.8-3.8,0.4-8.2-2.3-11.2C43.4,98.5,38.9,95.9,35.2,95.7 z M175.9,131.5c-0.7-6.5,1-13.4-1.5-19.6c-1.6-3.5-4.4-6.4-6.5-9.7c-3.4-3-7.2-5.8-11.7-6.6c-3.7,0.3-8.2,2.9-10.6,5.6 c-2.7,3-3.1,7.4-2.3,11.2c1,5.1,2.8,10,3.9,15.1c1,4.6,2.1,9.3,2.5,14c0.6,4.5,0.3,9.3,1.4,13.7c1.4,2.7,2,6,4.3,8.1 c2.7,2.5,6.4,4.7,10.2,3.8c3.9-1.5,7.9-2.8,11.5-4.9c2.4-1.4,4.1-4.3,3.6-7.1C180.1,148.3,177.4,140,175.9,131.5z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("hamstrings") && (
                      <path
                        d="M96.2,183.4c-2.4-1-5.1-1.8-7.7-1.2c-5.6,1.3-11.6,1.4-16.5,4.8c-4.8,3.6-6.2,9.9-7.2,15.5 c-2.5,17.2-4.3,34.6-8.5,51.5c-1.2,3.7-1.7,8-0.1,11.5c1.8,3.3,5.3,5.8,5.3,9.7c2.4,4.9,6.6,8.4,11.6,10.4c2.5,1.1,5.4,0.5,7.2-1.5 c1.9-1.7,1.4-4.6,2.6-6.7c1.3-3.4,2.2-7,3.5-10.4c2.5-6.9,3.5-14.2,4.2-21.5c0.6-5.7,0.7-11.4,0.5-17.1c-0.1-5.2-0.1-10.5-0.3-15.7 c0.1-4.5,0.5-9.1,0.7-13.6c0.2-3.6,0.2-7.2,0.7-10.8C94.2,186.1,95.6,184.8,96.2,183.4z M128.3,187c-4.9-3.4-10.9-3.5-16.5-4.8 c-2.6-0.6-5.3,0.2-7.7,1.2c0.5,1.4,2,2.7,2.9,3.9c0.5,3.6,0.5,7.2,0.7,10.8c0.2,4.5,0.6,9.1,0.7,13.6c-0.2,5.2-0.2,10.5-0.3,15.7 c-0.2,5.7-0.1,11.4,0.5,17.1c0.8,7.3,1.7,14.6,4.2,21.5c1.3,3.4,2.2,7,3.5,10.4c1.2,2.1,0.7,5,2.6,6.7c1.8,2,4.7,2.6,7.2,1.5 c4.9-2,9.2-5.5,11.6-10.4c0-3.9,3.5-6.4,5.3-9.7c1.5-3.5,1.1-7.8-0.1-11.5c-4.2-16.9-6-34.3-8.5-51.5C134.5,196.9,133.1,190.5,128.3,187z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("glutes") && (
                      <path
                        d="M81.1,158.7c-3.7,3.7-8.4,7.7-8.6,13.4c-0.8,5.6-1.5,11.7,1.5,16.6c2.8,4.7,8.1,7.1,13.3,8.2 c1.9,0.1,3.8,0.1,5.6,0.9c3,1.4,7.5,1.6,9.8-1.1c2-1.1,4.1-2.1,6.4-2.3c5.2-1,10.5-3.2,13.5-7.8c2.8-5.1,1.9-11.1,1.1-16.6 c-0.3-5.6-5.1-9.6-8.9-13.2c-1.4-1.2-2.8-2.4-4.2-3.6c-1.9,4.6-6.6,7.6-11.5,7c-4.4,0.5-8.6-2.2-10.6-6.1c-1.4,1-2.7,2.1-4,3.1 C83.3,156.9,82.2,157.7,81.1,158.7z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("calves") && (
                      <path
                        d="M59.1,263c-0.9,10.1-6.6,19.2-7.3,29.2c-0.6,5.1-0.5,10.3-0.8,15.5c-0.1,2.6,2.2,4.9,4.7,5.6 c3.6,0.9,7.3,1.5,11.1,0.9c3.2-0.5,6.2-2.6,7.3-5.7c2.5-7.6,2.6-15.7,2.4-23.7c-0.3-8.3-0.3-16.6-1.9-24.7c-0.6-4.2-1.6-8.3-2.9-12.3 c-1.9-6-6.4-10.3-11.4-13.7C59.7,243.5,60,253.4,59.1,263z M125.5,246.8c-5,3.4-9.5,7.7-11.4,13.7c-1.3,4-2.3,8.1-2.9,12.3 c-1.6,8.1-1.6,16.4-1.9,24.7c-0.2,7.9-0.1,16,2.4,23.7c1.1,3.1,4.1,5.2,7.3,5.7c3.8,0.6,7.5,0,11.1-0.9c2.5-0.7,4.9-3,4.7-5.6 c-0.2-5.2-0.2-10.4-0.8-15.5c-0.7-10-6.4-19.1-7.3-29.2C125.9,253.4,126.2,243.5,125.5,246.8z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                  </svg>
                </div>
              </TabsContent>
            </Tabs>
            
            {!isLoading && trainedMuscles?.length === 0 && (
              <p className="text-center text-gray-500 mt-4 text-sm">
                No muscles trained yet this week.
              </p>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
