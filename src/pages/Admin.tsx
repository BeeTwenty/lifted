
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTitle, 
  DialogTrigger 
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
  Settings, 
  Users, 
  Database, 
  Edit, 
  Trash, 
  Plus, 
  ArrowLeft,
  User,
  Save
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("database");
  
  // Check if user is admin
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Database Management
  const [selectedTable, setSelectedTable] = useState("exercise_templates");
  const [tableData, setTableData] = useState([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // Get table data
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ["adminTables"],
    queryFn: async () => {
      return ["exercise_templates", "food_logs", "workouts", "profiles"];
    },
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
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id) => {
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
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error deleting item",
        description: error.message,
      });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from(selectedTable)
        .update(data)
        .eq("id", data.id);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tableData", selectedTable] });
      setIsEditDialogOpen(false);
      toast({
        title: "Item updated",
        description: "The item was successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error updating item",
        description: error.message,
      });
    },
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from(selectedTable)
        .insert(data);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tableData", selectedTable] });
      setIsEditDialogOpen(false);
      toast({
        title: "Item created",
        description: "The item was successfully created.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error creating item",
        description: error.message,
      });
    },
  });

  // Handle edit button click
  const handleEditClick = (item) => {
    setCurrentItem(item);
    setEditFormData(item);
    setIsEditDialogOpen(true);
  };

  // Handle create new item
  const handleCreateClick = () => {
    setCurrentItem(null);
    // Initialize empty form data based on columns
    const emptyForm = {};
    tableColumns?.forEach(column => {
      if (column !== 'id' && column !== 'created_at' && column !== 'updated_at') {
        emptyForm[column] = '';
      }
    });
    setEditFormData(emptyForm);
    setIsEditDialogOpen(true);
  };

  // Handle form submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (currentItem) {
      updateItemMutation.mutate(editFormData);
    } else {
      createItemMutation.mutate(editFormData);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // User Management
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Site Settings
  const [siteSettings, setSiteSettings] = useState({
    siteName: "Fitness Tracker",
    defaultDailyCalories: 2000,
    defaultWorkoutGoal: 5,
    defaultHourGoal: 10
  });

  // Update site settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      // This would normally update site settings in the database
      // For now, we're just simulating it
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "The site settings were successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error updating settings",
        description: error.message,
      });
    },
  });

  // Handle settings form submit
  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate(siteSettings);
  };

  // Handle settings input change
  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSiteSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Redirect if not admin (in a real app, you'd check for admin role)
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      }
      // In a real app, you'd check if the user has admin role
    };
    checkAdmin();
  }, [navigate]);

  if (profileLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="container">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              className="mr-2"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="database" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Database Management Tab */}
          <TabsContent value="database" className="space-y-4">
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
            </Card>
            
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
          </TabsContent>
          
          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage user accounts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="py-8 text-center">Loading users...</div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Daily Calories</TableHead>
                          <TableHead>Workout Goal</TableHead>
                          <TableHead>Hour Goal</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          users?.map(user => (
                            <TableRow key={user.id}>
                              <TableCell className="max-w-[80px] truncate">{user.id}</TableCell>
                              <TableCell>{user.username || "—"}</TableCell>
                              <TableCell>{user.full_name || "—"}</TableCell>
                              <TableCell>{user.daily_calories || "—"}</TableCell>
                              <TableCell>{user.workout_goal || "—"}</TableCell>
                              <TableCell>{user.hour_goal || "—"}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                      // Navigate to user profile
                                      navigate(`/settings?user=${user.id}`);
                                    }}
                                  >
                                    <User className="h-4 w-4" />
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
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
                <CardDescription>
                  Manage global application settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSettingsSubmit} className="space-y-6">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                      <Label htmlFor="siteName" className="md:text-right">
                        Site Name
                      </Label>
                      <Input
                        id="siteName"
                        name="siteName"
                        value={siteSettings.siteName}
                        onChange={handleSettingsChange}
                        className="md:col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                      <Label htmlFor="defaultDailyCalories" className="md:text-right">
                        Default Daily Calories
                      </Label>
                      <Input
                        id="defaultDailyCalories"
                        name="defaultDailyCalories"
                        type="number"
                        value={siteSettings.defaultDailyCalories}
                        onChange={handleSettingsChange}
                        className="md:col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                      <Label htmlFor="defaultWorkoutGoal" className="md:text-right">
                        Default Workout Goal (per week)
                      </Label>
                      <Input
                        id="defaultWorkoutGoal"
                        name="defaultWorkoutGoal"
                        type="number"
                        value={siteSettings.defaultWorkoutGoal}
                        onChange={handleSettingsChange}
                        className="md:col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                      <Label htmlFor="defaultHourGoal" className="md:text-right">
                        Default Hour Goal (per week)
                      </Label>
                      <Input
                        id="defaultHourGoal"
                        name="defaultHourGoal"
                        type="number"
                        value={siteSettings.defaultHourGoal}
                        onChange={handleSettingsChange}
                        className="md:col-span-3"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
