interface GkyProceedButtonProps {
  onProceed: () => void;
  disabled?: boolean;
}

export default function GkyProceedButton({ onProceed, disabled = false }: GkyProceedButtonProps) {
  return (
    <div className="rounded-xl border border-teal-200/80 bg-gradient-to-r from-teal-50 via-blue-50 to-indigo-50 p-4 shadow-sm">
      <button
        type="button"
        onClick={onProceed}
        disabled={disabled}
        className="mx-auto flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-500 px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-teal-600 hover:via-blue-600 hover:to-indigo-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        <span>Proceed</span>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  );
}
