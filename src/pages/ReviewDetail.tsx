import { useState } from 'react';
import { ArrowLeft, AlertTriangle, Shield, Zap, Lightbulb, Code2, CheckCircle, Share2, Copy, Link, X, Loader2 } from 'lucide-react';
import { useReview } from '../hooks/useReviews';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ScoreRing from '../components/ScoreRing';
import SeverityBadge from '../components/SeverityBadge';
import type { CodeIssue, CodeSuggestion, SecurityIssue, PerformanceNote } from '../lib/database.types';

interface ReviewDetailProps {
  reviewId: string;
  onBack: () => void;
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ReviewDetail({ reviewId, onBack }: ReviewDetailProps) {
  const { user } = useAuth();
  const { review, loading } = useReview(reviewId);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const handleShare = async () => {
    if (!user || !review) return;
    setShowShareModal(true);
    if (shareLink) return;
    setSharingLoading(true);
    const { data, error } = await supabase
      .from('review_shares')
      .insert({ review_id: reviewId, shared_by_id: user.id })
      .select('public_token')
      .single();
    if (!error && data) {
      setShareLink(`${window.location.origin}/shared/${data.public_token}`);
    }
    setSharingLoading(false);
  };

  const handleCopyShareLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
        <AlertTriangle size={40} className="text-slate-300 mb-4" />
        <p className="text-slate-500">Review not found.</p>
        <button onClick={onBack} className="mt-4 text-blue-600 text-sm font-medium hover:underline">Go back</button>
      </div>
    );
  }

  const issues = (review.issues as unknown as CodeIssue[]) || [];
  const suggestions = (review.suggestions as unknown as CodeSuggestion[]) || [];
  const securityIssues = (review.security_issues as unknown as SecurityIssue[]) || [];
  const performanceNotes = (review.performance_notes as unknown as PerformanceNote[]) || [];

  const criticalCount = [...issues, ...securityIssues].filter(i => i.severity === 'critical').length;
  const highCount = [...issues, ...securityIssues].filter(i => i.severity === 'high').length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors">
          <ArrowLeft size={15} />
          Back to history
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg text-sm font-medium transition-all hover:bg-white"
        >
          <Share2 size={14} />
          Share
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Code2 size={16} className="text-blue-600" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{review.language}</span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-slate-500">{review.lines_of_code} lines</span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-slate-500">{formatDate(review.created_at)}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">{review.title}</h2>
            <p className="text-slate-600 leading-relaxed text-sm">{review.summary}</p>

            {(criticalCount > 0 || highCount > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {criticalCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-1.5 text-xs font-semibold">
                    <AlertTriangle size={12} />
                    {criticalCount} critical issue{criticalCount > 1 ? 's' : ''}
                  </div>
                )}
                {highCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg px-3 py-1.5 text-xs font-semibold">
                    <AlertTriangle size={12} />
                    {highCount} high severity
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-5 shrink-0">
            <ScoreRing score={review.overall_score} size={72} strokeWidth={6} label="Overall" />
            <ScoreRing score={review.maintainability_score} size={72} strokeWidth={6} label="Maintain." />
            <ScoreRing score={Math.max(0, 100 - review.complexity_score)} size={72} strokeWidth={6} label="Simplicity" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="font-semibold text-slate-900 text-sm">Code Issues ({issues.length})</h3>
          </div>
          {issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-6">
              <CheckCircle size={28} className="text-emerald-400 mb-2" />
              <p className="text-slate-500 text-sm">No code issues found</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {issues.map((issue, i) => (
                <li key={i} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SeverityBadge severity={issue.severity} />
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${issueTypeColors[issue.type] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {issue.type.replace('_', ' ')}
                      </span>
                    </div>
                    {issue.line && (
                      <span className="text-xs text-slate-400 shrink-0 font-mono">L{issue.line}</span>
                    )}
                  </div>
                  <p className="font-medium text-slate-800 text-sm mb-1">{issue.title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed mb-2">{issue.description}</p>
                  <div className="bg-blue-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-blue-700 leading-relaxed"><span className="font-semibold">Fix: </span>{issue.suggestion}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Shield size={16} className="text-red-500" />
            <h3 className="font-semibold text-slate-900 text-sm">Security ({securityIssues.length})</h3>
          </div>
          {securityIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-6">
              <CheckCircle size={28} className="text-emerald-400 mb-2" />
              <p className="text-slate-500 text-sm">No security issues detected</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {securityIssues.map((issue, i) => (
                <li key={i} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <SeverityBadge severity={issue.severity} />
                    {issue.cwe && (
                      <span className="text-xs text-slate-400 font-mono">{issue.cwe}</span>
                    )}
                  </div>
                  <p className="font-medium text-slate-800 text-sm mb-1">{issue.title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed mb-2">{issue.description}</p>
                  <div className="bg-red-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-700 leading-relaxed"><span className="font-semibold">Remediation: </span>{issue.fix}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Lightbulb size={16} className="text-blue-500" />
            <h3 className="font-semibold text-slate-900 text-sm">Suggestions ({suggestions.length})</h3>
          </div>
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <CheckCircle size={28} className="text-emerald-400 mb-2" />
              <p className="text-slate-500 text-sm">No suggestions at this time</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {suggestions.map((s, i) => (
                <li key={i} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[s.category] || 'bg-slate-50 text-slate-600'}`}>
                      {s.category}
                    </span>
                    <span className={`text-xs font-medium ${s.impact === 'high' ? 'text-emerald-600' : s.impact === 'medium' ? 'text-amber-600' : 'text-slate-400'}`}>
                      {s.impact} impact
                    </span>
                  </div>
                  <p className="font-medium text-slate-800 text-sm mb-1">{s.title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{s.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Zap size={16} className="text-amber-500" />
            <h3 className="font-semibold text-slate-900 text-sm">Performance ({performanceNotes.length})</h3>
          </div>
          {performanceNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <CheckCircle size={28} className="text-emerald-400 mb-2" />
              <p className="text-slate-500 text-sm">No performance concerns detected</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {performanceNotes.map((note, i) => (
                <li key={i} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${note.impact === 'high' ? 'bg-red-50 text-red-600' : note.impact === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                      {note.impact} impact
                    </span>
                  </div>
                  <p className="font-medium text-slate-800 text-sm mb-1">{note.title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed mb-2">{note.description}</p>
                  <div className="bg-amber-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-700 leading-relaxed"><span className="font-semibold">Recommendation: </span>{note.recommendation}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <Code2 size={16} className="text-slate-500" />
          <h3 className="font-semibold text-slate-900 text-sm">Submitted Code</h3>
          <span className="ml-auto text-xs text-slate-400">{review.lines_of_code} lines</span>
        </div>
        <pre className="p-5 overflow-x-auto text-xs font-mono text-slate-700 bg-slate-50 rounded-b-xl leading-relaxed max-h-96">
          <code>{review.code}</code>
        </pre>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Share2 size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Share review</h3>
                  <p className="text-xs text-slate-500">Anyone with the link can view this review</p>
                </div>
              </div>
              <button onClick={() => setShowShareModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            {sharingLoading ? (
              <div className="flex items-center justify-center py-8 gap-3">
                <Loader2 size={18} className="animate-spin text-blue-600" />
                <span className="text-sm text-slate-500">Generating share link...</span>
              </div>
            ) : shareLink ? (
              <div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                  <Link size={14} className="text-slate-400 shrink-0" />
                  <span className="flex-1 text-xs text-slate-600 font-mono truncate">{shareLink}</span>
                </div>
                <button
                  onClick={handleCopyShareLink}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors"
                >
                  {copiedShareLink ? <CheckCircle size={15} /> : <Copy size={15} />}
                  {copiedShareLink ? 'Link copied!' : 'Copy link'}
                </button>
                <p className="text-xs text-slate-400 text-center mt-3">
                  This link will show review results but not your account details
                </p>
              </div>
            ) : (
              <p className="text-sm text-red-500 text-center py-4">Failed to generate share link. Please try again.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
