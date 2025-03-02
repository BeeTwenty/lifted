
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Shield,
  User
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PostgrestError } from "@supabase/supabase-js";

interface UserManagerProps {
  isAdmin: boolean;
}

const UserManager = ({ isAdmin }: UserManagerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    enabled: isAdmin,
  });

  // Get admin users
  const { data: adminUsers, refetch: refetchAdmins } = useQuery({
    queryKey: ["adminList"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admins")
        .select("user_id");
      
      if (error) throw error;
      return data.map(admin => admin.user_id);
    },
    enabled: isAdmin,
  });

  // Toggle admin status mutation
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string, isAdmin: boolean }) => {
      if (isAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from("admins")
          .delete()
          .eq("user_id", userId);
        
        if (error) throw error;
      } else {
        // Add admin role
        const { error } = await supabase
          .from("admins")
          .insert({ user_id: userId });
        
        if (error) throw error;
      }
      return { userId, isAdmin: !isAdmin };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminList"] });
      toast({
        title: "Admin status updated",
        description: "The user's admin status was successfully updated.",
      });
      refetchAdmins();
    },
    onError: (error: PostgrestError | Error) => {
      toast({
        variant: "destructive",
        title: "Error updating admin status",
        description: error instanceof PostgrestError ? error.message : (error as Error).message,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          View and manage user accounts and admin privileges.
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
                  users?.map(user => {
                    const isUserAdmin = adminUsers?.includes(user.id);
                    return (
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
                              variant={isUserAdmin ? "default" : "outline"} 
                              size="sm" 
                              className={`${isUserAdmin ? 'bg-blue-600 hover:bg-blue-700' : ''} flex items-center`}
                              onClick={() => toggleAdminMutation.mutate({ userId: user.id, isAdmin: !!isUserAdmin })}
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              {isUserAdmin ? 'Admin' : 'Make Admin'}
                            </Button>
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManager;
