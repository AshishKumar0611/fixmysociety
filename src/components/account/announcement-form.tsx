"use client";

import { useRef } from "react";
import { Send } from "lucide-react";
import { Field, Input, Textarea, describedBy } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToastAction } from "@/components/complaints/use-action-toast";
import { createAnnouncementAction } from "@/server/actions/community";

export function AnnouncementForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [state, formAction] = useToastAction(createAnnouncementAction, { onSuccess: () => ref.current?.reset() });
  const err = (k: string) => (state.ok ? undefined : state.fieldErrors?.[k]?.[0]);
  const v = state.ok ? {} : (state.values ?? {});

  return (
    <form ref={ref} action={formAction} className="space-y-4" noValidate>
      <Field id="a-title" label="Title" error={err("title")} required>
        <Input id="a-title" name="title" maxLength={120} required defaultValue={v.title} invalid={!!err("title")} aria-describedby={describedBy("a-title", err("title"))} placeholder="e.g. Water supply interruption on Friday" />
      </Field>
      <Field id="a-message" label="Message" error={err("message")} required>
        <Textarea id="a-message" name="message" rows={4} maxLength={2000} required defaultValue={v.message} invalid={!!err("message")} aria-describedby={describedBy("a-message", err("message"))} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="a-published" label="Publish on" error={err("publishedAt")} hint="Leave blank to publish now">
          <Input id="a-published" name="publishedAt" type="date" defaultValue={v.publishedAt} invalid={!!err("publishedAt")} aria-describedby={describedBy("a-published", err("publishedAt"), "hint")} />
        </Field>
        <Field id="a-expires" label="Expires on" error={err("expiresAt")} hint="Hidden from residents after this date">
          <Input id="a-expires" name="expiresAt" type="date" defaultValue={v.expiresAt} invalid={!!err("expiresAt")} aria-describedby={describedBy("a-expires", err("expiresAt"), "hint")} />
        </Field>
      </div>
      <SubmitButton pendingText="Publishing…">
        <Send aria-hidden />
        Publish announcement
      </SubmitButton>
    </form>
  );
}
