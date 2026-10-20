import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CheckCircle2, ClipboardList, Clock, Inbox, Megaphone, Plus, User, Wrench } from "lucide-react";
import { AnnouncementList } from "@/components/app/announcement-list";
import { RecentComplaintList } from "@/components/app/complaint-list";
import { KpiCard } from "@/components/app/kpi-card";
import { LinkButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormMessage } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { requireResident } from "@/lib/auth";
import { formatLongDate, greeting } from "@/lib/utils";
import { toActor } from "@/server/actions/helpers";
import { listActiveAnnouncements } from "@/server/services/community";
import { unreadCount } from "@/server/services/notifications";
import { getRecentComplaintsForResident, getResidentStats } from "@/server/services/stats";

export const metadata: Metadata = { title: "Dashboard" };

export default async function ResidentDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireResident();
  const actor = toActor(user);
  const [stats, recent, announcements, unread, { denied }] = await Promise.all([
    getResidentStats(actor),
    getRecentComplaintsForResident(actor, 5),
    listActiveAnnouncements(actor, 3),
    unreadCount(actor),
    searchParams,
  ]);
  const firstName = user.name.split(" ")[0];

  return (
    <>
      {denied ? (
        <div className="mb-4">
          <FormMessage>That page is only available to society managers.</FormMessage>
        </div>
      ) : null}
      <PageHeader
        eyebrow={formatLongDate(new Date())}
        title={`${greeting()}, ${firstName}`}
        description={`${user.society.name}${user.unitNumber ? ` · Unit ${user.unitNumber}` : ""}`}
        actions={
          <>
            <LinkButton href="/resident/notifications" variant="outline">
              <Bell aria-hidden />
              Notifications{unread > 0 ? ` (${unread})` : ""}
            </LinkButton>
            <LinkButton href="/resident/complaints/new">
              <Plus aria-hidden />
              Raise Complaint
            </LinkButton>
          </>
        }
      />

      <section aria-label="Complaint summary" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard label="Total Complaints" value={stats.total} icon={ClipboardList} tone="navy" />
        <KpiCard label="Open Complaints" value={stats.open} icon={Inbox} tone="info" hint="Open or assigned" />
        <KpiCard label="In Progress" value={stats.inProgress} icon={Wrench} tone="warning" />
        <KpiCard label="Resolved" value={stats.resolved} icon={CheckCircle2} tone="success" hint="Resolved or closed" />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader
            title="Recent complaints"
            description="Your five most recent requests"
            action={
              stats.total > 0 ? (
                <Link href="/resident/complaints" className="text-sm font-semibold text-secondary hover:underline">
                  View all
                </Link>
              ) : null
            }
          />
          {recent.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No complaints yet"
              description="When something in your flat or building needs fixing, raise a complaint and track it here."
              action={
                <LinkButton href="/resident/complaints/new">
                  <Plus aria-hidden />
                  Raise your first complaint
                </LinkButton>
              }
            />
          ) : (
            <div className="mt-4">
              <RecentComplaintList rows={recent} basePath="/resident/complaints" />
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Community announcements"
              action={
                <Link href="/resident/announcements" className="text-sm font-semibold text-secondary hover:underline">
                  View all
                </Link>
              }
            />
            {announcements.length === 0 ? (
              <EmptyState icon={Megaphone} title="No announcements" description="Notices from your management team will appear here." />
            ) : (
              <div className="mt-2">
                <AnnouncementList items={announcements} compact />
              </div>
            )}
          </Card>
          <Card>
            <CardHeader title="Quick actions" />
            <ul className="grid gap-2 p-4 sm:p-6 sm:pt-4">
              {[
                { href: "/resident/complaints/new", label: "Raise a new complaint", icon: Plus },
                { href: "/resident/complaints?status=IN_PROGRESS", label: "See work in progress", icon: Clock },
                { href: "/resident/history", label: "View resolved history", icon: CheckCircle2 },
                { href: "/resident/profile", label: "Update your profile", icon: User },
              ].map((a) => (
                <li key={a.href}>
                  <Link
                    href={a.href}
                    className="flex min-h-11 items-center gap-3 rounded-[8px] border border-line px-3 text-sm font-medium text-ink hover:bg-surface-muted"
                  >
                    <a.icon className="size-4 text-secondary" aria-hidden />
                    {a.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
