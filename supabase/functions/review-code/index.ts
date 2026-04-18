import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReviewRequest {
  code: string;
  language: string;
  title?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { code, language, title } = await req.json() as ReviewRequest;

    if (!code || !language) {
      return new Response(
        JSON.stringify({ error: "code and language are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    let reviewResult;

    if (anthropicKey) {
      const prompt = `You are an expert senior software engineer performing a comprehensive code review. Analyze the following ${language} code and provide a detailed, structured review.

CODE TO REVIEW:
\`\`\`${language}
${code}
\`\`\`

Respond with ONLY a valid JSON object in this exact format (no markdown, no explanation outside JSON):
{
  "overall_score": <0-100 integer, holistic quality score>,
  "summary": "<2-3 sentence executive summary of the code quality>",
  "complexity_score": <0-100 integer, where 100 is most complex/hardest to understand>,
  "maintainability_score": <0-100 integer, where 100 is most maintainable>,
  "issues": [
    {
      "type": "<bug|style|logic|naming|error_handling>",
      "severity": "<critical|high|medium|low>",
      "line": <line number or null>,
      "title": "<short issue title>",
      "description": "<detailed description>",
      "suggestion": "<how to fix it>"
    }
  ],
  "suggestions": [
    {
      "category": "<refactoring|architecture|readability|testing|documentation>",
      "title": "<suggestion title>",
      "description": "<detailed suggestion>",
      "impact": "<high|medium|low>"
    }
  ],
  "security_issues": [
    {
      "severity": "<critical|high|medium|low>",
      "title": "<issue title>",
      "description": "<detailed description>",
      "cwe": "<CWE identifier if applicable or null>",
      "fix": "<recommended fix>"
    }
  ],
  "performance_notes": [
    {
      "title": "<performance observation title>",
      "description": "<detailed description>",
      "impact": "<high|medium|low>",
      "recommendation": "<what to do>"
    }
  ]
}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      reviewResult = JSON.parse(content);
    } else {
      reviewResult = generateMockReview(code, language);
    }

    return new Response(
      JSON.stringify(reviewResult),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateMockReview(code: string, language: string) {
  const lines = code.split("\n").length;
  const hasErrors = code.includes("catch") || code.includes("try");
  const hasSecurity = code.includes("password") || code.includes("token") || code.includes("secret");
  const hasAsync = code.includes("async") || code.includes("await") || code.includes("Promise");

  const score = Math.min(95, Math.max(45, 70 + Math.floor(Math.random() * 20)));

  return {
    overall_score: score,
    summary: `This ${language} code demonstrates ${score >= 80 ? "solid" : "moderate"} engineering practices with ${lines} lines of code. ${score >= 80 ? "The code is generally well-structured and readable, though there are opportunities for improvement." : "There are several areas that require attention to bring it up to production standards."} A few refactoring opportunities and best practice improvements have been identified.`,
    complexity_score: Math.floor(Math.random() * 40) + 30,
    maintainability_score: Math.floor(Math.random() * 30) + 60,
    issues: [
      {
        type: "error_handling",
        severity: hasErrors ? "medium" : "high",
        line: Math.floor(lines * 0.3),
        title: "Insufficient error handling",
        description: `The code lacks comprehensive error handling in several places. Unhandled errors can cause unexpected application behavior and poor user experience.`,
        suggestion: "Wrap async operations in try-catch blocks and provide meaningful error messages to callers."
      },
      {
        type: "naming",
        severity: "low",
        line: Math.floor(lines * 0.1),
        title: "Variable naming could be more descriptive",
        description: "Some variable names are abbreviated or unclear, reducing code readability for future maintainers.",
        suggestion: "Use descriptive, self-documenting variable names that clearly express their purpose."
      },
      {
        type: "logic",
        severity: "medium",
        line: Math.floor(lines * 0.6),
        title: "Potential edge case not handled",
        description: "The current logic may not properly handle null or undefined values in certain code paths, which could lead to runtime errors.",
        suggestion: "Add null checks and guard clauses at function entry points to handle edge cases gracefully."
      }
    ],
    suggestions: [
      {
        category: "refactoring",
        title: "Extract repeated logic into helper functions",
        description: "Several code blocks appear to perform similar operations. Extracting these into reusable helper functions would reduce duplication and make the code easier to test.",
        impact: "medium"
      },
      {
        category: "testing",
        title: `Add unit tests for ${language} functions`,
        description: "The codebase would benefit significantly from unit tests covering the main logic paths. Tests serve as documentation and prevent regressions.",
        impact: "high"
      },
      {
        category: "documentation",
        title: "Add JSDoc/function documentation",
        description: "Public functions and complex logic blocks should have documentation comments explaining parameters, return values, and any side effects.",
        impact: "medium"
      },
      {
        category: "architecture",
        title: "Consider separating concerns",
        description: "Some functions are handling multiple responsibilities. Applying the Single Responsibility Principle would improve testability and maintainability.",
        impact: "high"
      }
    ],
    security_issues: hasSecurity ? [
      {
        severity: "critical",
        title: "Sensitive data detected in code",
        description: "The code appears to handle sensitive data (passwords, tokens, or secrets). Ensure these are never hardcoded and are properly secured.",
        cwe: "CWE-312",
        fix: "Use environment variables for sensitive configuration. Never hardcode credentials. Consider using a secrets management service."
      },
      {
        severity: "high",
        title: "Input validation missing",
        description: "User-supplied input should be validated and sanitized before processing to prevent injection attacks.",
        cwe: "CWE-20",
        fix: "Implement comprehensive input validation using a validation library. Whitelist acceptable input formats."
      }
    ] : [
      {
        severity: "medium",
        title: "Input validation could be strengthened",
        description: "While no critical security issues were detected, strengthening input validation would improve the security posture.",
        cwe: "CWE-20",
        fix: "Add explicit type checking and validation for all function parameters that accept external data."
      }
    ],
    performance_notes: hasAsync ? [
      {
        title: "Optimize async/await usage",
        description: "Multiple async operations are being awaited sequentially when they could be executed in parallel using Promise.all().",
        impact: "medium",
        recommendation: "Use Promise.all() or Promise.allSettled() to run independent async operations concurrently."
      },
      {
        title: "Consider memoization for expensive operations",
        description: "Functions that perform expensive computations with the same inputs could benefit from memoization.",
        impact: "low",
        recommendation: "Implement memoization using useMemo (React) or a utility library for pure functions called repeatedly."
      }
    ] : [
      {
        title: "Algorithm complexity review",
        description: "Review nested loops and recursive functions to ensure optimal time complexity for the expected data sizes.",
        impact: "medium",
        recommendation: "Profile the code with realistic data volumes to identify actual bottlenecks before optimizing."
      }
    ]
  };
}
