import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ClipboardList } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser, homePathFor } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { safeRedirectPath, firstParam } from "@/lib/validation";
import { demoLoginAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));

  const params = await searchParams;
  const next = safeRedirectPath(firstParam(params.next), "");
  const demo = isDemoMode();

  return (
    <div>
      <h1 className="text-[26px] font-bold tracking-tight sm:text-[28px]">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted">Sign in to report and track maintenance issues.</p>

      {demo ? (
        <section aria-labelledby="demo-heading" className="mt-6 rounded-[12px] border border-accent/30 bg-accent-soft p-4">
          <h2 id="demo-heading" className="text-sm font-semibold text-ink">Explore the demo</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            One-click access to the fictional Greenview Residency. Demo mode is enabled on this deployment.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <form action={demoLoginAction}>
              <input type="hidden" name="role" value="RESIDENT" />
              <button
                type="submit"
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-line bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-muted"
              >
                <ClipboardList className="size-4 text-accent" aria-hidden />
                Resident demo
              </button>
            </form>
            <form action={demoLoginAction}>
              <input type="hidden" name="role" value="MANAGER" />
              <button
                type="submit"
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-line bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-muted"
              >
                <Building2 className="size-4 text-accent" aria-hidden />
                Manager demo
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        <LoginForm next={next} />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        New resident?{" "}
        <Link href="/register" className="font-semibold text-secondary hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-3 text-center text-[13px] text-muted">
        Forgot your password? Ask your society manager to help you regain access.
      </p>
    </div>
  );
}
