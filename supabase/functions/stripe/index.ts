
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
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.error(`Invalid method: ${req.method}`);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
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
      console.error("Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Supabase credentials not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Handle webhook requests (they come directly from Stripe, not through the front-end)
    const url = new URL(req.url);
    if (url.pathname.endsWith('/webhook')) {
      return handleWebhook(req, supabaseAdmin, stripe, corsHeaders);
    }

    // For all other endpoints, verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    const token = authHeader.substring(7);
    console.log('Token received:', token);

    // Verify the user token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token or user not found' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = user.id;
    console.log('Authenticated user:', userId);

    // Parse the request body safely
    let requestData;
    try {
      // Check if the request has a body
      const contentType = req.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('Invalid content type, expected application/json, got:', contentType);
        return new Response(
          JSON.stringify({ error: 'Content-Type must be application/json' }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Clone the request to ensure we can read the body
      const clonedReq = req.clone();
      const bodyText = await clonedReq.text();
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('Request body is empty');
        return new Response(
          JSON.stringify({ error: 'Request body is empty' }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      console.log('Raw request body:', bodyText);
      
      try {
        requestData = JSON.parse(bodyText);
        console.log('Parsed request body:', requestData);
      } catch (parseError) {
        console.error('Failed to parse JSON body:', parseError, 'Body:', bodyText);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { status: 400, headers: corsHeaders }
        );
      }
    } catch (error) {
      console.error('Error processing request body:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to read request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Determine which endpoint to use
    const endpoint = requestData?.endpoint || 'create-checkout-session';
    console.log(`Processing endpoint: ${endpoint}`);

    // Handle different endpoints
    let result;
    switch (endpoint) {
      case 'create-checkout-session':
        if (!requestData.priceId) {
          console.error('Missing priceId in request body');
          return new Response(
            JSON.stringify({ error: 'Missing required field: priceId' }),
            { status: 400, headers: corsHeaders }
          );
        }
        result = await handleCreateCheckoutSession(userId, requestData, supabaseAdmin, stripe);
        break;
        
      case 'customer-portal':
        result = await handleCustomerPortal(userId, requestData, supabaseAdmin, stripe);
        break;
        
      default:
        console.error(`Invalid endpoint: ${endpoint}`);
        return new Response(
          JSON.stringify({ error: `Invalid endpoint: ${endpoint}` }),
          { status: 400, headers: corsHeaders }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

async function handleCreateCheckoutSession(userId, data, supabase, stripe) {
  console.log(`Creating checkout session for user ${userId}`);
  
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
    console.log('Using existing Stripe customer:', stripeCustomerId);
  } else {
    // Create a new customer
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    if (!userData || !userData.user || !userData.user.email) {
      throw new Error('Unable to get user email');
    }
    
    const customer = await stripe.customers.create({
      email: userData.user.email,
      metadata: {
        supabase_id: userId,
      },
    });
    stripeCustomerId = customer.id;
    console.log('Created new Stripe customer:', stripeCustomerId);
  }

  // Determine success and cancel URLs
  const successUrl = data.successUrl || 'https://workout.au11no.com';
  const cancelUrl = data.cancelUrl || 'https://workout.au11no.com';
  
  console.log(`Success URL: ${successUrl}, Cancel URL: ${cancelUrl}`);

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

  console.log('Created checkout session:', session.id);
  console.log('Checkout URL:', session.url);
  
  return { url: session.url };
}

async function handleCustomerPortal(userId, data, supabase, stripe) {
  console.log(`Creating customer portal session for user ${userId}`);
  
  // Get the customer ID from the payments table
  const { data: paymentData, error: paymentError } = await supabase
    .from('payments')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (paymentError) {
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

  console.log('Created customer portal session:', session.url);
  return { url: session.url };
}

async function handleWebhook(req, supabase, stripe, corsHeaders) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.error('No Stripe signature found');
    return new Response(
      JSON.stringify({ error: 'No Stripe signature found' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return new Response(
      JSON.stringify({ error: 'Webhook secret not configured' }),
      { status: 500, headers: corsHeaders }
    );
  }
  
  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`Webhook event verified: ${event.type}`);

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
    console.error(`Webhook error: ${err.message}`);
    return new Response(
      JSON.stringify({ error: `Webhook error: ${err.message}` }),
      { status: 400, headers: corsHeaders }
    );
  }
}
