"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { useToast } from "@/components/ui/toast";

/**
 * useActionState plus a toast for every result. The toast is raised inside the action
 * wrapper (not in an effect), so it still appears when the form unmounts on success —
 * e.g. the feedback form disappears as soon as feedback exists.
 */
export function useToastAction(
  action: (state: ActionState, formData: FormData) => Promise<ActionState>,
  { onSuccess }: { onSuccess?: () => void } = {},
) {
  const toast = useToast();
  return useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.message) toast(result.message, result.ok ? "success" : "error");
    if (result.ok) onSuccess?.();
    return result;
  }, initialActionState);
}
