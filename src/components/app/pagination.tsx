import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  basePath: string;
  params: Record<string, string>;
}) {
  if (total === 0) return null;
  const href = (p: number) => {
    const q = new URLSearchParams({ ...params, page: String(p) });
    return `${basePath}?${q.toString()}`;
  };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const linkCls = "inline-flex h-10 items-center gap-1 rounded-[8px] border border-line bg-surface px-3 text-sm font-medium";
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <p className="text-[13px] text-muted">
        Showing <span className="font-semibold text-ink">{from}–{to}</span> of{" "}
        <span className="font-semibold text-ink">{total}</span>
      </p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={href(page - 1)} className={cn(linkCls, "hover:bg-surface-muted")} rel="prev">
              <ChevronLeft className="size-4" aria-hidden /> Previous
            </Link>
          ) : (
            <span className={cn(linkCls, "opacity-50")} aria-disabled="true">
              <ChevronLeft className="size-4" aria-hidden /> Previous
            </span>
          )}
          <span className="text-[13px] text-muted">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={href(page + 1)} className={cn(linkCls, "hover:bg-surface-muted")} rel="next">
              Next <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span className={cn(linkCls, "opacity-50")} aria-disabled="true">
              Next <ChevronRight className="size-4" aria-hidden />
            </span>
          )}
        </div>
      ) : null}
    </nav>
  );
}
