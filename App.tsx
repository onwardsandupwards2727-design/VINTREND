import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import { AppLayout, View } from '@/components/AppLayout';
import { Dashboard } from '@/views/Dashboard';
import { SubscriptionsView } from '@/views/SubscriptionsView';
import { AnalyticsView } from '@/views/AnalyticsView';
import { supabase } from '@/lib/supabase';
import { Subscription } from '@/types';
import { Loader2 } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setSubscriptions(data as Subscription[]);
    }
    setDataLoading(false);
  }, [user]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-7 h-7 text-slate-950" strokeWidth={2.5} />
          </div>
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <AppLayout currentView={view} onNavigate={setView}>
      {dataLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <>
          {view === 'dashboard' && <Dashboard subscriptions={subscriptions} onNavigate={setView} />}
          {view === 'subscriptions' && <SubscriptionsView subscriptions={subscriptions} onRefresh={loadSubscriptions} />}
          {view === 'analytics' && <AnalyticsView subscriptions={subscriptions} />}
        </>
      )}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
