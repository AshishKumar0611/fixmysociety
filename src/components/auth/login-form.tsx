"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Field, FormMessage, Input, describedBy } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { loginAction } from "@/server/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(loginAction, initialActionState);
  const [show, setShow] = useState(false);
  const err = (k: string) => state.fieldErrors?.[k]?.[0];

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && !state.ok ? <FormMessage>{state.message}</FormMessage> : null}
      <input type="hidden" name="next" value={next} />
      <Field id="email" label="Email address" error={err("email")} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.values?.email}
          invalid={!!err("email")}
          aria-describedby={describedBy("email", err("email"))}
          placeholder="you@example.com"
        />
      </Field>
      <Field id="password" label="Password" error={err("password")} required>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            invalid={!!err("password")}
            aria-describedby={describedBy("password", err("password"))}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
      </Field>
      <SubmitButton className="w-full" pendingText="Signing in…">
        <LogIn aria-hidden />
        Sign in
      </SubmitButton>
    </form>
  );
}
