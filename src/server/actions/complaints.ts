"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager, requireResident, requireUser } from "@/lib/auth";
import { validateImageUpload } from "@/lib/uploads";
import {
  assignSchema,
  commentSchema,
  complaintSchema,
  feedbackSchema,
  statusUpdateSchema,
} from "@/lib/validation";
import {
  addComment,
  assignComplaint,
  createComplaint,
  submitFeedback,
  updateComplaintStatus,
} from "../services/complaints";
import {
  failure,
  formValues,
  setFlash,
  success,
  toActor,
  validationFailure,
  type ActionState,
} from "./helpers";

const COMPLAINT_FIELDS = ["category", "title", "description", "location", "priority", "preferredContact"];

function revalidateComplaint(id: string) {
  revalidatePath(`/resident/complaints/${id}`);
  revalidatePath(`/manager/complaints/${id}`);
  revalidatePath("/resident", "layout");
  revalidatePath("/manager", "layout");
}

export async function createComplaintAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireResident();
  const values = formValues(formData, COMPLAINT_FIELDS);

  const parsed = complaintSchema.safeParse({
    category: formData.get("category") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    priority: formData.get("priority") || undefined,
    preferredContact: formData.get("preferredContact") || undefined,
    submissionKey: formData.get("submissionKey") || undefined,
  });
  if (!parsed.success) return validationFailure(parsed.error, values);

  const photo = await validateImageUpload(formData.get("photo"));
  if (!photo.ok) {
    return { ok: false, message: photo.error, fieldErrors: { photo: [photo.error] }, values, at: Date.now() };
  }

  let result: { id: string; complaintNumber: string; duplicate: boolean };
  try {
    result = await createComplaint(toActor(user), parsed.data, photo.image ?? undefined);
  } catch (error) {
    return failure(error, values);
  }

  revalidatePath("/resident", "layout");
  revalidatePath("/manager", "layout");
  await setFlash(
    result.duplicate
      ? `Complaint ${result.complaintNumber} was already submitted.`
      : `Complaint ${result.complaintNumber} submitted. We'll keep you updated.`,
  );
  redirect(`/resident/complaints/${result.id}`);
}

export async function addCommentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = commentSchema.safeParse({
    complaintId: formData.get("complaintId"),
    body: formData.get("body"),
    isInternal: formData.get("isInternal") ?? undefined,
  });
  if (!parsed.success) return validationFailure(parsed.error, formValues(formData, ["body"]));
  try {
    await addComment(toActor(user), parsed.data);
  } catch (error) {
    return failure(error, formValues(formData, ["body"]));
  }
  revalidateComplaint(parsed.data.complaintId);
  return success(parsed.data.isInternal && user.role === "MANAGER" ? "Internal note added." : "Comment posted.");
}

export async function submitFeedbackAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireResident();
  const values = formValues(formData, ["rating", "comment"]);
  const parsed = feedbackSchema.safeParse({
    complaintId: formData.get("complaintId"),
    rating: formData.get("rating") ?? undefined,
    comment: formData.get("comment") ?? undefined,
  });
  if (!parsed.success) return validationFailure(parsed.error, values);
  try {
    await submitFeedback(toActor(user), parsed.data);
  } catch (error) {
    return failure(error, values);
  }
  revalidateComplaint(parsed.data.complaintId);
  return success("Thank you for your feedback!");
}

export async function updateStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireManager();
  const values = formValues(formData, ["status", "note", "resolutionNote"]);
  const parsed = statusUpdateSchema.safeParse({
    complaintId: formData.get("complaintId"),
    status: formData.get("status") || undefined,
    note: formData.get("note") ?? undefined,
    resolutionNote: formData.get("resolutionNote") ?? undefined,
  });
  if (!parsed.success) return validationFailure(parsed.error, values);
  try {
    await updateComplaintStatus(toActor(user), parsed.data);
  } catch (error) {
    return failure(error, values);
  }
  revalidateComplaint(parsed.data.complaintId);
  return success("Status updated and the resident has been notified in the app.");
}

export async function assignComplaintAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireManager();
  const parsed = assignSchema.safeParse({
    complaintId: formData.get("complaintId"),
    managerId: formData.get("managerId") || "",
  });
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    await assignComplaint(toActor(user), parsed.data);
  } catch (error) {
    return failure(error);
  }
  revalidateComplaint(parsed.data.complaintId);
  return success("Complaint assigned.");
}
