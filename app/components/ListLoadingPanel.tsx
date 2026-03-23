'use client';

import type { ListLoadProgress, ListLoadStage } from '../lib/content';

interface ListLoadingPanelProps {
  progress: ListLoadProgress | null;
  sourceLabel: string;
}

type LoadingStepState = 'pending' | 'active' | 'done';

function formatSourceLabel(sourceLabel: string) {
  if (!sourceLabel) {
    return 'List source';
  }

  try {
    const url = new URL(sourceLabel);
    const path = url.pathname === '/' ? '' : url.pathname;
    return `${url.hostname.replace(/^www\./, '')}${path}`;
  } catch {
    return sourceLabel;
  }
}

function getStageIndex(stage: ListLoadStage): number {
  if (stage === 'preparing') {
    return 0;
  }

  if (stage === 'fetching' || stage === 'proxying') {
    return 1;
  }

  if (stage === 'parsing') {
    return 2;
  }

  return 3;
}

function getStepState(stage: ListLoadStage, stepIndex: number): LoadingStepState {
  const stageIndex = getStageIndex(stage);

  if (stageIndex > stepIndex) {
    return 'done';
  }

  if (stageIndex === stepIndex) {
    return 'active';
  }

  return 'pending';
}

const FALLBACK_PROGRESS: ListLoadProgress = {
  stage: 'preparing',
  headline: 'Preparing your list',
  detail: 'Checking the source and getting the first links ready.',
  progressPercent: 10,
  usesProxy: false,
  proxyAttempts: [],
};

export default function ListLoadingPanel({
  progress,
  sourceLabel,
}: ListLoadingPanelProps) {
  const current = progress ?? FALLBACK_PROGRESS;
  const progressPercent = Math.min(100, Math.max(6, current.progressPercent));
  const steps = [
    {
      label: 'Connect',
      description: 'Reach the list source',
      state: getStepState(current.stage, 0),
    },
    {
      label: current.usesProxy ? 'Bridge' : 'Fetch',
      description: current.usesProxy
        ? 'Try public proxy services'
        : 'Download the text file',
      state: getStepState(current.stage, 1),
    },
    {
      label: 'Parse',
      description: 'Collect supported links',
      state: getStepState(current.stage, 2),
    },
  ];

  return (
    <section
      role="status"
      aria-live="polite"
      className="loading-surface relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,249,255,0.96),rgba(255,251,235,0.96))] p-6 shadow-[0_24px_80px_rgba(148,163,184,0.16)] sm:p-8"
    >
      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/80">
            <span className="rounded-full bg-white/85 px-3 py-1 text-[0.68rem] shadow-sm">
              Loading list
            </span>
            <span className="truncate text-slate-400">
              {formatSourceLabel(sourceLabel)}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
            {current.headline}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {current.detail}
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-4 text-sm font-medium text-slate-500">
              <span>
                {current.usesProxy ? 'Proxy-assisted request' : 'Direct browser request'}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/85 ring-1 ring-sky-100">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-300 to-amber-300 transition-[width] duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              >
                <span className="loading-bar-shine absolute inset-y-0 right-0 w-20" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.label}
                className={`rounded-[1.35rem] border px-4 py-4 transition ${
                  step.state === 'done'
                    ? 'border-emerald-200 bg-emerald-50/80'
                    : step.state === 'active'
                      ? 'border-sky-200 bg-white/90 shadow-sm'
                      : 'border-white/70 bg-white/55'
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    step.state === 'done'
                      ? 'text-emerald-700'
                      : step.state === 'active'
                        ? 'text-slate-900'
                        : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {current.proxyAttempts.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {current.proxyAttempts.map((attempt) => (
                <span
                  key={attempt.name}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-[0.16em] uppercase ${
                    attempt.status === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : attempt.status === 'failed'
                        ? 'bg-rose-100 text-rose-700'
                        : attempt.status === 'active'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-white/75 text-slate-400'
                  }`}
                >
                  {attempt.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative flex min-h-[13rem] items-center justify-center">
          <div className="absolute h-48 w-48 rounded-full border border-sky-200/70 bg-white/35" />
          <div className="absolute h-32 w-32 rounded-full border border-sky-200/70" />
          <div className="absolute h-20 w-20 rounded-full border border-amber-200/80 bg-white/85 backdrop-blur-sm" />
          <div className="absolute h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18),transparent_58%)]" />

          <div className="relative flex items-center gap-3">
            <span className="loading-orb h-4 w-4 rounded-full bg-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.55)]" />
            <span className="loading-orb h-4 w-4 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.5)]" />
            <span className="loading-orb h-4 w-4 rounded-full bg-amber-300 shadow-[0_0_24px_rgba(252,211,77,0.55)]" />
          </div>

          <div className="absolute bottom-0 text-center">
            <p className="text-[2.5rem] font-semibold tracking-tight text-slate-900">
              {progressPercent}%
            </p>
            <p className="text-sm text-slate-500">Getting the next list ready</p>
          </div>
        </div>
      </div>
    </section>
  );
}
