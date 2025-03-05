
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AdDisplayProps {
  onClose?: () => void;
  fullWidth?: boolean;
}

export function AdDisplay({ onClose, fullWidth = false }: AdDisplayProps) {
  const [adContent, setAdContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // GOOGLE ADSENSE INTEGRATION
    // 1. Add your Google AdSense script to index.html head section:
    // <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=YOUR-CLIENT-ID"
    //      crossorigin="anonymous"></script>

    // 2. Replace this entire useEffect with your AdSense ad unit code:
    // Remove the setTimeout and mock data below
    // Instead, insert your AdSense code here, example:
    // <ins class="adsbygoogle"
    //      style="display:block"
    //      data-ad-client="YOUR-CLIENT-ID"
    //      data-ad-slot="YOUR-AD-SLOT"
    //      data-ad-format="auto"
    //      data-full-width-responsive="true"></ins>
    // <script>
    //      (adsbygoogle = window.adsbygoogle || []).push({});
    // </script>

    // This is mock data for demonstration - REMOVE THIS when adding real AdSense
    setLoading(true);
    const timer = setTimeout(() => {
      const ads = [
        "Try our premium plan for more workout features!",
        "Check out new protein supplements at HealthStore",
        "New workout gear available at FitnessMart",
        "Download our partner app for nutrition tracking"
      ];
      
      const randomAd = ads[Math.floor(Math.random() * ads.length)];
      setAdContent(randomAd);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

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
        {/* GOOGLE ADSENSE AD UNIT
            Replace this entire content div with your AdSense ad unit code
            The loading state and mock content below should be removed */}
        {loading ? (
          <div className="py-2 animate-pulse">
            <div className="h-4 bg-primary/20 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-primary/20 rounded w-1/2 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="text-xs uppercase font-bold text-muted-foreground mb-1">Sponsored</div>
            <p className="text-sm font-medium">{adContent}</p>
          </>
        )}
      </div>
    </Card>
  );
}
