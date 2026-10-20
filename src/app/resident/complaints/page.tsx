import type { Metadata } from "next";
import { ClipboardList, Plus, SearchX } from "lucide-react";
import { ComplaintCards, ComplaintTable } from "@/components/app/complaint-list";
import { FilterBar } from "@/components/app/filter-bar";
import { Pagination } from "@/components/app/pagination";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireResident } from "@/lib/auth";
import { complaintFiltersSchema, normalizeSearchParams } from "@/lib/validation";
import { toActor } from "@/server/actions/helpers";
import { listComplaints } from "@/server/services/complaints";

export const metadata: Metadata = { title: "My complaints" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ResidentComplaintsPage({ searchParams }: Props) {
  const user = await requireResident();
  const raw = normalizeSearchParams(await searchParams);
  const filters = complaintFiltersSchema.parse(raw);
  const result = await listComplaints(toActor(user), filters);
  const hasFilters = Boolean(filters.q || filters.status || filters.category || filters.priority || filters.from || filters.to);
  const { page: _page, ...linkParams } = raw;

  return (
    <>
      <PageHeader
        title="My complaints"
        description="Search, filter and follow every maintenance request you have raised."
        actions={
          <LinkButton href="/resident/complaints/new">
            <Plus aria-hidden />
            Raise Complaint
          </LinkButton>
        }
      />
      <Card className="mb-4 p-4 sm:p-5">
        <FilterBar key={JSON.stringify(raw)} action="/resident/complaints" values={raw} />
      </Card>
      <Card>
        {result.total === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No complaints match these filters"
              description="Try a different search term or clear the filters."
              action={<LinkButton href="/resident/complaints" variant="outline">Clear filters</LinkButton>}
            />
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="You haven't raised any complaints"
              description="Report a maintenance issue and you'll be able to track its progress here."
              action={<LinkButton href="/resident/complaints/new"><Plus aria-hidden />Raise Complaint</LinkButton>}
            />
          )
        ) : (
          <>
            <ComplaintTable rows={result.items} basePath="/resident/complaints" caption="Your complaints" />
            <div className="p-4 md:hidden">
              <ComplaintCards rows={result.items} basePath="/resident/complaints" />
            </div>
            <div className="border-t border-line">
              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                total={result.total}
                pageSize={result.pageSize}
                basePath="/resident/complaints"
                params={linkParams}
              />
            </div>
          </>
        )}
      </Card>
    </>
  );
}
