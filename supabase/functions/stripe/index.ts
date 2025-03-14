
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
  
  // Log all request headers for debugging
  console.log(`[${requestId}] Request headers:`, Object.fromEntries([...req.headers.entries()]));
  
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
    // Try to read and parse the request body
    let requestText;
    try {
      requestText = await req.text();
      console.log(`[${requestId}] Raw request body:`, requestText);
      
      if (!requestText || requestText.trim() === '') {
        console.error(`[${requestId}] Request body is empty`);
        return new Response(
          JSON.stringify({ error: 'Request body is empty' }),
          { status: 400, headers: corsHeaders }
        );
      }
    } catch (bodyError) {
      console.error(`[${requestId}] Error reading request body:`, bodyError);
      return new Response(
        JSON.stringify({ error: `Failed to read request body: ${bodyError.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Try to parse the JSON body
    let requestData;
    try {
      requestData = JSON.parse(requestText);
      console.log(`[${requestId}] Parsed request data:`, requestData);
    } catch (parseError) {
      console.error(`[${requestId}] Error parsing JSON:`, parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message,
          receivedText: requestText.substring(0, 200) // Show part of what was received
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error(`[${requestId}] STRIPE_SECRET_KEY is not configured`);
      return new Response(
        JSON.stringify({ error: "Stripe secret key is not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Supabase credentials not configured`);
      return new Response(
        JSON.stringify({ error: "Supabase credentials not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // We'll bypass authentication temporarily for testing
    // In production, this should use proper authentication
    const userId = "test-user-id"; // For testing only
    console.log(`[${requestId}] Using test user ID:`, userId);

    // Handle different endpoints
    const endpoint = requestData?.endpoint || 'create-checkout-session';
    console.log(`[${requestId}] Using endpoint: ${endpoint}`);
    
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
        // Get or create customer
        let stripeCustomerId = "cus_test"; // For testing, use a placeholder
        
        // Create checkout session
        const successUrl = requestData.successUrl || 'https://workout.au11no.com';
        const cancelUrl = requestData.cancelUrl || 'https://workout.au11no.com';
        
        console.log(`[${requestId}] Creating checkout session with price:`, requestData.priceId);
        
        const session = await stripe.checkout.sessions.create({
          customer: stripeCustomerId,
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
        console.log(`[${requestId}] Checkout URL:`, session.url);
        
        result = { url: session.url };
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
      // Handle customer portal logic similar to checkout session
      result = { url: 'https://billing.stripe.com/p/test' }; // Placeholder for testing
    } else {
      console.error(`[${requestId}] Invalid endpoint: ${endpoint}`);
      return new Response(
        JSON.stringify({ error: `Invalid endpoint: ${endpoint}` }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`[${requestId}] Returning result:`, result);
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        stack: error.stack, // Include stack trace for debugging
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
