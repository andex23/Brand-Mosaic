import React, { useState } from 'react';
import { createStripeCheckout, isStripeConfigured } from '../lib/payments';
import { useError } from '../hooks/useError';

export type PaymentType = 'credits' | 'subscription' | 'full_access';

interface PaymentModalProps {
  userId: string;
  userEmail: string;
  currentCredits: number;
  onSuccess: () => void;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  userId,
  userEmail,
  currentCredits,
  onSuccess,
  onClose,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PaymentType>('credits');
  const [isProcessing, setIsProcessing] = useState(false);
  const { showError, showSuccess, showWarning } = useError();

  const paymentPlans = {
    credits: {
      title: 'Pay-Per-Use',
      price: 5,
      description: '2 brand kit generations',
      features: [
        '2 Full brand kit generations',
        'Complete AI analysis',
        'Logo generation access',
        'PDF export capabilities',
      ],
      type: 'credits' as PaymentType,
    },
    subscription: {
      title: 'Monthly Subscription',
      price: 15,
      description: 'Unlimited generations',
      features: [
        'Unlimited brand kit generations',
        'Unlimited logo generations',
        'Priority support',
        'Early access to new features',
        'Cancel anytime',
      ],
      type: 'subscription' as PaymentType,
    },
    full_access: {
      title: 'Full Access',
      price: 49,
      description: 'Lifetime unlimited',
      features: [
        'Lifetime unlimited generations',
        'All premium features',
        'Priority support forever',
        'One-time payment',
        'No recurring charges',
      ],
      type: 'full_access' as PaymentType,
    },
  };

  const handlePurchase = async () => {
    if (!isStripeConfigured()) {
      showWarning('Payment system is not configured yet. Please contact support.');
      return;
    }

    setIsProcessing(true);

    try {
      const plan = paymentPlans[selectedPlan];
      const result = await createStripeCheckout(userId, {
        email: userEmail,
        amount: plan.price,
        generationsCount: selectedPlan === 'credits' ? 2 : undefined,
        paymentType: selectedPlan,
      });

      if (result.success) {
        showSuccess(result.message || 'Redirecting to payment...');
        // Stripe will redirect, so we don't need to close the modal
      } else {
        if (result.message?.includes('cancel')) {
          showError('payment/cancelled');
        } else {
          showError('payment/failed', { message: result.message });
        }
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      showError('payment/failed', { message: err.message });
      setIsProcessing(false);
    }
  };

  const selectedPlanData = paymentPlans[selectedPlan];

  return (
    <div
      className="payment-modal-overlay"
      onClick={onClose}
    >
      <div
        className="payment-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="payment-modal-header">
          <h2 className="payment-modal-title">[ UPGRADE ]</h2>
          <button onClick={onClose} className="payment-modal-close">[×]</button>
        </div>

        {/* Plan Selection */}
        <div className="payment-plans-grid">
          {Object.values(paymentPlans).map((plan) => (
            <div
              key={plan.type}
              className={`payment-plan-card ${selectedPlan === plan.type ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan.type)}
            >
              <div className="payment-plan-header">
                <h3 className="payment-plan-title">{plan.title}</h3>
                <div className="payment-plan-price">
                  ${plan.price}
                  {plan.type === 'subscription' && <span className="payment-plan-period">/mo</span>}
                </div>
              </div>
              <p className="payment-plan-desc">{plan.description}</p>
              <ul className="payment-plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>✓ {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Current Status */}
        {currentCredits >= 0 && currentCredits !== -1 && (
          <div className="payment-current-status">
            <span>Current credits: <strong>{currentCredits}</strong></span>
          </div>
        )}

        {/* Payment Button */}
        <div className="payment-modal-actions">
          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="brand-submit-btn payment-purchase-btn"
          >
            {isProcessing ? (
              '[ PROCESSING... ]'
            ) : (
              <>
                [ PAY ${selectedPlanData.price} WITH STRIPE ]
                <span style={{ fontSize: '12px', opacity: 0.7, marginLeft: '8px' }}>→</span>
              </>
            )}
          </button>
          <div className="payment-security-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Secure payment powered by Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
