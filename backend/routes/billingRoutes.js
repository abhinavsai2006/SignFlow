import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendSubscriptionActivatedEmail,
  sendSubscriptionRenewedEmail,
  sendPaymentSuccessfulEmail,
  sendPaymentFailedEmail,
  sendTrialEndingEmail,
  sendPlanUpgradedEmail,
  sendPlanDowngradedEmail
} from '../middleware/emailService.js';

const router = express.Router();
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_key';
const stripe = new Stripe(stripeKey);

// Resolve frontend base URL from environment (no localhost hardcoding in production)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5177';

// @route   GET /api/billing/plan
// @desc    Get user plan and usage limits
router.get('/plan', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      plan: user.plan,
      documentLimit: user.documentLimit,
      documentsCount: user.documentsCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch plan', error: error.message });
  }
});

// @route   POST /api/billing/checkout
// @desc    Create a Stripe Checkout Session
router.post('/checkout', protect, async (req, res) => {
  try {
    const { planName } = req.body;
    if (!['Pro', 'Business', 'Enterprise'].includes(planName)) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    const user = await User.findById(req.user._id);

    // Fallback if Stripe key is mock
    if (stripeKey === 'sk_test_mock_stripe_key') {
      // Direct simulation: instantly upgrade user plan
      let limit = 5;
      if (planName === 'Pro') limit = 50;
      if (planName === 'Business') limit = 500;
      if (planName === 'Enterprise') limit = 10000;

      user.plan = planName;
      user.documentLimit = limit;
      await user.save();

      return res.json({ 
        url: `${FRONTEND_URL}/billing?success=true`,
        simulated: true,
        message: 'Mock Stripe Session Success: Plan upgraded instantly.' 
      });
    }

    // Real Stripe Integration code path
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `SignFlow AI ${planName} Subscription`,
            description: `Upgrade to ${planName} Plan`,
          },
          unit_amount: planName === 'Pro' ? 1500 : planName === 'Business' ? 4500 : 12000,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${FRONTEND_URL}/billing?success=true`,
      cancel_url: `${FRONTEND_URL}/billing?cancel=true`,
      customer_email: user.email,
      metadata: {
        userId: user._id.toString(),
        planName
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: 'Stripe session creation failed', error: error.message });
  }
});

// @route   POST /api/billing/webhook
// @desc    Handle Stripe Webhooks
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (stripeKey !== 'sk_test_mock_stripe_key' && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // Mock webhook event trigger
      event = req.body;
    }

    // Handle subscription event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const planName = session.metadata?.planName;

      if (userId && planName) {
        let limit = 5;
        if (planName === 'Pro') limit = 50;
        if (planName === 'Business') limit = 500;
        if (planName === 'Enterprise') limit = 10000;

        await User.findByIdAndUpdate(userId, {
          plan: planName,
          documentLimit: limit,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// ============================================================================
// DEMO BILLING ENDPOINTS — Student Project
// ============================================================================

// @route   POST /api/billing/demo/activate
// @desc    DEMO FEATURE - Simulates subscription activation email
router.post('/demo/activate', protect, async (req, res) => {
  try {
    const { planName, amount } = req.body;
    await sendSubscriptionActivatedEmail(req.user.email, req.user.name, planName || 'Pro', amount || '$15.00');
    res.json({ message: 'Subscription activated email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send activation email', error: err.message });
  }
});

// @route   POST /api/billing/demo/renew
// @desc    DEMO FEATURE - Simulates subscription renewed email
router.post('/demo/renew', protect, async (req, res) => {
  try {
    const { planName, amount } = req.body;
    await sendSubscriptionRenewedEmail(req.user.email, req.user.name, planName || 'Pro', amount || '$15.00');
    res.json({ message: 'Subscription renewed email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send renewal email', error: err.message });
  }
});

// @route   POST /api/billing/demo/payment-success
// @desc    DEMO FEATURE - Simulates payment successful email
router.post('/demo/payment-success', protect, async (req, res) => {
  try {
    const { amount, invoiceUrl } = req.body;
    const invUrl = invoiceUrl || `${FRONTEND_URL}/billing/invoices/inv_12345`;
    await sendPaymentSuccessfulEmail(req.user.email, req.user.name, amount || '$15.00', invUrl);
    res.json({ message: 'Payment success email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send payment success email', error: err.message });
  }
});

// @route   POST /api/billing/demo/payment-fail
// @desc    DEMO FEATURE - Simulates payment failed email
router.post('/demo/payment-fail', protect, async (req, res) => {
  try {
    const { amount, updateUrl } = req.body;
    const updUrl = updateUrl || `${FRONTEND_URL}/billing/payment-methods`;
    await sendPaymentFailedEmail(req.user.email, req.user.name, amount || '$15.00', updUrl);
    res.json({ message: 'Payment failed email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send payment failed email', error: err.message });
  }
});

// @route   POST /api/billing/demo/trial-ending
// @desc    DEMO FEATURE - Simulates trial ending email
router.post('/demo/trial-ending', protect, async (req, res) => {
  try {
    const { planName, upgradeUrl } = req.body;
    const upgUrl = upgradeUrl || `${FRONTEND_URL}/billing`;
    await sendTrialEndingEmail(req.user.email, req.user.name, planName || 'Free Trial', upgUrl);
    res.json({ message: 'Trial ending email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send trial ending email', error: err.message });
  }
});

// @route   POST /api/billing/demo/upgrade
// @desc    DEMO FEATURE - Simulates upgrade email
router.post('/demo/upgrade', protect, async (req, res) => {
  try {
    const { planName } = req.body;
    await sendPlanUpgradedEmail(req.user.email, req.user.name, planName || 'Business');
    res.json({ message: 'Upgrade email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send upgrade email', error: err.message });
  }
});

// @route   POST /api/billing/demo/downgrade
// @desc    DEMO FEATURE - Simulates downgrade email
router.post('/demo/downgrade', protect, async (req, res) => {
  try {
    const { planName } = req.body;
    await sendPlanDowngradedEmail(req.user.email, req.user.name, planName || 'Free');
    res.json({ message: 'Downgrade email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send downgrade email', error: err.message });
  }
});

export default router;
