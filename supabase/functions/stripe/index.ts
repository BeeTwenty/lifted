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
    // Check Content-Type header - this is critical
    const contentType = req.headers.get('Content-Type');
    console.log(`[${requestId}] Content-Type header:`, contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`[${requestId}] Invalid Content-Type: ${contentType}`);
      return new Response(
        JSON.stringify({ error: `Invalid Content-Type: ${contentType}. Expected application/json` }),
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

    // Handle webhook requests (they come directly from Stripe, not through the front-end)
    const url = new URL(req.url);
    if (url.pathname.endsWith('/webhook')) {
      return await handleWebhook(req, supabaseAdmin, stripe, corsHeaders, requestId);
    }

    // Try to read and parse the request body
    let requestText;
    try {
      requestText = await req.text();
      console.log(`[${requestId}] Raw request body (first 500 chars):`, requestText.substring(0, 500));
      
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

    // Temporary bypass authentication for testing
    // In production, this should be restored to use proper authentication
    const userId = "test-user-id"; // Temporary for testing
    console.log(`[${requestId}] Using test user ID:`, userId);

    // Determine which endpoint to use
    const endpoint = requestData?.endpoint || 'create-checkout-session';
    console.log(`[${requestId}] Processing endpoint: ${endpoint}`);

    // Handle different endpoints
    let result;
    switch (endpoint) {
      case 'create-checkout-session':
        if (!requestData.priceId) {
          console.error(`[${requestId}] Missing priceId in request body`);
          return new Response(
            JSON.stringify({ error: 'Missing required field: priceId' }),
            { status: 400, headers: corsHeaders }
          );
        }
        result = await handleCreateCheckoutSession(userId, requestData, supabaseAdmin, stripe, requestId);
        break;
        
      case 'customer-portal':
        result = await handleCustomerPortal(userId, requestData, supabaseAdmin, stripe, requestId);
        break;
        
      default:
        console.error(`[${requestId}] Invalid endpoint: ${endpoint}`);
        return new Response(
          JSON.stringify({ error: `Invalid endpoint: ${endpoint}` }),
          { status: 400, headers: corsHeaders }
        );
    }

    console.log(`[${requestId}] Successfully processed request, returning:`, result);
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

async function handleCreateCheckoutSession(userId, data, supabase, stripe, requestId) {
  console.log(`[${requestId}] Creating checkout session for user ${userId}`);
  
  if (!data.priceId) {
    throw new Error('Price ID is required');
  }

  // Get or create Stripe customer
  let stripeCustomerId;
  
  // Check if customer exists in payments table
  const { data: paymentData, error: paymentError } = await supabase
    .from('payments')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (paymentData && paymentData.length > 0 && paymentData[0].stripe_customer_id) {
    stripeCustomerId = paymentData[0].stripe_customer_id;
    console.log(`[${requestId}] Using existing Stripe customer:`, stripeCustomerId);
  } else {
    // Create a new customer
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData || !userData.user || !userData.user.email) {
      console.error(`[${requestId}] Error getting user data:`, userError);
      throw new Error('Unable to get user email');
    }
    
    const customer = await stripe.customers.create({
      email: userData.user.email,
      metadata: {
        supabase_id: userId,
      },
    });
    stripeCustomerId = customer.id;
    console.log(`[${requestId}] Created new Stripe customer:`, stripeCustomerId);
  }

  // Determine success and cancel URLs
  const successUrl = data.successUrl || 'https://workout.au11no.com';
  const cancelUrl = data.cancelUrl || 'https://workout.au11no.com';
  
  console.log(`[${requestId}] Success URL: ${successUrl}, Cancel URL: ${cancelUrl}`);

  // Create the checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [
      {
        price: data.priceId,
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
  
  return { url: session.url };
}

async function handleCustomerPortal(userId, data, supabase, stripe, requestId) {
  console.log(`[${requestId}] Creating customer portal session for user ${userId}`);
  
  // Get the customer ID from the payments table
  const { data: paymentData, error: paymentError } = await supabase
    .from('payments')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (paymentError) {
    console.error(`[${requestId}] Error getting payment data:`, paymentError);
    throw paymentError;
  }
  
  if (!paymentData || paymentData.length === 0 || !paymentData[0].stripe_customer_id) {
    throw new Error('No Stripe customer found for this user');
  }

  const stripeCustomerId = paymentData[0].stripe_customer_id;
  const returnUrl = data.returnUrl || 'https://workout.au11no.com';
  
  // Create a billing portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  console.log(`[${requestId}] Created customer portal session:`, session.url);
  return { url: session.url };
}

async function handleWebhook(req, supabase, stripe, corsHeaders, requestId) {
  console.log(`[${requestId}] Processing webhook`);
  
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.error(`[${requestId}] No Stripe signature found`);
    return new Response(
      JSON.stringify({ error: 'No Stripe signature found' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error(`[${requestId}] STRIPE_WEBHOOK_SECRET is not configured`);
    return new Response(
      JSON.stringify({ error: 'Webhook secret not configured' }),
      { status: 500, headers: corsHeaders }
    );
  }
  
  try {
    const body = await req.text();
    console.log(`[${requestId}] Webhook body:`, body.substring(0, 200) + "...");
    
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`[${requestId}] Webhook event verified: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.user_id;
        const customerId = session.customer;
        
        // Record the payment
        await supabase.from('payments').insert({
          user_id: userId,
          amount: session.amount_total / 100,
          currency: session.currency,
          status: 'completed',
          payment_method: 'card',
          stripe_payment_id: session.id,
          stripe_customer_id: customerId,
        });
        
        // Update the user's profile status to 'pro'
        await supabase
          .from('profiles')
          .update({ status: 'pro' })
          .eq('id', userId);
        
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Find the user associated with this customer
        const { data: paymentData } = await supabase
          .from('payments')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .limit(1);
        
        if (!paymentData || paymentData.length === 0) {
          break;
        }
        
        const userId = paymentData[0].user_id;
        const status = subscription.status === 'active' ? 'pro' : 'basic';
        
        // Update the user's profile status
        await supabase
          .from('profiles')
          .update({ status })
          .eq('id', userId);
        
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Find the user associated with this customer
        const { data: paymentData } = await supabase
          .from('payments')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .limit(1);
        
        if (!paymentData || paymentData.length === 0) {
          break;
        }
        
        const userId = paymentData[0].user_id;
        
        // Update the user's profile status to 'basic'
        await supabase
          .from('profiles')
          .update({ status: 'basic' })
          .eq('id', userId);
        
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error(`[${requestId}] Webhook error: ${err.message}`);
    return new Response(
      JSON.stringify({ error: `Webhook error: ${err.message}` }),
      { status: 400, headers: corsHeaders }
    );
  }
}
