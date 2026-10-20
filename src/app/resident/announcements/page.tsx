import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { AnnouncementList } from "@/components/app/announcement-list";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireResident } from "@/lib/auth";
import { toActor } from "@/server/actions/helpers";
import { listActiveAnnouncements } from "@/server/services/community";

export const metadata: Metadata = { title: "Announcements" };

export default async function ResidentAnnouncementsPage() {
  const user = await requireResident();
  const items = await listActiveAnnouncements(toActor(user));
  return (
    <>
      <PageHeader title="Announcements" description={`Notices from the ${user.society.name} management team.`} />
      <Card>
        {items.length === 0 ? (
          <EmptyState icon={Megaphone} title="No current announcements" description="Check back later for notices about maintenance, meetings and events." />
        ) : (
          <AnnouncementList items={items} />
        )}
      </Card>
    </>
  );
}
