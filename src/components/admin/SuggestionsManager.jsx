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
      return data ?? [];
    },
  });

  const addToTemplates = useMutation({
    mutationFn: async ({ suggestion, updates }) => {
      const { error } = await supabase.from("exercise_templates").insert({
        name: suggestion.workout_name,
        media_url: updates.media_url || null,
        description: updates.description || "",
        muscles: updates.muscles || "",
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
                  <TableHead className="w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((sugg) => {
                  const [media_url, setMediaUrl] = useState("");
                  const [muscles, setMuscles] = useState("");
                  const [description, setDescription] = useState("");

                  return (
                    <TableRow key={sugg.id}>
                      <TableCell className="font-medium">{sugg.workout_name}</TableCell>
                      <TableCell>
                        <Input
                          value={media_url}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder="https://media.example.com"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={muscles}
                          onChange={(e) => setMuscles(e.target.value)}
                          placeholder="Chest, Arms, Legs..."
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Optional description..."
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() =>
                            addToTemplates.mutate({
                              suggestion: sugg,
                              updates: { media_url, muscles, description },
                            })
                          }
                          disabled={addToTemplates.isPending}
                        >
                          Add
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