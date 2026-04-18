export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string;
          plan: 'free' | 'pro' | 'enterprise';
          reviews_count: number;
          monthly_reviews_used: number;
          monthly_reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string;
          plan?: 'free' | 'pro' | 'enterprise';
          reviews_count?: number;
          monthly_reviews_used?: number;
          monthly_reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          avatar_url?: string;
          plan?: 'free' | 'pro' | 'enterprise';
          reviews_count?: number;
          monthly_reviews_used?: number;
          monthly_reset_at?: string;
          updated_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          review_completed: boolean;
          weekly_digest: boolean;
          security_alerts: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          review_completed?: boolean;
          weekly_digest?: boolean;
          security_alerts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          review_completed?: boolean;
          weekly_digest?: boolean;
          security_alerts?: boolean;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          last_used_at?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          last_used_at?: string | null;
        };
      };
      review_shares: {
        Row: {
          id: string;
          review_id: string;
          shared_by_id: string;
          public_token: string;
          expires_at: string | null;
          view_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          shared_by_id: string;
          public_token?: string;
          expires_at?: string | null;
          view_count?: number;
          created_at?: string;
        };
        Update: {
          expires_at?: string | null;
          view_count?: number;
        };
      };
      code_reviews: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          code: string;
          language: string;
          overall_score: number;
          summary: string;
          issues: CodeIssue[];
          suggestions: CodeSuggestion[];
          security_issues: SecurityIssue[];
          performance_notes: PerformanceNote[];
          complexity_score: number;
          maintainability_score: number;
          lines_of_code: number;
          status: 'pending' | 'completed' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          code: string;
          language: string;
          overall_score?: number;
          summary?: string;
          issues?: CodeIssue[];
          suggestions?: CodeSuggestion[];
          security_issues?: SecurityIssue[];
          performance_notes?: PerformanceNote[];
          complexity_score?: number;
          maintainability_score?: number;
          lines_of_code?: number;
          status?: 'pending' | 'completed' | 'failed';
          created_at?: string;
        };
        Update: {
          title?: string;
          overall_score?: number;
          summary?: string;
          issues?: CodeIssue[];
          suggestions?: CodeSuggestion[];
          security_issues?: SecurityIssue[];
          performance_notes?: PerformanceNote[];
          complexity_score?: number;
          maintainability_score?: number;
          lines_of_code?: number;
          status?: 'pending' | 'completed' | 'failed';
        };
      };
    };
  };
}

export interface CodeIssue {
  type: 'bug' | 'style' | 'logic' | 'naming' | 'error_handling';
  severity: 'critical' | 'high' | 'medium' | 'low';
  line: number | null;
  title: string;
  description: string;
  suggestion: string;
}

export interface CodeSuggestion {
  category: 'refactoring' | 'architecture' | 'readability' | 'testing' | 'documentation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  cwe: string | null;
  fix: string;
}

export interface PerformanceNote {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}
