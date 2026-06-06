import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import MetaCard from '../ui/MetaCard';
import MetaButton from '../ui/MetaButton';
import MetaBadge from '../ui/MetaBadge';

export default function Billing() {
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [usage, setUsage] = useState(0);
  const [limit, setLimit] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState(false);

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
      Promise.resolve().then(() => setSuccess(true));
    }
    Promise.resolve().then(() => fetchPlanDetails());
  }, [fetchPlanDetails]);

  const handleUpgrade = async (plan: string) => {
    try {
      const response = await api.post('/billing/checkout', { planName: plan });
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Upgrade redirect failed:', error);
      alert('Failed to initialize subscription checkout.');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-xxl text-slate text-body-md">
        Loading billing profile...
      </div>
    );
  }

  return (
    <div className="space-y-xl max-w-[900px]">
      <div>
        <h1 className="text-heading-lg font-bold text-ink-deep mb-xxs">Plans & Subscription</h1>
        <p className="text-body-sm text-slate">Upgrade, modify, or check usage statistics on your account billing cycles.</p>
      </div>

      {success && (
        <div className="bg-success-bg/10 border border-success text-success px-md py-sm rounded-lg text-body-sm-bold text-center">
          Congratulations! Your subscription has been successfully upgraded.
        </div>
      )}

      {/* Usage Meter Card */}
      <MetaCard variant="product-feature" className="space-y-md">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-subtitle-md font-bold text-ink-deep">Monthly Document Usage</h3>
            <p className="text-body-sm text-slate">Usage resets on the 1st of the month.</p>
          </div>
          <MetaBadge variant={usage / limit > 0.8 ? 'warning' : 'success'}>
            {usage} / {limit >= 10000 ? 'Unlimited' : `${limit} Documents`}
          </MetaBadge>
        </div>

        <div className="w-full bg-surface-soft h-[8px] rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-500"
            style={{ width: `${Math.min(100, (usage / limit) * 100)}%` }}
          />
        </div>
      </MetaCard>

      {/* Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
        {/* Free Plan */}
        <MetaCard variant="why-buy-tile" className={`flex flex-col justify-between ${currentPlan === 'Free' ? 'border-primary ring-2 ring-primary/10' : ''}`}>
          <div className="space-y-md">
            <div>
              <p className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Free Starter</p>
              <h3 className="text-display-sm font-bold text-ink-deep mt-xs">$0 <span className="text-body-sm font-normal text-slate">/mo</span></h3>
            </div>
            <ul className="text-body-sm text-slate space-y-xs">
              <li>✓ Up to 5 documents / mo</li>
              <li>✓ Standard signatures</li>
              <li>✓ Basic audit trail logs</li>
              <li>✗ No workspaces support</li>
            </ul>
          </div>
          <MetaButton 
            variant={currentPlan === 'Free' ? 'secondary' : 'ghost'} 
            disabled={currentPlan === 'Free'} 
            className="w-full mt-xl"
          >
            {currentPlan === 'Free' ? 'Active Plan' : 'Current Plan'}
          </MetaButton>
        </MetaCard>

        {/* Pro Plan */}
        <MetaCard variant="why-buy-tile" className={`flex flex-col justify-between ${currentPlan === 'Pro' ? 'border-primary ring-2 ring-primary/10' : ''}`}>
          <div className="space-y-md">
            <div>
              <p className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Professional</p>
              <h3 className="text-display-sm font-bold text-ink-deep mt-xs">$15 <span className="text-body-sm font-normal text-slate">/mo</span></h3>
            </div>
            <ul className="text-body-sm text-slate space-y-xs">
              <li>✓ Up to 50 documents / mo</li>
              <li>✓ Reusable signature profiles</li>
              <li>✓ Parallel & sequential paths</li>
              <li>✓ Basic shared links</li>
            </ul>
          </div>
          <MetaButton 
            variant={currentPlan === 'Pro' ? 'secondary' : 'buy-cta'} 
            onClick={() => handleUpgrade('Pro')}
            className="w-full mt-xl"
            disabled={currentPlan === 'Pro'}
          >
            {currentPlan === 'Pro' ? 'Active Plan' : 'Select Pro'}
          </MetaButton>
        </MetaCard>

        {/* Enterprise Plan */}
        <MetaCard variant="why-buy-tile" className={`flex flex-col justify-between ${currentPlan === 'Business' ? 'border-primary ring-2 ring-primary/10' : ''}`}>
          <div className="space-y-md">
            <div>
              <p className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Enterprise Business</p>
              <h3 className="text-display-sm font-bold text-ink-deep mt-xs">$45 <span className="text-body-sm font-normal text-slate">/mo</span></h3>
            </div>
            <ul className="text-body-sm text-slate space-y-xs">
              <li>✓ Up to 500 documents / mo</li>
              <li>✓ Full workspaces RBAC</li>
              <li>✓ Custom branding / stamp logo</li>
              <li>✓ Priority support & audit exports</li>
            </ul>
          </div>
          <MetaButton 
            variant={currentPlan === 'Business' ? 'secondary' : 'buy-cta'} 
            onClick={() => handleUpgrade('Business')}
            className="w-full mt-xl"
            disabled={currentPlan === 'Business'}
          >
            {currentPlan === 'Business' ? 'Active Plan' : 'Select Business'}
          </MetaButton>
        </MetaCard>
      </div>
    </div>
  );
}
