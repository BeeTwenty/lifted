
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UseWorkoutPlayerReturn } from "@/hooks/useWorkoutPlayer";
import { AdDisplay } from "@/components/AdDisplay";
import { useState, useEffect, useRef } from "react";

interface WorkoutCompleteProps {
  playerState: UseWorkoutPlayerReturn;
}

export function WorkoutComplete({ playerState }: WorkoutCompleteProps) {
  const { workoutNotes, setWorkoutNotes, handleComplete } = playerState;
  const [adDismissed, setAdDismissed] = useState(false);
  const [showAfterWorkoutAd, setShowAfterWorkoutAd] = useState(true);
  const [adAttempted, setAdAttempted] = useState(false);
  const [fallbackToAdDisplay, setFallbackToAdDisplay] = useState(false);
  const afterWorkoutAdRef = useRef<HTMLDivElement>(null);
  const adTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only attempt to load the ad once
    if (adAttempted) return;
    setAdAttempted(true);
    
    const loadAfterWorkoutAd = () => {
      if (afterWorkoutAdRef.current && typeof window !== 'undefined' && showAfterWorkoutAd) {
        // Clear previous content
        if (afterWorkoutAdRef.current.firstChild) {
          afterWorkoutAdRef.current.innerHTML = '';
        }
        
        // Create the ins element
        const adInsElement = document.createElement('ins');
        adInsElement.className = 'adsbygoogle';
        adInsElement.style.display = 'block';
        adInsElement.setAttribute('data-ad-client', 'ca-pub-1703915401564574');
        adInsElement.setAttribute('data-ad-slot', '5572763011');
        adInsElement.setAttribute('data-ad-format', 'auto');
        adInsElement.setAttribute('data-full-width-responsive', 'true');
        
        // Append the element
        afterWorkoutAdRef.current.appendChild(adInsElement);
        
        // Execute the ad push
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          console.log('After workout AdSense ad pushed to queue');
          
          // Set a timeout to check if ad loaded, if not fallback to embedded AdDisplay
          adTimeoutRef.current = setTimeout(() => {
            if (afterWorkoutAdRef.current) {
              const adIns = afterWorkoutAdRef.current.querySelector('ins.adsbygoogle');
              if (!adIns || adIns.getAttribute('data-ad-status') !== 'filled') {
                console.log('After workout ad did not fill - switching to AdDisplay component');
                setFallbackToAdDisplay(true);
              } else {
                console.log('After workout ad successfully loaded');
              }
            }
          }, 4000); // Give ad more time to load (4 seconds)
        } catch (error) {
          console.error('Error pushing after workout ad:', error);
          setFallbackToAdDisplay(true);
        }
      }
    };
    
    // Add a small delay before loading ad to give the page time to render
    const initTimeout = setTimeout(() => {
      loadAfterWorkoutAd();
    }, 500);
    
    return () => {
      if (adTimeoutRef.current) clearTimeout(adTimeoutRef.current);
      clearTimeout(initTimeout);
    };
  }, [adAttempted, showAfterWorkoutAd]);

  return (
    <div className="py-3 sm:py-10 text-center space-y-2 sm:space-y-4">
      <CheckCircle className="mx-auto h-10 w-10 sm:h-16 sm:w-16 text-primary" />
      <h2 className="text-lg sm:text-2xl font-bold">Workout Complete!</h2>
      <p className="text-xs sm:text-sm text-muted-foreground">Congratulations on finishing your workout.</p>
      
      {!adDismissed && (
        <AdDisplay 
          onClose={() => setAdDismissed(true)} 
          fullWidth 
        />
      )}
      
      <div className="space-y-1.5 sm:space-y-2 text-left">
        <Label htmlFor="workout-notes" className="text-xs sm:text-sm">Add notes about this workout (optional)</Label>
        <Textarea 
          id="workout-notes"
          placeholder="How did it feel? Any issues or progress?"
          value={workoutNotes}
          onChange={(e) => setWorkoutNotes(e.target.value)}
          className="min-h-[60px] sm:min-h-[100px] text-xs sm:text-sm"
        />
      </div>
      
      <div className="pt-1.5 sm:pt-4">
        <Button 
          onClick={handleComplete} 
          className="text-xs sm:text-base py-1.5 h-auto sm:h-10"
        >
          Finish & Save
        </Button>
      </div>
      
      {/* After workout ad section */}
      <div className="mt-4 w-full">
        {fallbackToAdDisplay ? (
          <AdDisplay fullWidth adSlot="5572763011" />
        ) : (
          <div 
            ref={afterWorkoutAdRef} 
            className="w-full min-h-[250px] border border-muted rounded-md bg-muted/20 flex items-center justify-center"
          >
            {/* AdSense content will be injected here */}
            <div className="text-muted-foreground text-sm animate-pulse">Loading ad...</div>
          </div>
        )}
      </div>
    </div>
  );
}
