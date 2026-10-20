import type { Metadata } from "next";
import Form from "next/form";
import { Search, UserCheck, UserX, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { requireManager } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { normalizeSearchParams } from "@/lib/validation";
import { setResidentActiveAction } from "@/server/actions/community";
import { toActor } from "@/server/actions/helpers";
import { listResidents } from "@/server/services/community";

export const metadata: Metadata = { title: "Residents" };

export default async function ResidentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireManager();
  const params = normalizeSearchParams(await searchParams);
  const q = params.q?.slice(0, 100);
  const status = params.status === "active" || params.status === "inactive" ? params.status : undefined;
  const residents = await listResidents(toActor(user), { q, status });

  const toggle = (r: (typeof residents)[number]) =>
    r.isActive ? (
      <ConfirmAction
        action={setResidentActiveAction}
        fields={{ residentId: r.id, isActive: "false" }}
        trigger={<><UserX aria-hidden />Deactivate</>}
        title={`Deactivate ${r.name}?`}
        description="They will be signed out immediately and won't be able to sign in until reactivated. Their complaints stay on record."
        confirmLabel="Deactivate account"
      />
    ) : (
      <ConfirmAction
        action={setResidentActiveAction}
        fields={{ residentId: r.id, isActive: "true" }}
        trigger={<><UserCheck aria-hidden />Reactivate</>}
        title={`Reactivate ${r.name}?`}
        description="They will be able to sign in and raise complaints again."
        confirmLabel="Reactivate account"
        confirmVariant="primary"
      />
    );

  return (
    <>
      <PageHeader title="Resident directory" description={`Residents registered with ${user.society.name}.`} />
      <Card className="mb-4 p-4 sm:p-5">
        <Form action="/manager/residents" className="flex flex-col gap-3 sm:flex-row" role="search" aria-label="Search residents">
          <div className="relative flex-1">
            <label htmlFor="resident-q" className="sr-only">Search residents</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input id="resident-q" name="q" type="search" defaultValue={q} placeholder="Search name, unit or email" className="pl-9" />
          </div>
          <label htmlFor="resident-status" className="sr-only">Account status</label>
          <Select id="resident-status" name="status" defaultValue={status ?? ""} className="sm:w-44">
            <option value="">All accounts</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </Select>
          <button type="submit" className={buttonVariants()}>Search</button>
        </Form>
      </Card>
      <Card>
        {residents.length === 0 ? (
          <EmptyState icon={Users} title={q || status ? "No residents match" : "No residents yet"} description={q || status ? "Try a different search." : "Share your society join code from Settings so residents can register."} />
        ) : (
          <>
            <div className="relative hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <caption className="sr-only">Residents</caption>
                <thead>
                  <tr className="border-b border-line bg-surface-muted text-[12px] font-semibold uppercase tracking-wide text-muted">
                    <th scope="col" className="px-6 py-3">Name</th>
                    <th scope="col" className="px-4 py-3">Unit</th>
                    <th scope="col" className="px-4 py-3">Email</th>
                    <th scope="col" className="px-4 py-3 text-right">Complaints</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-6 py-3 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {residents.map((r) => (
                    <tr key={r.id}>
                      <td className="px-6 py-3.5">
                        <span className="block font-medium text-ink">{r.name}</span>
                        <span className="text-[12px] text-muted">Joined {formatDate(r.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3.5 font-medium">{r.unitNumber ?? "—"}</td>
                      <td className="px-4 py-3.5 text-muted">{r.email}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums">{r._count.complaints}</td>
                      <td className="px-4 py-3.5">
                        {r.isActive ? <Badge tone="success">Active</Badge> : <Badge>Deactivated</Badge>}
                      </td>
                      <td className="px-6 py-3.5 text-right">{toggle(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line md:hidden">
              {residents.map((r) => (
                <li key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{r.name}</p>
                      <p className="text-[13px] text-muted">Unit {r.unitNumber ?? "—"} · {r._count.complaints} complaint{r._count.complaints === 1 ? "" : "s"}</p>
                      <p className="truncate text-[13px] text-muted">{r.email}</p>
                    </div>
                    {r.isActive ? <Badge tone="success">Active</Badge> : <Badge>Deactivated</Badge>}
                  </div>
                  <div className="mt-3">{toggle(r)}</div>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-4 py-3 text-[13px] text-muted sm:px-6">
              {residents.length} resident{residents.length === 1 ? "" : "s"}
            </p>
          </>
        )}
      </Card>
    </>
  );
}
