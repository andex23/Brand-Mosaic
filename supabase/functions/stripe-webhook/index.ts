import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (stripeWebhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // For testing without signature verification
      event = JSON.parse(body);
    }

    // Only process checkout.session.completed events
    if (event.type !== 'checkout.session.completed') {
      console.log('Ignoring event:', event.type);
      return new Response(
        JSON.stringify({ message: 'Event ignored' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, reference, generationsCount, paymentType } = session.metadata || {};

    if (!userId || !reference) {
      console.error('Missing metadata in session');
      return new Response(
        JSON.stringify({ error: 'Invalid session metadata' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: 'completed' })
      .eq('payment_id', reference);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      throw updateError;
    }

    // Handle different payment types
    const paymentTypeValue = paymentType || 'credits';
    
    if (paymentTypeValue === 'full_access' || paymentTypeValue === 'subscription') {
      // Set unlimited access (-1 means unlimited)
      const { error: unlimitedError } = await supabase
        .from('user_profiles')
        .update({ available_generations: -1 })
        .eq('id', userId);

      if (unlimitedError) {
        console.error('Error setting unlimited access:', unlimitedError);
        throw unlimitedError;
      }

      console.log(`Successfully granted ${paymentTypeValue} to user ${userId}`);
    } else {
      // Add generations for credits purchase
      const generations = parseInt(generationsCount || '2');
      const { error: addError } = await supabase.rpc('add_user_generations', {
        p_user_id: userId,
        p_count: generations,
      });

      if (addError) {
        console.error('Error adding generations:', addError);
        throw addError;
      }

      console.log(`Successfully added ${generations} generations to user ${userId}`);
    }

    return new Response(
      JSON.stringify({ message: 'Webhook processed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

