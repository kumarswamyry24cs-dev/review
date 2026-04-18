import { useEffect, useState } from 'react';
import { Code2, AlertTriangle, Shield, Zap, Lightbulb, ExternalLink, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ScoreRing from '../components/ScoreRing';
import SeverityBadge from '../components/SeverityBadge';
import type { CodeIssue, CodeSuggestion, SecurityIssue, PerformanceNote } from '../lib/database.types';

interface SharedReviewProps {
  token: string;
  onGetStarted: () => void;
}

const issueTypeColors: Record<string, string> = {
  bug: 'bg-red-50 text-red-700 border-red-200',
  style: 'bg-sky-50 text-sky-700 border-sky-200',
  logic: 'bg-orange-50 text-orange-700 border-orange-200',
  naming: 'bg-slate-50 text-slate-600 border-slate-200',
  error_handling: 'bg-amber-50 text-amber-700 border-amber-200',
};

const categoryColors: Record<string, string> = {
  refactoring: 'bg-blue-50 text-blue-700',
  architecture: 'bg-emerald-50 text-emerald-700',
  readability: 'bg-sky-50 text-sky-700',
  testing: 'bg-violet-50 text-violet-700',
  documentation: 'bg-slate-50 text-slate-600',
};

export default function SharedReview({ token, onGetStarted }: SharedReviewProps) {
  const [review, setReview] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: share } = await supabase
        .from('review_shares')
        .select('review_id, expires_at, view_count')
        .eq('public_token', token)
        .maybeSingle();

      if (!share) { setNotFound(true); setLoading(false); return; }

      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        setNotFound(true); setLoading(false); return;
      }

      await supabase
        .from('review_shares')
        .update({ view_count: (share.view_count ?? 0) + 1 })
        .eq('public_token', token);

      const { data: reviewData } = await supabase
        .from('code_reviews')
        .select('title, language, overall_score, summary, issues, suggestions, security_issues, performance_notes, complexity_score, maintainability_score, lines_of_code, status, created_at')
        .eq('id', share.review_id)
        .maybeSingle();

      if (!reviewData) { setNotFound(true); setLoading(false); return; }
      setReview(reviewData as Record<string, unknown>);
      setLoading(false);
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Lock size={28} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Review not found</h2>
        <p className="text-slate-500 text-sm mb-6">This shared review link is invalid or has expired.</p>
        <button onClick={onGetStarted} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
          Try CodeSense for free
        </button>
      </div>
    );
  }

  const issues = (review!.issues as unknown as CodeIssue[]) || [];
  const suggestions = (review!.suggestions as unknown as CodeSuggestion[]) || [];
  const securityIssues = (review!.security_issues as unknown as SecurityIssue[]) || [];
  const performanceNotes = (review!.performance_notes as unknown as PerformanceNote[]) || [];
  const score = review!.overall_score as number;
  const criticalCount = [...issues, ...securityIssues].filter(i => i.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Code2 size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">CodeSense</span>
            <span className="text-slate-300 mx-2">|</span>
            <span className="text-slate-500 text-sm">Shared Review</span>
          </div>
          <button
            onClick={onGetStarted}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink size={12} />
            Try for free
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 mb-1">{review!.title as string}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
                <span className="capitalize">{review!.language as string}</span>
                <span>·</span>
                <span>{review!.lines_of_code as number} lines</span>
                <span>·</span>
                <span>{new Date(review!.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              {criticalCount > 0 && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                  <AlertTriangle size={14} className="text-red-600 shrink-0" />
                  <p className="text-red-700 text-sm font-medium">{criticalCount} critical issue{criticalCount !== 1 ? 's' : ''} found</p>
                </div>
              )}
              <p className="text-slate-600 text-sm leading-relaxed">{review!.summary as string}</p>
            </div>
            <div className="flex gap-4 md:flex-col items-center md:items-end">
              <ScoreRing score={score} size={80} strokeWidth={6} />
              <div className="flex md:flex-col gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900">{review!.maintainability_score as number}</div>
                  <div className="text-xs text-slate-400">Maintainability</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900">{100 - (review!.complexity_score as number)}</div>
                  <div className="text-xs text-slate-400">Simplicity</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {issues.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
                <AlertTriangle size={15} className="text-amber-500" />
                <h3 className="font-semibold text-slate-900 text-sm">Code Issues ({issues.length})</h3>
              </div>
              <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {issues.map((issue, i) => (
                  <li key={i} className="px-5 py-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <SeverityBadge severity={issue.severity} />
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${issueTypeColors[issue.type] || 'bg-slate-50 text-slate-600'}`}>
                        {issue.type.replace('_', ' ')}
                      </span>
                      {issue.line && <span className="text-xs text-slate-400 font-mono">Line {issue.line}</span>}
                    </div>
                    <p className="font-medium text-slate-800 text-sm mb-0.5">{issue.title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed mb-1.5">{issue.description}</p>
                    <div className="bg-blue-50 rounded-lg px-3 py-1.5">
                      <p className="text-xs text-blue-700"><span className="font-semibold">Fix: </span>{issue.suggestion}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {securityIssues.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-red-100 bg-red-50 rounded-t-xl">
                <Shield size={15} className="text-red-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Security Issues ({securityIssues.length})</h3>
              </div>
              <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {securityIssues.map((issue, i) => (
                  <li key={i} className="px-5 py-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <SeverityBadge severity={issue.severity} />
                      {issue.cwe && <span className="text-xs text-slate-400 font-mono">{issue.cwe}</span>}
                    </div>
                    <p className="font-medium text-slate-800 text-sm mb-0.5">{issue.title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed mb-1.5">{issue.description}</p>
                    <div className="bg-red-50 rounded-lg px-3 py-1.5">
                      <p className="text-xs text-red-700"><span className="font-semibold">Fix: </span>{issue.fix}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {performanceNotes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
                <Zap size={15} className="text-amber-500" />
                <h3 className="font-semibold text-slate-900 text-sm">Performance ({performanceNotes.length})</h3>
              </div>
              <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {performanceNotes.map((note, i) => (
                  <li key={i} className="px-5 py-3.5">
                    <p className="font-medium text-slate-800 text-sm mb-0.5">{note.title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{note.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
                <Lightbulb size={15} className="text-blue-500" />
                <h3 className="font-semibold text-slate-900 text-sm">Suggestions ({suggestions.length})</h3>
              </div>
              <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li key={i} className="px-5 py-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[s.category] || 'bg-slate-50 text-slate-600'}`}>
                        {s.category}
                      </span>
                    </div>
                    <p className="font-medium text-slate-800 text-sm mb-0.5">{s.title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{s.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-7 text-center text-white">
          <h3 className="text-xl font-bold mb-2">Want AI reviews for your own code?</h3>
          <p className="text-blue-100 text-sm mb-5">Get instant, comprehensive AI-powered code reviews for free. Spot bugs, security issues, and performance problems in seconds.</p>
          <button
            onClick={onGetStarted}
            className="px-7 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors text-sm"
          >
            Start for free — no credit card required
          </button>
        </div>
      </div>
    </div>
  );
}
