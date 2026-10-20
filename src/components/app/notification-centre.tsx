"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToastAction } from "@/components/complaints/use-action-toast";
import { cn } from "@/lib/utils";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/server/actions/community";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
  /** Pre-formatted on the server so text is identical on server and client. */
  when: string;
};

export function NotificationCentre({ items }: { items: NotificationItem[] }) {
  const [, markAll] = useToastAction(markAllNotificationsReadAction);
  const unread = items.filter((n) => !n.readAt).length;

  if (items.length === 0) {
    return (
      <EmptyState icon={Bell} title="No notifications yet" description="Updates about your complaints and announcements will appear here." />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <p className="text-sm text-muted" aria-live="polite">
          {unread > 0 ? `${unread} unread` : "All caught up"}
        </p>
        <form action={markAll}>
          <SubmitButton variant="outline" size="sm" disabled={unread === 0} pendingText="Marking…">
            <CheckCheck aria-hidden />
            Mark all as read
          </SubmitButton>
        </form>
      </div>
      <ul className="divide-y divide-line">
        {items.map((n) => (
          <li key={n.id} className={cn("flex gap-3 px-4 py-4 sm:px-6", !n.readAt && "bg-info-soft/40")}>
            <span
              className={cn("mt-2 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-info")}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className={cn("text-[15px] text-ink", !n.readAt && "font-semibold")}>
                {!n.readAt ? <span className="sr-only">Unread: </span> : null}
                {n.title}
              </p>
              <p className="mt-0.5 text-sm text-muted">{n.message}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
                <time className="text-muted" dateTime={new Date(n.createdAt).toISOString()}>{n.when}</time>
                {n.link ? (
                  <Link href={n.link} className="font-semibold text-secondary hover:underline">
                    View details
                  </Link>
                ) : null}
                {!n.readAt ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <button type="submit" className="min-h-8 font-semibold text-muted hover:text-ink hover:underline">
                      Mark as read
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
