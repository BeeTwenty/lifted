import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const SuggestionsManager = () => {
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["exerciseSuggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_suggestions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addToTemplates = useMutation({
    mutationFn: async (suggestion) => {
      const { error } = await supabase.from("exercise_templates").insert({
        name: suggestion.workout_name,
        media_url: suggestion.media_link,
        description: suggestion.description || "",
        muscles: suggestion.muscles,
      });
      if (error) throw error;

      await supabase.from("exercise_suggestions").delete().eq("id", suggestion.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["exerciseSuggestions"]);
      toast({ title: "Added to templates ✅" });
    },
    onError: () => {
      toast({ title: "Failed to add exercise", variant: "destructive" });
    },
  });

  const validSuggestions = suggestions.filter(
    (s) => s.media_link && s.muscles
  );

  if (isLoading) return <div>Loading suggestions...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Exercise Suggestions</h2>

      {suggestions.length > 0 && validSuggestions.length < suggestions.length && (
        <p className="text-sm text-muted-foreground italic">
          Some suggestions were hidden because they’re missing required fields.
        </p>
      )}

      {validSuggestions.length === 0 ? (
        <p>No suggestions yet.</p>
      ) : (
        validSuggestions.map((sugg) => (
          <div
            key={sugg.id}
            className="border rounded p-4 flex flex-col gap-2 shadow-sm bg-white"
          >
            <div><strong>Name:</strong> {sugg.workout_name}</div>
            <div><strong>Media URL:</strong> {sugg.media_link}</div>
            <div><strong>Muscles:</strong> {sugg.muscles}</div>
            {sugg.description && (
              <div><strong>Description:</strong> {sugg.description}</div>
            )}
            <div className="flex justify-end mt-2">
              <Button
                onClick={() => addToTemplates.mutate(sugg)}
                disabled={addToTemplates.isPending}
              >
                Add to Templates
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SuggestionsManager;
