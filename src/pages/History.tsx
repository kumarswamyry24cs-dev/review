import { useState, useMemo } from 'react';
import { Search, Trash2, ArrowRight, Clock, Code2, Filter, AlertTriangle, CheckSquare, Square, Download, Import as SortAsc, Dessert as SortDesc, ChevronDown } from 'lucide-react';
import { useReviews } from '../hooks/useReviews';
import ScoreRing from '../components/ScoreRing';

interface HistoryProps {
  selectedReviewId?: string;
  onViewReview: (reviewId: string) => void;
}

const LANGUAGES: Record<string, string> = {
  javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', java: 'Java',
  go: 'Go', rust: 'Rust', cpp: 'C++', csharp: 'C#', php: 'PHP', ruby: 'Ruby',
  swift: 'Swift', kotlin: 'Kotlin', sql: 'SQL', html: 'HTML', css: 'CSS', bash: 'Bash', other: 'Other',
};

type SortField = 'date' | 'score' | 'language' | 'issues';
type SortDir = 'asc' | 'desc';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function History({ selectedReviewId, onViewReview }: HistoryProps) {
  const { reviews, loading, deleteReview } = useReviews();
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const langs = [...new Set(reviews.map(r => r.language))];

  const filtered = useMemo(() => {
    let result = reviews.filter(r => {
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.language.toLowerCase().includes(search.toLowerCase());
      const matchLang = filterLang === 'all' || r.language === filterLang;
      return matchSearch && matchLang;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === 'score') cmp = a.overall_score - b.overall_score;
      else if (sortField === 'language') cmp = a.language.localeCompare(b.language);
      else if (sortField === 'issues') cmp = (a.issues as unknown[]).length - (b.issues as unknown[]).length;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [reviews, search, filterLang, sortField, sortDir]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this review? This cannot be undone.')) return;
    setDeletingId(id);
    await deleteReview(id);
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
    setDeletingId(null);
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(r => r.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} review${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    for (const id of selected) {
      await deleteReview(id);
    }
    setSelected(new Set());
    setBulkDeleting(false);
  };

  const handleExportCSV = () => {
    const rows = filtered.map(r => [
      `"${r.title.replace(/"/g, '""')}"`,
      r.language,
      r.overall_score,
      r.lines_of_code,
      (r.issues as unknown[]).length,
      (r.security_issues as unknown[]).length,
      r.status,
      new Date(r.created_at).toISOString(),
    ].join(','));
    const csv = ['Title,Language,Score,Lines,Issues,Security Issues,Status,Date', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codesense-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setShowSortMenu(false);
  };

  const sortLabels: Record<SortField, string> = {
    date: 'Date', score: 'Score', language: 'Language', issues: 'Issues',
  };

  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  const someSelected = selected.size > 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Review History</h2>
          <p className="text-slate-500 mt-1">{reviews.length} total review{reviews.length !== 1 ? 's' : ''}</p>
        </div>
        {filtered.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg text-sm font-medium transition-all hover:bg-white"
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reviews..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={filterLang}
            onChange={e => setFilterLang(e.target.value)}
            className="pl-8 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
          >
            <option value="all">All languages</option>
            {langs.map(l => <option key={l} value={l}>{LANGUAGES[l] || l}</option>)}
          </select>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(p => !p)}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            {sortDir === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
            {sortLabels[sortField]}
            <ChevronDown size={13} className="text-slate-400" />
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 min-w-[140px] py-1">
              {(Object.keys(sortLabels) as SortField[]).map(f => (
                <button
                  key={f}
                  onClick={() => handleSort(f)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${sortField === f ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  {sortLabels[f]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {someSelected && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <span className="text-sm font-medium text-blue-800">{selected.size} selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Trash2 size={12} />
            {bulkDeleting ? 'Deleting...' : `Delete ${selected.size}`}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-auto"
          >
            Deselect all
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Code2 size={24} className="text-slate-400" />
          </div>
          <h4 className="font-semibold text-slate-700 mb-2">
            {search || filterLang !== 'all' ? 'No matching reviews' : 'No reviews yet'}
          </h4>
          <p className="text-slate-400 text-sm">
            {search || filterLang !== 'all' ? 'Try adjusting your filters' : 'Start by submitting your first code snippet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50">
            <button
              onClick={toggleSelectAll}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title={allSelected ? 'Deselect all' : 'Select all'}
            >
              {allSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
            </button>
            <span className="text-xs text-slate-500 font-medium">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {filtered.map(review => (
              <li key={review.id}>
                <div
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer group ${selectedReviewId === review.id ? 'bg-blue-50' : ''} ${selected.has(review.id) ? 'bg-blue-50/60' : ''}`}
                  onClick={() => onViewReview(review.id)}
                >
                  <button
                    onClick={e => toggleSelect(e, review.id)}
                    className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
                  >
                    {selected.has(review.id) ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                  </button>

                  {review.status === 'completed' ? (
                    <ScoreRing score={review.overall_score} size={48} strokeWidth={4} />
                  ) : review.status === 'pending' ? (
                    <div className="w-12 h-12 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-red-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800 truncate">{review.title}</p>
                      {review.status === 'pending' && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">Processing</span>
                      )}
                      {review.status === 'failed' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full shrink-0">Failed</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400">{LANGUAGES[review.language] || review.language}</span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-400">{review.lines_of_code} lines</span>
                      {review.status === 'completed' && (
                        <>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-400">
                            {(review.issues as unknown[]).length} issue{(review.issues as unknown[]).length !== 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={10} />{timeAgo(review.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={e => handleDelete(e, review.id)}
                      disabled={deletingId === review.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ArrowRight size={14} className="text-slate-300" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
