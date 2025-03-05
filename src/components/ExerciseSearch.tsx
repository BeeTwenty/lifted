
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ExerciseTemplate } from "@/types/workout";
import { formatMuscleName } from "@/lib/format-utils";

interface ExerciseSearchProps {
  templates: ExerciseTemplate[];
  onSelectTemplate: (template: ExerciseTemplate) => void;
  placeholder?: string;
}

export function ExerciseSearch({ templates, onSelectTemplate, placeholder = "Search exercises..." }: ExerciseSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTemplates, setFilteredTemplates] = useState<ExerciseTemplate[]>(templates);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTemplates(templates);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = templates.filter(
      template => 
        template.name.toLowerCase().includes(query) || 
        (template.target_muscle && template.target_muscle.toLowerCase().includes(query))
    );
    
    setFilteredTemplates(filtered);
  }, [searchQuery, templates]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
        />
      </div>

      <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
        {filteredTemplates.length === 0 ? (
          <p className="text-center py-4 text-sm text-muted-foreground dark:text-gray-400">
            No matching exercises found
          </p>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="p-2 rounded-md hover:bg-accent dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="font-medium dark:text-white">{template.name}</div>
              {template.target_muscle && (
                <div className="text-xs text-muted-foreground dark:text-gray-400">
                  {formatMuscleName(template.target_muscle)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
