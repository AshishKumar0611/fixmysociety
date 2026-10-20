"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { ImagePlus, Send, Trash2 } from "lucide-react";
import type { ComplaintCategory } from "@prisma/client";
import { Field, FormMessage, Input, Select, Textarea, describedBy } from "@/components/ui/form";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import {
  ALLOWED_IMAGE_TYPES,
  CATEGORY_LABELS,
  CONTACT_LABELS,
  CONTACT_METHODS,
  MAX_UPLOAD_BYTES,
  PRIORITIES,
  PRIORITY_LABELS,
} from "@/lib/constants";
import { complaintSchema, fieldErrorsOf, type FieldErrors } from "@/lib/validation";
import { createComplaintAction } from "@/server/actions/complaints";

const PRIORITY_HINTS = {
  LOW: "Cosmetic or can wait a week",
  NORMAL: "Needs attention in a few days",
  HIGH: "Affects daily life — fix soon",
  URGENT: "Safety risk or no water/power",
} as const;

export function ComplaintForm({ categories, submissionKey }: { categories: ComplaintCategory[]; submissionKey: string }) {
  const [state, formAction] = useActionState(createComplaintAction, initialActionState);
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const errors = clientErrors ?? state.fieldErrors ?? {};
  const err = (k: string) => (k === "photo" ? photoError ?? errors.photo?.[0] : errors[k]?.[0]);
  const v = state.values ?? {};

  useEffect(() => {
    // After a server-side rejection, move focus to the first invalid field.
    if (state.fieldErrors) focusFirstError(formRef.current, state.fieldErrors);
  }, [state]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = complaintSchema.safeParse({
      ...data,
      category: data.category || undefined,
      submissionKey: data.submissionKey || undefined,
    });
    if (!parsed.success || photoError) {
      e.preventDefault();
      const fe = parsed.success ? {} : fieldErrorsOf(parsed.error);
      setClientErrors(fe);
      focusFirstError(e.currentTarget, fe);
      return;
    }
    setClientErrors(null);
  }

  function onPhotoChange(file: File | undefined) {
    setPhotoError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (!file) return;
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setPhotoError("Only JPEG, PNG or WebP photos are allowed.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setPhotoError("Photos must be 2 MB or smaller.");
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    if (fileRef.current) fileRef.current.value = "";
    onPhotoChange(undefined);
  }

  return (
    <form
      ref={formRef}
      key={state.at ?? "initial"}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      className="space-y-5"
      aria-describedby="form-required-note"
    >
      <p id="form-required-note" className="text-[13px] text-muted">
        Fields marked <span className="text-error">*</span> are required.
      </p>
      {state.message && !state.ok ? <FormMessage>{state.message}</FormMessage> : null}
      <input type="hidden" name="submissionKey" value={submissionKey} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="category" label="Category" error={err("category")} required>
          <Select
            id="category"
            name="category"
            defaultValue={v.category ?? ""}
            required
            invalid={!!err("category")}
            aria-describedby={describedBy("category", err("category"))}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="location" label="Location" error={err("location")} hint="Tower, flat or common area" required>
          <Input
            id="location"
            name="location"
            defaultValue={v.location}
            required
            maxLength={120}
            placeholder="e.g. Tower A, Flat A-101, kitchen"
            invalid={!!err("location")}
            aria-describedby={describedBy("location", err("location"), "hint")}
          />
        </Field>
      </div>

      <Field id="title" label="Title" error={err("title")} hint="A short summary, 5–100 characters" required>
        <Input
          id="title"
          name="title"
          defaultValue={v.title}
          required
          maxLength={100}
          placeholder="e.g. Kitchen sink leaking under the cabinet"
          invalid={!!err("title")}
          aria-describedby={describedBy("title", err("title"), "hint")}
        />
      </Field>

      <Field
        id="description"
        label="Description"
        error={err("description")}
        hint="What is wrong, since when, and anything the team should know before visiting."
        required
      >
        <Textarea
          id="description"
          name="description"
          defaultValue={v.description}
          required
          maxLength={2000}
          rows={5}
          placeholder="Describe the issue in a few sentences…"
          invalid={!!err("description")}
          aria-describedby={describedBy("description", err("description"), "hint")}
        />
      </Field>

      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold text-ink sm:text-sm">Priority</legend>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {PRIORITIES.map((p) => (
            <label
              key={p}
              className="flex cursor-pointer flex-col rounded-[8px] border border-line bg-surface px-3 py-2.5 transition-colors has-checked:border-secondary has-checked:bg-secondary-soft has-focus-visible:outline-2 has-focus-visible:outline-focus"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  defaultChecked={(v.priority || "NORMAL") === p}
                  className="size-4 accent-[var(--primary)]"
                />
                <span className="text-sm font-semibold text-ink">{PRIORITY_LABELS[p]}</span>
              </span>
              <span className="mt-0.5 pl-6 text-[12px] text-muted">{PRIORITY_HINTS[p]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="preferredContact" label="Preferred contact method" hint="How the team should reach you if needed">
          <Select id="preferredContact" name="preferredContact" defaultValue={v.preferredContact || "IN_APP"} aria-describedby="preferredContact-hint">
            {CONTACT_METHODS.map((m) => (
              <option key={m} value={m}>
                {CONTACT_LABELS[m]}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="photo" label="Photo" error={err("photo")} hint="JPEG, PNG or WebP, up to 2 MB">
          <div>
            <label
              htmlFor="photo"
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[8px] border border-dashed border-line bg-surface-muted px-3 py-2 text-sm text-muted hover:border-secondary hover:text-ink"
            >
              <ImagePlus className="size-4" aria-hidden />
              {preview ? "Change photo" : "Attach a photo"}
            </label>
            <input
              ref={fileRef}
              id="photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => onPhotoChange(e.target.files?.[0])}
              aria-describedby={describedBy("photo", err("photo"), "hint")}
            />
            {preview ? (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                <img src={preview} alt="Selected photo preview" className="size-16 rounded-[8px] border border-line object-cover" />
                <button type="button" onClick={removePhoto} className="inline-flex min-h-9 items-center gap-1 text-[13px] font-semibold text-error hover:underline">
                  <Trash2 className="size-3.5" aria-hidden />
                  Remove
                </button>
              </div>
            ) : null}
          </div>
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <Link href="/resident/complaints" className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
        <SubmitButton pendingText="Submitting…">
          <Send aria-hidden />
          Submit complaint
        </SubmitButton>
      </div>
    </form>
  );
}

function focusFirstError(form: HTMLFormElement | null, errors: FieldErrors) {
  const first = Object.keys(errors).find((k) => errors[k]?.length);
  if (!form || !first) return;
  const el = form.querySelector<HTMLElement>(`[name="${first}"]`);
  el?.focus();
}
