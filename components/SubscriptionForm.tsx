import { useState, useEffect } from 'react';
import { Subscription, NewSubscription, BILLING_PLATFORMS, CATEGORIES, BillingPlatform, BillingCycle } from '@/types';
import { X } from 'lucide-react';

interface SubscriptionFormProps {
  subscription: Subscription | null;
  onSave: (data: NewSubscription | (NewSubscription & { id: string })) => void;
  onClose: () => void;
}

export function SubscriptionForm({ subscription, onSave, onClose }: SubscriptionFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Streaming');
  const [billingPlatform, setBillingPlatform] = useState<BillingPlatform>('direct');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [nextRenewalDate, setNextRenewalDate] = useState('');

  useEffect(() => {
    if (subscription) {
      setName(subscription.name);
      setCategory(subscription.category);
      setBillingPlatform(subscription.billing_platform);
      setPrice(subscription.price.toString());
      setBillingCycle(subscription.billing_cycle);
      setNextRenewalDate(subscription.next_renewal_date ?? '');
    }
  }, [subscription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: NewSubscription = {
      name,
      category,
      billing_platform: billingPlatform,
      price: parseFloat(price) || 0,
      currency: 'USD',
      billing_cycle: billingCycle,
      next_renewal_date: nextRenewalDate || null,
    };
    if (subscription) {
      onSave({ ...data, id: subscription.id });
    } else {
      onSave(data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {subscription ? 'Edit Subscription' : 'Add Subscription'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              placeholder="e.g. Netflix, Spotify, Adobe Creative Cloud"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Billing Platform</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BILLING_PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setBillingPlatform(p.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    billingPlatform === p.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Price</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  placeholder="9.99"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Billing Cycle</label>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                    billingCycle === 'monthly' ? 'bg-emerald-500 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                    billingCycle === 'yearly' ? 'bg-emerald-500 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Next Renewal Date</label>
            <input
              type="date"
              value={nextRenewalDate}
              onChange={(e) => setNextRenewalDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20"
            >
              {subscription ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
