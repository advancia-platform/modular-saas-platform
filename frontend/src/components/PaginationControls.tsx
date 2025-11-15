"use client";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export default function PaginationControls({
  page,
  totalPages,
  setPage,
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      <div className="text-sm text-gray-600 dark:text-gray-300">
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => setPage(Math.max(1, page - 1))}
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Prev
        </button>
        <button
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Next
        </button>
      </div>
    </div>
  );
}
