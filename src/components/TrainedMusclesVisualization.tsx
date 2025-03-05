
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
                    
                    {/* Highlighted muscles - refined paths for better precision */}
                    {highlightedSet.has("chest") && (
                      <path
                        d="M76.8,101.5c-5.2,2.7-6.9,9.1-7.9,14.5c-1.1,6.3-0.2,13.1,2.8,18.7c1.2,2.3,3.8,3.6,6.3,3.9c5.1-0.6,10.6-5.7,15.6-3.1c3.8,1.9,8.6,1.7,12.2-0.5c3.8-2.3,7.9-6.9,6.8-11.8c-0.9-7.9-2.1-16-6.7-22.5c-3.3-4.6-9.6-5.8-14.8-4.1C86.7,97.6,81.5,99.2,76.8,101.5z M123.2,101.5c5.2,2.7,6.9,9.1,7.9,14.5c1.1,6.3,0.2,13.1-2.8,18.7c-1.2,2.3-3.8,3.6-6.3,3.9c-5.1-0.6-10.6-5.7-15.6-3.1c-3.8,1.9-8.6,1.7-12.2-0.5c-3.8-2.3-7.9-6.9-6.8-11.8c0.9-7.9,2.1-16,6.7-22.5c3.3-4.6,9.6-5.8,14.8-4.1C113.3,97.6,118.5,99.2,123.2,101.5z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("abs") && (
                      <path
                        d="M88.4,139.2c-4.2,1.8-5.4,6.8-5.9,11c-0.3,5.7,0.7,11.5,3.1,16.7c1.8,4.1,4.4,7.7,7.5,10.8c1.5,1.3,3,2.7,4.9,3.2c3.4,0.8,7.1,0.7,10.4-0.4c1.8-0.6,3.4-1.7,4.8-3c3.6-3.4,5.9-8,7.8-12.6c2-5,3.1-10.4,2.9-15.8c-0.2-4.3-1.5-9.2-5.5-11.3c-6.4-3.3-14.2-2.3-20.9-0.2C95,138.5,91.6,138.2,88.4,139.2z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("shoulders") && (
                      <path
                        d="M59.1,82.5c-7.4,6.3-16.5,10.9-22.1,19.1c-1.6,3-2.5,6.4-2.1,9.8c2.3,11.1,6.5,21.6,10.2,32.2c1,2.7,3.6,4.2,6.4,4.3c4.8,0.5,9.6-1.3,13.4-4.2c2.5-1.9,5.2-4.1,6-7.2c2.1-7.4,1.1-15.3,2.4-22.9c0.9-3.7,2.5-7.1,5-10c1.9-2.2,4.2-4,6-6.2c1.8-2.4,2.9-5.4,2.3-8.4c-0.8-3.9-3.7-7-6.9-9.3C67.9,76.1,63.2,78.8,59.1,82.5z M140.9,82.5c7.4,6.3,16.5,10.9,22.1,19.1c1.6,3,2.5,6.4,2.1,9.8c-2.3,11.1-6.5,21.6-10.2,32.2c-1,2.7-3.6,4.2-6.4,4.3c-4.8,0.5-9.6-1.3-13.4-4.2c-2.5-1.9-5.2-4.1-6-7.2c-2.1-7.4-1.1-15.3-2.4-22.9c-0.9-3.7-2.5-7.1-5-10c-1.9-2.2-4.2-4-6-6.2c-1.8-2.4-2.9-5.4-2.3-8.4c0.8-3.9,3.7-7,6.9-9.3C132.1,76.1,136.8,78.8,140.9,82.5z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("biceps") && (
                      <path
                        d="M37.3,130.6c-3.8,2.3-8.3,3.9-11.5,7.2c-1.8,2.3-2.1,5.3-2.2,8.1c0.1,9.4,1.5,18.8,4.9,27.5c1.2,2.9,4.5,4.5,7.6,4.1c3.8-0.4,7.3-2.2,10.1-4.8c2.5-2.3,3.6-5.7,4.1-9c1.4-7.1,2.8-14.2,5.8-20.8c1.3-2.8,3.2-5.8,2.6-9c-0.5-3.2-3.6-4.9-6.2-6.4C47.6,125.3,41.8,127.9,37.3,130.6z M162.7,130.6c3.8,2.3,8.3,3.9,11.5,7.2c1.8,2.3,2.1,5.3,2.2,8.1c-0.1,9.4-1.5,18.8-4.9,27.5c-1.2,2.9-4.5,4.5-7.6,4.1c-3.8-0.4-7.3-2.2-10.1-4.8c-2.5-2.3-3.6-5.7-4.1-9c-1.4-7.1-2.8-14.2-5.8-20.8c-1.3-2.8-3.2-5.8-2.6-9c0.5-3.2,3.6-4.9,6.2-6.4C152.4,125.3,158.2,127.9,162.7,130.6z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("forearms") && (
                      <path
                        d="M22.8,175.1c-2.7,1.2-4.8,3.6-5.8,6.4c-1.5,5.4-1.3,11.1,0.5,16.3c2.8,7.5,6.9,14.5,12.2,20.6c1.8,2,4.4,3.2,7.1,3.5c2.7,0.2,5.7-0.5,7.6-2.4c5.3-6.4,8.4-14.2,11.2-21.9c1.5-4.2,2.9-8.5,3.7-12.9c0.5-3.1,0.3-6.5-1.4-9.2c-1.8-2.7-5.4-3.6-8.4-2.7c-4.9,0.9-8.7,4.4-13.5,5.7C31.5,179.8,26.6,178.7,22.8,175.1z M177.2,175.1c2.7,1.2,4.8,3.6,5.8,6.4c1.5,5.4,1.3,11.1-0.5,16.3c-2.8,7.5-6.9,14.5-12.2,20.6c-1.8,2-4.4,3.2-7.1,3.5c-2.7,0.2-5.7-0.5-7.6-2.4c-5.3-6.4-8.4-14.2-11.2-21.9c-1.5-4.2-2.9-8.5-3.7-12.9c-0.5-3.1-0.3-6.5,1.4-9.2c1.8-2.7,5.4-3.6,8.4-2.7c4.9,0.9,8.7,4.4,13.5,5.7C168.5,179.8,173.4,178.7,177.2,175.1z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("quads") && (
                      <path
                        d="M71.3,192.1c-5.8,2.3-12.1,3.7-16.9,8c-3.4,3.2-4.6,8.1-5.5,12.7c-2.7,12.3-3.4,24.9-4.6,37.4c-0.5,5.3-1.1,10.6-0.8,15.9c0.2,3.3,3.2,5.6,6.1,6.8c7,3.3,14.3,6,21.8,7.6c3.4,0.6,7.2,0.3,9.8-2c2.5-2.1,3.7-5.4,4.8-8.4c3.6-10.4,6.4-21.1,8.3-32c0.9-5.3,1.6-10.5,1.5-15.9c-0.1-5.5-0.7-11.2-3.2-16.1c-1.3-2.4-3.5-4.3-6-5.3C81.4,198.1,76.1,195.3,71.3,192.1z M128.7,192.1c5.8,2.3,12.1,3.7,16.9,8c3.4,3.2,4.6,8.1,5.5,12.7c2.7,12.3,3.4,24.9,4.6,37.4c0.5,5.3,1.1,10.6,0.8,15.9c-0.2,3.3-3.2,5.6-6.1,6.8c-7,3.3-14.3,6-21.8,7.6c-3.4,0.6-7.2,0.3-9.8-2c-2.5-2.1-3.7-5.4-4.8-8.4c-3.6-10.4-6.4-21.1-8.3-32c-0.9-5.3-1.6-10.5-1.5-15.9c0.1-5.5,0.7-11.2,3.2-16.1c1.3-2.4,3.5-4.3,6-5.3C118.6,198.1,123.9,195.3,128.7,192.1z"
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
                    
                    {/* Highlighted muscles - back view with improved precision */}
                    {highlightedSet.has("back") && (
                      <path
                        d="M60.4,107.3c-3.9,1.5-8.1,1.6-12.2,1.6c-3.4-0.1-6.4-1.9-8.8-4.2c-3-2.9-5.4-6.5-9.4-8.1c-3.4,1.2-4.3,5.2-4.5,8.5c-0.5,11-0.7,22-0.2,33c0.1,4.6,1.9,9.3,5.4,12.3c5.2,4.3,11.5,7,18,8.1c3.8,0.6,7.4-0.7,10.6-2.7c3.1-2,6.8-1.9,10.2-1.4c7.3,1.1,15.1,1.2,21.9-1.9c5.3-2.6,10.7-5.9,13.5-11.2c2.1-4.3,2.6-9.3,2.3-14.1c-0.5-9.1-0.2-18.3-0.4-27.4c-0.1-3.4-1.3-7.2-4.5-8.8c-4.1,1.6-6.6,5.5-9.9,8.3c-2.6,2.2-5.7,3.6-9.1,3.6C76.6,103.1,68,102.8,60.4,107.3z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("lats") && (
                      <path
                        d="M32.5,96.4c-2.8,3.2-3.6,7.6-4.2,11.7c-1.1,7.3-0.7,14.7-0.2,22c0.4,5,1.7,10.4,5.3,14c5.6,5.8,12.2,11.1,14.1,19.1c0.5,2.2,1.7,4.5,3.9,5.1c3.8,0.5,6.8-2.5,8.5-5.6c3-5.8,3.3-12.5,4.4-18.9c1.3-7.6,3.4-14.9,5.6-22.2c0.9-2.9,1.8-5.9,1.6-9c-0.1-2.8-2.5-4.9-4.8-6.1c-3.1-1.6-6.3-3.1-9.8-3c-4.8,0.2-9,2.9-13.4,4.7C39.9,90.2,35.5,92.5,32.5,96.4z M167.5,96.4c2.8,3.2,3.6,7.6,4.2,11.7c1.1,7.3,0.7,14.7,0.2,22c-0.4,5-1.7,10.4-5.3,14c-5.6,5.8-12.2,11.1-14.1,19.1c-0.5,2.2-1.7,4.5-3.9,5.1c-3.8,0.5-6.8-2.5-8.5-5.6c-3-5.8-3.3-12.5-4.4-18.9c-1.3-7.6-3.4-14.9-5.6-22.2c-0.9-2.9-1.8-5.9-1.6-9c0.1-2.8,2.5-4.9,4.8-6.1c3.1-1.6,6.3-3.1,9.8-3c4.8,0.2,9,2.9,13.4,4.7C160.1,90.2,164.5,92.5,167.5,96.4z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("trapezius") && (
                      <path
                        d="M89.5,46.5c-2.6,2.1-3.9,5.4-5.5,8.3c-2.4,4.6-3.7,9.8-7.2,13.7c-3.6,3.9-8.7,5.8-13.7,7c-5.3,1.2-10.8,4.3-16.1,2.1c-3.5,3-7.2,5.8-10.1,9.4c-2.1,3-1.1,7.1,2.1,8.8c4.5,2.5,9.5,4.3,14.7,4.2c9.7-0.1,19.1-5.4,25.1-13c4.1-5.3,8.3-10.4,12.9-15.3c2.8-3,4.9-6.7,5.4-10.9c0.5-4.2,0.5-8.5-0.5-12.6C95.1,44.4,91.8,44.8,89.5,46.5z M110.5,46.5c2.6,2.1,3.9,5.4,5.5,8.3c2.4,4.6,3.7,9.8,7.2,13.7c3.6,3.9,8.7,5.8,13.7,7c5.3,1.2,10.8,4.3,16.1,2.1c3.5,3,7.2,5.8,10.1,9.4c2.1,3,1.1,7.1-2.1,8.8c-4.5,2.5-9.5,4.3-14.7,4.2c-9.7-0.1-19.1-5.4-25.1-13c-4.1-5.3-8.3-10.4-12.9-15.3c-2.8-3-4.9-6.7-5.4-10.9c-0.5-4.2-0.5-8.5,0.5-12.6C104.9,44.4,108.2,44.8,110.5,46.5z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("triceps") && (
                      <path
                        d="M32.5,104.7c-3.3,3.2-6.1,7.1-7.5,11.6c-2,7.4-1.4,15.3-2.5,22.9c-1.4,9.8-3.5,19.5-3.8,29.4c0,3.6,2.6,6.6,5.8,8c3.4,1.5,7.1,2.3,10.8,2c2.3-0.3,4.6-1.3,6-3.1c2.8-3.8,3.3-8.6,4.2-13.1c1.3-6.6,1.5-13.3,2.6-19.9c1-6,2.4-11.9,3.1-18c0.5-3.8,0.3-7.9-1.7-11.2c-2.2-3.5-6.1-5.2-9.9-6.1C37.1,106.4,34.6,105.6,32.5,104.7z M167.5,104.7c3.3,3.2,6.1,7.1,7.5,11.6c2,7.4,1.4,15.3,2.5,22.9c1.4,9.8,3.5,19.5,3.8,29.4c0,3.6-2.6,6.6-5.8,8c-3.4,1.5-7.1,2.3-10.8,2c-2.3-0.3-4.6-1.3-6-3.1c-2.8-3.8-3.3-8.6-4.2-13.1c-1.3-6.6-1.5-13.3-2.6-19.9c-1-6-2.4-11.9-3.1-18c-0.5-3.8-0.3-7.9,1.7-11.2c2.2-3.5,6.1-5.2,9.9-6.1C162.9,106.4,165.4,105.6,167.5,104.7z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("hamstrings") && (
                      <path
                        d="M80.5,186.4c-5.9,2-12.5,1.7-17.4,6c-3.1,2.7-3.9,7-4.5,10.9c-2.2,16.7-3.3,33.7-6.5,50.2c-0.8,4.1-0.5,9,2.7,12c2.6,2.5,6.3,3.2,9.7,3.2c3.6-0.1,7.3-1.5,9.7-4.2c2-2.3,2.5-5.4,3.3-8.2c2-9.1,3.2-18.3,4-27.6c0.8-8.9,1.1-17.8,1.3-26.7c0.1-4.8,0.4-9.7-0.5-14.4C81.8,186.8,81.2,186.4,80.5,186.4z M119.5,186.4c5.9,2,12.5,1.7,17.4,6c3.1,2.7,3.9,7,4.5,10.9c2.2,16.7,3.3,33.7,6.5,50.2c0.8,4.1,0.5,9-2.7,12c-2.6,2.5-6.3,3.2-9.7,3.2c-3.6-0.1-7.3-1.5-9.7-4.2c-2-2.3-2.5-5.4-3.3-8.2c-2-9.1-3.2-18.3-4-27.6c-0.8-8.9-1.1-17.8-1.3-26.7c-0.1-4.8-0.4-9.7,0.5-14.4C118.2,186.8,118.8,186.4,119.5,186.4z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("glutes") && (
                      <path
                        d="M76.1,155.7c-4.2,4.1-5,10.6-3.9,16.1c0.9,4.7,4.1,8.6,7.6,11.7c3.7,3.2,8.4,5.3,13.3,5.2c4-0.1,7.3-2.5,10.8-4.3c3.9-2,8.6-2.2,12.2-4.9c3.5-2.6,5.7-6.6,6.7-10.8c1.4-5.9,0.1-12.7-4.1-17c-2.2-2.2-5.2-2.8-8.1-3.6c-4.4-1.3-6.7-6-10.5-8.4c-4.2,2.9-7,7.5-11.6,9.8C85.1,152.1,80,152.1,76.1,155.7z"
                        fill="#ef4444"
                        opacity="0.6"
                      />
                    )}
                    {highlightedSet.has("calves") && (
                      <path
                        d="M59.5,265c-0.8,10.1-4.5,19.8-5.2,30c-0.1,5.1,0,10.2-0.3,15.3c0,3.3,2.8,5.7,5.8,6.6c3.9,1.1,8.1,0.9,11.8-0.7c2.9-1.4,4.6-4.5,5-7.6c1.3-7.5,0.9-15.2,0.4-22.7c-0.6-9.1-1.4-18.1-3.4-27c-0.8-3.6-2.2-7-4.4-9.9c-1.9-2.5-5-4.1-8.2-4C60.2,250.8,60,257.9,59.5,265z M140.5,265c0.8,10.1,4.5,19.8,5.2,30c0.1,5.1,0,10.2,0.3,15.3c0,3.3-2.8,5.7-5.8,6.6c-3.9,1.1-8.1,0.9-11.8-0.7c-2.9-1.4-4.6-4.5-5-7.6c-1.3-7.5-0.9-15.2-0.4-22.7c0.6-9.1,1.4-18.1,3.4-27c0.8-3.6,2.2-7,4.4-9.9c1.9-2.5,5-4.1,8.2-4C139.8,250.8,140,257.9,140.5,265z"
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
