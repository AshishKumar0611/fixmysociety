import type { Metadata } from "next";
import { Eye, EyeOff, Megaphone, Trash2 } from "lucide-react";
import { AnnouncementForm } from "@/components/account/announcement-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireManager } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { deleteAnnouncementAction, toggleAnnouncementAction } from "@/server/actions/community";
import { toActor } from "@/server/actions/helpers";
import { listAllAnnouncements } from "@/server/services/community";

export const metadata: Metadata = { title: "Announcements" };

export default async function ManagerAnnouncementsPage() {
  const user = await requireManager();
  const items = await listAllAnnouncements(toActor(user));
  const now = new Date();

  const stateOf = (a: (typeof items)[number]) => {
    if (!a.isActive) return <Badge>Inactive</Badge>;
    if (a.publishedAt > now) return <Badge tone="info">Scheduled</Badge>;
    if (a.expiresAt && a.expiresAt <= now) return <Badge tone="warning">Expired</Badge>;
    return <Badge tone="success">Live</Badge>;
  };

  return (
    <>
      <PageHeader title="Announcements" description="Publish notices to every resident of your society. Residents are notified in the app." />
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="self-start">
          <CardHeader title="New announcement" />
          <CardBody>
            <AnnouncementForm />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="All announcements" description={`${items.length} total`} />
          {items.length === 0 ? (
            <EmptyState icon={Megaphone} title="No announcements yet" description="Use the form to publish your first notice." />
          ) : (
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {items.map((a) => (
                <li key={a.id} className="px-4 py-4 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-ink">{a.title}</h3>
                    {stateOf(a)}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-ink">{a.message}</p>
                  <p className="mt-1.5 text-[12px] text-muted">
                    Published {formatDate(a.publishedAt)}
                    {a.expiresAt ? ` · expires ${formatDate(a.expiresAt)}` : " · no expiry"} · by {a.author.name}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ConfirmAction
                      action={toggleAnnouncementAction}
                      fields={{ id: a.id, isActive: String(!a.isActive) }}
                      trigger={a.isActive ? <><EyeOff aria-hidden />Deactivate</> : <><Eye aria-hidden />Activate</>}
                      title={a.isActive ? "Hide this announcement?" : "Show this announcement?"}
                      description={a.isActive ? "Residents will no longer see it." : "Residents will see it again (if it has not expired)."}
                      confirmLabel={a.isActive ? "Deactivate" : "Activate"}
                      confirmVariant="primary"
                    />
                    <ConfirmAction
                      action={deleteAnnouncementAction}
                      fields={{ id: a.id }}
                      trigger={<><Trash2 aria-hidden />Delete</>}
                      triggerVariant="ghost"
                      title="Delete this announcement?"
                      description="This permanently removes it. This cannot be undone."
                      confirmLabel="Delete announcement"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
