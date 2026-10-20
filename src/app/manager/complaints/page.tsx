import type { Metadata } from "next";
import { ClipboardList, SearchX } from "lucide-react";
import { ComplaintCards, ComplaintTable } from "@/components/app/complaint-list";
import { FilterBar } from "@/components/app/filter-bar";
import { Pagination } from "@/components/app/pagination";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireManager } from "@/lib/auth";
import { complaintFiltersSchema, normalizeSearchParams } from "@/lib/validation";
import { toActor } from "@/server/actions/helpers";
import { listComplaints } from "@/server/services/complaints";

export const metadata: Metadata = { title: "Complaint queue" };

export default async function ManagerComplaintsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireManager();
  const raw = normalizeSearchParams(await searchParams);
  const filters = complaintFiltersSchema.parse(raw);
  const result = await listComplaints(toActor(user), filters);
  const hasFilters = Boolean(filters.q || filters.status || filters.category || filters.priority || filters.from || filters.to);
  const { page: _page, ...linkParams } = raw;

  return (
    <>
      <PageHeader title="Complaint queue" description={`All maintenance complaints for ${user.society.name}.`} />
      <Card className="mb-4 p-4 sm:p-5">
        <FilterBar key={JSON.stringify(raw)} action="/manager/complaints" values={raw} searchPlaceholder="Search ID, title, resident or unit" />
      </Card>
      <Card>
        {result.total === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No complaints match these filters"
              description="Try a different search or clear the filters."
              action={<LinkButton href="/manager/complaints" variant="outline">Clear filters</LinkButton>}
            />
          ) : (
            <EmptyState icon={ClipboardList} title="No complaints yet" description="Complaints raised by residents will appear here." />
          )
        ) : (
          <>
            <ComplaintTable rows={result.items} basePath="/manager/complaints" showResident caption="Society complaints" />
            <div className="p-4 md:hidden">
              <ComplaintCards rows={result.items} basePath="/manager/complaints" showResident />
            </div>
            <div className="border-t border-line">
              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                total={result.total}
                pageSize={result.pageSize}
                basePath="/manager/complaints"
                params={linkParams}
              />
            </div>
          </>
        )}
      </Card>
    </>
  );
}
