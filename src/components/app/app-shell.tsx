import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { cn, initials } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth";
import { Logo, LogoMark } from "../brand";
import { MobileDrawer } from "./mobile-drawer";
import { BottomNav, RailNav, SidebarNav, type NavVariant } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

function LogoutButton({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={cn(
          "flex min-h-11 w-full items-center gap-3 rounded-[8px] px-3 text-sm font-medium transition-colors",
          tone === "dark"
            ? "text-white/75 hover:bg-white/8 hover:text-white"
            : "text-muted hover:bg-neutral-soft hover:text-ink",
        )}
      >
        <LogOut className="size-[18px]" aria-hidden />
        Sign out
      </button>
    </form>
  );
}

/**
 * Shared authenticated layout:
 * - ≥1024px: 248px sidebar with labels;
 * - 768–1023px: compact navigation rail;
 * - <768px: header with drawer menu plus a bottom tab bar.
 */
export function AppShell({
  user,
  unread,
  children,
}: {
  user: SessionUser;
  unread: number;
  children: React.ReactNode;
}) {
  const variant: NavVariant = user.role === "MANAGER" ? "manager" : "resident";
  const home = variant === "manager" ? "/manager/dashboard" : "/resident/dashboard";
  const roleLabel = variant === "manager" ? "Society Manager" : `Resident${user.unitNumber ? ` · ${user.unitNumber}` : ""}`;

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-ink focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-navy text-white lg:flex">
        <div className="px-5 pb-4 pt-5">
          <Logo href={home} inverted showTagline />
        </div>
        <div className="mx-3 mb-3 rounded-[10px] bg-white/6 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/55">Society</p>
          <p className="truncate text-sm font-semibold">{user.society.name}</p>
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3">
          <SidebarNav variant={variant} unread={unread} />
        </nav>
        <div className="border-t border-white/10 p-3">
          <LogoutButton tone="dark" />
        </div>
      </aside>

      {/* Tablet rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[88px] flex-col items-stretch bg-navy py-4 text-white md:flex lg:hidden">
        <Link href={home} className="mx-auto mb-4 rounded-lg" aria-label="FixMySociety home">
          <LogoMark inverted />
        </Link>
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-2">
          <RailNav variant={variant} unread={unread} />
        </nav>
      </aside>

      <div className="md:pl-[88px] lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-2 px-4 sm:px-6 lg:px-8">
            <MobileDrawer
              variant={variant}
              unread={unread}
              societyName={user.society.name}
              footer={<LogoutButton tone="dark" />}
            />
            <Link href={home} className="flex items-center gap-2 rounded-lg md:hidden" aria-label="FixMySociety home">
              <LogoMark className="size-8" />
              <span className="text-[15px] font-bold">FixMySociety</span>
            </Link>
            <p className="hidden truncate text-sm text-muted md:block lg:hidden">{user.society.name}</p>
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <Link
                href={`/${variant}/notifications`}
                className="relative flex size-11 items-center justify-center rounded-[8px] text-muted hover:bg-neutral-soft hover:text-ink"
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
              >
                <Bell className="size-5" aria-hidden />
                {unread > 0 ? (
                  <span className="absolute right-2 top-2 flex min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-4 text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Link>
              <Link
                href={variant === "manager" ? "/manager/settings" : "/resident/profile"}
                className="ml-1 flex items-center gap-2.5 rounded-[8px] p-1 pr-2 hover:bg-neutral-soft"
                aria-label={`Account: ${user.name}`}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-secondary-soft text-[13px] font-bold text-secondary">
                  {initials(user.name)}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block max-w-40 truncate text-sm font-semibold text-ink">{user.name}</span>
                  <span className="block text-[12px] text-muted">{roleLabel}</span>
                </span>
              </Link>
              <form action={logoutAction} className="hidden md:block lg:hidden">
                <button
                  type="submit"
                  className="flex size-11 items-center justify-center rounded-[8px] text-muted hover:bg-neutral-soft hover:text-ink"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="size-5" aria-hidden />
                </button>
              </form>
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-[1280px] px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>

      <BottomNav variant={variant} unread={unread} />
    </div>
  );
}
