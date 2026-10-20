"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { Field, FormMessage, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";
import { submitFeedbackAction } from "@/server/actions/complaints";
import { useActionToast } from "./use-action-toast";

const LABELS = ["", "Very poor", "Poor", "Okay", "Good", "Excellent"];

export function FeedbackForm({ complaintId }: { complaintId: string }) {
  const [state, formAction] = useActionState(submitFeedbackAction, initialActionState);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  useActionToast(state);
  const err = state.ok ? undefined : state.fieldErrors?.rating?.[0];
  const shown = hover || rating;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && !state.ok && !state.fieldErrors ? <FormMessage>{state.message}</FormMessage> : null}
      <input type="hidden" name="complaintId" value={complaintId} />
      <fieldset>
        <legend className="text-sm font-semibold text-ink">How satisfied are you with the resolution?</legend>
        <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-md p-1 has-focus-visible:outline-2 has-focus-visible:outline-focus" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name="rating"
                value={n}
                className="sr-only"
                checked={rating === n}
                onChange={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""} — ${LABELS[n]}`}
              />
              <Star
                className={cn("size-8 transition-colors duration-150", n <= shown ? "fill-[#F5A524] text-[#F5A524]" : "text-line")}
                aria-hidden
              />
            </label>
          ))}
          <span className="ml-2 text-sm text-muted" aria-live="polite">
            {shown ? LABELS[shown] : "Choose a rating"}
          </span>
        </div>
        {err ? (
          <p className="mt-1 text-[13px] text-error" role="alert">
            {err}
          </p>
        ) : null}
      </fieldset>
      <Field id="feedback-comment" label="Comments">
        <Textarea id="feedback-comment" name="comment" rows={3} maxLength={500} placeholder="What went well, or what could be better?" />
      </Field>
      <SubmitButton pendingText="Submitting…">Submit feedback</SubmitButton>
    </form>
  );
}
