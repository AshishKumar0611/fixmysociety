import type { Metadata } from "next";
import { NotificationsPage } from "@/components/account/notifications-page";
import { requireResident } from "@/lib/auth";

export const metadata: Metadata = { title: "Notifications" };

export default async function ResidentNotificationsPage() {
  return <NotificationsPage user={await requireResident()} />;
}
