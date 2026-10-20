"use client";

import { useEffect } from "react";
import type { ActionState } from "@/lib/action-state";
import { useToast } from "@/components/ui/toast";

/** Shows a toast whenever a server action returns a new result. */
export function useActionToast(state: ActionState, { onSuccess }: { onSuccess?: () => void } = {}) {
  const toast = useToast();
  useEffect(() => {
    if (!state.at || !state.message) return;
    toast(state.message, state.ok ? "success" : "error");
    if (state.ok) onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per action result
  }, [state.at]);
}
