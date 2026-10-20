import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComplaintDetailView } from "@/components/complaints/complaint-detail";
import { FeedbackForm } from "@/components/complaints/feedback-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireResident } from "@/lib/auth";
import { isFeedbackEligible } from "@/lib/workflow";
import { toActor } from "@/server/actions/helpers";
import { getComplaintDetail } from "@/server/services/complaints";

export const metadata: Metadata = { title: "Complaint details" };

export default async function ResidentComplaintPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireResident();
  const { id } = await params;
  // Returns null for other residents' complaints, so they get a 404 rather than a hint that it exists.
  const complaint = await getComplaintDetail(toActor(user), id);
  if (!complaint) notFound();

  const canRate = isFeedbackEligible(complaint.status) && !complaint.feedback;

  return (
    <ComplaintDetailView
      complaint={complaint}
      viewerRole="RESIDENT"
      backHref="/resident/complaints"
      backLabel="Back to my complaints"
      feedbackSlot={
        canRate ? (
          <Card className="border-secondary/30">
            <CardHeader title="Rate this resolution" description="Your feedback helps the management team improve." />
            <CardBody>
              <FeedbackForm complaintId={complaint.id} />
            </CardBody>
          </Card>
        ) : null
      }
    />
  );
}
