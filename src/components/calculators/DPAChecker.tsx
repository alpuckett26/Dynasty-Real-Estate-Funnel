'use client';

import { useState } from 'react';
import { CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type Answer = string | null;

interface Question {
  id: string;
  text: string;
  sub?: string;
  options: { value: string; label: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'firstTime',
    text: 'Are you a first-time homebuyer?',
    sub: 'Or haven\'t owned a home in the past 3 years',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No — I\'ve owned recently' },
    ],
  },
  {
    id: 'healthcare',
    text: 'Do you work in healthcare?',
    sub: 'Nurse, doctor, EMT, therapist, technician, or healthcare admin',
    options: [
      { value: 'yes', label: 'Yes, healthcare' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'income',
    text: 'What is your approximate household income?',
    sub: 'Combined income of all buyers',
    options: [
      { value: 'under60', label: 'Under $60,000' },
      { value: '60to85', label: '$60,000 – $85,000' },
      { value: '85to110', label: '$85,000 – $110,000' },
      { value: 'over110', label: 'Over $110,000' },
    ],
  },
  {
    id: 'credit',
    text: 'What is your estimated credit score?',
    sub: 'Approximate is fine — we won\'t pull your credit',
    options: [
      { value: 'under580', label: 'Below 580' },
      { value: '580to619', label: '580 – 619' },
      { value: '620to679', label: '620 – 679' },
      { value: '680plus', label: '680 or above' },
    ],
  },
  {
    id: 'timeline',
    text: 'When are you looking to buy?',
    options: [
      { value: 'asap', label: 'As soon as possible' },
      { value: '3to6', label: 'In 3–6 months' },
      { value: '6to12', label: 'In 6–12 months' },
      { value: 'over12', label: 'More than a year out' },
    ],
  },
];

function getResult(answers: Record<string, Answer>) {
  const { firstTime, healthcare, income, credit, timeline } = answers;

  const creditOk = credit === '620to679' || credit === '680plus';
  const creditGood = credit === '680plus';
  const creditPoor = credit === 'under580';
  const incomeOk = income !== 'over110';
  const incomeLow = income === 'under60' || income === '60to85';

  if (creditPoor) {
    return {
      level: 'path',
      headline: 'Not quite yet — but there\'s a clear path.',
      summary: 'With a credit score below 580, most DPA programs aren\'t available yet. But this is fixable. Adreanne works with buyers through a 6–12 month credit repair program that gets you ready.',
      programs: [],
      cta: 'Start My Credit Repair Path',
      ctaHref: '/get-ready',
      color: 'bg-amber-50 border-amber-200',
      iconColor: 'text-amber-500',
    };
  }

  const programs: string[] = [];
  let potential = 0;

  if (firstTime === 'yes' && creditOk && incomeOk) {
    programs.push('GSFA Platinum (up to $15,000 grant)');
    potential = Math.max(potential, 15000);
  }
  if (firstTime === 'yes' && creditOk && incomeLow) {
    programs.push('LHC LACAA (up to $10,000 soft second)');
    potential = Math.max(potential, 10000);
  }
  if (healthcare === 'yes') {
    programs.push('Healthcare Hero rate discount + closing cost credit');
    potential = Math.max(potential, 5000);
  }
  if (creditGood && incomeOk) {
    programs.push('HUD-approved DPA (amount varies by program)');
  }

  if (programs.length === 0) {
    return {
      level: 'low',
      headline: 'Limited programs available for your profile.',
      summary: 'Based on your answers, you may not qualify for the major DPA programs — but there may still be lender-specific incentives. A free call with Adreanne will confirm.',
      programs: [],
      cta: 'Talk to Adreanne',
      ctaHref: '/book',
      color: 'bg-navy-50 border-navy-200',
      iconColor: 'text-navy-400',
    };
  }

  return {
    level: 'qualify',
    headline: `You likely qualify for up to ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(potential)} in assistance.`,
    summary: 'Based on your answers, you appear eligible for multiple programs. These are estimates — Adreanne will verify your exact eligibility and match you with the right lender.',
    programs,
    cta: 'Book Free Consultation',
    ctaHref: '/book',
    color: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-500',
  };
}

export function DPAChecker() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitted, setSubmitted] = useState(false);

  const currentStep = QUESTIONS.findIndex(q => !answers[q.id]);
  const done = currentStep === -1;

  function answer(questionId: string, value: string) {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);
    const next = QUESTIONS.findIndex(q => !updated[q.id]);
    if (next === -1) setSubmitted(true);
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  const result = submitted ? getResult(answers) : null;

  return (
    <div className="max-w-2xl mx-auto">
      {!submitted ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Progress */}
          <div className="h-1.5 bg-gray-100">
            <div
              className="h-full bg-brand-600 transition-all duration-500"
              style={{ width: `${(Object.keys(answers).length / QUESTIONS.length) * 100}%` }}
            />
          </div>

          <div className="p-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
              Question {Math.min(currentStep + 1, QUESTIONS.length)} of {QUESTIONS.length}
            </p>

            {QUESTIONS.map((q, i) => {
              if (i !== currentStep) return null;
              return (
                <div key={q.id}>
                  <h3 className="font-serif text-2xl font-bold text-navy-950 mb-1">{q.text}</h3>
                  {q.sub && <p className="text-sm text-gray-400 mb-6">{q.sub}</p>}
                  <div className="space-y-3 mt-6">
                    {q.options.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => answer(q.id, opt.value)}
                        className="w-full text-left rounded-xl border-2 border-gray-200 px-5 py-3.5 text-sm font-medium text-navy-800 hover:border-brand-400 hover:bg-brand-50 transition-all"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Previous answers */}
            {Object.keys(answers).length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
                {QUESTIONS.filter(q => answers[q.id]).map(q => (
                  <span key={q.id} className="text-xs bg-gray-100 text-gray-500 rounded-full px-3 py-1">
                    {q.options.find(o => o.value === answers[q.id])?.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : result ? (
        <div className={`rounded-3xl border p-8 ${result.color}`}>
          <div className="flex items-start gap-4 mb-6">
            {result.level === 'qualify' ? (
              <CheckCircle className={`h-8 w-8 flex-shrink-0 mt-0.5 ${result.iconColor}`} />
            ) : (
              <AlertCircle className={`h-8 w-8 flex-shrink-0 mt-0.5 ${result.iconColor}`} />
            )}
            <div>
              <h3 className="font-serif text-2xl font-bold text-navy-950">{result.headline}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{result.summary}</p>
            </div>
          </div>

          {result.programs.length > 0 && (
            <div className="bg-white/70 rounded-2xl p-5 mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Programs you may qualify for</p>
              <ul className="space-y-2">
                {result.programs.map(p => (
                  <li key={p} className="flex items-center gap-2 text-sm text-navy-800 font-medium">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link href={result.ctaHref} className="btn-primary text-sm">
              {result.cta} <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2">
              Start over
            </button>
          </div>

          <p className="mt-5 text-xs text-gray-400 leading-relaxed">
            These results are estimates based on general program guidelines. Actual eligibility is determined by lenders and program administrators. Adreanne will verify your specific situation.
          </p>
        </div>
      ) : null}
    </div>
  );
}
