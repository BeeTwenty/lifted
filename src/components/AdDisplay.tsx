
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
    // Simulate loading an ad
    setLoading(true);
    
    // This timeout simulates fetching an ad from a service
    const timer = setTimeout(() => {
      // In a real implementation, this would be replaced with actual ad content from an ad network
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
