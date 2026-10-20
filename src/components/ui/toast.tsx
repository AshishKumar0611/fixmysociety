"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { FLASH_COOKIE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<{ toast: (message: string, tone?: Tone) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx.toast;
}

/** Reads (and clears) a one-time flash message set by a server action before redirecting. */
function readFlash(): { message: string; tone: Tone } | null {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${FLASH_COOKIE}=`));
  if (!match) return null;
  document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/`;
  try {
    // The value may be URL-encoded more than once depending on how the cookie was serialised.
    let raw = match.slice(FLASH_COOKIE.length + 1);
    for (let i = 0; i < 3 && raw.includes("%"); i++) raw = decodeURIComponent(raw);
    const value = JSON.parse(raw);
    if (typeof value?.message === "string") return { message: value.message, tone: value.tone ?? "success" };
  } catch {
    /* ignore malformed cookie */
  }
  return null;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pathname = usePathname();

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  useEffect(() => {
    // Defer so the flash is read after the new route has committed.
    const timer = window.setTimeout(() => {
      const flash = readFlash();
      if (flash) toast(flash.message, flash.tone);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, toast]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6"
      >
        {toasts.map((t) => {
          const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? XCircle : Info;
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[12px] border bg-surface p-3.5 text-sm shadow-[var(--shadow-raised)] animate-[toast-in_180ms_ease-out]",
                t.tone === "success" && "border-success/30",
                t.tone === "error" && "border-error/30",
                t.tone === "info" && "border-info/30",
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  t.tone === "success" && "text-success",
                  t.tone === "error" && "text-error",
                  t.tone === "info" && "text-info",
                )}
              />
              <p className="flex-1 text-ink">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="-m-1 rounded-md p-1 text-muted hover:bg-neutral-soft hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
