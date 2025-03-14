
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Add request ID for tracing
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Webhook request received: ${req.method}`);
  
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
    // Get the raw request body
    const rawBody = await req.text();
    
    if (!rawBody) {
      console.error(`[${requestId}] Empty request body`);
      return new Response(
        JSON.stringify({ error: 'Empty request body' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`[${requestId}] Processing webhook event`);

    // Initialize Stripe and Supabase
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error(`[${requestId}] Stripe configuration missing`);
      return new Response(
        JSON.stringify({ error: "Stripe configuration is missing" }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Supabase configuration missing`);
      return new Response(
        JSON.stringify({ error: "Supabase configuration is missing" }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the Stripe signature from the headers
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error(`[${requestId}] No Stripe signature found`);
      return new Response(
        JSON.stringify({ error: "No Stripe signature found" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Verify the webhook event
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
      console.log(`[${requestId}] Webhook verified: ${event.type}`);
    } catch (verifyError) {
      console.error(`[${requestId}] Webhook signature verification failed:`, verifyError.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${verifyError.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Extract customer and subscription info from the event
    const { type } = event;
    
    let customerId;
    let subscriptionId;
    let userId;
    let status;
    
    if (event.data.object.customer) {
      customerId = event.data.object.customer;
      console.log(`[${requestId}] Customer ID: ${customerId}`);
      
      // Lookup the user ID from customer metadata
      try {
        const customer = await stripe.customers.retrieve(customerId);
        userId = customer.metadata?.user_id;
        console.log(`[${requestId}] User ID from customer metadata: ${userId}`);
      } catch (error) {
        console.error(`[${requestId}] Error retrieving customer:`, error.message);
      }
    }
    
    // Handle different event types
    switch (type) {
      case 'checkout.session.completed':
        // Payment is successful and the subscription is created
        subscriptionId = event.data.object.subscription;
        console.log(`[${requestId}] Checkout completed, subscription ID: ${subscriptionId}`);
        
        // If we didn't get userId from customer metadata, try to get it from checkout session metadata
        if (!userId && event.data.object.metadata?.user_id) {
          userId = event.data.object.metadata.user_id;
          console.log(`[${requestId}] User ID from session metadata: ${userId}`);
        }
        
        // Set user as pro
        if (userId) {
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ status: 'pro' })
            .eq('id', userId);
          
          if (error) {
            console.error(`[${requestId}] Error updating user status:`, error);
          } else {
            console.log(`[${requestId}] User ${userId} upgraded to pro`);
          }
        }
        break;
      
      case 'invoice.payment_succeeded':
        // Continuing subscription payments succeed
        console.log(`[${requestId}] Invoice payment succeeded`);
        
        if (userId) {
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ status: 'pro' })
            .eq('id', userId);
          
          if (error) {
            console.error(`[${requestId}] Error updating user status:`, error);
          } else {
            console.log(`[${requestId}] User ${userId} status confirmed as pro`);
          }
        }
        break;
      
      case 'customer.subscription.updated':
        // Subscription was updated
        status = event.data.object.status;
        console.log(`[${requestId}] Subscription updated, status: ${status}`);
        
        if (userId) {
          // Update status based on subscription status
          const newStatus = (status === 'active' || status === 'trialing') ? 'pro' : 'basic';
          
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ status: newStatus })
            .eq('id', userId);
          
          if (error) {
            console.error(`[${requestId}] Error updating user status:`, error);
          } else {
            console.log(`[${requestId}] User ${userId} status updated to ${newStatus}`);
          }
        }
        break;
      
      case 'customer.subscription.deleted':
        // Subscription was canceled or expired
        console.log(`[${requestId}] Subscription deleted/canceled`);
        
        if (userId) {
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ status: 'basic' })
            .eq('id', userId);
          
          if (error) {
            console.error(`[${requestId}] Error updating user status:`, error);
          } else {
            console.log(`[${requestId}] User ${userId} downgraded to basic`);
          }
        }
        break;
      
      default:
        console.log(`[${requestId}] Unhandled event type: ${type}`);
    }
    
    // Return a successful response
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(`[${requestId}] Webhook error:`, error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
