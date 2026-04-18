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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string;
          plan?: 'free' | 'pro' | 'enterprise';
          reviews_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          avatar_url?: string;
          plan?: 'free' | 'pro' | 'enterprise';
          reviews_count?: number;
          updated_at?: string;
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
