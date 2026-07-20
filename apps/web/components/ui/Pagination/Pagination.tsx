import { Button } from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  if (totalItems <= pageSize) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
      <span>
        صفحه {safePage.toLocaleString("fa-IR")} از{" "}
        {totalPages.toLocaleString("fa-IR")} ·{" "}
        {totalItems.toLocaleString("fa-IR")} مورد
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          قبلی
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          بعدی
        </Button>
      </div>
    </div>
  );
}
