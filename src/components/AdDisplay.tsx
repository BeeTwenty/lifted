
import { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AdDisplayProps {
  onClose?: () => void;
  fullWidth?: boolean;
}

export function AdDisplay({ onClose, fullWidth = false }: AdDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fallbackAdShown, setFallbackAdShown] = useState(false);
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Function to load Google AdSense ads
    const loadAd = () => {
      try {
        if (adContainerRef.current && typeof window !== 'undefined') {
          // Clear any existing content
          adContainerRef.current.innerHTML = '';
          
          // Create the ins element for AdSense
          const adInsElement = document.createElement('ins');
          adInsElement.className = 'adsbygoogle';
          adInsElement.style.display = 'block';
          adInsElement.setAttribute('data-ad-client', 'ca-pub-1703915401564574');
          adInsElement.setAttribute('data-ad-slot', 'YOUR-AD-SLOT'); // Replace with your actual ad slot
          adInsElement.setAttribute('data-ad-format', 'auto');
          adInsElement.setAttribute('data-full-width-responsive', 'true');
          
          // Append the ins element to our container
          adContainerRef.current.appendChild(adInsElement);
          
          // Execute the ad code
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            console.log('AdSense ad pushed to queue');
            setLoading(false);
          } catch (adError) {
            console.error('Error pushing ad to queue:', adError);
            showFallbackAd();
          }
        }
      } catch (initError) {
        console.error('Error initializing AdSense:', initError);
        showFallbackAd();
      }
    };

    // Show fallback ads if AdSense fails
    const showFallbackAd = () => {
      console.log('Showing fallback ad');
      setFallbackAdShown(true);
      setLoading(false);
      
      // In a production app, you might want to report this error
      // to your analytics or logging system
    };

    // Check if AdSense is blocked or not loaded
    const adBlockDetectionTimer = setTimeout(() => {
      if (loading && !fallbackAdShown) {
        showFallbackAd();
      }
    }, 2000);

    // Load the ad
    loadAd();

    return () => {
      clearTimeout(adBlockDetectionTimer);
    };
  }, [loading, fallbackAdShown]);

  // Fallback ad content
  const fallbackAds = [
    "Try our premium plan for more workout features!",
    "Check out new protein supplements at HealthStore",
    "New workout gear available at FitnessMart",
    "Download our partner app for nutrition tracking"
  ];
  
  const randomFallbackAd = fallbackAds[Math.floor(Math.random() * fallbackAds.length)];

  if (error) {
    return null;
  }

  return (
    <Card className={`relative p-4 bg-muted/30 border border-primary/20 ${fullWidth ? 'w-full' : 'max-w-md mx-auto'} my-3`}>
      {onClose && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-1 right-1 h-6 w-6" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      <div className="text-center">
        {loading && !fallbackAdShown ? (
          <div className="py-2 animate-pulse">
            <div className="h-4 bg-primary/20 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-primary/20 rounded w-1/2 mx-auto"></div>
          </div>
        ) : (
          fallbackAdShown ? (
            <>
              <div className="text-xs uppercase font-bold text-muted-foreground mb-1">Sponsored</div>
              <p className="text-sm font-medium">{randomFallbackAd}</p>
            </>
          ) : (
            <div ref={adContainerRef} className="min-h-[100px]">
              {/* AdSense ads will be inserted here by the script */}
            </div>
          )
        )}
      </div>
    </Card>
  );
}
