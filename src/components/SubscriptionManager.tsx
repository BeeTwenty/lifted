import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, CheckCircle, XCircle, Shield, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const SubscriptionManager = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<"basic" | "pro">("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (data && data.status) {
          setStatus(data.status as "basic" | "pro");
        }
      } catch (error: any) {
        console.error("Error fetching subscription status:", error);
      }
    };

    fetchSubscriptionStatus();
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      // Get the current URL for success and cancel URLs
      const baseUrl = window.location.origin;
      
      // Correct price ID from your message
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
      
      // Call the Stripe function
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/stripe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify(payload),
        }
      );
      
      // Test connection by checking response status
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from Stripe function:", errorText);
        
        // Save debug info
        setDebugInfo(`Status: ${response.status}, Response: ${errorText}`);
        
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
      
      // Call the Stripe customer portal endpoint
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/stripe`,
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
      
      {debugInfo && (
        <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <Info className="h-4 w-4" />
          <AlertTitle>Debug Information</AlertTitle>
          <AlertDescription className="font-mono text-xs break-all">{debugInfo}</AlertDescription>
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
              <li className="flex items-center">
                <XCircle className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-400">Premium workouts</span>
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
            <div className="text-2xl font-bold mb-4">$7.99 <span className="text-sm font-normal text-gray-500">/month</span></div>
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
                <span>Premium workouts</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Priority support</span>
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
          Pro subscriptions give you access to all premium features. You can cancel anytime.
        </AlertDescription>
      </Alert>

      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <Info className="h-4 w-4" />
        <AlertTitle>Test Connection</AlertTitle>
        <AlertDescription>
          <p className="mb-2">If you're experiencing issues with Stripe integration, check that:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Your Stripe account is properly set up</li>
            <li>The price ID exists in your Stripe dashboard</li>
            <li>STRIPE_SECRET_KEY is correctly set in Supabase Edge Function secrets</li>
          </ul>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-3"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            Test Stripe Connection
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};
