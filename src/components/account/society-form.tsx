"use client";

import { Save } from "lucide-react";
import type { ComplaintCategory } from "@prisma/client";
import { Field, Input, Textarea, describedBy } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToastAction } from "@/components/complaints/use-action-toast";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { updateSocietyAction } from "@/server/actions/community";

type Society = {
  name: string;
  description: string | null;
  locality: string | null;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

export function SocietyForm({ society, enabled }: { society: Society; enabled: ComplaintCategory[] }) {
  const [state, formAction] = useToastAction(updateSocietyAction);
  const err = (k: string) => (state.ok ? undefined : state.fieldErrors?.[k]?.[0]);
  const val = (k: keyof Society) => (state.ok ? undefined : state.values?.[k]) ?? society[k] ?? "";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field id="s-name" label="Society name" error={err("name")} required>
        <Input id="s-name" name="name" required defaultValue={val("name")} invalid={!!err("name")} aria-describedby={describedBy("s-name", err("name"))} />
      </Field>
      <Field id="s-description" label="Description" error={err("description")}>
        <Textarea id="s-description" name="description" rows={3} maxLength={500} defaultValue={val("description")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="s-locality" label="Locality" error={err("locality")}>
          <Input id="s-locality" name="locality" defaultValue={val("locality")} />
        </Field>
        <Field id="s-address" label="Address" error={err("address")}>
          <Input id="s-address" name="address" defaultValue={val("address")} />
        </Field>
        <Field id="s-email" label="Contact email" error={err("contactEmail")}>
          <Input id="s-email" name="contactEmail" type="email" defaultValue={val("contactEmail")} invalid={!!err("contactEmail")} aria-describedby={describedBy("s-email", err("contactEmail"))} />
        </Field>
        <Field id="s-phone" label="Contact phone" error={err("contactPhone")}>
          <Input id="s-phone" name="contactPhone" type="tel" defaultValue={val("contactPhone")} invalid={!!err("contactPhone")} aria-describedby={describedBy("s-phone", err("contactPhone"))} />
        </Field>
      </div>
      <fieldset aria-describedby={err("enabledCategories") ? "cat-error" : "cat-hint"}>
        <legend className="text-sm font-semibold text-ink">Complaint categories</legend>
        <p id="cat-hint" className="text-[13px] text-muted">Residents can only choose enabled categories. Existing complaints are not affected.</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <label key={c} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[8px] border border-line px-3 text-sm has-checked:border-secondary has-checked:bg-secondary-soft">
              <input type="checkbox" name="enabledCategories" value={c} defaultChecked={enabled.includes(c)} className="size-4 accent-[var(--primary)]" />
              {CATEGORY_LABELS[c]}
            </label>
          ))}
        </div>
        {err("enabledCategories") ? (
          <p id="cat-error" role="alert" className="mt-1 text-[13px] text-error">{err("enabledCategories")}</p>
        ) : null}
      </fieldset>
      <SubmitButton pendingText="Saving…">
        <Save aria-hidden />
        Save settings
      </SubmitButton>
    </form>
  );
}
