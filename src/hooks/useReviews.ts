import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

type CodeReview = Database['public']['Tables']['code_reviews']['Row'];

export function useReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('code_reviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setReviews(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const deleteReview = async (id: string) => {
    await supabase.from('code_reviews').delete().eq('id', id);
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  return { reviews, loading, error, refetch: fetchReviews, deleteReview };
}

export function useReview(id: string | null) {
  const [review, setReview] = useState<CodeReview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase.from('code_reviews').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      setReview(data);
      setLoading(false);
    });
  }, [id]);

  return { review, loading };
}
