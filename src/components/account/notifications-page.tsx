import { NotificationCentre } from "@/components/app/notification-centre";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import type { SessionUser } from "@/lib/auth";
import { formatRelative } from "@/lib/utils";
import { toActor } from "@/server/actions/helpers";
import { listNotifications } from "@/server/services/notifications";

export async function NotificationsPage({ user }: { user: SessionUser }) {
  const items = await listNotifications(toActor(user));
  const now = new Date();
  return (
    <>
      <PageHeader
        title="Notifications"
        description="In-app updates about complaints and announcements. FixMySociety does not send email, SMS or WhatsApp messages."
      />
      <Card>
        <NotificationCentre items={items.map((n) => ({ ...n, when: formatRelative(n.createdAt, now) }))} />
      </Card>
    </>
  );
}
