import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { userId, email, amount, generationsCount, paymentType, reference, successUrl, cancelUrl } = await req.json();

    const paymentTypeValue = paymentType || 'credits';

    // Determine product name and description based on payment type
    let productName = 'Brand Mosaic Credits';
    let productDescription = `${generationsCount || 2} brand kit generations`;
    let mode: 'payment' | 'subscription' = 'payment';

    if (paymentTypeValue === 'subscription') {
      productName = 'Brand Mosaic Monthly Subscription';
      productDescription = 'Unlimited brand kit generations';
      mode = 'subscription';
    } else if (paymentTypeValue === 'full_access') {
      productName = 'Brand Mosaic Full Access';
      productDescription = 'Lifetime unlimited access';
      mode = 'payment';
    }

    // Create line items
    const lineItems: any[] = [];

    if (mode === 'subscription') {
      // For subscriptions, create a recurring price
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: productName,
            description: productDescription,
          },
          recurring: {
            interval: 'month',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      });
    } else {
      // For one-time payments (credits or full access)
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: productName,
            description: productDescription,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: {
        userId,
        reference,
        paymentType: paymentTypeValue,
        generationsCount: String(generationsCount || (paymentTypeValue === 'full_access' ? -1 : 2)),
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

