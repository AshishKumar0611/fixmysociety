import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComplaintDetailView } from "@/components/complaints/complaint-detail";
import { AssignForm, StatusUpdateForm } from "@/components/complaints/manager-actions";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireManager } from "@/lib/auth";
import { nextStatuses } from "@/lib/workflow";
import { toActor } from "@/server/actions/helpers";
import { getComplaintDetail, listManagers } from "@/server/services/complaints";

export const metadata: Metadata = { title: "Manage complaint" };

export default async function ManagerComplaintPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireManager();
  const actor = toActor(user);
  const { id } = await params;
  // Complaints from other societies return null → 404.
  const [complaint, managers] = await Promise.all([getComplaintDetail(actor, id), listManagers(actor)]);
  if (!complaint) notFound();
  const canAssign = complaint.status !== "RESOLVED" && complaint.status !== "CLOSED";

  return (
    <ComplaintDetailView
      complaint={complaint}
      viewerRole="MANAGER"
      backHref="/manager/complaints"
      backLabel="Back to complaint queue"
      sidePanel={
        <>
          <Card className="border-secondary/30">
            <CardHeader title="Update status" description="The resident is notified in the app." />
            <CardBody>
              <StatusUpdateForm complaintId={complaint.id} current={complaint.status} allowed={nextStatuses(complaint.status)} />
            </CardBody>
          </Card>
          {canAssign ? (
            <Card>
              <CardHeader title="Assignment" description={complaint.assignedManager ? `Currently: ${complaint.assignedManager.name}` : "Not yet assigned"} />
              <CardBody>
                <AssignForm complaintId={complaint.id} managers={managers} currentId={complaint.assignedManager?.id ?? null} />
              </CardBody>
            </Card>
          ) : null}
        </>
      }
    />
  );
}
