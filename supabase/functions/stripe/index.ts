
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  console.log('Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const endpoint = pathParts[pathParts.length - 1];

    console.log(`Request to endpoint: ${endpoint}`);

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Handle webhook requests separately as they don't require authentication
    if (endpoint === 'webhook') {
      return handleWebhook(req, supabaseAdmin);
    }

    // Verify the session for non-webhook endpoints
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      throw new Error('Missing or invalid authorization header');
    }
    const token = authHeader.substring(7);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Invalid token or user not found');
    }

    const userId = user.id;
    console.log('Authenticated user:', userId);

    // Check for content-type header
    const contentType = req.headers.get('Content-Type');
    console.log('Content-Type header:', contentType);

    // Extract request data
    let requestData = {};
    
    try {
      if (req.body) {
        const bodyText = await req.text();
        console.log('Raw request body:', bodyText);
        
        if (bodyText && bodyText.trim() !== '') {
          try {
            requestData = JSON.parse(bodyText);
            console.log('Parsed request data:', JSON.stringify(requestData));
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error(`Failed to parse request body as JSON: ${parseError.message}`);
          }
        } else {
          console.log('Empty request body');
          // For empty body, use an empty object
          requestData = {};
        }
      } else {
        console.log('No request body');
      }
    } catch (e) {
      console.error('Error processing request body:', e);
      throw new Error('Invalid request body: ' + e.message);
    }

    // Handle different endpoints
    let result;
    switch (endpoint) {
      case 'create-checkout-session':
        result = await handleCreateCheckoutSession(userId, requestData, supabaseAdmin, req);
        break;
      case 'customer-portal':
        result = await handleCustomerPortal(userId, supabaseAdmin, req);
        break;
      default:
        throw new Error('Invalid endpoint');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Stripe API Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleCreateCheckoutSession(userId, data, supabase, req) {
  console.log(`Creating checkout session for user ${userId}`);
  console.log('Request data for checkout:', JSON.stringify(data));
  
  if (!data || !data.priceId) {
    console.error('Missing priceId in request data');
    throw new Error('Price ID is required');
  }

  console.log(`Using priceId: ${data.priceId}`);

  // Check if user already has a Stripe customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, status')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Profile error:', profileError);
    throw profileError;
  }

  // Get or create Stripe customer
  let stripeCustomerId;
  
  // Check if customer exists in payments table
  const { data: paymentData } = await supabase
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
      console.error('Unable to get user email');
      throw new Error('Unable to get user email');
    }
    
    console.log('Creating new Stripe customer for email:', userData.user.email);
    
    const customer = await stripe.customers.create({
      email: userData.user.email,
      metadata: {
        supabase_id: userId,
      },
    });
    stripeCustomerId = customer.id;
    console.log('Created new Stripe customer:', stripeCustomerId);
  }

  // Create the checkout session
  const successUrl = data.successUrl || new URL(req.url).origin;
  const cancelUrl = data.cancelUrl || new URL(req.url).origin;
  
  console.log(`Success URL: ${successUrl}, Cancel URL: ${cancelUrl}`);

  try {
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
      cancel_url: `${cancelUrl}`,
      metadata: {
        user_id: userId,
      },
    });

    console.log('Created checkout session:', session.id);
    console.log('Checkout URL:', session.url);
    
    return { url: session.url };
  } catch (stripeError) {
    console.error('Stripe checkout session creation error:', stripeError);
    throw new Error(`Stripe error: ${stripeError.message}`);
  }
}

async function handleCustomerPortal(userId, supabase, req) {
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
    console.error('Payment error:', paymentError);
    throw paymentError;
  }
  
  if (!paymentData || paymentData.length === 0 || !paymentData[0].stripe_customer_id) {
    throw new Error('No Stripe customer found for this user');
  }

  const stripeCustomerId = paymentData[0].stripe_customer_id;
  console.log('Using customer portal for:', stripeCustomerId);

  const returnUrl = `${new URL(req.url).origin}`;
  console.log('Return URL:', returnUrl);
  
  // Create a billing portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  console.log('Created customer portal session:', session.url);
  return { url: session.url };
}

async function handleWebhook(req, supabase) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.error('No Stripe signature found');
    throw new Error('No Stripe signature found');
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured.');
    throw new Error('Webhook secret not configured');
  }
  
  const body = await req.text();
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`Webhook event verified: ${event.type}`);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  console.log(`Event received: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.user_id;
      const customerId = session.customer;
      
      console.log('Processing completed checkout for user:', userId);
      
      // Record the payment
      await supabase.from('payments').insert({
        user_id: userId,
        amount: session.amount_total / 100, // Convert cents to dollars
        currency: session.currency,
        status: 'completed',
        payment_method: 'card',
        stripe_payment_id: session.id,
        stripe_customer_id: customerId,
      });
      
      // Update the user's profile status to 'pro'
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'pro' })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Error updating user status:', updateError);
      } else {
        console.log(`Successfully updated user ${userId} to pro status`);
      }
      
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      console.log('Processing subscription update for customer:', customerId);
      
      // Find the user associated with this customer
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .limit(1);
      
      if (paymentError || !paymentData || paymentData.length === 0) {
        console.error('Could not find user for this customer:', customerId);
        break;
      }
      
      const userId = paymentData[0].user_id;
      const status = subscription.status === 'active' ? 'pro' : 'basic';
      
      console.log(`Updating user ${userId} status to ${status}`);
      
      // Update the user's profile status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Error updating user status:', updateError);
      } else {
        console.log(`Successfully updated user ${userId} to ${status} status`);
      }
      
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      console.log('Processing subscription deletion for customer:', customerId);
      
      // Find the user associated with this customer
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .limit(1);
      
      if (paymentError || !paymentData || paymentData.length === 0) {
        console.error('Could not find user for this customer:', customerId);
        break;
      }
      
      const userId = paymentData[0].user_id;
      
      console.log(`Downgrading user ${userId} to basic plan`);
      
      // Update the user's profile status to 'basic'
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'basic' })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Error updating user status:', updateError);
      } else {
        console.log(`Successfully downgraded user ${userId} to basic status`);
      }
      
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}
