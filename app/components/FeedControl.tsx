'use client';

import type { ReactNode } from 'react';

type FeedIconName = 'list' | 'favorites' | 'order' | 'random' | 'reshuffle';

function FeedIcon({ name }: { name: FeedIconName }) {
  const dice = <>
    <rect x="6" y="6" width="20" height="20" rx="5" />
    <g fill="currentColor" stroke="none">
      <circle cx="11" cy="11" r="1.5" /><circle cx="21" cy="11" r="1.5" />
      <circle cx="16" cy="16" r="1.5" />
      <circle cx="11" cy="21" r="1.5" /><circle cx="21" cy="21" r="1.5" />
    </g>
  </>;
  const shapes: Record<FeedIconName, ReactNode> = {
    list: <><path d="M8 5h15a3 3 0 0 1 3 3v15" /><rect x="4" y="9" width="18" height="19" rx="3" /><path d="m7 22 4-5 3 3 2-2 3 4" /><circle cx="16" cy="14" r="1" /></>,
    favorites: <path fill="currentColor" stroke="none" d="m16 3 4 8.1 9 1.3-6.5 6.3 1.5 9L16 23.5 8 27.7l1.5-9L3 12.4l9-1.3Z" />,
    order: <><path d="M6 5h2v7M5 12h5M5 19c0-4 6-4 6 0 0 2-6 4-6 7h6M16 8h10M16 22h10M22 12v6m-3-3 3 3 3-3" /></>,
    random: dice,
    reshuffle: <><g transform="translate(5 5) scale(.68)">{dice}</g><path d="M6 9a12 12 0 0 1 21 6M6 9V3m0 6h6M26 23A12 12 0 0 1 5 17m21 6v6m0-6h-6" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{shapes[name]}</svg>;
}

export default function FeedControl({ icon, label, selected, count, onClick }: {
  icon: FeedIconName;
  label: string;
  selected?: boolean;
  count?: number;
  onClick: () => void;
}) {
  const color = icon === 'favorites' ? 'text-amber-600' : icon === 'list' ? 'text-sky-600' : icon === 'order' ? 'text-teal-600' : 'text-violet-600';
  return (
    <button type="button" aria-label={count === undefined ? label : `${label} ${count}`} aria-pressed={selected} title={label} onClick={onClick}
      className={`relative flex min-h-20 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 active:scale-95 ${selected ? 'border-current bg-white shadow-sm' : 'border-transparent bg-white/60 hover:bg-white'} ${color}`}>
      <FeedIcon name={icon} />
      <span className="whitespace-nowrap text-xs font-medium text-slate-700">{label}</span>
      {count !== undefined ? <span aria-hidden="true" className="absolute -right-1 -top-1 min-w-5 rounded-full bg-amber-100 px-1 text-xs font-bold text-amber-800">{count}</span> : null}
      {selected ? <span aria-hidden="true" className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-current"><svg viewBox="0 0 16 16" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 8 3 3 7-7" /></svg></span> : null}
    </button>
  );
}
