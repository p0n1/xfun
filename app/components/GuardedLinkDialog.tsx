'use client';

interface GuardedLinkDialogProps {
  authorName?: string;
  isOpen: boolean;
  onClose: () => void;
  postUrl: string;
}

export default function GuardedLinkDialog({
  authorName,
  isOpen,
  onClose,
  postUrl,
}: GuardedLinkDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-4 pb-4 pt-20 sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.25)] backdrop-blur">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
            Leave X Fun
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">
            Open the original post on X?
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            {authorName
              ? `This will open ${authorName}'s post in a new tab.`
              : 'This will open the original post in a new tab.'}
          </p>
          <p className="break-all rounded-2xl bg-slate-100 px-4 py-3 text-xs text-slate-500">
            {postUrl}
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Stay here
          </button>
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-full bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Open on X
          </a>
        </div>
      </div>
    </div>
  );
}
