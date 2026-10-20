import type { Metadata } from "next";
import { NotificationsPage } from "@/components/account/notifications-page";
import { requireManager } from "@/lib/auth";

export const metadata: Metadata = { title: "Notifications" };

export default async function ManagerNotificationsPage() {
  return <NotificationsPage user={await requireManager()} />;
}
