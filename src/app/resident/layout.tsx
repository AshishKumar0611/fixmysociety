import { AppShell } from "@/components/app/app-shell";
import { requireResident } from "@/lib/auth";
import { toActor } from "@/server/actions/helpers";
import { unreadCount } from "@/server/services/notifications";

export default async function ResidentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireResident();
  const unread = await unreadCount(toActor(user));
  return (
    <AppShell user={user} unread={unread}>
      {children}
    </AppShell>
  );
}
