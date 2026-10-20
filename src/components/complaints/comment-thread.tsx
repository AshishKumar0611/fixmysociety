"use client";

import { useActionState, useRef } from "react";
import { Lock, MessageSquare, Send } from "lucide-react";
import type { Role } from "@prisma/client";
import { Field, Textarea, describedBy } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { cn, initials } from "@/lib/utils";
import { addCommentAction } from "@/server/actions/complaints";
import { useActionToast } from "./use-action-toast";

export type CommentItem = {
  id: string;
  body: string;
  isInternal: boolean;
  when: string;
  author: { id: string; name: string; role: Role };
};

export function CommentThread({
  complaintId,
  comments,
  viewerRole,
  canComment,
}: {
  complaintId: string;
  comments: CommentItem[];
  viewerRole: Role;
  canComment: boolean;
}) {
  const [state, formAction] = useActionState(addCommentAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, { onSuccess: () => formRef.current?.reset() });
  const err = state.ok ? undefined : state.fieldErrors?.body?.[0];
  const isManager = viewerRole === "MANAGER";

  return (
    <div>
      {comments.length === 0 ? (
        <p className="flex items-center gap-2 px-4 py-6 text-sm text-muted sm:px-6">
          <MessageSquare className="size-4" aria-hidden />
          No comments yet.
        </p>
      ) : (
        <ul className="space-y-4 px-4 py-4 sm:px-6">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
                  c.author.role === "MANAGER" ? "bg-secondary-soft text-secondary" : "bg-accent-soft text-accent",
                )}
                aria-hidden
              >
                {initials(c.author.name)}
              </span>
              <div
                className={cn(
                  "min-w-0 flex-1 rounded-[10px] border px-3.5 py-2.5",
                  c.isInternal ? "border-warning/30 bg-warning-soft" : "border-line bg-surface-muted",
                )}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold text-ink">{c.author.name}</span>
                  <span className="text-[12px] text-muted">{c.author.role === "MANAGER" ? "Manager" : "Resident"}</span>
                  {c.isInternal ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-warning">
                      <Lock className="size-3" aria-hidden />
                      Internal note — not visible to residents
                    </span>
                  ) : null}
                  <span className="text-[12px] text-muted">· {c.when}</span>
                </div>
                <p className="mt-1 whitespace-pre-line break-words text-sm text-ink">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canComment ? (
        <form ref={formRef} action={formAction} className="space-y-3 border-t border-line px-4 py-4 sm:px-6" noValidate>
          <input type="hidden" name="complaintId" value={complaintId} />
          <Field id="comment-body" label={isManager ? "Add a reply or internal note" : "Add a comment"} error={err} required>
            <Textarea
              id="comment-body"
              name="body"
              rows={3}
              maxLength={1000}
              required
              placeholder={isManager ? "Write an update for the resident, or tick ‘Internal note’…" : "Add more details or ask a question…"}
              invalid={!!err}
              aria-describedby={describedBy("comment-body", err)}
            />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {isManager ? (
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
                <input type="checkbox" name="isInternal" className="size-4 accent-[var(--warning)]" />
                <Lock className="size-3.5 text-warning" aria-hidden />
                Internal note (managers only)
              </label>
            ) : (
              <span />
            )}
            <SubmitButton variant="outline" pendingText="Posting…">
              <Send aria-hidden />
              Post
            </SubmitButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}
