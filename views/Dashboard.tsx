import { Subscription } from '@/types';
import { TrendingUp, TrendingDown, Calendar, Wallet, Zap, AlertCircle, ArrowRight } from 'lucide-react';
import { PlatformBadge, StatusBadge } from '@/components/Badges';

interface DashboardProps {
  subscriptions: Subscription[];
  onNavigate: (view: 'subscriptions' | 'analytics') => void;
}

export function Dashboard({ subscriptions, onNavigate }: DashboardProps) {
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

  const upcomingRenewals = active
    .filter((s) => s.next_renewal_date)
    .sort((a, b) => new Date(a.next_renewal_date!).getTime() - new Date(b.next_renewal_date!).getTime())
    .slice(0, 5);

  const platformBreakdown = active.reduce((acc, s) => {
    acc[s.billing_platform] = (acc[s.billing_platform] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const needsManualCancellation = active.filter((s) =>
    ['apple', 'google_play', 'amazon', 'paypal', 'roku'].includes(s.billing_platform)
  ).length;

  const autoCancellable = active.filter((s) => s.billing_platform === 'direct').length;

  return (
    <div className="space-y-6">
      {/* Hero stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Spend"
          value={`$${monthlySpend.toFixed(2)}`}
          icon={Wallet}
          color="emerald"
          subtitle={`$${yearlySpend.toFixed(2)} per year`}
        />
        <StatCard
          label="Active Subscriptions"
          value={active.length.toString()}
          icon={TrendingUp}
          color="blue"
          subtitle={`${autoCancellable} auto-cancellable`}
        />
        <StatCard
          label="Total Savings"
          value={`$${yearlySavings.toFixed(2)}`}
          icon={TrendingDown}
          color="teal"
          subtitle={`${cancelled.length} cancelled`}
        />
        <StatCard
          label="Needs Manual Cancel"
          value={needsManualCancellation.toString()}
          icon={AlertCircle}
          color="amber"
          subtitle="Apple, Google, etc."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming renewals */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              Upcoming Renewals
            </h2>
            <button
              onClick={() => onNavigate('subscriptions')}
              className="text-sm text-emerald-600 font-medium flex items-center gap-1 hover:text-emerald-700 transition-colors"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingRenewals.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No upcoming renewals. Add subscriptions to see renewal dates.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingRenewals.map((sub) => {
                const days = sub.next_renewal_date
                  ? Math.ceil((new Date(sub.next_renewal_date + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                const urgent = days !== null && days <= 3;
                return (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                        {sub.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{sub.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <PlatformBadge platform={sub.billing_platform} />
                          <span className="text-xs text-slate-400">${sub.price.toFixed(2)}/{sub.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${urgent ? 'text-amber-600' : 'text-slate-700'}`}>
                        {days !== null && days < 0 ? 'Overdue' : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days} days`}
                      </p>
                      <p className="text-xs text-slate-400">
                        {sub.next_renewal_date && new Date(sub.next_renewal_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Platform breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-5">By Billing Platform</h2>
          {Object.keys(platformBreakdown).length === 0 ? (
            <div className="py-12 text-center">
              <Zap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(platformBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([platform, count]) => {
                  const max = Math.max(...Object.values(platformBreakdown));
                  const pct = (count / max) * 100;
                  return (
                    <div key={platform}>
                      <div className="flex items-center justify-between mb-1.5">
                        <PlatformBadge platform={platform as any} />
                        <span className="text-xs font-medium text-slate-600">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Recently cancelled */}
      {cancelled.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-emerald-500" />
            Recently Cancelled
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cancelled.slice(0, 6).map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-bold text-slate-500">
                  {sub.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{sub.name}</p>
                  <p className="text-xs text-emerald-600 font-medium">
                    Saving ${sub.billing_cycle === 'monthly' ? (sub.price * 12).toFixed(0) : sub.price.toFixed(0)}/yr
                  </p>
                </div>
                <StatusBadge status={sub.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  color: 'emerald' | 'blue' | 'teal' | 'amber';
  subtitle: string;
}) {
  const colors = {
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
    blue: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600' },
    teal: { bg: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-600' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' },
  };
  const c = colors[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.light} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
    </div>
  );
}
