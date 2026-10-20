"use client";

import { useActionState, useState, type ReactNode } from "react";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { SubmitButton } from "./submit-button";
import { useToast } from "./toast";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

/**
 * A button that asks for confirmation in an accessible dialog before running a server action.
 * Hidden `fields` are posted with the form.
 */
export function ConfirmAction({
  action,
  fields,
  trigger,
  triggerVariant = "outline",
  title,
  description,
  confirmLabel,
  confirmVariant = "danger",
  size = "sm",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  trigger: ReactNode;
  triggerVariant?: Variant;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  confirmVariant?: Variant;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  // Toast from inside the action: the row holding this button may disappear on success.
  const [, formAction] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.message) toast(result.message, result.ok ? "success" : "error");
    if (result.ok) setOpen(false);
    return result;
  }, initialActionState);

  return (
    <>
      <Button variant={triggerVariant} size={size} onClick={() => setOpen(true)}>
        {trigger}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title} description={description}>
        <form action={formAction} className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <SubmitButton variant={confirmVariant} pendingText="Working…">
            {confirmLabel}
          </SubmitButton>
        </form>
      </Dialog>
    </>
  );
}
