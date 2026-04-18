import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import NewReview from './pages/NewReview';
import History from './pages/History';
import Settings from './pages/Settings';
import ReviewDetail from './pages/ReviewDetail';
import AppLayout from './components/AppLayout';

type Page = 'dashboard' | 'new-review' | 'history' | 'settings';

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [showReviewDetail, setShowReviewDetail] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return <Auth onBack={() => setShowAuth(false)} />;
    }
    return <Landing onGetStarted={() => setShowAuth(true)} />;
  }

  const handleNavigate = (targetPage: Page, reviewId?: string) => {
    if (reviewId) {
      setSelectedReviewId(reviewId);
      setShowReviewDetail(true);
      setPage('history');
    } else {
      setPage(targetPage);
      setShowReviewDetail(false);
      setSelectedReviewId(null);
    }
  };

  const handleReviewCreated = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setShowReviewDetail(true);
    setPage('history');
  };

  const renderPage = () => {
    if (showReviewDetail && selectedReviewId) {
      return (
        <ReviewDetail
          reviewId={selectedReviewId}
          onBack={() => {
            setShowReviewDetail(false);
            setSelectedReviewId(null);
          }}
        />
      );
    }
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'new-review':
        return <NewReview onReviewCreated={handleReviewCreated} />;
      case 'history':
        return (
          <History
            selectedReviewId={selectedReviewId ?? undefined}
            onViewReview={(id) => {
              setSelectedReviewId(id);
              setShowReviewDetail(true);
            }}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppLayout currentPage={page} onNavigate={handleNavigate}>
      {renderPage()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
