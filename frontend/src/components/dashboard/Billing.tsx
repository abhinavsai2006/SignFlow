import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import MetaCard from '../ui/MetaCard';
import MetaButton from '../ui/MetaButton';
import MetaBadge from '../ui/MetaBadge';

const PLANS = [
  {
    key: 'Free',
    label: 'Free Starter',
    price: '$0',
    period: '/mo',
    limit: '5 docs / month',
    features: [
      '5 documents per month',
      'Standard e-signatures',
      'Basic audit trail',
      'Email notifications',
    ],
    missing: ['Workspaces', 'Priority support'],
    variant: 'ghost' as const,
    highlight: false,
  },
  {
    key: 'Pro',
    label: 'Professional',
    price: '$15',
    period: '/mo',
    limit: '50 docs / month',
    features: [
      '50 documents per month',
      'Reusable signature profiles',
      'Parallel & sequential routing',
      'Shared signing links',
      'Advanced audit certificates',
    ],
    missing: ['Custom branding'],
    variant: 'buy-cta' as const,
    highlight: true,
  },
  {
    key: 'Enterprise',
    label: 'Enterprise',
    price: '$120',
    period: '/mo',
    limit: 'Unlimited docs',
    features: [
      'Unlimited documents',
      'Full workspace RBAC',
      'Custom branding & stamp logo',
      'Priority support',
      'Audit trail exports (PDF/CSV)',
      'Dedicated account manager',
    ],
    missing: [],
    variant: 'buy-cta' as const,
    highlight: false,
  },
];

export default function Billing() {
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [usage, setUsage] = useState(0);
  const [limit, setLimit] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPlanDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/billing/plan');
      setCurrentPlan(response.data.plan || 'Free');
      setUsage(response.data.documentsCount || 0);
      setLimit(response.data.documentLimit || 5);
    } catch (error) {
      console.error('Failed to fetch plan status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setTimeout(() => {
        setSuccess(true);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlanDetails();
  }, [fetchPlanDetails]);

  const handleUpgrade = async (planKey: string) => {
    if (planKey === currentPlan) return;
    setUpgrading(planKey);
    try {
      const response = await api.post('/billing/checkout', { planName: planKey });
      if (response.data.url) {
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = response.data.url;
      }
      if (response.data.simulated) {
        showToast(`✓ Demo mode: Plan upgraded to ${planKey} instantly!`);
        await fetchPlanDetails();
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      showToast('Failed to process upgrade. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  const usagePct = limit >= 10000 ? 5 : Math.min(100, (usage / limit) * 100);
  const usageColor = usagePct > 80 ? '#ef4444' : usagePct > 60 ? '#f59e0b' : '#22c55e';

  if (isLoading) {
    return (
      <div className="space-y-xl max-w-[960px]">
        <div className="h-8 w-48 bg-surface-soft rounded-lg animate-pulse" />
        <div className="h-24 w-full bg-surface-soft rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-xl">
          {[0, 1, 2].map(i => <div key={i} className="h-80 bg-surface-soft rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-xl max-w-[960px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-heading-lg font-bold text-ink-deep mb-xxs">Plans & Billing</h1>
          <p className="text-body-sm text-slate">Manage your subscription and document usage.</p>
        </div>
        <div className="flex items-center gap-sm">
          <span className="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-brand/10 border border-brand/30 text-body-xs font-bold text-brand">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <circle cx="5" cy="5" r="5" />
            </svg>
            DEMO MODE — No real charges
          </span>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="bg-success/10 border border-success text-success px-md py-sm rounded-lg text-body-sm font-medium flex items-center gap-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          {toast}
        </div>
      )}

      {success && (
        <div className="bg-success/10 border border-success text-success px-md py-sm rounded-lg text-body-sm-bold text-center">
          🎉 Congratulations! Your plan has been successfully upgraded.
        </div>
      )}

      {/* Current Plan + Usage Card */}
      <MetaCard variant="product-feature">
        <div className="flex flex-col sm:flex-row sm:items-center gap-md mb-md">
          <div className="flex-1">
            <div className="flex items-center gap-sm mb-xxs">
              <h3 className="text-subtitle-md font-bold text-ink-deep">Current Plan</h3>
              <MetaBadge variant={currentPlan === 'Free' ? 'neutral' : 'success'}>
                {currentPlan}
              </MetaBadge>
            </div>
            <p className="text-body-sm text-slate">Document usage this month</p>
          </div>
          <div className="text-right">
            <p className="text-heading-md font-bold text-ink-deep">
              {usage} <span className="text-body-sm font-normal text-slate">/ {limit >= 10000 ? 'Unlimited' : limit} docs</span>
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface-soft h-[10px] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${usagePct}%`, backgroundColor: usageColor }}
          />
        </div>

        {usagePct > 80 && (
          <p className="text-body-xs text-critical mt-xs">
            ⚠ You're approaching your monthly limit. Consider upgrading your plan.
          </p>
        )}
      </MetaCard>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isUpgrading = upgrading === plan.key;

          return (
            <MetaCard
              key={plan.key}
              variant="why-buy-tile"
              className={`flex flex-col justify-between relative transition-all duration-200 ${
                isCurrent
                  ? 'border-brand ring-2 ring-brand/15 bg-brand/3'
                  : plan.highlight
                  ? 'border-brand/40 shadow-md'
                  : ''
              }`}
            >
              {plan.highlight && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-sm py-xxs rounded-full bg-brand text-white text-body-xs font-bold whitespace-nowrap">
                    MOST POPULAR
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-sm py-xxs rounded-full bg-success text-white text-body-xs font-bold whitespace-nowrap">
                    ✓ ACTIVE
                  </span>
                </div>
              )}

              <div className="space-y-md">
                <div>
                  <p className="text-body-xs font-bold text-slate uppercase tracking-widest">{plan.label}</p>
                  <div className="flex items-baseline gap-xs mt-xs">
                    <span className="text-display-sm font-bold text-ink-deep">{plan.price}</span>
                    <span className="text-body-sm text-slate">{plan.period}</span>
                  </div>
                  <p className="text-body-xs text-slate mt-xxs">{plan.limit}</p>
                </div>

                <div className="space-y-xs">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-xs text-body-sm text-ink">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="mt-[2px] flex-shrink-0">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      {f}
                    </div>
                  ))}
                  {plan.missing.map((f, i) => (
                    <div key={i} className="flex items-start gap-xs text-body-sm text-slate/60">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" className="mt-[2px] flex-shrink-0">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <MetaButton
                variant={isCurrent ? 'secondary' : plan.variant}
                onClick={() => !isCurrent && handleUpgrade(plan.key)}
                className="w-full mt-xl"
                disabled={isCurrent}
                isLoading={isUpgrading}
              >
                {isCurrent ? 'Current Plan' : `Upgrade to ${plan.label}`}
              </MetaButton>
            </MetaCard>
          );
        })}
      </div>

      {/* Demo mode notice */}
      <div className="border border-hairline-soft rounded-xl p-md bg-surface-soft/50 flex items-start gap-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate mt-[2px] flex-shrink-0">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
        <div>
          <p className="text-body-sm font-semibold text-ink-deep">Demo Billing Mode</p>
          <p className="text-body-xs text-slate mt-xxs">
            This is a college project showcase. Plan upgrades are simulated — no real charges are made.
            In production, this would connect to Stripe's payment infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
}
