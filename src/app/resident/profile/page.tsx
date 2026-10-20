import type { Metadata } from "next";
import { PasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireResident } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile" };

export default async function ResidentProfilePage() {
  const user = await requireResident();
  return (
    <>
      <PageHeader title="Your profile" description="Manage your personal details and password." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account details" description="Society, unit and email are managed by your society team." />
          <CardBody>
            <dl className="mb-6 grid gap-4 rounded-[10px] bg-surface-muted p-4 sm:grid-cols-2">
              <div>
                <dt className="text-[12px] font-medium uppercase tracking-wide text-muted">Email</dt>
                <dd className="mt-1 break-all text-sm text-ink">{user.email}</dd>
              </div>
              <div>
                <dt className="text-[12px] font-medium uppercase tracking-wide text-muted">Society</dt>
                <dd className="mt-1 text-sm text-ink">{user.society.name}</dd>
              </div>
              <div>
                <dt className="text-[12px] font-medium uppercase tracking-wide text-muted">Unit number</dt>
                <dd className="mt-1 text-sm text-ink">{user.unitNumber ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[12px] font-medium uppercase tracking-wide text-muted">Role</dt>
                <dd className="mt-1 text-sm text-ink">Resident</dd>
              </div>
            </dl>
            <ProfileForm name={user.name} phone={user.phone} />
          </CardBody>
        </Card>
        <Card className="self-start">
          <CardHeader title="Change password" description="Changing your password signs out your other devices." />
          <CardBody>
            <PasswordForm />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
