"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { hashToken, requireManager, requireUser } from "@/lib/auth";
import { CATEGORIES, SESSION_COOKIE } from "@/lib/constants";
import {
  announcementSchema,
  passwordChangeSchema,
  profileSchema,
  societySettingsSchema,
} from "@/lib/validation";
import { changePassword, updateProfile } from "../services/accounts";
import {
  createAnnouncement,
  deleteAnnouncement,
  regenerateJoinCode,
  setAnnouncementActive,
  setResidentActive,
  updateSocietySettings,
} from "../services/community";
import { markAllNotificationsRead, markNotificationRead } from "../services/notifications";
import { failure, formValues, success, toActor, validationFailure, type ActionState } from "./helpers";

// ------------------------------------------------------------------ Notifications

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) await markNotificationRead(toActor(user), id);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const count = await markAllNotificationsRead(toActor(user));
  revalidatePath("/", "layout");
  return success(count ? `Marked ${count} notification${count === 1 ? "" : "s"} as read.` : "You're all caught up.");
}

// ------------------------------------------------------------------ Announcements

export async function createAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireManager();
  const values = formValues(formData, ["title", "message", "publishedAt", "expiresAt"]);
  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    message: formData.get("message"),
    publishedAt: formData.get("publishedAt") ?? undefined,
    expiresAt: formData.get("expiresAt") ?? undefined,
  });
  if (!parsed.success) return validationFailure(parsed.error, values);
  try {
    await createAnnouncement(toActor(user), parsed.data);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/manager/announcements");
  revalidatePath("/resident", "layout");
  return success("Announcement published to residents.");
}

export async function toggleAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireManager();
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";
  try {
    await setAnnouncementActive(toActor(user), id, isActive);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/manager/announcements");
  revalidatePath("/resident", "layout");
  return success(isActive ? "Announcement is now visible to residents." : "Announcement hidden from residents.");
}

export async function deleteAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireManager();
  try {
    await deleteAnnouncement(toActor(user), String(formData.get("id") ?? ""));
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/manager/announcements");
  revalidatePath("/resident", "layout");
  return success("Announcement deleted.");
}

// ------------------------------------------------------------------ Residents

export async function setResidentActiveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireManager();
  const isActive = formData.get("isActive") === "true";
  try {
    await setResidentActive(toActor(user), String(formData.get("residentId") ?? ""), isActive);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/manager/residents");
  return success(isActive ? "Resident account reactivated." : "Resident account deactivated and signed out.");
}

// ------------------------------------------------------------------ Settings and profile

export async function updateSocietyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireManager();
  const keys = ["name", "description", "locality", "address", "contactEmail", "contactPhone"];
  const values = formValues(formData, keys);
  const parsed = societySettingsSchema.safeParse({
    ...values,
    enabledCategories: formData.getAll("enabledCategories").filter((v) => CATEGORIES.includes(v as never)),
  });
  if (!parsed.success) return validationFailure(parsed.error, values);
  try {
    await updateSocietySettings(toActor(user), parsed.data);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/", "layout");
  return success("Society settings saved.");
}

export async function regenerateJoinCodeAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const user = await requireManager();
  const code = await regenerateJoinCode(toActor(user));
  revalidatePath("/manager/settings");
  return success(`New join code generated: ${code}. The old code no longer works.`);
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const values = formValues(formData, ["name", "phone"]);
  // Only name and phone are read from the form. Any role, societyId or email fields are ignored.
  const parsed = profileSchema.safeParse({ name: formData.get("name"), phone: formData.get("phone") ?? undefined });
  if (!parsed.success) return validationFailure(parsed.error, values);
  try {
    await updateProfile(toActor(user), parsed.data);
  } catch (error) {
    return failure(error, values);
  }
  revalidatePath("/", "layout");
  return success("Profile updated.");
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  try {
    await changePassword(toActor(user), parsed.data, token ? hashToken(token) : undefined);
  } catch (error) {
    return failure(error);
  }
  return success("Password changed. Other devices have been signed out.");
}
