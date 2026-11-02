import { Subscription, BillingPlatform, PLATFORM_CANCELLATION_INFO } from '@/types';
import { PlatformBadge, StatusBadge } from '@/components/Badges';
import { Calendar, DollarSign, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface SubscriptionCardProps {
  subscription: Subscription;
  onCancel: (sub: Subscription) => void;
  onEdit: (sub: Subscription) => void;
}

export function SubscriptionCard({ subscription, onCancel, onEdit }: SubscriptionCardProps) {
  const info = PLATFORM_CANCELLATION_INFO[subscription.billing_platform as BillingPlatform];
  const monthlyCost = subscription.billing_cycle === 'yearly' ? subscription.price / 12 : subscription.price;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-lg font-bold text-slate-600">
            {subscription.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{subscription.name}</h3>
            <p className="text-xs text-slate-400">{subscription.category}</p>
          </div>
        </div>
        <StatusBadge status={subscription.status} />
      </div>

      <div className="flex items-end gap-1 mb-4">
        <DollarSign className="w-5 h-5 text-slate-400 mb-1" />
        <span className="text-2xl font-bold text-slate-900 tracking-tight">
          {subscription.price.toFixed(2)}
        </span>
        <span className="text-sm text-slate-400 mb-1">/{subscription.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <PlatformBadge platform={subscription.billing_platform as BillingPlatform} />
        {subscription.next_renewal_date && subscription.status === 'active' && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            Renews {formatDate(subscription.next_renewal_date)}
          </div>
        )}
      </div>

      {subscription.status === 'active' && (
        <div className="flex items-center gap-1.5 mb-4 text-xs">
          {info.auto ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600">Auto-cancellation available</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-600">Guided cancellation needed ({info.difficulty})</span>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {subscription.status === 'active' && (
          <button
            onClick={() => onCancel(subscription)}
            className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
        {subscription.status === 'cancelling' && (
          <div className="flex-1 py-2.5 rounded-xl bg-amber-50 text-amber-600 text-sm font-medium flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cancellation in progress
          </div>
        )}
        {subscription.status === 'cancelled' && (
          <div className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-sm font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Cancelled
          </div>
        )}
        <button
          onClick={() => onEdit(subscription)}
          className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days <= 7) return `in ${days} days`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
