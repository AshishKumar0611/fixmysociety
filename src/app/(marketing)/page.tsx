import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  SearchX,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { KpiCard } from "@/components/app/kpi-card";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { ComplaintPriority, ComplaintStatus } from "@prisma/client";

// Refresh daily so the footer year and any copy changes stay current without a redeploy.
export const revalidate = 86400;

const previewRows: { id: string; title: string; status: ComplaintStatus; priority: ComplaintPriority }[] = [
  { id: "GVR-1011", title: "Lift making grinding noise", status: "OPEN", priority: "HIGH" },
  { id: "GVR-1006", title: "Main gate CCTV not recording", status: "IN_PROGRESS", priority: "HIGH" },
  { id: "GVR-1008", title: "Broken swing in play area", status: "ASSIGNED", priority: "LOW" },
  { id: "GVR-1003", title: "Corridor lights not working", status: "RESOLVED", priority: "NORMAL" },
];

function ProductPreview() {
  return (
    <div className="relative" aria-label="Preview of the FixMySociety manager dashboard with sample data" role="img">
      <div className="rounded-[14px] border border-line bg-surface shadow-[var(--shadow-raised)]">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
          <span className="size-2.5 rounded-full bg-[#F04438]/70" />
          <span className="size-2.5 rounded-full bg-[#F79009]/70" />
          <span className="size-2.5 rounded-full bg-[#12B76A]/70" />
          <span className="ml-3 text-[12px] font-medium text-muted">Manager dashboard · sample data</span>
        </div>
        <div className="space-y-3 bg-page p-3 sm:p-4" aria-hidden>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Open" value={3} icon={ClipboardList} tone="info" className="p-3 sm:p-4" />
            <KpiCard label="Resolved" value={6} icon={CheckCircle2} tone="success" className="p-3 sm:p-4" />
          </div>
          <div className="rounded-[12px] border border-line bg-surface">
            <p className="border-b border-line px-4 py-2.5 text-[13px] font-semibold">Complaint queue</p>
            <ul className="divide-y divide-line">
              {previewRows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="font-mono text-[12px] font-semibold text-secondary">{r.id}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{r.title}</span>
                  <span className="hidden sm:inline-flex">
                    <PriorityBadge priority={r.priority} />
                  </span>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const problems = [
  {
    icon: MessagesSquare,
    title: "Complaints get lost in conversations",
    body: "Requests sent by phone calls and busy messaging groups are easily buried, forgotten or duplicated.",
  },
  {
    icon: SearchX,
    title: "Residents don't know the status",
    body: "Without a single place to check, residents have to chase the office repeatedly for updates.",
  },
  {
    icon: Clock,
    title: "Managers can't see what's unresolved",
    body: "It is hard to prioritise urgent work or spot recurring problems without an organised record.",
  },
];

const features = [
  {
    icon: ClipboardList,
    title: "Centralized complaint reporting",
    body: "Residents raise issues with a category, location, priority and an optional photo — every request gets a unique ID.",
  },
  {
    icon: Eye,
    title: "Transparent status tracking",
    body: "A timeline shows every status change with who made it and when, plus in-app notifications at each step.",
  },
  {
    icon: Wrench,
    title: "Better maintenance coordination",
    body: "Managers assign complaints, keep private internal notes, and record a resolution note before closing work.",
  },
  {
    icon: BarChart3,
    title: "Performance reporting",
    body: "Live dashboards show resolution rate, average resolution time, category trends and resident ratings.",
  },
];

const steps = [
  { icon: MessageSquare, title: "Resident reports an issue", body: "A short form captures what is wrong, where, and how urgent it is." },
  { icon: Wrench, title: "Manager reviews and updates it", body: "The team assigns the work, updates the status and adds a resolution note." },
  { icon: Bell, title: "Resident tracks the outcome", body: "The resident follows progress in real time and rates the fix once resolved." },
];

const plans = [
  {
    name: "Starter",
    price: "Free trial",
    period: "",
    body: "Try the full workflow with your management committee before committing.",
    points: ["Complaint reporting and tracking", "Resident and manager accounts", "Announcements"],
  },
  {
    name: "Society Basic",
    price: "₹499",
    period: "/month",
    body: "For smaller societies that want an organised complaint desk.",
    points: ["Everything in Starter", "Status timeline and notifications", "Resident directory"],
    featured: true,
  },
  {
    name: "Society Plus",
    price: "₹999",
    period: "/month",
    body: "For larger communities that need reporting and oversight.",
    points: ["Everything in Basic", "Analytics and CSV export", "Multiple managers and assignment"],
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section id="top" className="scroll-mt-16 overflow-hidden bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-[13px] font-semibold text-accent">
              <ShieldCheck className="size-4" aria-hidden />
              Report it. Track it. Resolve it.
            </p>
            <h1 className="mt-5 text-[32px] font-bold leading-[1.1] tracking-tight text-ink sm:text-[42px] lg:text-[50px]">
              Maintenance Issues, Finally Under Control.
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[17px]">
              Report residential maintenance issues, track progress, and help your community resolve problems with
              greater transparency.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login?demo=1" className={buttonVariants({ size: "lg" })}>
                Explore the Demo
                <ArrowRight aria-hidden />
              </Link>
              <Link href="#how-it-works" className={buttonVariants({ variant: "outline", size: "lg" })}>
                See How It Works
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-muted">Built for housing societies, RWAs and apartment managers in India.</p>
          </div>
          <ProductPreview />
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-line bg-page py-16 sm:py-20" aria-labelledby="problem-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 id="problem-heading" className="text-[26px] font-bold tracking-tight sm:text-[32px]">
              Small Problems Shouldn&apos;t Become Big Frustrations.
            </h2>
            <p className="mt-3 text-muted">
              A leaking pipe or a broken light is simple to fix — when the right person knows about it and someone keeps track.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {problems.map((p) => (
              <div key={p.title} className="rounded-[12px] border border-line bg-surface p-6">
                <span className="flex size-10 items-center justify-center rounded-[10px] bg-error-soft text-error">
                  <p.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 bg-surface py-16 sm:py-20" aria-labelledby="features-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-accent">Features</p>
            <h2 id="features-heading" className="mt-2 text-[26px] font-bold tracking-tight sm:text-[32px]">
              One place for every maintenance request
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4 rounded-[12px] border border-line p-6">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-secondary-soft text-primary dark:text-secondary">
                  <f.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 border-y border-line bg-page py-16 sm:py-20" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-accent">How it works</p>
            <h2 id="how-heading" className="mt-2 text-[26px] font-bold tracking-tight sm:text-[32px]">
              Three steps from problem to resolution
            </h2>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="relative rounded-[12px] border border-line bg-surface p-6">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                  {i + 1}
                </span>
                <h3 className="mt-4 flex items-center gap-2 text-base font-semibold">
                  <s.icon className="size-4 text-accent" aria-hidden />
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Business */}
      <section id="societies" className="scroll-mt-16 bg-surface py-16 sm:py-20" aria-labelledby="societies-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-wide text-accent">For housing societies</p>
              <h2 id="societies-heading" className="mt-2 text-[26px] font-bold tracking-tight sm:text-[32px]">
                A simple subscription for your management committee
              </h2>
              <p className="mt-3 text-muted">
                FixMySociety is offered as B2B subscription software. The society subscribes; residents use it at no cost.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  { icon: ClipboardList, text: "A complete record of every complaint and how it was handled" },
                  { icon: Users, text: "Fewer follow-up calls because residents can check progress themselves" },
                  { icon: Megaphone, text: "Announcements that reach every resident in one place" },
                  { icon: BarChart3, text: "Evidence for committee meetings: workloads, trends and response times" },
                ].map((b) => (
                  <li key={b.text} className="flex gap-3">
                    <b.icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                    <span>{b.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="grid gap-4 md:grid-cols-3">
                {plans.map((p) => (
                  <div
                    key={p.name}
                    className={
                      p.featured
                        ? "rounded-[12px] border-2 border-primary bg-surface p-5 dark:border-secondary"
                        : "rounded-[12px] border border-line bg-surface p-5"
                    }
                  >
                    <h3 className="text-base font-semibold">{p.name}</h3>
                    <p className="mt-3">
                      <span className="text-[28px] font-bold tracking-tight">{p.price}</span>
                      <span className="text-sm text-muted">{p.period}</span>
                    </p>
                    <p className="mt-2 text-[13px] text-muted">{p.body}</p>
                    <ul className="mt-4 space-y-2 text-[13px]">
                      {p.points.map((pt) => (
                        <li key={pt} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-[8px] bg-info-soft px-4 py-3 text-[13px] text-info">
                Proposed pricing for validation. These prices are early hypotheses being tested with housing societies, not
                final market prices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-page pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-start gap-6 rounded-[14px] bg-navy px-6 py-10 text-white sm:px-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[24px] font-bold tracking-tight sm:text-[28px]">See FixMySociety in action</h2>
              <p className="mt-2 max-w-xl text-white/75">
                Explore the demo as a resident or as a society manager using the fictional Greenview Residency.
              </p>
            </div>
            <Link href="/login?demo=1" className={buttonVariants({ variant: "accent", size: "lg" })}>
              Explore the Demo
              <ArrowRight aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
