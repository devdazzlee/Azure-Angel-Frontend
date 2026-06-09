import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { getPaginationRange } from '../utils/paginationRange';

interface VenturesPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function VenturesPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: VenturesPaginationProps) {
  if (totalPages <= 1) return null;

  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);
  const pages = getPaginationRange(currentPage, totalPages);

  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-700">{rangeStart}–{rangeEnd}</span> of{' '}
        <span className="font-semibold text-gray-700">{totalItems}</span> ventures
      </p>

      <nav
        aria-label="Ventures pagination"
        className="inline-flex max-w-full items-center gap-1 rounded-2xl border border-white/70 bg-white/80 p-1.5 shadow-lg backdrop-blur-md sm:gap-1.5 sm:p-2"
      >
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl px-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-35 sm:px-3"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {pages.map((token, index) =>
            token === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                aria-hidden
                className="flex h-9 w-8 items-center justify-center text-gray-400 sm:w-9"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <button
                key={token}
                type="button"
                onClick={() => onPageChange(token)}
                aria-current={token === currentPage ? 'page' : undefined}
                className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-semibold transition-all sm:min-w-10 ${
                  token === currentPage
                    ? 'bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-500 text-white shadow-md shadow-teal-500/25'
                    : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                }`}
              >
                {token}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl px-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-35 sm:px-3"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>

      <p className="text-xs text-gray-400">
        Page {currentPage} of {totalPages}
      </p>
    </div>
  );
}
