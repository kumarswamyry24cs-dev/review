import { useState, useEffect, useCallback } from 'react';
import { User, Shield, Bell, Loader2, CheckCircle, Zap, Key, Trash2, Copy, Eye, EyeOff, AlertTriangle, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface NotificationPrefs {
  review_completed: boolean;
  weekly_digest: boolean;
  security_alerts: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
}

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPass: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    review_completed: true,
    weekly_digest: true,
    security_alerts: true,
  });
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [showAddKey, setShowAddKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const fetchNotifPrefs = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setNotifPrefs({
        review_completed: data.review_completed,
        weekly_digest: data.weekly_digest,
        security_alerts: data.security_alerts,
      });
    }
    setNotifLoading(false);
  }, [user]);

  const fetchApiKeys = useCallback(async () => {
    if (!user) return;
    setApiKeysLoading(true);
    const { data } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, last_used_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setApiKeys(data ?? []);
    setApiKeysLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifPrefs();
    fetchApiKeys();
  }, [fetchNotifPrefs, fetchApiKeys]);

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
    else {
      setPwSuccess(true);
      setPasswordData({ newPass: '', confirm: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    }
    setPwLoading(false);
  };

  const handleNotifToggle = async (key: keyof NotificationPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    setNotifSaving(true);
    await supabase
      .from('notification_preferences')
      .upsert(
        { user_id: user!.id, ...updated, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    setNotifSaving(false);
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'cs_live_';
    for (let i = 0; i < 32; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    return key;
  };

  const hashKey = async (key: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    const rawKey = generateApiKey();
    const keyHash = await hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 12) + '...';

    const { error } = await supabase.from('api_keys').insert({
      user_id: user!.id,
      name: newKeyName.trim(),
      key_prefix: keyPrefix,
      key_hash: keyHash,
    });

    if (!error) {
      setNewlyCreatedKey(rawKey);
      setNewKeyName('');
      setShowAddKey(false);
      await fetchApiKeys();
    }
    setCreatingKey(false);
  };

  const handleDeleteApiKey = async (keyId: string) => {
    setDeletingKey(keyId);
    await supabase.from('api_keys').delete().eq('id', keyId);
    setApiKeys(prev => prev.filter(k => k.id !== keyId));
    setShowDeleteConfirm(null);
    setDeletingKey(null);
  };

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeletingAccount(true);
    await supabase.from('code_reviews').delete().eq('user_id', user!.id);
    await supabase.from('profiles').delete().eq('id', user!.id);
    await supabase.auth.signOut();
  };

  const planBadge = (plan: string) => {
    if (plan === 'pro') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (plan === 'enterprise') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const notifItems = [
    { key: 'review_completed' as const, label: 'Review completed', desc: 'When your AI code review is ready' },
    { key: 'weekly_digest' as const, label: 'Weekly digest', desc: 'Summary of your code quality trends' },
    { key: 'security_alerts' as const, label: 'Security alerts', desc: 'Critical security issues in your reviews' },
  ];

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
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={passwordData.newPass}
                  onChange={e => setPasswordData(d => ({ ...d, newPass: e.target.value }))}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowNewPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
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
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total reviews</span>
                <span className="font-medium text-slate-800">{profile?.reviews_count || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Reviews this month</span>
                <span className="font-medium text-slate-800">
                  {profile?.monthly_reviews_used || 0}{profile?.plan === 'free' ? ' / 10' : ''}
                </span>
              </div>
              <div className="flex justify-between text-sm">
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
            {notifSaving && <Loader2 size={13} className="ml-auto text-slate-400 animate-spin" />}
          </div>
          <div className="p-6 space-y-4">
            {notifLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              notifItems.map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNotifToggle(item.key)}
                    disabled={notifSaving}
                    className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${notifPrefs[item.key] ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notifPrefs[item.key] ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
              <Key size={14} className="text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-900">API Keys</h3>
            <button
              onClick={() => { setShowAddKey(p => !p); setNewlyCreatedKey(null); }}
              className="ml-auto flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus size={13} />
              New key
            </button>
          </div>

          {newlyCreatedKey && (
            <div className="mx-6 mt-5 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">API key created — copy it now!</p>
                  <p className="text-xs text-emerald-700 mt-0.5">This key won't be shown again. Store it somewhere safe.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white border border-emerald-200 rounded-lg px-3 py-2 font-mono text-slate-700 truncate">
                  {newlyCreatedKey}
                </code>
                <button
                  onClick={() => handleCopyKey(newlyCreatedKey)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
                >
                  {copiedKey ? <CheckCircle size={13} /> : <Copy size={13} />}
                  {copiedKey ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {showAddKey && (
            <form onSubmit={handleCreateApiKey} className="mx-6 mt-5 flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Key name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="e.g. CI/CD Pipeline, VS Code Extension"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={creatingKey || !newKeyName.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
              >
                {creatingKey ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Create
              </button>
            </form>
          )}

          <div className="p-6">
            {apiKeysLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Key size={18} className="text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm font-medium mb-1">No API keys</p>
                <p className="text-slate-400 text-xs">Create a key to access the CodeSense API programmatically</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {apiKeys.map(key => (
                  <li key={key.id} className="py-3 flex items-center gap-3 group">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                      <Key size={13} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{key.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{key.key_prefix}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">
                        {key.last_used_at
                          ? `Used ${new Date(key.last_used_at).toLocaleDateString()}`
                          : 'Never used'}
                      </p>
                      <p className="text-xs text-slate-300">{new Date(key.created_at).toLocaleDateString()}</p>
                    </div>
                    {showDeleteConfirm === key.id ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDeleteApiKey(key.id)}
                          disabled={deletingKey === key.id}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
                        >
                          {deletingKey === key.id ? <Loader2 size={12} className="animate-spin" /> : 'Delete'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(key.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-red-100 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-red-100">
            <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={14} className="text-red-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Danger Zone</h3>
          </div>
          <div className="p-6">
            {!showDeleteAccount ? (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">Delete account</p>
                  <p className="text-xs text-slate-500 mt-0.5">Permanently remove your account and all associated data. This action is irreversible.</p>
                </div>
                <button
                  onClick={() => setShowDeleteAccount(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                  Delete account
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">This will permanently delete your account</p>
                    <p className="text-xs text-red-700 mt-1">All your reviews, data, and settings will be erased. This cannot be undone.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Type <strong>DELETE</strong> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-4 py-2.5 border border-red-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                    className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    {deletingAccount ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Delete my account
                  </button>
                  <button
                    onClick={() => { setShowDeleteAccount(false); setDeleteConfirmText(''); }}
                    className="px-5 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
