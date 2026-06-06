import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import MetaCard from '../ui/MetaCard';
import MetaBadge from '../ui/MetaBadge';
import { ShieldAlert, Users, FileSignature, Database, HardDrive, CreditCard, Layers } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
      setError(err.response?.data?.message || 'Access Denied: You are not authorized as an administrator.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchStats());
  }, [fetchStats]);

  if (isLoading) {
    return (
      <div className="text-center py-xxl text-slate text-body-md">
        Loading system administration panel...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[500px] mx-auto text-center py-xxl space-y-xl select-none">
        <div className="w-16 h-16 bg-critical/10 text-critical rounded-circle flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-heading-lg font-bold text-ink-deep">Administrator Access Required</h2>
          <p className="text-body-sm text-slate mt-xxs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div>
        <h1 className="text-heading-lg font-bold text-ink-deep mb-xxs">Admin System Management</h1>
        <p className="text-body-sm text-slate">Monitor SignFlow system operations, usage growth, and storage capacity metrics.</p>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-xl">
        <MetaCard variant="product-feature" className="flex items-center space-x-md">
          <div className="p-sm bg-primary/10 rounded-circle text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-body-xs text-slate uppercase tracking-wider font-bold">Total Platform Users</p>
            <p className="text-heading-lg font-bold text-ink-deep">{stats?.totalUsers}</p>
          </div>
        </MetaCard>

        <MetaCard variant="product-feature" className="flex items-center space-x-md">
          <div className="p-sm bg-attention/10 rounded-circle text-attention">
            <FileSignature className="w-5 h-5" />
          </div>
          <div>
            <p className="text-body-xs text-slate uppercase tracking-wider font-bold">Active Contracts</p>
            <p className="text-heading-lg font-bold text-ink-deep">{stats?.activeDocuments}</p>
          </div>
        </MetaCard>

        <MetaCard variant="product-feature" className="flex items-center space-x-md">
          <div className="p-sm bg-success/10 rounded-circle text-success">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-body-xs text-slate uppercase tracking-wider font-bold">Storage Used</p>
            <p className="text-heading-lg font-bold text-ink-deep">{stats?.totalStorageUsed}</p>
          </div>
        </MetaCard>

        <MetaCard variant="product-feature" className="flex items-center space-x-md">
          <div className="p-sm bg-info/10 rounded-circle text-info">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-body-xs text-slate uppercase tracking-wider font-bold">Monthly Revenue</p>
            <p className="text-heading-lg font-bold text-ink-deep">{stats?.totalRevenue}</p>
          </div>
        </MetaCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
        {/* System Status Table */}
        <div className="md:col-span-2">
          <MetaCard variant="product-feature" className="space-y-xl">
            <h3 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Operational Health Status</h3>
            <div className="space-y-md">
              <div className="flex justify-between items-center p-md bg-surface-soft border border-hairline-soft rounded-xl">
                <div className="flex items-center space-x-md">
                  <Database className="w-5 h-5 text-slate" />
                  <div>
                    <p className="text-body-md font-bold text-ink-deep">Primary DB Cluster</p>
                    <p className="text-body-xs text-slate">Replica sets status checks</p>
                  </div>
                </div>
                <MetaBadge variant="success">
                  {stats?.databaseConnection}
                </MetaBadge>
              </div>

              <div className="flex justify-between items-center p-md bg-surface-soft border border-hairline-soft rounded-xl">
                <div className="flex items-center space-x-md">
                  <CreditCard className="w-5 h-5 text-slate" />
                  <div>
                    <p className="text-body-md font-bold text-ink-deep">Stripe Integration Services</p>
                    <p className="text-body-xs text-slate">Webhook processing health</p>
                  </div>
                </div>
                <MetaBadge variant="success">
                  {stats?.stripeStatus}
                </MetaBadge>
              </div>

              <div className="flex justify-between items-center p-md bg-surface-soft border border-hairline-soft rounded-xl">
                <div className="flex items-center space-x-md">
                  <HardDrive className="w-5 h-5 text-slate" />
                  <div>
                    <p className="text-body-md font-bold text-ink-deep">Redis Session Caches</p>
                    <p className="text-body-xs text-slate">Job queues listeners</p>
                  </div>
                </div>
                <MetaBadge variant="success">
                  Active
                </MetaBadge>
              </div>
            </div>
          </MetaCard>
        </div>

        {/* Plan Breakdown */}
        <div className="md:col-span-1">
          <MetaCard variant="product-feature" className="space-y-xl">
            <h3 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider flex items-center">
              <Layers className="w-4 h-4 mr-2" /> Plan Breakdown
            </h3>
            <div className="space-y-md">
              <div className="flex justify-between items-center py-xs border-b border-hairline-soft">
                <span className="text-body-sm text-slate">Professional Plan</span>
                <span className="text-body-sm-bold font-bold text-ink-deep">{stats?.planBreakdown?.Pro || 0} users</span>
              </div>
              <div className="flex justify-between items-center py-xs border-b border-hairline-soft">
                <span className="text-body-sm text-slate">Enterprise Plan</span>
                <span className="text-body-sm-bold font-bold text-ink-deep">{stats?.planBreakdown?.Business || 0} users</span>
              </div>
              <div className="flex justify-between items-center py-xs">
                <span className="text-body-sm text-slate">Corporate Business</span>
                <span className="text-body-sm-bold font-bold text-ink-deep">{stats?.planBreakdown?.Enterprise || 0} users</span>
              </div>
            </div>
          </MetaCard>
        </div>
      </div>
    </div>
  );
}
