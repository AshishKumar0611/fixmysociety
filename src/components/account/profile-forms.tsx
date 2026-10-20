"use client";

import { useActionState, useRef } from "react";
import { KeyRound, Save } from "lucide-react";
import { Field, Input, describedBy } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionToast } from "@/components/complaints/use-action-toast";
import { initialActionState } from "@/lib/action-state";
import { changePasswordAction, updateProfileAction } from "@/server/actions/community";

export function ProfileForm({ name, phone }: { name: string; phone: string | null }) {
  const [state, formAction] = useActionState(updateProfileAction, initialActionState);
  useActionToast(state);
  const err = (k: string) => (state.ok ? undefined : state.fieldErrors?.[k]?.[0]);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field id="name" label="Full name" error={err("name")} required>
        <Input id="name" name="name" defaultValue={state.values?.name ?? name} required autoComplete="name" invalid={!!err("name")} aria-describedby={describedBy("name", err("name"))} />
      </Field>
      <Field id="phone" label="Phone number" error={err("phone")} hint="Used only by your society team">
        <Input id="phone" name="phone" type="tel" defaultValue={state.values?.phone ?? phone ?? ""} autoComplete="tel" invalid={!!err("phone")} aria-describedby={describedBy("phone", err("phone"), "hint")} placeholder="+91 98xxx xxxxx" />
      </Field>
      <SubmitButton pendingText="Saving…">
        <Save aria-hidden />
        Save changes
      </SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initialActionState);
  const ref = useRef<HTMLFormElement>(null);
  useActionToast(state, { onSuccess: () => ref.current?.reset() });
  const err = (k: string) => (state.ok ? undefined : state.fieldErrors?.[k]?.[0]);
  return (
    <form ref={ref} action={formAction} className="space-y-4" noValidate>
      <Field id="currentPassword" label="Current password" error={err("currentPassword")} required>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required invalid={!!err("currentPassword")} aria-describedby={describedBy("currentPassword", err("currentPassword"))} />
      </Field>
      <Field id="newPassword" label="New password" error={err("newPassword")} hint="At least 8 characters with a letter and a number" required>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required invalid={!!err("newPassword")} aria-describedby={describedBy("newPassword", err("newPassword"), "hint")} />
      </Field>
      <Field id="confirmPassword" label="Confirm new password" error={err("confirmPassword")} required>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required invalid={!!err("confirmPassword")} aria-describedby={describedBy("confirmPassword", err("confirmPassword"))} />
      </Field>
      <SubmitButton variant="outline" pendingText="Updating…">
        <KeyRound aria-hidden />
        Change password
      </SubmitButton>
    </form>
  );
}
