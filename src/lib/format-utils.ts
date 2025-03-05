
/**
 * Formats a muscle name from Latin to English
 * @param muscleName The muscle name to format
 * @returns Formatted muscle name in English
 */
export const formatMuscleName = (muscleName: string | null): string => {
  if (!muscleName) return "";
  
  // Map Latin names to English
  const muscleNameMap: Record<string, string> = {
    // Original mappings
    "Biceps brachii": "Biceps",
    "biceps brachii": "biceps",
    "Triceps brachii": "Triceps",
    "triceps brachii": "triceps",
    "Quadriceps femoris": "Quads",
    "quadriceps femoris": "quads",
    "Gluteus maximus": "Glutes",
    "gluteus maximus": "glutes",
    "Biceps femoris": "Hamstrings",
    "biceps femoris": "hamstrings",
    "Gastrocnemius": "Calves",
    "gastrocnemius": "calves",
    "Pectoralis major": "Chest",
    "pectoralis major": "chest",
    "Rectus abdominis": "Abs",
    "rectus abdominis": "abs",
    "Deltoideus": "Shoulders",
    "deltoideus": "shoulders",
    "Anterior deltoid": "Front shoulders",
    "anterior deltoid": "front shoulders",
    "Trapezius": "Traps",
    "trapezius": "traps",
    "Latissimus dorsi": "Back",
    "latissimus dorsi": "back",
    
    // Additional mappings from the screenshot
    "Serratus anterior": "Serratus",
    "serratus anterior": "serratus",
    "Soleus": "Calves",
    "soleus": "calves",
    "Brachialis": "Biceps",
    "brachialis": "biceps"
  };
  
  return muscleNameMap[muscleName] || muscleName;
};

/**
 * Formats a comma-separated list of muscle names from Latin to English
 * @param muscleNames Comma-separated list of muscle names
 * @returns Formatted comma-separated list of muscle names in English
 */
export const formatMuscleNameList = (muscleNames: string | null): string => {
  if (!muscleNames) return "";
  
  return muscleNames
    .split(",")
    .map(name => formatMuscleName(name.trim()))
    .join(", ");
};
