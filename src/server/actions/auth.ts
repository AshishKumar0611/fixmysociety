"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  burnPasswordCheck,
  createSession,
  destroySession,
  hashPassword,
  homePathFor,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/env";
import { loginSchema, registerSchema, safeRedirectPath } from "@/lib/validation";
import { clearFailures, isLocked, RATE_LIMIT, recordFailure, registerResident } from "../services/accounts";
import { failure, formValues, setFlash, validationFailure, type ActionState } from "./helpers";

const GENERIC_LOGIN_ERROR = "Incorrect email or password.";

async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData, ["email"]);
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return validationFailure(parsed.error, values);

  const { email, password } = parsed.data;
  const emailKey = `email:${email}`;
  const ipKey = `ip:${await clientIp()}`;

  const lockedUntil = await isLocked([emailKey, ipKey]);
  if (lockedUntil) {
    const minutes = Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 60000));
    return { ok: false, message: `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`, values, at: Date.now() };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, passwordHash: true, isActive: true },
  });
  const valid = user ? await verifyPassword(password, user.passwordHash) : await burnPasswordCheck(password);

  if (!user || !valid || !user.isActive) {
    await recordFailure(emailKey, RATE_LIMIT.maxPerEmail);
    await recordFailure(ipKey, RATE_LIMIT.maxPerIp);
    // Same message whether the email exists, the password is wrong, or the account is deactivated.
    return { ok: false, message: GENERIC_LOGIN_ERROR, values, at: Date.now() };
  }

  await clearFailures(emailKey);
  await createSession(user.id);
  const next = safeRedirectPath(formData.get("next"), homePathFor(user.role));
  const target = next.startsWith(user.role === "MANAGER" ? "/manager" : "/resident") ? next : homePathFor(user.role);
  redirect(target);
}

const DEMO_ACCOUNTS = {
  RESIDENT: "resident@greenview.demo",
  MANAGER: "manager@greenview.demo",
} as const;

/** One-click demo sign-in. Only works when DEMO_MODE="true" is explicitly configured. */
export async function demoLoginAction(formData: FormData) {
  if (!isDemoMode()) redirect("/login");
  const role = formData.get("role") === "MANAGER" ? "MANAGER" : "RESIDENT";
  const user = await prisma.user.findUnique({
    where: { email: DEMO_ACCOUNTS[role] },
    select: { id: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) {
    await setFlash("Demo data is not loaded. Run `npm run db:seed` first.", "error");
    redirect("/login");
  }
  await createSession(user.id);
  redirect(homePathFor(user.role));
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData, ["name", "email", "joinCode", "unitNumber"]);
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    joinCode: formData.get("joinCode"),
    unitNumber: formData.get("unitNumber"),
  });
  if (!parsed.success) return validationFailure(parsed.error, values);

  let userId: string;
  try {
    const user = await registerResident({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      joinCode: parsed.data.joinCode,
      unitNumber: parsed.data.unitNumber,
    });
    userId = user.id;
  } catch (error) {
    return failure(error, values);
  }
  await createSession(userId);
  await setFlash("Welcome to FixMySociety! Your resident account is ready.");
  redirect("/resident/dashboard");
}

export async function logoutAction() {
  await destroySession();
  await setFlash("You have been signed out.", "info");
  redirect("/login");
}
