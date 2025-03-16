
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import AdsComponent from "./AdsComponent";

interface AdDisplayProps {
  onClose?: () => void;
  fullWidth?: boolean;
  adSlot?: string;
}

export function AdDisplay({ onClose, fullWidth = false, adSlot = "1234567890" }: AdDisplayProps) {
  const fallbackAds = [
    "Try our premium plan for more workout features!",
    "Check out new protein supplements at HealthStore",
    "New workout gear available at FitnessMart",
    "Download our partner app for nutrition tracking"
  ];
  
  const randomFallbackAd = fallbackAds[Math.floor(Math.random() * fallbackAds.length)];

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
      
      <div className="text-center min-h-[100px]">
        <AdsComponent dataAdSlot={adSlot} />
      </div>
    </Card>
  );
}
