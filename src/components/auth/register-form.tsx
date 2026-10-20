"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { Field, FormMessage, Input, describedBy } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { registerAction } from "@/server/actions/auth";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialActionState);
  const err = (k: string) => state.fieldErrors?.[k]?.[0];
  const v = state.values ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && !state.ok ? <FormMessage>{state.message}</FormMessage> : null}
      <Field id="name" label="Full name" error={err("name")} required>
        <Input id="name" name="name" autoComplete="name" required defaultValue={v.name} invalid={!!err("name")} aria-describedby={describedBy("name", err("name"))} />
      </Field>
      <Field id="email" label="Email address" error={err("email")} required>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={v.email} invalid={!!err("email")} aria-describedby={describedBy("email", err("email"))} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="joinCode" label="Society join code" error={err("joinCode")} hint="From your manager" required>
          <Input id="joinCode" name="joinCode" autoCapitalize="characters" required defaultValue={v.joinCode} invalid={!!err("joinCode")} aria-describedby={describedBy("joinCode", err("joinCode"), "From your manager")} placeholder="e.g. GREEN2026" />
        </Field>
        <Field id="unitNumber" label="Flat / unit number" error={err("unitNumber")} required>
          <Input id="unitNumber" name="unitNumber" required defaultValue={v.unitNumber} invalid={!!err("unitNumber")} aria-describedby={describedBy("unitNumber", err("unitNumber"))} placeholder="e.g. B-204" />
        </Field>
      </div>
      <Field id="password" label="Password" error={err("password")} hint="At least 8 characters, including a letter and a number." required>
        <Input id="password" name="password" type="password" autoComplete="new-password" required invalid={!!err("password")} aria-describedby={describedBy("password", err("password"), "hint")} />
      </Field>
      <Field id="confirmPassword" label="Confirm password" error={err("confirmPassword")} required>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required invalid={!!err("confirmPassword")} aria-describedby={describedBy("confirmPassword", err("confirmPassword"))} />
      </Field>
      <SubmitButton className="w-full" pendingText="Creating account…">
        <UserPlus aria-hidden />
        Create account
      </SubmitButton>
      <p className="text-center text-[12px] text-muted">
        By creating an account you agree to the <a className="underline" href="/terms">terms</a> and{" "}
        <a className="underline" href="/privacy">privacy information</a>.
      </p>
    </form>
  );
}
