
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Get API key from header or bearer token
    let apiKey = req.headers.get('x-api-key');
    
    // If no x-api-key, try to get from Authorization header
    if (!apiKey) {
      const authHeader = req.headers.get('Authorization');
      console.log('Authorization header:', authHeader);
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Try to use the bearer token as the API key
        apiKey = authHeader.substring(7);
        console.log('Using bearer token as API key');
      }
    }
    
    if (!apiKey) {
      throw new Error('API key is required');
    }

    console.log('Request received with API key:', apiKey);

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify API key and get user_id
    const { data: apiKeyData, error: verifyError } = await supabaseAdmin
      .rpc('verify_api_key', { api_key_param: apiKey })
      .single();

    console.log('Verify API key result:', { apiKeyData, error: verifyError });

    if (verifyError || !apiKeyData?.user_id) {
      throw new Error('Invalid API key');
    }

    const user_id = apiKeyData.user_id;
    console.log('Verified user_id:', user_id);

    // Check if user has pro status
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('status')
      .eq('id', user_id)
      .single();
      
    const isPro = profileData?.status === 'pro';
    console.log('User pro status:', isPro);

    // Handle different endpoints
    const pathParts = url.pathname.split('/');
    const endpoint = pathParts[pathParts.length - 1];

    console.log('Endpoint requested:', endpoint);

    let result;
    switch (endpoint) {
      case 'workouts':
        result = await handleWorkouts(req, supabaseAdmin, user_id);
        break;
      case 'exercises':
        result = await handleExercises(req, supabaseAdmin, user_id);
        break;
      case 'weights':
        // Weight endpoint requires pro status
        if (!isPro) {
          throw new Error('Pro subscription required for weight tracking');
        }
        result = await handleWeights(req, supabaseAdmin, user_id);
        break;
      case 'stats':
        // Stats endpoint requires pro status
        if (!isPro) {
          throw new Error('Pro subscription required for detailed stats');
        }
        result = await handleStats(req, supabaseAdmin, user_id);
        break;
      case 'subscription':
        result = await handleSubscription(req, supabaseAdmin, user_id);
        break;
      case 'api':
      case '':
        // Handle the root endpoint or /api endpoint
        result = { 
          message: "API is working correctly", 
          endpoints: ["workouts", "exercises", "weights", "stats", "subscription"],
          user: { id: user_id, pro: isPro }
        };
        break;
      default:
        throw new Error('Invalid endpoint');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message.includes('API key') || error.message.includes('Pro subscription') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleWorkouts(req: Request, supabase: any, userId: string) {
  switch (req.method) {
    case 'GET':
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;

    case 'POST':
      const body = await req.json();
      const { data: newWorkout, error: createError } = await supabase
        .from('workouts')
        .insert([{ ...body, user_id: userId }])
        .select()
        .single();
      if (createError) throw createError;
      return newWorkout;

    default:
      throw new Error(`Method ${req.method} not allowed`);
  }
}

async function handleExercises(req: Request, supabase: any, userId: string) {
  switch (req.method) {
    case 'GET':
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;

    default:
      throw new Error(`Method ${req.method} not allowed`);
  }
}

async function handleWeights(req: Request, supabase: any, userId: string) {
  switch (req.method) {
    case 'GET':
      const { data, error } = await supabase
        .from('weight_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
      
    case 'POST':
      const body = await req.json();
      const { data: newWeight, error: createError } = await supabase
        .from('weight_records')
        .insert([{ ...body, user_id: userId }])
        .select()
        .single();
      if (createError) throw createError;
      return newWeight;

    default:
      throw new Error(`Method ${req.method} not allowed`);
  }
}

async function handleStats(req: Request, supabase: any, userId: string) {
  // Only support GET for stats
  if (req.method !== 'GET') {
    throw new Error(`Method ${req.method} not allowed`);
  }
  
  // Get profile data with goals
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('workout_goal, hour_goal')
    .eq('id', userId)
    .single();
    
  if (profileError) throw profileError;
  
  // Get completed workouts (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: completedWorkouts, error: workoutsError } = await supabase
    .from('completed_workouts')
    .select('*')
    .eq('user_id', userId)
    .gte('completed_at', thirtyDaysAgo.toISOString())
    .order('completed_at', { ascending: false });
    
  if (workoutsError) throw workoutsError;
  
  // Get weight records (last 30 days)
  const { data: weightRecords, error: weightError } = await supabase
    .from('weight_records')
    .select('*')
    .eq('user_id', userId)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });
    
  if (weightError) throw weightError;
  
  return {
    goals: {
      workout: profile?.workout_goal || 5,
      hour: profile?.hour_goal || 10
    },
    completedWorkouts,
    weightRecords
  };
}

async function handleSubscription(req: Request, supabase: any, userId: string) {
  // Only support GET for subscription status
  if (req.method !== 'GET') {
    throw new Error(`Method ${req.method} not allowed`);
  }
  
  // Get profile data with status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', userId)
    .single();
    
  if (profileError) throw profileError;
  
  // Get payment history
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (paymentsError) throw paymentsError;
  
  return {
    status: profile?.status || 'basic',
    payments: payments || []
  };
}
