
import { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AdDisplayProps {
  onClose?: () => void;
  fullWidth?: boolean;
  adSlot?: string;
}

export function AdDisplay({ onClose, fullWidth = false, adSlot = "1234567890" }: AdDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fallbackAdShown, setFallbackAdShown] = useState(false);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const adAttemptedRef = useRef(false);

  useEffect(() => {
    // Only allow one ad attempt per component lifecycle
    if (adAttemptedRef.current) return;
    adAttemptedRef.current = true;
    
    // Set a longer timeout (5 seconds) for ad loading
    const adLoadTimeout = setTimeout(() => {
      if (loading && !fallbackAdShown) {
        console.log(`Ad load timeout for slot ${adSlot} - showing fallback`);
        showFallbackAd();
      }
    }, 5000);

    const loadAd = () => {
      try {
        if (adContainerRef.current && typeof window !== 'undefined') {
          adContainerRef.current.innerHTML = '';
          
          const adInsElement = document.createElement('ins');
          adInsElement.className = 'adsbygoogle';
          adInsElement.style.display = 'block';
          adInsElement.setAttribute('data-ad-client', 'ca-pub-1703915401564574');
          adInsElement.setAttribute('data-ad-slot', adSlot);
          adInsElement.setAttribute('data-ad-format', 'auto');
          adInsElement.setAttribute('data-full-width-responsive', 'true');
          
          adContainerRef.current.appendChild(adInsElement);
          
          try {
            // Initialize adsbygoogle as an array if it doesn't exist
            if (!window.adsbygoogle) {
              window.adsbygoogle = [];
            }
            
            // Push ad configuration (not requiring a push property in the passed object)
            window.adsbygoogle.push({} as any);
            console.log(`AdSense ad (slot: ${adSlot}) pushed to queue`);
            
            // Check if ad loaded after a short delay
            setTimeout(() => {
              if (adContainerRef.current) {
                const adIns = adContainerRef.current.querySelector('ins.adsbygoogle');
                if (!adIns || adIns.getAttribute('data-ad-status') !== 'filled') {
                  console.log(`Ad slot ${adSlot} not filled - showing fallback`);
                  showFallbackAd();
                } else {
                  console.log(`Ad slot ${adSlot} successfully loaded`);
                  setLoading(false);
                }
              }
            }, 2000);
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

    const showFallbackAd = () => {
      console.log('Showing fallback ad');
      setFallbackAdShown(true);
      setLoading(false);
    };

    loadAd();

    return () => {
      clearTimeout(adLoadTimeout);
    };
  }, [adSlot, loading]);

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
              <p className="text-sm font-medium">{fallbackAds[Math.floor(Math.random() * fallbackAds.length)]}</p>
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

const fallbackAds = [
  "Try our premium plan for more workout features!",
  "Check out new protein supplements at HealthStore",
  "New workout gear available at FitnessMart",
  "Download our partner app for nutrition tracking"
];
