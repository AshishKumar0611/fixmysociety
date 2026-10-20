import { AppShell } from "@/components/app/app-shell";
import { requireManager } from "@/lib/auth";
import { toActor } from "@/server/actions/helpers";
import { unreadCount } from "@/server/services/notifications";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireManager();
  const unread = await unreadCount(toActor(user));
  return (
    <AppShell user={user} unread={unread}>
      {children}
    </AppShell>
  );
}
