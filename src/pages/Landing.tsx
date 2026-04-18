import { useState } from 'react';
import { Code2, Zap, Shield, BarChart3, ArrowRight, CheckCircle, Star, GitBranch, Clock, Users, ChevronRight, X, AlertTriangle, Lightbulb } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
}

const DEMO_CODE = `async function fetchUserData(userId) {
  const response = await fetch('/api/users/' + userId);
  const data = response.json(); // Missing await!

  if (data.password) {
    console.log('User password:', data.password); // Security risk
  }

  var result = [];
  for (var i = 0; i < data.items.length; i++) {
    result.push(data.items[i]);
  }
  return result;
}`;

const DEMO_RESULT = {
  score: 42,
  summary: 'This JavaScript function has critical security vulnerabilities and missing error handling. The code exposes sensitive user data and has a missing await that will cause runtime errors.',
  issues: [
    { type: 'bug', severity: 'critical' as const, line: 3, title: 'Missing await on response.json()', description: 'response.json() returns a Promise. Without await, data is a Promise object, not the actual data.', suggestion: 'Change to: const data = await response.json()' },
    { type: 'error_handling', severity: 'high' as const, line: 1, title: 'No error handling for fetch', description: 'Network errors and non-OK responses are not handled.', suggestion: 'Add try/catch and check response.ok before parsing.' },
    { type: 'naming', severity: 'low' as const, line: 9, title: 'Use const and modern array methods', description: 'Using var and manual for-loop instead of modern JavaScript.', suggestion: 'Replace with: const result = data.items.map(item => item)' },
  ],
  security: [
    { severity: 'critical' as const, title: 'Sensitive data exposure', description: 'Logging password to console exposes sensitive data in production logs.', cwe: 'CWE-312', fix: 'Remove the console.log statement. Never log sensitive user data.' },
  ],
};

