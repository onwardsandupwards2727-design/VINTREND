import { BillingPlatform } from '@/types';

export function PlatformBadge({ platform }: { platform: BillingPlatform }) {
  const styles: Record<BillingPlatform, { label: string; className: string }> = {
    direct: { label: 'Direct', className: 'bg-slate-100 text-slate-600' },
    apple: { label: 'Apple', className: 'bg-slate-100 text-slate-700' },
    google_play: { label: 'Google Play', className: 'bg-blue-50 text-blue-600' },
    amazon: { label: 'Amazon', className: 'bg-orange-50 text-orange-600' },
    paypal: { label: 'PayPal', className: 'bg-sky-50 text-sky-600' },
    roku: { label: 'Roku', className: 'bg-purple-50 text-purple-600' },
  };

  const s = styles[platform] ?? styles.direct;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-600',
    cancelling: 'bg-amber-50 text-amber-600',
    cancelled: 'bg-slate-100 text-slate-500',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${styles[status] ?? styles.active}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
