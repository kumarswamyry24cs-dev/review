import { useState } from 'react';
import { Loader2, Code2, Wand2, AlertCircle, ChevronDown, CheckCircle2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { reviewCodeWithAI, type ReviewProgress } from '../services/codeReviewService';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'bash', label: 'Bash/Shell' },
  { value: 'other', label: 'Other' },
];

const SAMPLE_CODE = `async function fetchUserData(userId) {
  const response = await fetch('/api/users/' + userId);
  const data = response.json();

  if (data.password) {
    console.log('User password:', data.password);
  }

  var result = [];
  for (var i = 0; i < data.items.length; i++) {
    result.push(data.items[i]);
  }

  return result;
}`;

interface NewReviewProps {
  onReviewCreated: (reviewId: string) => void;
}

export default function NewReview({ onReviewCreated }: NewReviewProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'analyzing'>('form');
  const [progress, setProgress] = useState<ReviewProgress | null>(null);

  const FREE_LIMIT = 10;
  const isFreePlan = profile?.plan === 'free';
  const monthlyUsed = profile?.monthly_reviews_used ?? 0;
  const isAtLimit = isFreePlan && monthlyUsed >= FREE_LIMIT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError('Please paste your code to review.'); return; }
    if (!user) return;

    if (isAtLimit) {
      setError('You have reached your 10 free reviews this month. Upgrade to Pro for unlimited reviews.');
      return;
    }

    if (code.trim().length > 50000) {
      setError('Code is too large. Please keep it under 50,000 characters.');
      return;
    }

    setError('');
    setLoading(true);
    setStep('analyzing');
    setProgress(null);

    const reviewTitle = title.trim() || `${LANGUAGES.find(l => l.value === language)?.label} Review`;
    const linesOfCode = code.split('\n').length;

    const { data: reviewRow, error: insertError } = await supabase
      .from('code_reviews')
      .insert({
        user_id: user.id,
        title: reviewTitle,
        code: code.trim(),
        language,
        lines_of_code: linesOfCode,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !reviewRow) {
      setError('Failed to create review. Please try again.');
      setLoading(false);
      setStep('form');
      return;
    }

    try {
      const aiResult = await reviewCodeWithAI(code.trim(), language, (prog) => {
        setProgress(prog);
      });

      await supabase
        .from('code_reviews')
        .update({
          overall_score: aiResult.overall_score ?? 0,
          summary: aiResult.summary ?? '',
          issues: aiResult.issues ?? [],
          suggestions: aiResult.suggestions ?? [],
          security_issues: aiResult.security_issues ?? [],
          performance_notes: aiResult.performance_notes ?? [],
          complexity_score: aiResult.complexity_score ?? 0,
          maintainability_score: aiResult.maintainability_score ?? 0,
          status: 'completed',
        })
        .eq('id', reviewRow.id);

      await supabase.rpc('increment_reviews_count', { user_uuid: user.id });
      await refreshProfile();
      onReviewCreated(reviewRow.id);
    } catch {
      await supabase.from('code_reviews').update({ status: 'failed' }).eq('id', reviewRow.id);
      setError('The AI review encountered an error. Please try again.');
      setStep('form');
      setLoading(false);
    }
  };

  if (step === 'analyzing') {
    const stages = [
      { id: 'parsing', label: 'Parsing code structure', icon: '📝' },
      { id: 'analysis', label: 'Running analysis', icon: '🔍' },
      { id: 'security', label: 'Analyzing security', icon: '🔒' },
      { id: 'suggestions', label: 'Generating suggestions', icon: '💡' },
      { id: 'performance', label: 'Performance analysis', icon: '⚡' },
    ];

    const stageMap: Record<string, number> = {
      parsing: 0, analysis: 1, security: 2, suggestions: 3, performance: 4, complete: 5,
    };
    const currentStageIndex = progress ? stageMap[progress.stage] ?? 0 : 0;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8">
        <div className="text-center max-w-xl">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="w-24 h-24 border-4 border-blue-100 rounded-full" />
            <div className="absolute inset-0 w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Code2 size={32} className="text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Analyzing your code</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Claude AI is scanning for bugs, security vulnerabilities, performance issues, and improvement opportunities...
          </p>

          <div className="space-y-3 mb-8">
            {stages.map((stage, idx) => {
              const isActive = idx === currentStageIndex;
              const isComplete = idx < currentStageIndex;
              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    isComplete
                      ? 'bg-emerald-100 text-emerald-600'
                      : isActive
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isComplete ? <CheckCircle2 size={14} /> : idx + 1}
                  </div>
                  <div className={`flex-1 text-left ${isActive ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                    {stage.label}
                  </div>
                  {isActive && <span className="text-lg">{stage.icon}</span>}
                </div>
              );
            })}
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress?.progress ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{progress?.progress ?? 0}% complete</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">New Code Review</h2>
        <p className="text-slate-500 mt-1">Paste your code and our AI will provide a comprehensive review in seconds.</p>
      </div>

      {isAtLimit && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Monthly review limit reached</p>
            <p className="text-xs text-amber-700 mt-0.5">You've used all 10 free reviews this month. Upgrade to Pro for unlimited access.</p>
          </div>
        </div>
      )}

      {isFreePlan && !isAtLimit && monthlyUsed >= FREE_LIMIT - 2 && (
        <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
          <AlertCircle size={15} className="text-blue-600 shrink-0" />
          <p className="text-sm text-blue-800">
            <strong>{FREE_LIMIT - monthlyUsed} review{FREE_LIMIT - monthlyUsed !== 1 ? 's' : ''} remaining</strong> this month on the free plan.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Review title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Auth middleware, Payment processor..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Language</label>
              <div className="relative">
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between px-6 pt-4 pb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Code</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCode(SAMPLE_CODE)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Load sample
                </button>
                {code && (
                  <button
                    type="button"
                    onClick={() => setCode('')}
                    className="text-xs text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1"
                  >
                    <X size={11} />
                    Clear
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={`Paste your ${LANGUAGES.find(l => l.value === language)?.label} code here...`}
              rows={20}
              spellCheck={false}
              className="w-full px-6 pb-6 font-mono text-sm text-slate-800 bg-slate-50 focus:outline-none resize-none focus:bg-white transition-colors border-t border-slate-100 leading-relaxed"
              style={{ minHeight: '400px' }}
            />
            {code && (
              <div className="absolute bottom-3 right-6 text-xs text-slate-400">
                {code.split('\n').length} lines · {code.length} chars
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3.5 text-red-700 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <p className="text-slate-400 text-xs">
            Your code is analyzed securely and never shared with third parties.
          </p>
          <button
            type="submit"
            disabled={loading || !code.trim() || isAtLimit}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {loading ? 'Analyzing...' : 'Analyze with AI'}
          </button>
        </div>
      </form>
    </div>
  );
}
