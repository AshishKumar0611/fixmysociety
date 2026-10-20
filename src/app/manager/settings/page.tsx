import type { Metadata } from "next";
import { KeyRound, RefreshCw } from "lucide-react";
import { PasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { SocietyForm } from "@/components/account/society-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { PageHeader } from "@/components/ui/page-header";
import { requireManager } from "@/lib/auth";
import { regenerateJoinCodeAction } from "@/server/actions/community";
import { toActor } from "@/server/actions/helpers";
import { getSociety } from "@/server/services/community";
import { parseEnabledCategories } from "@/server/services/complaints";

export const metadata: Metadata = { title: "Settings" };

export default async function ManagerSettingsPage() {
  const user = await requireManager();
  const society = await getSociety(toActor(user));

  return (
    <>
      <PageHeader title="Settings" description="Society details, complaint categories and your account." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <CardHeader title="Society details" />
          <CardBody>
            <SocietyForm society={society} enabled={parseEnabledCategories(society.enabledCategories)} />
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Resident join code" description="Residents enter this code when they register." />
            <CardBody>
              <div className="flex items-center gap-3 rounded-[10px] bg-surface-muted p-4">
                <KeyRound className="size-5 text-secondary" aria-hidden />
                <code className="font-mono text-xl font-bold tracking-widest text-ink">{society.joinCode}</code>
              </div>
              <p className="mt-2 text-[13px] text-muted">Complaint numbers use the prefix <strong>{society.code}</strong>.</p>
              <div className="mt-4">
                <ConfirmAction
                  action={regenerateJoinCodeAction}
                  fields={{}}
                  trigger={<><RefreshCw aria-hidden />Generate new code</>}
                  title="Generate a new join code?"
                  description="The current code will stop working immediately. Existing residents are not affected."
                  confirmLabel="Generate new code"
                  confirmVariant="primary"
                  size="md"
                />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Your profile" description={user.email} />
            <CardBody>
              <ProfileForm name={user.name} phone={user.phone} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Change password" />
            <CardBody>
              <PasswordForm />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
