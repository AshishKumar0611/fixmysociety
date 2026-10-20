"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { LogoMark } from "../brand";
import { SidebarNav, type NavVariant } from "./nav-links";

/** Slide-in navigation drawer for phones, built on <dialog> for focus trapping and Escape support. */
export function MobileDrawer({
  variant,
  unread,
  societyName,
  footer,
}: {
  variant: NavVariant;
  unread: number;
  societyName: string;
  footer: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-11 items-center justify-center rounded-[8px] text-ink hover:bg-neutral-soft md:hidden"
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <Menu className="size-6" aria-hidden />
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
        aria-label="Navigation menu"
        className="m-0 h-dvh max-h-dvh w-[min(86vw,300px)] max-w-none bg-navy p-0 text-white"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <LogoMark inverted className="size-8" />
              <div className="min-w-0">
                <p className="text-[15px] font-bold">FixMySociety</p>
                <p className="truncate text-[12px] text-white/65">{societyName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex size-11 items-center justify-center rounded-[8px] text-white/80 hover:bg-white/10"
              aria-label="Close navigation menu"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto p-3">
            <SidebarNav variant={variant} unread={unread} onNavigate={() => setOpen(false)} />
          </nav>
          <div className="border-t border-white/10 p-3">{footer}</div>
        </div>
      </dialog>
    </>
  );
}
