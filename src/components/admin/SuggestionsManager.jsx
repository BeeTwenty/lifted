import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Trash } from "lucide-react";

const SuggestionsManager = () => {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState({});

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["exerciseSuggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_suggestions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addToTemplates = useMutation({
    mutationFn: async ({ suggestion, updates }) => {
      const { error } = await supabase.from("exercise_templates").insert({
        name: suggestion.workout_name,
        media_url: updates.media_url || null,
        description: updates.description || "",
        target_muscle: updates.muscles
          ? updates.muscles.split(",").map((m) => m.trim()).join(", ")
          : "",
      });
      if (error) throw error;

      const { error: deleteError } = await supabase
        .from("exercise_suggestions")
        .delete()
        .eq("id", suggestion.id);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["exerciseSuggestions"]);
      toast({ title: "Added to templates ✅" });
    },
    onError: () => {
      toast({ title: "Failed to add exercise", variant: "destructive" });
    },
  });

  const rejectSuggestion = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("exercise_suggestions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["exerciseSuggestions"]);
      toast({ title: "Suggestion rejected and deleted ❌" });
    },
    onError: () => {
      toast({ title: "Failed to delete suggestion", variant: "destructive" });
    },
  });

  const updateForm = (id, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercise Suggestions</CardTitle>
        <CardDescription>Review and promote user-submitted suggestions.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center">Loading suggestions...</div>
        ) : suggestions.length === 0 ? (
          <p className="text-center text-muted-foreground">No suggestions yet.</p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Media URL</TableHead>
                  <TableHead>Muscles</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-36">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((sugg) => {
                  const state = formState[sugg.id] || { media_url: "", muscles: "", description: "" };

                  return (
                    <TableRow key={sugg.id}>
                      <TableCell className="font-medium">{sugg.workout_name}</TableCell>
                      <TableCell>
                        <Input
                          value={state.media_url}
                          onChange={(e) => updateForm(sugg.id, "media_url", e.target.value)}
                          placeholder="https://media.example.com"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={state.muscles}
                          onChange={(e) => updateForm(sugg.id, "muscles", e.target.value)}
                          placeholder="Biceps, Triceps, Quads..."
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={state.description}
                          onChange={(e) => updateForm(sugg.id, "description", e.target.value)}
                          placeholder="Optional description..."
                        />
                      </TableCell>
                      <TableCell className="flex gap-2 items-center">
                        <Button
                          size="sm"
                          onClick={() =>
                            addToTemplates.mutate({
                              suggestion: sugg,
                              updates: state,
                            })
                          }
                          disabled={addToTemplates.isPending}
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectSuggestion.mutate(sugg.id)}
                          disabled={rejectSuggestion.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuggestionsManager;
