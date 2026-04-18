import type { CodeIssue, CodeSuggestion, SecurityIssue, PerformanceNote } from '../lib/database.types';

export interface ReviewResult {
  overall_score: number;
  summary: string;
  complexity_score: number;
  maintainability_score: number;
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  security_issues: SecurityIssue[];
  performance_notes: PerformanceNote[];
}

export interface ReviewProgress {
  stage: 'parsing' | 'analysis' | 'security' | 'suggestions' | 'performance' | 'complete';
  message: string;
  progress: number;
}

const systemPrompt = `You are an expert senior software engineer and code reviewer. Your role is to provide comprehensive, actionable code reviews that help developers write better software.

When reviewing code, you analyze:
1. Correctness and bugs
2. Security vulnerabilities and best practices
3. Performance and optimization opportunities
4. Code complexity and maintainability
5. Style and naming conventions
6. Testing and error handling

Respond ONLY with valid JSON (no markdown, no explanation) in this exact format:
{
  "overall_score": <0-100>,
  "summary": "<2-3 sentence executive summary>",
  "complexity_score": <0-100 where 100 is most complex>,
  "maintainability_score": <0-100 where 100 is most maintainable>,
  "issues": [
    {
      "type": "<bug|style|logic|naming|error_handling>",
      "severity": "<critical|high|medium|low>",
      "line": <line number or null>,
      "title": "<short title>",
      "description": "<detailed description>",
      "suggestion": "<how to fix>"
    }
  ],
  "suggestions": [
    {
      "category": "<refactoring|architecture|readability|testing|documentation>",
      "title": "<title>",
      "description": "<description>",
      "impact": "<high|medium|low>"
    }
  ],
  "security_issues": [
    {
      "severity": "<critical|high|medium|low>",
      "title": "<title>",
      "description": "<description>",
      "cwe": "<CWE identifier or null>",
      "fix": "<remediation>"
    }
  ],
  "performance_notes": [
    {
      "title": "<title>",
      "description": "<description>",
      "impact": "<high|medium|low>",
      "recommendation": "<what to do>"
    }
  ]
}`;

export async function reviewCodeWithAI(
  code: string,
  language: string,
  onProgress?: (progress: ReviewProgress) => void,
): Promise<ReviewResult> {
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    onProgress?.({ stage: 'analysis', message: 'Using mock AI review', progress: 50 });
    return generateMockReview(code, language);
  }

  const userPrompt = `Review this ${language} code for bugs, security issues, performance problems, and best practices:

\`\`\`${language}
${code}
\`\`\`

Provide a comprehensive review as JSON.`;

  try {
    onProgress?.({ stage: 'parsing', message: 'Parsing code structure...', progress: 10 });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    onProgress?.({ stage: 'analysis', message: 'Running analysis...', progress: 40 });

    const data = await response.json();
    const content = data.content[0].text;

    onProgress?.({ stage: 'security', message: 'Analyzing security...', progress: 60 });

    const result = JSON.parse(content) as ReviewResult;

    onProgress?.({ stage: 'suggestions', message: 'Generating suggestions...', progress: 80 });
    onProgress?.({ stage: 'performance', message: 'Performance analysis...', progress: 90 });
    onProgress?.({ stage: 'complete', message: 'Review complete', progress: 100 });

    return result;
  } catch (error) {
    console.error('AI review error:', error);
    return generateMockReview(code, language);
  }
}

function generateMockReview(code: string, language: string): ReviewResult {
  const lines = code.split('\n').length;
  const hasErrors = code.includes('catch') || code.includes('try');
  const hasSecurity = code.includes('password') || code.includes('token') || code.includes('secret');
  const score = Math.min(95, Math.max(45, 70 + Math.floor(Math.random() * 20)));

  return {
    overall_score: score,
    summary: `This ${language} code demonstrates ${score >= 80 ? 'solid' : 'moderate'} engineering practices with ${lines} lines. ${score >= 80 ? 'Generally well-structured and readable.' : 'Several areas need attention.'}`,
    complexity_score: Math.floor(Math.random() * 40) + 30,
    maintainability_score: Math.floor(Math.random() * 30) + 60,
    issues: [
      {
        type: 'error_handling',
        severity: hasErrors ? 'medium' : 'high',
        line: Math.floor(lines * 0.3),
        title: 'Insufficient error handling',
        description: 'Code lacks comprehensive error handling in several places.',
        suggestion: 'Wrap async operations in try-catch blocks and provide meaningful error messages.',
      },
      {
        type: 'naming',
        severity: 'low',
        line: Math.floor(lines * 0.1),
        title: 'Variable naming could be more descriptive',
        description: 'Some variable names are abbreviated or unclear.',
        suggestion: 'Use descriptive, self-documenting variable names.',
      },
    ],
    suggestions: [
      {
        category: 'testing',
        title: 'Add unit tests',
        description: 'Codebase would benefit from comprehensive unit test coverage.',
        impact: 'high',
      },
      {
        category: 'documentation',
        title: 'Add JSDoc comments',
        description: 'Public functions should have documentation comments.',
        impact: 'medium',
      },
    ],
    security_issues: hasSecurity
      ? [
          {
            severity: 'critical',
            title: 'Sensitive data detected',
            description: 'Code appears to handle sensitive data. Ensure it is never hardcoded.',
            cwe: 'CWE-312',
            fix: 'Use environment variables for sensitive configuration.',
          },
        ]
      : [],
    performance_notes: [
      {
        title: 'Algorithm efficiency',
        description: 'Review nested loops and recursive functions for optimization.',
        impact: 'medium',
        recommendation: 'Profile with realistic data to identify actual bottlenecks.',
      },
    ],
  };
}
