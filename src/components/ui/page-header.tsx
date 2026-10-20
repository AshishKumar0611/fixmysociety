import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-[13px] font-medium text-muted">{eyebrow}</p> : null}
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-ink sm:text-[28px] lg:text-[30px]">
          {title}
        </h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted sm:text-[15px]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
