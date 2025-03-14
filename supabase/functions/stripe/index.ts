
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Define CORS headers to ensure browser requests work properly
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Add a request ID for tracing through logs
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Request received: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] Handling CORS preflight request`);
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.error(`[${requestId}] Invalid method: ${req.method}`);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Verify Content-Type header
    const contentType = req.headers.get('content-type');
    console.log(`[${requestId}] Content-Type header: ${contentType}`);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`[${requestId}] Invalid Content-Type: ${contentType}`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Content-Type',
          message: 'Content-Type must be application/json',
          received: contentType || 'none' 
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Parse request body
    let requestData;
    try {
      // Check if the request body is empty
      const clonedReq = req.clone();
      const bodyText = await clonedReq.text();
      
      if (!bodyText || bodyText.trim() === '') {
        console.error(`[${requestId}] Empty request body`);
        return new Response(
          JSON.stringify({ 
            error: 'Empty request body',
            message: 'Request body cannot be empty' 
          }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Log raw request body for debugging
      console.log(`[${requestId}] Raw request body:`, bodyText);
      
      // Now parse the JSON
      requestData = JSON.parse(bodyText);
      console.log(`[${requestId}] Parsed request data:`, requestData);
    } catch (parseError) {
      console.error(`[${requestId}] Error parsing JSON:`, parseError);
      
      // Try to read the raw body for debugging
      try {
        const rawBody = await req.text();
        console.error(`[${requestId}] Raw request body:`, rawBody);
      } catch (rawError) {
        console.error(`[${requestId}] Could not read raw body:`, rawError);
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON',
          details: parseError.message
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error(`[${requestId}] STRIPE_SECRET_KEY is not configured`);
      return new Response(
        JSON.stringify({ 
          error: "Stripe secret key is not configured",
          debug: "Check that the STRIPE_SECRET_KEY environment variable is set in Supabase Edge Function secrets"
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Get user id from JWT token
    let userId = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseServiceKey) {
          console.error(`[${requestId}] Supabase credentials not configured`);
          return new Response(
            JSON.stringify({ error: "Supabase credentials not configured" }),
            { status: 500, headers: corsHeaders }
          );
        }
        
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        const jwt = authHeader.substring(7);
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(jwt);
        
        if (error) {
          console.error(`[${requestId}] JWT validation error:`, error.message);
        } else if (user) {
          userId = user.id;
          console.log(`[${requestId}] Authenticated user ID:`, userId);
        }
      } catch (authError) {
        console.error(`[${requestId}] Error validating JWT:`, authError);
      }
    }
    
    // Fallback to test user ID if authentication failed
    if (!userId) {
      userId = "test-user-id";
      console.log(`[${requestId}] Using test user ID for development:`, userId);
    }

    // Handle different endpoints
    const endpoint = requestData?.endpoint || 'create-checkout-session';
    console.log(`[${requestId}] Processing endpoint: ${endpoint}`);
    
    let result;
    
    if (endpoint === 'create-checkout-session') {
      // Create checkout session
      if (!requestData.priceId) {
        console.error(`[${requestId}] Missing priceId in request`);
        return new Response(
          JSON.stringify({ error: 'Missing required field: priceId' }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      try {
        // Validate price ID before proceeding
        console.log(`[${requestId}] Validating price ID: ${requestData.priceId}`);
        try {
          // Test if price exists
          const priceData = await stripe.prices.retrieve(requestData.priceId);
          console.log(`[${requestId}] Price exists:`, priceData.id);
        } catch (priceError) {
          console.error(`[${requestId}] Invalid price ID:`, priceError.message);
          return new Response(
            JSON.stringify({ 
              error: "Invalid price ID", 
              details: priceError.message,
              debug: {
                priceId: requestData.priceId,
                suggestion: "Check that this price ID exists in your Stripe account"
              }
            }),
            { status: 400, headers: corsHeaders }
          );
        }
        
        // Get or create customer by user_id
        const { data: existingCustomers } = await stripe.customers.list({
          email: `${userId}@example.com`, // Using user ID as an identifier
          limit: 1,
        });
        
        let customerId;
        if (existingCustomers && existingCustomers.length > 0) {
          customerId = existingCustomers[0].id;
          console.log(`[${requestId}] Using existing customer:`, customerId);
        } else {
          const newCustomer = await stripe.customers.create({
            email: `${userId}@example.com`,
            metadata: { user_id: userId },
          });
          customerId = newCustomer.id;
          console.log(`[${requestId}] Created new customer:`, customerId);
        }
        
        // Create checkout session
        const successUrl = requestData.successUrl || 'https://workout.au11no.com';
        const cancelUrl = requestData.cancelUrl || 'https://workout.au11no.com';
        
        console.log(`[${requestId}] Creating checkout session for price:`, requestData.priceId);
        
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [
            {
              price: requestData.priceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl,
          metadata: {
            user_id: userId,
          },
        });
        
        console.log(`[${requestId}] Created checkout session:`, session.id);
        
        result = { 
          url: session.url,
          sessionId: session.id
        };
      } catch (stripeError) {
        console.error(`[${requestId}] Stripe error:`, stripeError);
        return new Response(
          JSON.stringify({ 
            error: 'Error creating checkout session',
            details: stripeError.message
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    } else if (endpoint === 'customer-portal') {
      try {
        // Get customer by user_id
        const { data: customers } = await stripe.customers.list({
          email: `${userId}@example.com`,
          limit: 1,
        });
        
        if (!customers || customers.length === 0) {
          console.error(`[${requestId}] No Stripe customer found for user:`, userId);
          return new Response(
            JSON.stringify({ error: 'No subscription found for this user' }),
            { status: 404, headers: corsHeaders }
          );
        }
        
        const customerId = customers[0].id;
        const returnUrl = requestData.returnUrl || 'https://workout.au11no.com';
        
        // Create billing portal session
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: returnUrl,
        });
        
        console.log(`[${requestId}] Created portal session:`, portalSession.id);
        
        result = { url: portalSession.url };
      } catch (stripeError) {
        console.error(`[${requestId}] Stripe error:`, stripeError);
        return new Response(
          JSON.stringify({ 
            error: 'Error creating customer portal session',
            details: stripeError.message
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    } else if (endpoint === 'subscription-info') {
      try {
        // Fetch active pro subscription price
        console.log(`[${requestId}] Fetching subscription prices`);
        
        // Get the price for the pro plan - price_1R1vbRP6wHqHwKkzuGnmkQQk
        const proPriceId = "price_1R1vbRP6wHqHwKkzuGnmkQQk";
        const price = await stripe.prices.retrieve(proPriceId);
        
        // Get active subscription for this user if any
        let activeSubscription = null;
        if (userId) {
          const { data: customers } = await stripe.customers.list({
            email: `${userId}@example.com`,
            limit: 1,
          });
          
          if (customers && customers.length > 0) {
            const customerId = customers[0].id;
            const subscriptions = await stripe.subscriptions.list({
              customer: customerId,
              status: 'active',
              limit: 1,
            });
            
            if (subscriptions.data.length > 0) {
              activeSubscription = subscriptions.data[0];
            }
          }
        }
        
        // Return pricing information
        result = {
          prices: {
            pro: {
              amount: price.unit_amount,
              currency: price.currency,
              interval: price.recurring?.interval || 'month',
              id: price.id
            }
          },
          activeSubscription: activeSubscription ? {
            id: activeSubscription.id,
            status: activeSubscription.status,
            currentPeriodEnd: activeSubscription.current_period_end,
          } : null
        };
        
        console.log(`[${requestId}] Returning subscription info:`, result);
      } catch (stripeError) {
        console.error(`[${requestId}] Stripe error fetching subscription info:`, stripeError);
        return new Response(
          JSON.stringify({ 
            error: 'Error fetching subscription info',
            details: stripeError.message
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    } else {
      console.error(`[${requestId}] Invalid endpoint: ${endpoint}`);
      return new Response(
        JSON.stringify({ error: `Invalid endpoint: ${endpoint}` }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`[${requestId}] Success response:`, result);
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        stack: error.stack,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
