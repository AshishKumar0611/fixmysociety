"use client";

import Form from "next/form";
import Link from "next/link";
import { useRef } from "react";
import { Search, X } from "lucide-react";
import { Input, Select } from "@/components/ui/form";
import { buttonVariants } from "@/components/ui/button";
import { CATEGORIES, CATEGORY_LABELS, PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "@/lib/constants";

/**
 * Search, filter and sort controls. They submit as a GET form, so the URL is the single
 * source of truth: filters survive refreshes, can be bookmarked, and are applied on the server.
 */
export function FilterBar({
  action,
  values,
  searchPlaceholder = "Search by ID or title",
}: {
  action: string;
  values: Record<string, string | undefined>;
  searchPlaceholder?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => formRef.current?.requestSubmit();
  const active = ["q", "status", "category", "priority", "from", "to"].filter((k) => values[k]).length;

  return (
    <Form ref={formRef} action={action} className="space-y-3" role="search" aria-label="Filter complaints">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="filter-q" className="sr-only">
            Search
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input id="filter-q" name="q" type="search" defaultValue={values.q} placeholder={searchPlaceholder} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <label htmlFor="filter-sort" className="sr-only">
            Sort
          </label>
          <Select id="filter-sort" name="sort" defaultValue={values.sort ?? "newest"} onChange={submit} className="sm:w-44">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">Highest priority</option>
          </Select>
          <button type="submit" className={buttonVariants({ variant: "primary" })}>
            Search
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
        <div>
          <label htmlFor="filter-status" className="mb-1 block text-[12px] font-medium text-muted">Status</label>
          <Select id="filter-status" name="status" defaultValue={values.status ?? ""} onChange={submit}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="filter-category" className="mb-1 block text-[12px] font-medium text-muted">Category</label>
          <Select id="filter-category" name="category" defaultValue={values.category ?? ""} onChange={submit}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="filter-priority" className="mb-1 block text-[12px] font-medium text-muted">Priority</label>
          <Select id="filter-priority" name="priority" defaultValue={values.priority ?? ""} onChange={submit}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="filter-from" className="mb-1 block text-[12px] font-medium text-muted">From</label>
          <Input id="filter-from" name="from" type="date" defaultValue={values.from} onChange={submit} />
        </div>
        <div>
          <label htmlFor="filter-to" className="mb-1 block text-[12px] font-medium text-muted">To</label>
          <Input id="filter-to" name="to" type="date" defaultValue={values.to} onChange={submit} />
        </div>
        <div className="flex items-end">
          {active > 0 ? (
            <Link href={action} className={buttonVariants({ variant: "ghost", className: "w-full" })}>
              <X aria-hidden />
              Clear filters ({active})
            </Link>
          ) : null}
        </div>
      </div>
    </Form>
  );
}
