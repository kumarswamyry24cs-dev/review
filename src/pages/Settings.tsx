import { useState } from 'react';
import { User, Shield, Bell, Loader2, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', user!.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (passwordData.newPass !== passwordData.confirm) { setPwError('Passwords do not match.'); return; }
    if (passwordData.newPass.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwordData.newPass });
    if (error) setPwError(error.message);
    else { setPwSuccess(true); setPasswordData({ current: '', newPass: '', confirm: '' }); setTimeout(() => setPwSuccess(false), 3000); }
    setPwLoading(false);
  };

  const planBadge = (plan: string) => {
    if (plan === 'pro') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (plan === 'enterprise') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <User size={14} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Profile</h3>
          </div>
          <form onSubmit={handleProfileSave} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full px-4 py-2.5 border border-slate-100 rounded-lg text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                {saved && (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
                    <CheckCircle size={14} />
                    Profile saved
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save changes
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
              <Shield size={14} className="text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Security</h3>
          </div>
          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
              <input
                type="password"
                value={passwordData.newPass}
                onChange={e => setPasswordData(d => ({ ...d, newPass: e.target.value }))}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm new password</label>
              <input
                type="password"
                value={passwordData.confirm}
                onChange={e => setPasswordData(d => ({ ...d, confirm: e.target.value }))}
                placeholder="Repeat new password"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {pwError && <p className="text-red-600 text-sm">{pwError}</p>}
            {pwSuccess && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
                <CheckCircle size={14} />
                Password updated successfully
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={pwLoading || !passwordData.newPass}
                className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {pwLoading && <Loader2 size={14} className="animate-spin" />}
                Update password
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Subscription</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900">Current plan</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${planBadge(profile?.plan || 'free')}`}>
                    {(profile?.plan || 'free').toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-500 text-sm">
                  {profile?.plan === 'free'
                    ? 'Up to 10 reviews per month'
                    : profile?.plan === 'pro'
                    ? 'Unlimited reviews with priority AI'
                    : 'Full enterprise features with team management'}
                </p>
              </div>
            </div>
            {profile?.plan === 'free' && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Zap size={18} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900 text-sm mb-1">Upgrade to Pro for $19/month</p>
                    <p className="text-blue-700 text-xs leading-relaxed mb-3">
                      Unlimited reviews, priority AI processing, advanced security analysis, and full review history.
                    </p>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total reviews</span>
                <span className="font-medium text-slate-800">{profile?.reviews_count || 0}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-500">Member since</span>
                <span className="font-medium text-slate-800">
                  {profile ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
              <Bell size={14} className="text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Notifications</h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'Review completed', desc: 'When your AI code review is ready' },
              { label: 'Weekly digest', desc: 'Summary of your code quality trends' },
              { label: 'Security alerts', desc: 'Critical security issues in your reviews' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <button
                  type="button"
                  className="relative w-10 h-5 bg-blue-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
