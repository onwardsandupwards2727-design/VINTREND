import { useMemo } from 'react';
import { Subscription, BillingPlatform, CATEGORIES } from '@/types';
import { PlatformBadge } from '@/components/Badges';
import { BarChart3, TrendingDown, PieChart, Zap } from 'lucide-react';

interface AnalyticsViewProps {
  subscriptions: Subscription[];
}

const PLATFORM_LABELS: Record<string, string> = {
  direct: 'Direct',
  apple: 'Apple',
  google_play: 'Google Play',
  amazon: 'Amazon',
  paypal: 'PayPal',
  roku: 'Roku',
};

export function AnalyticsView({ subscriptions }: AnalyticsViewProps) {
  const active = subscriptions.filter((s) => s.status === 'active');
  const cancelled = subscriptions.filter((s) => s.status === 'cancelled');

  const monthlySpend = active.reduce((sum, s) => {
    const monthly = s.billing_cycle === 'yearly' ? s.price / 12 : s.price;
    return sum + monthly;
  }, 0);

  const yearlySpend = monthlySpend * 12;
  const yearlySavings = cancelled.reduce((sum, s) => {
    const yearly = s.billing_cycle === 'yearly' ? s.price : s.price * 12;
    return sum + yearly;
  }, 0);

  const avgPerSub = active.length > 0 ? monthlySpend / active.length : 0;

  // Spend by category
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    active.forEach((s) => {
      const monthly = s.billing_cycle === 'yearly' ? s.price / 12 : s.price;
      map[s.category] = (map[s.category] ?? 0) + monthly;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [active]);

  const maxCategory = byCategory[0]?.[1] ?? 1;

  // Spend by platform
  const byPlatform = useMemo(() => {
    const map: Record<string, { count: number; monthly: number }> = {};
    active.forEach((s) => {
      const monthly = s.billing_cycle === 'yearly' ? s.price / 12 : s.price;
      if (!map[s.billing_platform]) map[s.billing_platform] = { count: 0, monthly: 0 };
      map[s.billing_platform].count += 1;
      map[s.billing_platform].monthly += monthly;
    });
    return Object.entries(map).sort((a, b) => b[1].monthly - a[1].monthly);
  }, [active]);

  const maxPlatformSpend = byPlatform[0]?.[1].monthly ?? 1;

  // Top 5 most expensive
  const mostExpensive = useMemo(() => {
    return [...active]
      .map((s) => ({
        ...s,
        monthly: s.billing_cycle === 'yearly' ? s.price / 12 : s.price,
      }))
      .sort((a, b) => b.monthly - a.monthly)
      .slice(0, 5);
  }, [active]);

  // Cancellation stats
  const cancellationRate = subscriptions.length > 0
    ? Math.round((cancelled.length / subscriptions.length) * 100)
    : 0;

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="font-semibold text-slate-900 mb-1">No analytics yet</h3>
        <p className="text-sm text-slate-400">Add subscriptions to see spending insights and breakdowns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Spending insights and cancellation statistics</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryStat label="Monthly Spend" value={`$${monthlySpend.toFixed(2)}`} />
        <SummaryStat label="Yearly Spend" value={`$${yearlySpend.toFixed(2)}`} />
        <SummaryStat label="Total Saved" value={`$${yearlySavings.toFixed(2)}`} accent />
        <SummaryStat label="Avg / Subscription" value={`$${avgPerSub.toFixed(2)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by category */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-slate-400" />
            Spend by Category
          </h2>
          <p className="text-xs text-slate-400 mb-5">Monthly cost breakdown by service type</p>

          {byCategory.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No active subscriptions</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map(([cat, amount]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{cat}</span>
                    <span className="text-sm font-semibold text-slate-900">${amount.toFixed(2)}/mo</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${(amount / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spend by platform */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Zap className="w-5 h-5 text-slate-400" />
            Spend by Billing Platform
          </h2>
          <p className="text-xs text-slate-400 mb-5">Where your recurring charges come from</p>

          {byPlatform.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No active subscriptions</p>
          ) : (
            <div className="space-y-4">
              {byPlatform.map(([platform, data]) => (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <PlatformBadge platform={platform as BillingPlatform} />
                      <span className="text-xs text-slate-400">{data.count} {data.count === 1 ? 'sub' : 'subs'}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">${data.monthly.toFixed(2)}/mo</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${(data.monthly / maxPlatformSpend) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Most expensive */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-5">Most Expensive Active Subscriptions</h2>
        {mostExpensive.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No active subscriptions</p>
        ) : (
          <div className="space-y-2">
            {mostExpensive.map((sub, i) => (
              <div key={sub.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="text-sm font-bold text-slate-400 w-6">#{i + 1}</span>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                  {sub.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{sub.name}</p>
                  <p className="text-xs text-slate-400">{sub.category}</p>
                </div>
                <PlatformBadge platform={sub.billing_platform as BillingPlatform} />
                <div className="text-right">
                  <p className="font-bold text-slate-900">${sub.monthly.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">per month</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancellation stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Cancellation Rate</span>
          </div>
          <p className="text-3xl font-bold tracking-tight">{cancellationRate}%</p>
          <p className="text-sm opacity-80 mt-1">{cancelled.length} of {subscriptions.length} cancelled</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-2">Total Subscriptions Tracked</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{subscriptions.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-2">Still Active</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{active.length}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${accent ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' : 'bg-white border border-slate-200'}`}>
      <p className={`text-sm ${accent ? 'opacity-90' : 'text-slate-500'}`}>{label}</p>
      <p className={`text-2xl font-bold tracking-tight mt-1 ${accent ? '' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}
