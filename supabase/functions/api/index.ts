
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify API key and get user_id
    const { data: { user_id }, error: verifyError } = await supabase
      .rpc('verify_api_key', { api_key_param: apiKey })
      .single();

    if (verifyError || !user_id) {
      throw new Error('Invalid API key');
    }

    // Handle different endpoints
    const endpoint = url.pathname.split('/').pop();

    let result;
    switch (endpoint) {
      case 'workouts':
        result = await handleWorkouts(req, supabase, user_id);
        break;
      case 'exercises':
        result = await handleExercises(req, supabase, user_id);
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
        status: error.message.includes('API key') ? 401 : 500,
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
