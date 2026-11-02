import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, LayoutDashboard, CreditCard, BarChart3, LogOut } from 'lucide-react';

export type View = 'dashboard' | 'subscriptions' | 'analytics';

interface AppLayoutProps {
  children: ReactNode;
  currentView: View;
  onNavigate: (view: View) => void;
}

const navItems: { view: View; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { view: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export function AppLayout({ children, currentView, onNavigate }: AppLayoutProps) {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-950 border-r border-slate-800/50 fixed h-screen">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/50">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">CancelWave</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                currentView === item.view
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-800/50">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Top bar — mobile */}
      <div className="lg:hidden bg-slate-950 border-b border-slate-800/50 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-white tracking-tight">CancelWave</span>
          </div>
          <button onClick={signOut} className="text-slate-400 hover:text-white p-2">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex px-4 pb-3 gap-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                currentView === item.view
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