const features = [
  {
    icon: Zap,
    title: 'Instant AI Analysis',
    description: 'Get comprehensive code reviews in seconds powered by Claude AI. Catch bugs, security issues, and anti-patterns instantly.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Shield,
    title: 'Security Scanning',
    description: 'Automatically detect vulnerabilities, injection risks, and security misconfigurations before they reach production.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'Quality Metrics',
    description: 'Measure code quality with scores for maintainability, complexity, and overall health across your entire codebase.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: GitBranch,
    title: 'Multi-Language Support',
    description: 'Review JavaScript, TypeScript, Python, Java, Go, Rust, and 20+ other languages with language-specific best practices.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Clock,
    title: 'Review History',
    description: 'Track your code quality improvements over time with a complete history of all reviews and metrics trends.',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share reviews with your team, maintain consistent standards, and onboard new engineers faster.',
    color: 'bg-violet-50 text-violet-600',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for individual developers getting started',
    features: ['10 reviews per month', 'All languages supported', 'Basic security scan', 'Review history (30 days)', 'Email support'],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'For serious developers who ship quality code',
    features: ['Unlimited reviews', 'Priority AI processing', 'Advanced security analysis', 'Full review history', 'Performance profiling', 'Priority support', 'API access'],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$79',
    period: 'per month',
    description: 'For teams building mission-critical software',
    features: ['Everything in Pro', 'Team management', 'Custom rules & policies', 'SSO integration', 'Audit logs', 'Dedicated support', 'SLA guarantee'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Senior Engineer @ Stripe', text: 'CodeSense caught a SQL injection vulnerability in our auth flow that our entire team missed during review. Worth every penny.', rating: 5 },
  { name: 'Marcus Rivera', role: 'CTO @ Fintech startup', text: 'We reduced our code review turnaround from 2 days to 20 minutes. The AI suggestions are genuinely actionable and specific.', rating: 5 },
  { name: 'Emily Watson', role: 'Lead Developer @ Shopify', text: 'The complexity metrics helped us identify technical debt we had been accumulating for months. Game changer for our team.', rating: 5 },
];

const stats = [
  { value: '2.4M+', label: 'Lines reviewed' },
  { value: '98%', label: 'Accuracy rate' },
  { value: '12K+', label: 'Developers' },
  { value: '< 8s', label: 'Avg review time' },
];

export default function Landing({ onGetStarted }: LandingProps) {
  const [showDemo, setShowDemo] = useState(false);
  const [demoStep, setDemoStep] = useState<'code' | 'analyzing' | 'results'>('code');

  const runDemo = () => {
    setShowDemo(true);
    setDemoStep('analyzing');
    setTimeout(() => setDemoStep('results'), 2200);
  };

  const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-600 border-blue-200',
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">CodeSense</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">Features</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">Pricing</a>
            <a href="#testimonials" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">Reviews</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={onGetStarted} className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
              Sign in
            </button>
            <button
              onClick={onGetStarted}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Get started free
            </button>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-24 bg-gradient-to-b from-slate-50 to-white px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-blue-100">
            <Zap size={14} />
            Powered by Claude AI — the most advanced code reviewer
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Ship code you're
            <span className="text-blue-600"> actually proud of</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
            CodeSense uses advanced AI to review your code in seconds — catching bugs, security vulnerabilities, and performance issues before they cost you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-base transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
            >
              Start reviewing for free
              <ArrowRight size={18} />
            </button>
            <button
              onClick={runDemo}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-base transition-colors border border-slate-200"
            >
              See a demo
              <ChevronRight size={18} />
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-4">No credit card required · 10 free reviews/month</p>
        </div>
      </section>

      <section className="py-16 bg-slate-900 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-extrabold text-white mb-1">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Everything you need to ship better code</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A complete AI-powered code review platform built for modern engineering teams.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(feature => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="p-6 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 hover:shadow-lg transition-all group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-slate-900 font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">How it works</h2>
            <p className="text-lg text-slate-600">Get your first review in under a minute</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Paste your code', description: 'Drop in any code snippet or file. We support 20+ programming languages.' },
              { step: '02', title: 'AI analyzes it', description: 'Our Claude-powered engine scans for bugs, security issues, and code smells.' },
              { step: '03', title: 'Get actionable feedback', description: 'Receive line-by-line suggestions with explanations and fix recommendations.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="text-7xl font-extrabold text-slate-100 mb-3">{item.step}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-slate-600">Start free, scale when you're ready</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 border ${
                  plan.highlighted
                    ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-slate-900/20 scale-105'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="mb-6">
                  <div className={`text-sm font-semibold mb-1 ${plan.highlighted ? 'text-blue-400' : 'text-slate-500'}`}>{plan.name}</div>
                  <div className={`text-4xl font-extrabold mb-1 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>{plan.price}</div>
                  <div className={`text-sm ${plan.highlighted ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</div>
                  <p className={`text-sm mt-3 ${plan.highlighted ? 'text-slate-400' : 'text-slate-600'}`}>{plan.description}</p>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckCircle size={15} className={plan.highlighted ? 'text-blue-400' : 'text-emerald-500'} />
                      <span className={`text-sm ${plan.highlighted ? 'text-slate-300' : 'text-slate-700'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onGetStarted}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlighted
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24 bg-slate-50 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Loved by developers worldwide</h2>
            <p className="text-lg text-slate-600">Join thousands of engineers who ship with confidence</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex gap-0.5 mb-4">
                  {Array(t.rating).fill(0).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-slate-500 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Ready to write better code?</h2>
          <p className="text-lg text-slate-600 mb-8">Join 12,000+ developers shipping higher quality software with AI-powered code reviews.</p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-base transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
          >
            Get started for free
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <footer className="py-10 border-t border-slate-100 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Code2 size={12} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">CodeSense</span>
          </div>
          <p className="text-slate-500 text-sm">© 2025 CodeSense. All rights reserved.</p>
          <div className="flex gap-6 text-slate-500 text-sm">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {showDemo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Code2 size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Live Demo</h3>
                  <p className="text-xs text-slate-500">See CodeSense analyze real code</p>
                </div>
              </div>
              <button onClick={() => { setShowDemo(false); setDemoStep('code'); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-slate-900 rounded-xl p-5 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="ml-2 text-slate-400 text-xs font-mono">fetchUserData.js</span>
                </div>
                <pre className="text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto">
                  <code>{DEMO_CODE}</code>
                </pre>
              </div>

              {demoStep === 'analyzing' && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="relative w-16 h-16 mb-5">
                    <div className="w-16 h-16 border-3 border-blue-100 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap size={20} className="text-blue-600" />
                    </div>
                  </div>
                  <p className="font-semibold text-slate-900 mb-1">Analyzing code with Claude AI...</p>
                  <p className="text-slate-500 text-sm">Scanning for bugs, security issues, and best practices</p>
                </div>
              )}

              {demoStep === 'results' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="relative w-16 h-16 shrink-0">
                      <svg width="64" height="64" className="-rotate-90">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#ef4444" strokeWidth="5"
                          strokeDasharray={`${2 * Math.PI * 26}`}
                          strokeDashoffset={`${2 * Math.PI * 26 * (1 - DEMO_RESULT.score / 100)}`}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-base font-bold text-red-600">{DEMO_RESULT.score}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm mb-1">Quality Score: {DEMO_RESULT.score}/100</p>
                      <p className="text-slate-500 text-xs leading-relaxed">{DEMO_RESULT.summary}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className="font-semibold text-slate-900 text-sm">Code Issues ({DEMO_RESULT.issues.length})</span>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {DEMO_RESULT.issues.map((issue, i) => (
                        <li key={i} className="px-4 py-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${severityColors[issue.severity]}`}>
                              {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">Line {issue.line}</span>
                          </div>
                          <p className="font-medium text-slate-800 text-sm mb-0.5">{issue.title}</p>
                          <p className="text-slate-500 text-xs mb-1.5">{issue.description}</p>
                          <div className="bg-blue-50 rounded-lg px-3 py-1.5">
                            <p className="text-xs text-blue-700"><span className="font-semibold">Fix: </span>{issue.suggestion}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-red-100 bg-red-50">
                      <Shield size={14} className="text-red-500" />
                      <span className="font-semibold text-slate-900 text-sm">Security Issues ({DEMO_RESULT.security.length})</span>
                    </div>
                    {DEMO_RESULT.security.map((issue, i) => (
                      <div key={i} className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${severityColors[issue.severity]}`}>
                            {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{issue.cwe}</span>
                        </div>
                        <p className="font-medium text-slate-800 text-sm mb-0.5">{issue.title}</p>
                        <p className="text-slate-500 text-xs mb-1.5">{issue.description}</p>
                        <div className="bg-red-50 rounded-lg px-3 py-1.5">
                          <p className="text-xs text-red-700"><span className="font-semibold">Remediation: </span>{issue.fix}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={onGetStarted}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-blue-200"
                  >
                    <Lightbulb size={16} />
                    Start reviewing your own code for free
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
