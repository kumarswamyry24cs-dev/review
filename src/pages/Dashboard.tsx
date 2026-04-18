import { Plus, TrendingUp, Shield, AlertTriangle, Code2, Clock, ArrowRight, Zap, TrendingDown, Minus } from 'lucide-react';
import { useReviews } from '../hooks/useReviews';
import { useAuth } from '../contexts/AuthContext';
import ScoreRing from '../components/ScoreRing';

type Page = 'dashboard' | 'new-review' | 'history' | 'settings';

interface DashboardProps {
  onNavigate: (page: Page, reviewId?: string) => void;
}

const languages: Record<string, string> = {
  javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', java: 'Java',
  go: 'Go', rust: 'Rust', cpp: 'C++', csharp: 'C#', php: 'PHP', ruby: 'Ruby',
  swift: 'Swift', kotlin: 'Kotlin', sql: 'SQL', html: 'HTML', css: 'CSS', other: 'Other',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ScoreTrendChart({ reviews }: { reviews: { overall_score: number; created_at: string }[] }) {
  if (reviews.length < 2) return null;

  const last10 = [...reviews].reverse().slice(-10);
  const scores = last10.map(r => r.overall_score);
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;
  const range = max - min || 1;

  const width = 280;
  const height = 80;
  const points = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * width;
    const y = height - ((s - min) / range) * height;
    return `${x},${y}`;
  });

  const firstScore = scores[0];
  const lastScore = scores[scores.length - 1];
  const diff = lastScore - firstScore;
  const trending = diff > 2 ? 'up' : diff < -2 ? 'down' : 'flat';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-900 text-sm">Score Trend</h4>
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
          trending === 'up' ? 'bg-emerald-50 text-emerald-600' :
          trending === 'down' ? 'bg-red-50 text-red-600' :
          'bg-slate-50 text-slate-500'
        }`}>
          {trending === 'up' ? <TrendingUp size={11} /> : trending === 'down' ? <TrendingDown size={11} /> : <Minus size={11} />}
          {diff > 0 ? '+' : ''}{Math.round(diff)} pts
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M${points.join(' L')} L${width},${height} L0,${height} Z`}
          fill="url(#scoreGrad)"
        />
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {scores.map((s, i) => {
          const x = (i / (scores.length - 1)) * width;
          const y = height - ((s - min) / range) * height;
          return (
            <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" />
          );
        })}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-slate-400">
        <span>{last10[0] ? new Date(last10[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
        <span className="text-slate-500">Last {scores.length} reviews</span>
        <span>{last10[last10.length - 1] ? new Date(last10[last10.length - 1].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
      </div>
    </div>
  );
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { profile } = useAuth();
  const { reviews, loading } = useReviews();

  const completed = reviews.filter(r => r.status === 'completed');
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, r) => s + r.overall_score, 0) / completed.length)
    : 0;
  const totalIssues = completed.reduce((s, r) => s + (r.issues as unknown[]).length, 0);
  const totalSecurity = completed.reduce((s, r) => s + (r.security_issues as unknown[]).length, 0);
  const recentReviews = reviews.slice(0, 5);

  const FREE_LIMIT = 10;
  const monthlyUsed = profile?.monthly_reviews_used ?? 0;
  const isFreePlan = profile?.plan === 'free';
  const reviewsRemaining = Math.max(0, FREE_LIMIT - monthlyUsed);
  const usagePercent = Math.min(100, (monthlyUsed / FREE_LIMIT) * 100);
  const isNearLimit = isFreePlan && reviewsRemaining <= 2;
  const isAtLimit = isFreePlan && reviewsRemaining === 0;

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h2>
          <p className="text-slate-500 mt-1">Here's what's happening with your code quality.</p>
        </div>
        <button
          onClick={() => onNavigate('new-review')}
          disabled={isAtLimit}
          title={isAtLimit ? 'Monthly review limit reached. Upgrade to Pro.' : undefined}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Review
        </button>
      </div>

      {isAtLimit && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Monthly review limit reached</p>
            <p className="text-xs text-amber-700 mt-0.5">You've used all 10 free reviews this month. Upgrade to Pro for unlimited reviews.</p>
          </div>
          <button onClick={() => onNavigate('settings')} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shrink-0">
            Upgrade Now
          </button>
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
          <Zap size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            <strong>{reviewsRemaining} review{reviewsRemaining !== 1 ? 's' : ''} remaining</strong> this month on the free plan.{' '}
            <button onClick={() => onNavigate('settings')} className="underline font-semibold hover:text-blue-900">Upgrade to Pro</button> for unlimited.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Total Reviews</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Code2 size={16} className="text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{reviews.length}</div>
          <div className="text-xs text-slate-400 mt-1">{completed.length} completed</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Avg Quality Score</span>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
          </div>
          <div className={`text-3xl font-bold ${scoreColor(avgScore)}`}>{avgScore > 0 ? avgScore : '—'}</div>
          <div className="text-xs text-slate-400 mt-1">out of 100</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Issues Found</span>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalIssues}</div>
          <div className="text-xs text-slate-400 mt-1">across all reviews</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-sm font-medium">Security Issues</span>
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-red-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalSecurity}</div>
          <div className="text-xs text-slate-400 mt-1">vulnerabilities detected</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Recent Reviews</h3>
              <button onClick={() => onNavigate('history')} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                View all <ArrowRight size={13} />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Code2 size={24} className="text-slate-400" />
                </div>
                <h4 className="font-semibold text-slate-700 mb-2">No reviews yet</h4>
                <p className="text-slate-400 text-sm mb-4">Submit your first code snippet to get instant AI feedback</p>
                <button onClick={() => onNavigate('new-review')} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Start your first review
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentReviews.map(review => (
                  <li key={review.id}>
                    <button
                      onClick={() => onNavigate('history', review.id)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <ScoreRing score={review.overall_score} size={44} strokeWidth={4} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{review.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-400">{languages[review.language] || review.language}</span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{review.lines_of_code} lines</span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{timeAgo(review.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {review.status === 'pending' && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Processing</span>
                        )}
                        {review.status === 'failed' && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Failed</span>
                        )}
                        <ArrowRight size={14} className="text-slate-300" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-yellow-300" />
              <span className="font-semibold text-sm">Quick Review</span>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed mb-4">
              Paste any code snippet for an instant AI-powered review covering bugs, security, and performance.
            </p>
            <button
              onClick={() => onNavigate('new-review')}
              disabled={isAtLimit}
              className="w-full bg-white text-blue-700 font-semibold text-sm py-2.5 rounded-lg hover:bg-blue-50 disabled:bg-blue-300 disabled:text-blue-600 transition-colors"
            >
              {isAtLimit ? 'Limit Reached' : 'Start New Review'}
            </button>
          </div>

          <ScoreTrendChart reviews={completed} />

          {completed.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h4 className="font-semibold text-slate-900 mb-4 text-sm">Score Breakdown</h4>
              <div className="flex justify-around">
                <ScoreRing score={avgScore} size={64} strokeWidth={5} label="Quality" />
                <ScoreRing
                  score={Math.round(completed.reduce((s, r) => s + r.maintainability_score, 0) / completed.length)}
                  size={64}
                  strokeWidth={5}
                  label="Maintain."
                />
                <ScoreRing
                  score={100 - Math.round(completed.reduce((s, r) => s + r.complexity_score, 0) / completed.length)}
                  size={64}
                  strokeWidth={5}
                  label="Simplicity"
                />
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="font-semibold text-slate-900 mb-3 text-sm">Plan Status</h4>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                profile?.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                profile?.plan === 'enterprise' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {(profile?.plan || 'free').toUpperCase()}
              </span>
            </div>
            {isFreePlan ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>{monthlyUsed} of {FREE_LIMIT} reviews used</span>
                  <span className={reviewsRemaining <= 2 ? 'text-amber-600 font-semibold' : ''}>{reviewsRemaining} left</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                  <div
                    className={`h-1.5 rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <button onClick={() => onNavigate('settings')} className="w-full text-center text-blue-600 hover:text-blue-700 text-xs font-semibold py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  Upgrade to Pro for unlimited
                </button>
              </>
            ) : (
              <p className="text-slate-500 text-xs">Unlimited reviews included in your plan</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
