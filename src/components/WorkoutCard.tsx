
import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Edit, Trash2 } from "lucide-react";

interface WorkoutCardProps {
  title: string;
  exercises: number;
  duration?: string;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export function WorkoutCard({ title, exercises, duration, onClick, onDelete, onEdit }: WorkoutCardProps) {
  return (
    <Card className="flex flex-col h-full animate-fade-up transition-colors duration-200 dark:border-gray-700 dark:bg-gray-800/95">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl dark:text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <div className="space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {exercises} {exercises === 1 ? "exercise" : "exercises"}
          </p>
          {duration && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Duration: {duration}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="default" 
          size="sm" 
          onClick={onClick}
          className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
        >
          <Play className="mr-2 h-4 w-4" />
          Start
        </Button>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onEdit}
            className="dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <Edit className="h-4 w-4 dark:text-gray-300" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onDelete}
            className="dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
