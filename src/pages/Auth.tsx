import { useState } from 'react';
import { Code2, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onBack: () => void;
}

type Mode = 'signin' | 'signup' | 'forgot';

export default function Auth({ onBack }: AuthProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setResetSent(true);
      }
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) { setError('Please enter your full name.'); setLoading(false); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
      const { error } = await signUp(email, password, fullName);
      if (error) setError(error.message);
    } else {
      const { error } = await signIn(email, password);
      if (error) setError('Invalid email or password.');
    }
    setLoading(false);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setResetSent(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8 text-sm font-medium transition-colors">
          <ArrowLeft size={15} />
          Back to home
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Code2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">CodeSense</h1>
              <p className="text-slate-500 text-xs">AI Code Reviewer</p>
            </div>
          </div>

          {mode === 'forgot' ? (
            resetSent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
                <p className="text-slate-500 text-sm mb-6">
                  We sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.
                </p>
                <button
                  onClick={() => switchMode('signin')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Reset your password</h2>
                <p className="text-slate-500 text-sm mb-6">
                  Enter your email and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    {loading && <Loader2 size={15} className="animate-spin" />}
                    Send reset link
                  </button>
                </form>
                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                  <button onClick={() => switchMode('signin')} className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                    Back to sign in
                  </button>
                </div>
              </>
            )
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                {mode === 'signin'
                  ? 'Sign in to continue reviewing your code'
                  : 'Start reviewing code with AI for free'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Jane Smith"
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                {mode === 'signin' ? (
                  <p className="text-slate-500 text-sm">
                    Don't have an account?{' '}
                    <button onClick={() => switchMode('signup')} className="text-blue-600 hover:text-blue-700 font-semibold">
                      Sign up for free
                    </button>
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm">
                    Already have an account?{' '}
                    <button onClick={() => switchMode('signin')} className="text-blue-600 hover:text-blue-700 font-semibold">
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
