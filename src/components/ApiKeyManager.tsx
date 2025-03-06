
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

export function ApiKeyManager() {
  const [keyName, setKeyName] = useState("");
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("revoked", false)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .rpc("create_user_api_key", { name_param: name })
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      toast({
        title: "API Key Created",
        description: "Make sure to copy your API key now. You won't be able to see it again!",
      });
      setKeyName("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error creating API key",
        description: error.message,
      });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from("api_keys")
        .update({ revoked: true })
        .eq("id", keyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      toast({
        title: "API Key Revoked",
        description: "The API key has been revoked successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error revoking API key",
        description: error.message,
      });
    },
  });

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a key name",
      });
      return;
    }
    createKeyMutation.mutate(keyName);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Create and manage your API keys to access the Lifted API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateKey} className="flex gap-4 mb-6">
          <Input
            placeholder="Key name"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
          />
          <Button type="submit">Create API Key</Button>
        </form>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-4">
            {apiKeys?.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{key.key_name}</h3>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(key.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => revokeKeyMutation.mutate(key.id)}
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start">
        <h4 className="font-medium mb-2">API Documentation</h4>
        <p className="text-sm text-gray-500">
          Use your API key in the X-API-Key header to authenticate requests.
          Available endpoints:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-500 mt-2">
          <li>GET /api/workouts - List all workouts</li>
          <li>POST /api/workouts - Create a new workout</li>
          <li>GET /api/exercises - List all exercises</li>
        </ul>
      </CardFooter>
    </Card>
  );
}
