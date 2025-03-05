
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Edit, 
  ImagePlus,
  RefreshCw
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database as DatabaseTypes } from "@/integrations/supabase/types";

type ExerciseTemplate = DatabaseTypes["public"]["Tables"]["exercise_templates"]["Row"];

interface MissingMediaManagerProps {
  isAdmin: boolean;
}

const DEFAULT_MISSING_MEDIA = "https://fakeimg.pl/600x400/b36666/ffffff?text=No+Media&font=bebas";

const MissingMediaManager = ({ isAdmin }: MissingMediaManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<ExerciseTemplate | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");

  // Fetch exercise templates with missing media
  const { data: exercisesWithoutMedia, isLoading, refetch } = useQuery({
    queryKey: ["exercisesWithoutMedia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_templates")
        .select("*")
        .or(`media_url.eq.${DEFAULT_MISSING_MEDIA},media_url.is.null`);
      
      if (error) throw error;
      return data as ExerciseTemplate[];
    },
    enabled: isAdmin,
  });

  const updateExerciseMediaMutation = useMutation({
    mutationFn: async ({ id, mediaUrl }: { id: string; mediaUrl: string }) => {
      const { error } = await supabase
        .from("exercise_templates")
        .update({ media_url: mediaUrl })
        .eq("id", id);
      
      if (error) throw error;
      return { id, mediaUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercisesWithoutMedia"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Media URL updated",
        description: "The exercise template media URL was successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error updating media URL",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  const handleEditClick = (item: ExerciseTemplate) => {
    setCurrentItem(item);
    setMediaUrl(item.media_url || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveMediaUrl = () => {
    if (!currentItem) return;
    
    updateExerciseMediaMutation.mutate({
      id: currentItem.id,
      mediaUrl: mediaUrl.trim(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Missing Media Manager</CardTitle>
        <CardDescription>
          Manage exercise templates that are missing media assets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Exercises Without Media</h3>
            <Button onClick={() => refetch()} variant="outline" className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center">Loading exercise data...</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Target Muscle</TableHead>
                    <TableHead>Current Media URL</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exercisesWithoutMedia?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No exercises found with missing media
                      </TableCell>
                    </TableRow>
                  ) : (
                    exercisesWithoutMedia?.map((exercise) => (
                      <TableRow key={exercise.id}>
                        <TableCell className="font-medium">{exercise.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{exercise.description}</TableCell>
                        <TableCell>{exercise.target_muscle || "N/A"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {exercise.media_url || "No URL"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(exercise)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Media URL</DialogTitle>
            <DialogDescription>
              Enter a new media URL for {currentItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="media-url" className="text-right">
                Media URL
              </Label>
              <Input
                id="media-url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="col-span-3"
              />
            </div>
            {mediaUrl && (
              <div className="mt-2 border rounded-md overflow-hidden">
                <img
                  src={mediaUrl}
                  alt="Media preview"
                  className="w-full h-auto max-h-[200px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_MISSING_MEDIA;
                  }}
                />
                <p className="text-xs text-center py-1 bg-slate-100">Preview</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveMediaUrl}
              className="flex items-center"
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Save Media URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MissingMediaManager;
