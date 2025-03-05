
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Exercise } from "@/hooks/useWorkoutPlayer";

interface ExerciseMediaProps {
  exercise: Exercise | undefined;
}

export function ExerciseMedia({ exercise }: ExerciseMediaProps) {
  const [showMedia, setShowMedia] = useState(false);
  
  if (!exercise) return null;
  
  const renderMediaContent = () => {
    const mediaUrl = exercise?.media_url;
  
    if (!mediaUrl || mediaUrl.includes("fakeimg.pl")) {
      return (
        <div className="py-3 sm:py-10 text-center">
          <img 
            src="https://fakeimg.pl/600x400/b36666/ffffff?text=No+Media&font=bebas" 
            alt="No Media Available"
            className="rounded-md w-full h-auto mx-auto"
          />
        </div>
      );
    }
  
    if (mediaUrl.includes("youtube.com") || mediaUrl.includes("youtu.be")) {
      let embedUrl = mediaUrl;
      if (mediaUrl.includes("watch?v=")) {
        const videoId = mediaUrl.split("watch?v=")[1].split("&")[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (mediaUrl.includes("youtu.be/")) {
        const videoId = mediaUrl.split("youtu.be/")[1];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
  
      return (
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <iframe
            src={embedUrl}
            title={exercise?.name || "Exercise demonstration"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-md w-full h-full"
          />
        </AspectRatio>
      );
    }
  
    if (mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
      return (
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <video 
            src={mediaUrl}
            controls
            className="rounded-md object-cover w-full h-full"
            playsInline // Add playsInline for better mobile experience
          />
        </AspectRatio>
      );
    }
  
    if (mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
      return (
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <img 
            src={mediaUrl} 
            alt={exercise?.name || "Exercise demonstration"} 
            className="rounded-md object-cover w-full h-full"
          />
        </AspectRatio>
      );
    }
  
    return (
      <div className="py-3 sm:py-10 text-center">
        <img 
          src="https://fakeimg.pl/600x400/b36666/ffffff?text=No+Media&font=bebas" 
          alt="No Media Available"
          className="rounded-md w-full h-auto mx-auto"
        />
      </div>
    );
  };

  return (
    <>
      {exercise?.media_url && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5 sm:h-8 sm:w-8 p-0 sm:p-1" 
          onClick={() => setShowMedia(true)}
          title="Show exercise demonstration"
        >
          <HelpCircle className="h-3 w-3 sm:h-5 sm:w-5" />
        </Button>
      )}
      
      <Dialog open={showMedia} onOpenChange={setShowMedia}>
        <DialogContent className="sm:max-w-[700px] max-w-[95vw] p-2 sm:p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-center sm:text-left text-sm sm:text-lg">
              {exercise?.name || "Exercise Demonstration"}
            </DialogTitle>
          </DialogHeader>
          {renderMediaContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}
