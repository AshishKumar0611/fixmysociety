export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-ink [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-[15px]">
        <h1 className="text-[28px] font-bold tracking-tight sm:text-[32px]">{title}</h1>
        <p className="!mt-2 !text-sm !text-muted">Last updated: {updated}</p>
        <div className="mt-4 rounded-[8px] bg-warning-soft px-4 py-3 text-sm text-warning">
          FixMySociety is a student entrepreneurship project. This page describes how the prototype handles data; it is
          not legal advice and has not been reviewed by a lawyer.
        </div>
        {children}
      </article>
    </div>
  );
}
