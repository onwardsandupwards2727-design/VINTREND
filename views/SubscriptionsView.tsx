import { useState, useMemo } from 'react';
import { Subscription, NewSubscription, BillingPlatform } from '@/types';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { SubscriptionForm } from '@/components/SubscriptionForm';
import { CancelModal } from '@/components/CancelModal';
import { supabase } from '@/lib/supabase';
import { Plus, Search, CreditCard } from 'lucide-react';

interface SubscriptionsViewProps {
  subscriptions: Subscription[];
  onRefresh: () => void;
}

type FilterStatus = 'all' | 'active' | 'cancelled';
type FilterPlatform = 'all' | BillingPlatform;

export function SubscriptionsView({ subscriptions, onRefresh }: SubscriptionsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [cancelling, setCancelling] = useState<Subscription | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPlatform, setFilterPlatform] = useState<FilterPlatform>('all');

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterPlatform !== 'all' && s.billing_platform !== filterPlatform) return false;
      return true;
    });
  }, [subscriptions, search, filterStatus, filterPlatform]);

  const handleSave = async (data: NewSubscription | (NewSubscription & { id: string })) => {
    const { id, ...rest } = data as NewSubscription & { id?: string };
    if (id) {
      await supabase.from('subscriptions').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id);
    } else {
      await supabase.from('subscriptions').insert(rest);
    }
    setShowForm(false);
    setEditing(null);
    onRefresh();
  };

  const handleEdit = (sub: Subscription) => {
    setEditing(sub);
    setShowForm(true);
  };

  const handleCancel = (sub: Subscription) => {
    setCancelling(sub);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscriptions</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and cancel all your recurring payments</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscriptions..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelling">Cancelling</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value as FilterPlatform)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all bg-white"
          >
            <option value="all">All Platforms</option>
            <option value="direct">Direct Merchant</option>
            <option value="apple">Apple</option>
            <option value="google_play">Google Play</option>
            <option value="amazon">Amazon</option>
            <option value="paypal">PayPal</option>
            <option value="roku">Roku</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">No subscriptions found</h3>
          <p className="text-sm text-slate-400 mb-5">
            {subscriptions.length === 0
              ? 'Add your first subscription to start tracking and cancelling.'
              : 'Try adjusting your search or filters.'}
          </p>
          {subscriptions.length === 0 && (
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Subscription
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onCancel={handleCancel}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <SubscriptionForm
          subscription={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {cancelling && (
        <CancelModal subscription={cancelling} onClose={() => setCancelling(null)} onComplete={onRefresh} />
      )}
    </div>
  );
}
