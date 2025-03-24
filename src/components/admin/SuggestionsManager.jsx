import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
      return data.filter((s) => !!s.workout_name); // only filter if name is missing
    },
  });

  const addToTemplates = useMutation({
    mutationFn: async ({ suggestion, updates }) => {
      const { error } = await supabase.from("exercise_templates").insert({
        name: suggestion.workout_name,
        media_url: updates.media_link,
        description: updates.description || "",
        muscles: updates.muscles,
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

  if (isLoading) return <div>Loading suggestions...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Exercise Suggestions</h2>

      {suggestions.length === 0 ? (
        <p>No suggestions yet.</p>
      ) : (
        suggestions.map((sugg) => {
          const [mediaLink, setMediaLink] = useState("");
          const [muscles, setMuscles] = useState("");
          const [description, setDescription] = useState("");

          return (
            <div
              key={sugg.id}
              className="border rounded p-4 flex flex-col gap-2 shadow-sm bg-white"
            >
              <div>
                <strong>Name:</strong> {sugg.workout_name}
              </div>

              <Input
                placeholder="Media URL"
                value={mediaLink}
                onChange={(e) => setMediaLink(e.target.value)}
              />

              <Input
                placeholder="Target Muscles"
                value={muscles}
                onChange={(e) => setMuscles(e.target.value)}
              />

              <Textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="flex justify-end mt-2">
                <Button
                  onClick={() =>
                    addToTemplates.mutate({
                      suggestion: sugg,
                      updates: { media_link: mediaLink, muscles, description },
                    })
                  }
                  disabled={addToTemplates.isPending}
                >
                  Add to Templates
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default SuggestionsManager;
