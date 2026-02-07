import { supabase } from './supabase';

export type PaymentType = 'credits' | 'subscription' | 'full_access';

export interface PaymentOptions {
  email: string;
  amount: number;
  generationsCount?: number;
  paymentType?: PaymentType;
}

export interface PaymentResult {
  success: boolean;
  message?: string;
  reference?: string;
}

// Create checkout session via Supabase Edge Function
export const createStripeCheckout = async (
  userId: string,
  options: PaymentOptions
): Promise<PaymentResult> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!stripeKey) {
    throw new Error('Stripe not configured. Please add VITE_STRIPE_PUBLIC_KEY to your environment.');
  }

  try {
    // Generate unique reference
    const reference = `brandmosaic_${Date.now()}_${userId.slice(0, 8)}`;

    // Create payment record in database
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        payment_provider: 'stripe',
        payment_id: reference,
        amount: options.amount,
        currency: 'USD',
        status: 'pending',
        generations_purchased: options.generationsCount || 2,
      });

    if (dbError) {
      console.error('Error creating payment record:', dbError);
      throw dbError;
    }

    // Call Supabase Edge Function to create Stripe checkout session
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: {
        userId,
        email: options.email,
        amount: options.amount,
        generationsCount: options.generationsCount,
        paymentType: options.paymentType || 'credits',
        reference,
        successUrl: `${window.location.origin}?payment=success&ref=${reference}`,
        cancelUrl: `${window.location.origin}?payment=cancelled`,
      },
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }

    if (data?.url) {
      // Redirect to Stripe Checkout URL
      window.location.href = data.url;
      return {
        success: true,
        reference,
        message: 'Redirecting to payment...',
      };
    }

    if (data?.sessionId) {
      // Fallback: Load Stripe and redirect using dynamic import
      const { loadStripe } = await import('@stripe/stripe-js');
      const stripe = await loadStripe(stripeKey);
      
      if (stripe) {
        // Use type assertion for redirectToCheckout method
        const result = await (stripe as any).redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (result?.error) {
          throw new Error(result.error.message);
        }
      }

      return {
        success: true,
        reference,
        message: 'Redirecting to payment...',
      };
    }

    throw new Error('Failed to create checkout session');
  } catch (err: any) {
    console.error('Error initiating payment:', err);
    return {
      success: false,
      message: err.message || 'Failed to initiate payment.',
    };
  }
};

// Verify payment status
export const verifyPayment = async (reference: string): Promise<boolean> => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('status')
      .eq('payment_id', reference)
      .single();

    if (error) {
      console.error('Error verifying payment:', error);
      return false;
    }

    return data?.status === 'completed';
  } catch (err) {
    console.error('Error in verifyPayment:', err);
    return false;
  }
};

// Check if Stripe is configured
export const isStripeConfigured = (): boolean => {
  return !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;
};
