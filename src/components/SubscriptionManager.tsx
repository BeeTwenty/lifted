
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, CheckCircle, XCircle, Shield, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/api/config";
import { profileService } from "@/api/services/profile.service";
import { useQuery } from "@tanstack/react-query";

export const SubscriptionManager = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Use React Query to fetch and cache subscription status
  const { data: status = "basic", refetch } = useQuery({
    queryKey: ["subscriptionStatus"],
    queryFn: async () => {
      const status = await profileService.checkSubscriptionStatus();
      return status;
    }
  });

  // Fetch price information from Stripe
  const { data: subscriptionInfo, isLoading: isPriceLoading } = useQuery({
    queryKey: ["subscriptionInfo"],
    queryFn: async () => {
      return await profileService.getSubscriptionInfo();
    }
  });

  // Format price for display
  const formatPrice = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'usd',
      minimumFractionDigits: 2
    });
    
    return formatter.format(amount / 100);
  };

  // Get formatted price or default
  const getProPrice = () => {
    if (isPriceLoading) return "$7.99";
    
    const priceInfo = subscriptionInfo?.prices?.pro;
    if (!priceInfo) return "$7.99";
    
    return `${formatPrice(priceInfo.amount, priceInfo.currency)}`;
  };

  // Get billing interval
  const getBillingInterval = () => {
    if (isPriceLoading) return "month";
    return subscriptionInfo?.prices?.pro?.interval || "month";
  };

  useEffect(() => {
    // Check for Stripe session ID in URL parameters
    const checkStripeSession = async () => {
      setIsCheckingSession(true);
      try {
        const url = new URL(window.location.href);
        const sessionId = url.searchParams.get('session_id');
        
        if (sessionId) {
          // Clear the session ID from the URL without reloading
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Temporarily show a processing message
          toast({
            title: "Processing Subscription",
            description: "Finalizing your subscription...",
          });
          
          // Update the user status to pro
          await profileService.updateSubscriptionStatus("pro");
          
          // Refetch the subscription status
          refetch();
          
          // Show success message
          toast({
            title: "Subscription Activated",
            description: "Your Pro subscription has been successfully activated!",
            variant: "default",
          });
        }
      } catch (error: any) {
        console.error("Error processing subscription:", error);
        toast({
          variant: "destructive",
          title: "Subscription Error",
          description: error.message || "Failed to process subscription",
        });
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkStripeSession();
  }, [toast, refetch]);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the current URL for success and cancel URLs
      const baseUrl = window.location.origin;
      
      // Use the correct price ID
      const priceId = "price_1R1vbRP6wHqHwKkzuGnmkQQk";
      
      // Prepare the request payload
      const payload = {
        priceId: priceId,
        successUrl: baseUrl,
        cancelUrl: baseUrl,
        endpoint: "create-checkout-session"
      };
      
      console.log("Creating checkout session for price:", priceId);
      
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("You must be logged in to subscribe");
      }
      
      // Use the baseUrl from the api config
      const response = await fetch(
        `${api.baseUrl}/functions/v1/stripe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify(payload),
        }
      );
      
      // Check response status
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from Stripe function:", errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || "Failed to create checkout session");
        } catch (parseError) {
          throw new Error(`Status ${response.status}: ${errorText || "Failed to create checkout session"}`);
        }
      }
      
      const data = await response.json();
      console.log("Checkout session created:", data);
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned from Stripe");
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      setError(error.message || "Failed to start subscription process");
      
      toast({
        variant: "destructive",
        title: "Subscription Error",
        description: error.message || "Failed to start subscription process",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = window.location.origin;
      
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Use the baseUrl from the api config
      const response = await fetch(
        `${api.baseUrl}/functions/v1/stripe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({
            returnUrl: baseUrl,
            endpoint: "customer-portal"
          }),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from Stripe function:", errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || "Failed to access customer portal");
        } catch (parseError) {
          throw new Error(`Status ${response.status}: ${errorText || "Failed to access customer portal"}`);
        }
      }
      
      const data = await response.json();
      
      // Redirect to customer portal
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned from Stripe");
      }
    } catch (error: any) {
      console.error("Error accessing customer portal:", error);
      setError(error.message || "Failed to access subscription management");
      
      toast({
        variant: "destructive",
        title: "Subscription Management Error",
        description: error.message || "Failed to access subscription management",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <h2 className="text-2xl font-semibold mb-4 dark:text-white">Subscription Management</h2>
      
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isCheckingSession && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <Info className="h-4 w-4 animate-pulse" />
          <AlertTitle>Checking subscription status...</AlertTitle>
          <AlertDescription>Please wait while we verify your subscription status.</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={`${status === "basic" ? "border-primary" : ""}`}>
          <CardHeader>
            <CardTitle>Basic Plan</CardTitle>
            <CardDescription>Free tier with core workout features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-4">$0 <span className="text-sm font-normal text-gray-500">/month</span></div>
            <ul className="space-y-2">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Create custom workouts</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Track workout history</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Exercise library</span>
              </li>
              <li className="flex items-center">
                <XCircle className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-400">Weight tracking</span>
              </li>
              <li className="flex items-center">
                <XCircle className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-400">Advanced analytics</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            {status === "basic" ? (
              <div className="bg-primary/10 text-primary w-full py-2 rounded-lg text-center font-medium">
                Current Plan
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleManageSubscription}
                disabled={isLoading}
              >
                Downgrade
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className={`${status === "pro" ? "border-primary" : ""} bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800`}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pro Plan</CardTitle>
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>Premium features for serious athletes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-4">
              {isPriceLoading ? (
                <span className="inline-block animate-pulse">Loading...</span>
              ) : (
                <>{getProPrice()} <span className="text-sm font-normal text-gray-500">/{getBillingInterval()}</span></>
              )}
            </div>
            <ul className="space-y-2">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>All Basic features</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Weight tracking</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>No advertisements</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            {status === "pro" ? (
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleManageSubscription}
                disabled={isLoading}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleSubscribe}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Subscription Information</AlertTitle>
        <AlertDescription>
          Pro subscriptions give you access to all premium features. You can manage or cancel your subscription at any time through the "Manage Subscription" button.
        </AlertDescription>
      </Alert>
    </div>
  );
};
