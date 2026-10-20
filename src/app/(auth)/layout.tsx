import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between bg-navy p-10 text-white lg:flex">
        <Logo inverted showTagline />
        <div>
          <h2 className="text-[30px] font-bold leading-tight tracking-tight">Report it. Track it. Resolve it.</h2>
          <ul className="mt-6 space-y-3 text-white/80">
            {[
              "Raise maintenance complaints in under a minute",
              "Follow every status change on a clear timeline",
              "Managers see priorities, workloads and trends",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#7FD8D1]" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[13px] text-white/55">
          <Link href="/privacy" className="hover:text-white">Privacy</Link> ·{" "}
          <Link href="/terms" className="hover:text-white">Terms</Link>
        </p>
      </aside>
      <main id="main" className="flex flex-col bg-surface">
        <div className="flex items-center justify-between p-4 sm:p-6 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
