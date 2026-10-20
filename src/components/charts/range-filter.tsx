"use client";

import Form from "next/form";
import { useRef, useState } from "react";
import { Input, Select } from "@/components/ui/form";
import { buttonVariants } from "@/components/ui/button";
import { RANGE_OPTIONS } from "@/lib/date-range";

/** Date-range control for analytics; a GET form so the range lives in the URL. */
export function RangeFilter({ range, from, to }: { range: string; from?: string; to?: string }) {
  const [value, setValue] = useState(range);
  const ref = useRef<HTMLFormElement>(null);
  return (
    <Form ref={ref} action="/manager/analytics" className="flex flex-wrap items-end gap-2" aria-label="Analytics date range">
      <div>
        <label htmlFor="range" className="mb-1 block text-[12px] font-medium text-muted">Period</label>
        <Select
          id="range"
          name="range"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (e.target.value !== "custom") requestAnimationFrame(() => ref.current?.requestSubmit());
          }}
          className="w-44"
        >
          {RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>
      {value === "custom" ? (
        <>
          <div>
            <label htmlFor="from" className="mb-1 block text-[12px] font-medium text-muted">From</label>
            <Input id="from" name="from" type="date" defaultValue={from} required className="w-40" />
          </div>
          <div>
            <label htmlFor="to" className="mb-1 block text-[12px] font-medium text-muted">To</label>
            <Input id="to" name="to" type="date" defaultValue={to} required className="w-40" />
          </div>
          <button type="submit" className={buttonVariants()}>Apply</button>
        </>
      ) : null}
    </Form>
  );
}
