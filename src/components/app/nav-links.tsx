"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { managerNav, residentNav, type NavItem } from "./nav-config";

export type NavVariant = "resident" | "manager";

function isActive(pathname: string, item: NavItem) {
  if (item.exact) {
    // "My Complaints" stays active on detail pages but not on the "Raise Complaint" page.
    return pathname === item.href || (pathname.startsWith(`${item.href}/`) && !pathname.endsWith("/new"));
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function UnreadDot({ count, compact }: { count: number; compact?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "flex min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[11px] font-bold leading-5 text-white",
        compact && "absolute -right-1 -top-1 min-w-4 px-1 text-[10px] leading-4",
      )}
      aria-label={`${count} unread`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Full-width sidebar / drawer navigation. */
export function SidebarNav({ variant, unread, onNavigate }: { variant: NavVariant; unread: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = variant === "manager" ? managerNav : residentNav;
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-[8px] px-3 text-sm font-medium transition-colors duration-150",
                active ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon className={cn("size-[18px] shrink-0", active ? "text-[#7FD8D1]" : "")} aria-hidden />
              <span className="flex-1">{item.label}</span>
              {item.href.endsWith("/notifications") ? <UnreadDot count={unread} /> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Compact icon-and-label rail for tablet widths. */
export function RailNav({ variant, unread }: { variant: NavVariant; unread: number }) {
  const pathname = usePathname();
  const items = variant === "manager" ? managerNav : residentNav;
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[8px] px-1 py-2 text-[11px] font-medium leading-tight transition-colors duration-150",
                active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white",
              )}
            >
              <span className="relative">
                <Icon className={cn("size-5", active ? "text-[#7FD8D1]" : "")} aria-hidden />
                {item.href.endsWith("/notifications") ? <UnreadDot count={unread} compact /> : null}
              </span>
              <span className="text-center">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Bottom tab bar on phones with the most-used destinations. */
export function BottomNav({ variant, unread }: { variant: NavVariant; unread: number }) {
  const pathname = usePathname();
  const items = (variant === "manager" ? managerNav : residentNav).filter((i) => i.mobile);
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          const label = item.label.replace("My Complaints", "Complaints").replace("Raise Complaint", "Raise");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-primary dark:text-secondary" : "text-muted",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden />
                  {item.href.endsWith("/notifications") ? <UnreadDot count={unread} compact /> : null}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
