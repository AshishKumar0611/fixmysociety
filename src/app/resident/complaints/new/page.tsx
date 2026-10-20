import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { ComplaintForm } from "@/components/complaints/complaint-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireResident } from "@/lib/auth";
import { toActor } from "@/server/actions/helpers";
import { getSociety } from "@/server/services/community";
import { parseEnabledCategories } from "@/server/services/complaints";

export const metadata: Metadata = { title: "Raise a complaint" };

export default async function NewComplaintPage() {
  const user = await requireResident();
  const society = await getSociety(toActor(user));
  const categories = parseEnabledCategories(society.enabledCategories);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/resident/complaints" className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Back to my complaints
      </Link>
      <PageHeader title="Raise a complaint" description={`Report a maintenance issue to the ${society.name} management team.`} />
      <Card className="p-4 sm:p-6">
        <ComplaintForm categories={categories} submissionKey={randomUUID()} />
      </Card>
      <p className="mt-4 flex items-start gap-2 text-[13px] text-muted">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        For emergencies such as fire, gas leaks or exposed live wires, call 112 and the security desk first, then log the issue here.
      </p>
    </div>
  );
}
