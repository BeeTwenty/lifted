import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Check, Gem, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { UserProfile, SubscriptionPlan } from "@/types/workout";

// Define the subscription plans
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Free access to core workout features",
    price: 0,
    currency: "USD",
    interval: "month",
    features: [
      "Unlimited workout routines",
      "Exercise library",
      "Basic workout tracking",
    ],
    stripeProductId: "",
    stripePriceId: "",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Enhanced features for serious athletes",
    price: 15.00,
    currency: "NOK",
    interval: "month",
    features: [
      "All Basic features",
      "Detailed weight tracking",
      "Advanced workout statistics",
      "Progress analytics",
      "Priority support",
    ],
    stripeProductId: "prod_RvnBPKw0MzYleJ",
    stripePriceId: "price_1RtvbRP6wHqHwKkzuGnmkQQk",
  }
];

export function SubscriptionManager() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(profile);
    } catch (error: any) {
      console.error("Error fetching user profile:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load your subscription information",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (plan: SubscriptionPlan) => {
    try {
      setCheckoutLoading(true);
      setCheckoutError(null);
      
      const { data: sessionAuth } = await supabase.auth.getSession();
      if (!sessionAuth.session) throw new Error("No active session");

      console.log("Creating checkout session for price:", plan.stripePriceId);
      
      // Make sure we have a valid price ID
      if (!plan.stripePriceId) {
        throw new Error("No price ID available for this plan");
      }
      
      // Create the checkout session with properly formatted request
      const { data, error } = await supabase.functions.invoke("stripe/create-checkout-session", {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionAuth.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          priceId: plan.stripePriceId,
          successUrl: window.location.origin,
          cancelUrl: window.location.origin,
        },
      });
      
      if (error) {
        console.error("Stripe function error:", error);
        throw new Error(error.message || "Error creating checkout session");
      }

      if (!data || !data.url) {
        console.error("Invalid response from server:", data);
        throw new Error("Invalid response from server");
      }

      console.log("Redirecting to checkout URL:", data.url);
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      setCheckoutError(error.message);
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: error.message,
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setManageLoading(true);
      
      const { data: sessionAuth } = await supabase.auth.getSession();
      if (!sessionAuth.session) throw new Error("No active session");

      // Create a proper body object for the customer portal request
      const requestBody = {
        returnUrl: window.location.origin
      };
      
      // Use invoke method with a properly formatted body
      const { data, error } = await supabase.functions.invoke("stripe/customer-portal", {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionAuth.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
      
      if (error) {
        throw new Error(error.message);
      }

      if (!data || !data.url) {
        throw new Error("Invalid response from server");
      }

      // Redirect to Stripe customer portal
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error accessing customer portal:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setManageLoading(false);
    }
  };

  const isPro = userProfile?.status === "pro";
  const currentPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === (isPro ? "pro" : "basic"));

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Subscription
        </CardTitle>
        <CardDescription>Manage your subscription plan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <div className="flex items-center">
                <h3 className="text-2xl font-bold">{currentPlan?.name}</h3>
                {isPro && (
                  <Badge className="ml-2 bg-gradient-to-r from-indigo-500 to-purple-500">
                    <Gem className="mr-1 h-3 w-3" />
                    PRO
                  </Badge>
                )}
              </div>
            </div>
            {isPro && (
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                disabled={manageLoading}
              >
                {manageLoading ? "Loading..." : "Manage Subscription"}
              </Button>
            )}
          </div>

          {checkoutError && (
            <div className="rounded-md bg-destructive/15 p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-destructive">Checkout Error</h3>
                  <p className="mt-1 text-sm text-destructive/90">{checkoutError}</p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card key={plan.id} className={`overflow-hidden ${plan.id === 'pro' ? 'border-primary' : ''}`}>
                {plan.id === 'pro' && (
                  <div className="bg-primary py-1 text-center text-xs font-medium uppercase text-primary-foreground">
                    Recommended
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price > 0 ? `${plan.price} ${plan.currency}` : "$0"}</span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/{plan.interval}</span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {plan.id === 'basic' ? (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      disabled={true}
                    >
                      Current Plan
                    </Button>
                  ) : (
                    isPro ? (
                      <Button 
                        className="w-full" 
                        variant="outline" 
                        disabled={true}
                      >
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => handleCheckout(plan)}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? "Processing..." : "Upgrade to Pro"}
                      </Button>
                    )
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {!isPro && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950 p-4 mt-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Pro features are restricted
                  </h3>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    Upgrade to Pro to unlock weight tracking and detailed workout statistics.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
