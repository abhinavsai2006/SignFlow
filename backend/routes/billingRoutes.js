import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_key';
const stripe = new Stripe(stripeKey);

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
        url: 'http://localhost:5177/billing?success=true',
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
      success_url: 'http://localhost:5177/billing?success=true',
      cancel_url: 'http://localhost:5177/billing?cancel=true',
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

export default router;
