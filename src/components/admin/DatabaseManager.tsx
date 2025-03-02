
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
  Trash, 
  Plus, 
  Database, 
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database as DatabaseTypes } from "@/integrations/supabase/types";
import { PostgrestError } from "@supabase/supabase-js";

// Define allowed table names as a type to satisfy TypeScript
type AllowedTable = "exercise_templates" | "food_logs" | "workouts" | "profiles";

// Define type for the exercise templates table
type ExerciseTemplate = DatabaseTypes["public"]["Tables"]["exercise_templates"]["Insert"];
// Define type for the food logs table
type FoodLog = DatabaseTypes["public"]["Tables"]["food_logs"]["Insert"];
// Define type for the workouts table
type Workout = DatabaseTypes["public"]["Tables"]["workouts"]["Insert"];
// Define type for the profiles table
type Profile = DatabaseTypes["public"]["Tables"]["profiles"]["Insert"];

// Union type for all table types
type TableRow = ExerciseTemplate | FoodLog | Workout | Profile;

interface DatabaseManagerProps {
  isAdmin: boolean;
}

const DatabaseManager = ({ isAdmin }: DatabaseManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Database Management
  const [selectedTable, setSelectedTable] = useState<AllowedTable>("exercise_templates");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  
  // Get table data
  const { data: tables } = useQuery({
    queryKey: ["adminTables"],
    queryFn: async () => {
      return ["exercise_templates", "food_logs", "workouts", "profiles"] as AllowedTable[];
    },
    enabled: isAdmin,
  });

  const { data: selectedTableData, isLoading: tableDataLoading, refetch: refetchTableData } = useQuery({
    queryKey: ["tableData", selectedTable],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(selectedTable)
        .select("*")
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Get table columns
  const { data: tableColumns, isLoading: columnsLoading } = useQuery({
    queryKey: ["tableColumns", selectedTable],
    queryFn: async () => {
      // This would normally query the database for column information
      // For simplicity, we're using hardcoded columns based on the table
      switch (selectedTable) {
        case "exercise_templates":
          return ["id", "name", "description", "target_muscle", "media_url", "created_at"];
        case "food_logs":
          return ["id", "user_id", "name", "calories", "protein", "carbs", "fat", "date", "created_at"];
        case "workouts":
          return ["id", "user_id", "title", "duration", "notes", "created_at"];
        case "profiles":
          return ["id", "full_name", "username", "avatar_url", "daily_calories", "workout_goal", "hour_goal", "updated_at"];
        default:
          return [];
      }
    },
    enabled: isAdmin,
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(selectedTable)
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tableData", selectedTable] });
      toast({
        title: "Item deleted",
        description: "The item was successfully deleted.",
      });
    },
    onError: (error: PostgrestError | Error) => {
      toast({
        variant: "destructive",
        title: "Error deleting item",
        description: error instanceof PostgrestError ? error.message : (error as Error).message,
      });
    },
  });

  // Create a type-safe update function for each table type
  const updateExerciseTemplate = async (data: Partial<ExerciseTemplate> & { id: string }) => {
    const { id, ...updateData } = data;
    const { error } = await supabase
      .from("exercise_templates")
      .update(updateData as ExerciseTemplate)
      .eq("id", id);
    if (error) throw error;
    return data;
  };
  
  const updateFoodLog = async (data: Partial<FoodLog> & { id: string }) => {
    const { id, ...updateData } = data;
    const { error } = await supabase
      .from("food_logs")
      .update(updateData as FoodLog)
      .eq("id", id);
    if (error) throw error;
    return data;
  };
  
  const updateWorkout = async (data: Partial<Workout> & { id: string }) => {
    const { id, ...updateData } = data;
    const { error } = await supabase
      .from("workouts")
      .update(updateData as Workout)
      .eq("id", id);
    if (error) throw error;
    return data;
  };
  
  const updateProfile = async (data: Partial<Profile> & { id: string }) => {
    const { id, ...updateData } = data;
    const { error } = await supabase
      .from("profiles")
      .update(updateData as Profile)
      .eq("id", id);
    if (error) throw error;
    return data;
  };

  // Type-safe update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const { id } = data;
      if (!id) throw new Error("ID is required for updates");
      
      switch (selectedTable) {
        case "exercise_templates":
          return updateExerciseTemplate(data as Partial<ExerciseTemplate> & { id: string });
        case "food_logs":
          return updateFoodLog(data as Partial<FoodLog> & { id: string });
        case "workouts":
          return updateWorkout(data as Partial<Workout> & { id: string });
        case "profiles":
          return updateProfile(data as Partial<Profile> & { id: string });
        default:
          throw new Error(`Unknown table: ${selectedTable}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tableData", selectedTable] });
      setIsEditDialogOpen(false);
      toast({
        title: "Item updated",
        description: "The item was successfully updated.",
      });
    },
    onError: (error: PostgrestError | Error) => {
      toast({
        variant: "destructive",
        title: "Error updating item",
        description: error instanceof PostgrestError ? error.message : (error as Error).message,
      });
    },
  });

  // Create a type-safe create function for each table type
  const createExerciseTemplate = async (data: Partial<ExerciseTemplate>) => {
    const newData: Partial<ExerciseTemplate> = {
      name: data.name || "New Exercise",
      description: data.description || "Description",
      target_muscle: data.target_muscle || "General",
      media_url: data.media_url || "https://placehold.co/400",
    };
    
    const { error } = await supabase
      .from("exercise_templates")
      .insert(newData);
    if (error) throw error;
    return newData;
  };
  
  const createFoodLog = async (data: Partial<FoodLog>) => {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    const newData: Partial<FoodLog> = {
      user_id: data.user_id || user.id,
      name: data.name || "New Food Item",
      calories: data.calories || 0,
      protein: data.protein || 0,
      carbs: data.carbs || 0,
      fat: data.fat || 0,
    };
    
    const { error } = await supabase
      .from("food_logs")
      .insert(newData);
    if (error) throw error;
    return newData;
  };
  
  const createWorkout = async (data: Partial<Workout>) => {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    const newData: Partial<Workout> = {
      user_id: data.user_id || user.id,
      title: data.title || "New Workout",
      duration: data.duration || 30,
      notes: data.notes || "",
    };
    
    const { error } = await supabase
      .from("workouts")
      .insert(newData);
    if (error) throw error;
    return newData;
  };
  
  // Type-safe create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      // For profiles, we need to handle them differently since they link to auth users
      if (selectedTable === "profiles") {
        toast({
          variant: "destructive",
          title: "Cannot create profiles directly",
          description: "Profiles are created automatically when users sign up.",
        });
        throw new Error("Cannot create profiles directly");
      }
      
      switch (selectedTable) {
        case "exercise_templates":
          return createExerciseTemplate(data as Partial<ExerciseTemplate>);
        case "food_logs":
          return createFoodLog(data as Partial<FoodLog>);
        case "workouts":
          return createWorkout(data as Partial<Workout>);
        default:
          throw new Error(`Unknown table: ${selectedTable}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tableData", selectedTable] });
      setIsEditDialogOpen(false);
      toast({
        title: "Item created",
        description: "The item was successfully created.",
      });
    },
    onError: (error: PostgrestError | Error) => {
      toast({
        variant: "destructive",
        title: "Error creating item",
        description: error instanceof PostgrestError ? error.message : (error as Error).message,
      });
    },
  });

  // Handle edit button click
  const handleEditClick = (item: any) => {
    setCurrentItem(item);
    setEditFormData(item);
    setIsEditDialogOpen(true);
  };

  // Handle create new item
  const handleCreateClick = () => {
    setCurrentItem(null);
    // Initialize empty form data based on columns
    const emptyForm: Record<string, any> = {};
    tableColumns?.forEach(column => {
      if (column !== 'id' && column !== 'created_at' && column !== 'updated_at') {
        emptyForm[column] = '';
      }
    });
    setEditFormData(emptyForm);
    setIsEditDialogOpen(true);
  };

  // Handle form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem) {
      updateItemMutation.mutate(editFormData);
    } else {
      createItemMutation.mutate(editFormData);
    }
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Management</CardTitle>
        <CardDescription>
          Manage database records. Select a table to view and edit its data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table Selection */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {tables?.map(table => (
              <Button
                key={table}
                variant={selectedTable === table ? "default" : "outline"}
                onClick={() => setSelectedTable(table)}
                className="whitespace-nowrap"
              >
                {table}
              </Button>
            ))}
          </div>
          
          {/* Actions Bar */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{selectedTable}</h3>
            <Button onClick={handleCreateClick} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </div>
          
          {/* Data Table */}
          {tableDataLoading ? (
            <div className="py-8 text-center">Loading table data...</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableColumns?.map(column => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTableData?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={(tableColumns?.length || 0) + 1} className="text-center py-4">
                        No data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedTableData?.map(item => (
                      <TableRow key={item.id}>
                        {tableColumns?.map(column => (
                          <TableCell key={`${item.id}-${column}`} className="max-w-[200px] truncate">
                            {String(item[column] ?? '')}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this item?")) {
                                  deleteItemMutation.mutate(item.id);
                                }
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
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
      
      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentItem ? 'Edit Item' : 'Create New Item'}</DialogTitle>
            <DialogDescription>
              {currentItem 
                ? `Make changes to the selected ${selectedTable} record.` 
                : `Create a new record in the ${selectedTable} table.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {tableColumns?.map(column => {
                // Skip id and timestamps for editing
                if (column === 'id' || column === 'created_at' || column === 'updated_at') {
                  return null;
                }
                
                return (
                  <div key={column} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={column} className="text-right">
                      {column}
                    </Label>
                    <Input
                      id={column}
                      name={column}
                      value={editFormData[column] || ''}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DatabaseManager;
