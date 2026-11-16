'use client';

export default function FavoriteButton({ saved, onToggle }: { saved: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={saved}
      title={saved ? 'Remove from favorites' : 'Add to favorites'}
      onClick={onToggle}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${saved ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-slate-200 bg-white text-slate-400 hover:bg-amber-50 hover:text-amber-600'}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="m12 3 2.8 5.7 6.3.9-4.55 4.4 1.08 6.25L12 17.3l-5.63 2.95 1.08-6.25L2.9 9.6l6.3-.9L12 3Z" />
      </svg>
    </button>
  );
}
