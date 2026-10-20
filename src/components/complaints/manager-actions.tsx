"use client";

import { useState } from "react";
import { RefreshCw, UserCheck } from "lucide-react";
import type { ComplaintStatus } from "@prisma/client";
import { Field, Select, Textarea, describedBy } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState } from "@/lib/action-state";
import { STATUS_LABELS } from "@/lib/constants";
import { assignComplaintAction, updateStatusAction } from "@/server/actions/complaints";
import { useToastAction } from "./use-action-toast";

export function StatusUpdateForm({
  complaintId,
  current,
  allowed,
}: {
  complaintId: string;
  current: ComplaintStatus;
  allowed: ComplaintStatus[];
}) {
  const [state, formAction] = useToastAction(updateStatusAction);

  if (allowed.length === 0) {
    return <p className="text-sm text-muted">This complaint is {STATUS_LABELS[current].toLowerCase()}. No further status changes are possible.</p>;
  }
  // React resets a form after its action runs. Remounting the fields for every result keeps
  // the visible selection and the submitted value in sync (and restores what the user typed).
  return (
    <StatusFields
      key={state.at ?? "initial"}
      state={state}
      formAction={formAction}
      complaintId={complaintId}
      current={current}
      allowed={allowed}
    />
  );
}

function StatusFields({
  state,
  formAction,
  complaintId,
  current,
  allowed,
}: {
  state: ActionState;
  formAction: (formData: FormData) => void;
  complaintId: string;
  current: ComplaintStatus;
  allowed: ComplaintStatus[];
}) {
  const previous = !state.ok ? (state.values?.status as ComplaintStatus | undefined) : undefined;
  const [status, setStatus] = useState<ComplaintStatus | "">(previous && allowed.includes(previous) ? previous : "");
  const err = (k: string) => (state.ok ? undefined : state.fieldErrors?.[k]?.[0]);
  const v = state.ok ? {} : (state.values ?? {});
  const resolving = status === "RESOLVED";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="complaintId" value={complaintId} />
      <Field id="status" label="New status" error={err("status")} required>
        <Select
          id="status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
          required
          invalid={!!err("status")}
          aria-describedby={describedBy("status", err("status"))}
        >
          <option value="" disabled>
            Choose new status
          </option>
          {allowed.map((s) => (
            <option key={s} value={s}>
              {current === "RESOLVED" && s === "IN_PROGRESS" ? "Reopen (In Progress)" : STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </Field>
      {resolving ? (
        <Field
          id="resolutionNote"
          label="Resolution note"
          error={err("resolutionNote")}
          hint="Visible to the resident. Explain what was fixed."
          required
        >
          <Textarea
            id="resolutionNote"
            name="resolutionNote"
            rows={4}
            maxLength={1000}
            required
            defaultValue={v.resolutionNote}
            placeholder="e.g. Replaced the faulty washer and tested for leaks."
            invalid={!!err("resolutionNote")}
            aria-describedby={describedBy("resolutionNote", err("resolutionNote"), "hint")}
          />
        </Field>
      ) : (
        <Field id="note" label="Update note" error={err("note")} hint="Shown on the resident's timeline.">
          <Textarea
            id="note"
            name="note"
            rows={3}
            maxLength={1000}
            defaultValue={v.note}
            placeholder="e.g. Plumber scheduled for tomorrow morning."
            invalid={!!err("note")}
            aria-describedby={describedBy("note", err("note"), "hint")}
          />
        </Field>
      )}
      <SubmitButton className="w-full" pendingText="Updating…" disabled={!status}>
        <RefreshCw aria-hidden />
        {resolving ? "Mark as resolved" : "Update status"}
      </SubmitButton>
    </form>
  );
}

export function AssignForm({
  complaintId,
  managers,
  currentId,
}: {
  complaintId: string;
  managers: { id: string; name: string }[];
  currentId: string | null;
}) {
  const [state, formAction] = useToastAction(assignComplaintAction);
  const err = state.ok ? undefined : state.fieldErrors?.managerId?.[0];
  return (
    <form action={formAction} className="space-y-3" noValidate>
      <input type="hidden" name="complaintId" value={complaintId} />
      <Field id="managerId" label="Assign to" error={err} required>
        <Select id="managerId" name="managerId" defaultValue={currentId ?? ""} invalid={!!err} aria-describedby={describedBy("managerId", err)}>
          <option value="" disabled>
            Choose a manager
          </option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </Field>
      <SubmitButton variant="outline" className="w-full" pendingText="Assigning…">
        <UserCheck aria-hidden />
        {currentId ? "Reassign" : "Assign"}
      </SubmitButton>
    </form>
  );
}
