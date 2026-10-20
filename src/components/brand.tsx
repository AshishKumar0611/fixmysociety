import Link from "next/link";
import { cn } from "@/lib/utils";

/** House-and-checkmark logo mark. */
export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden focusable="false">
      <rect width="40" height="40" rx="10" fill={inverted ? "rgb(255 255 255 / 0.12)" : "#17324D"} />
      <path
        d="M9.5 19.2 20 10.5l10.5 8.7"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 17.6V29a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V17.6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m15.8 23.4 3 3 5.6-6"
        fill="none"
        stroke="#3CC4BA"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  showTagline = false,
  className,
  inverted = false,
}: {
  href?: string;
  showTagline?: boolean;
  className?: string;
  inverted?: boolean;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-lg", className)} aria-label="FixMySociety home">
      <LogoMark inverted={inverted} />
      <span className="flex flex-col leading-none">
        <span className={cn("text-[17px] font-bold tracking-tight", inverted ? "text-white" : "text-ink")}>
          Fix<span className={inverted ? "text-[#7FD8D1]" : "text-accent"}>My</span>Society
        </span>
        {showTagline ? (
          <span className={cn("mt-1 text-[11px] font-medium", inverted ? "text-white/70" : "text-muted")}>
            Your Community. Better Managed.
          </span>
        ) : null}
      </span>
    </Link>
  );
}
