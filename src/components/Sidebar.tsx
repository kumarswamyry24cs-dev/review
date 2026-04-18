import { Code2, LayoutDashboard, History, Settings, LogOut, Plus, Zap, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Page = 'dashboard' | 'new-review' | 'history' | 'settings';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'history' as Page, label: 'Review History', icon: History },
  { id: 'settings' as Page, label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { profile, user, signOut } = useAuth();

  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-64 bg-slate-900 min-h-screen flex flex-col fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Code2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">CodeSense</h1>
            <p className="text-slate-400 text-xs">AI Code Reviewer</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <button
          onClick={() => onNavigate('new-review')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <Plus size={16} />
          New Review
        </button>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon size={17} />
              {item.label}
              {isActive && <ChevronRight size={14} className="ml-auto text-slate-500" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3">
        {profile?.plan === 'free' && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={13} className="text-yellow-300" />
              <span className="text-white text-xs font-semibold">Upgrade to Pro</span>
            </div>
            <p className="text-blue-100 text-xs leading-tight mb-2">Unlimited reviews & priority AI</p>
            <button
              onClick={() => onNavigate('settings')}
              className="w-full bg-white text-blue-700 text-xs font-semibold py-1.5 rounded-md hover:bg-blue-50 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
          <button onClick={signOut} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
