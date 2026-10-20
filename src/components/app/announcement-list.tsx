import { Megaphone } from "lucide-react";
import { formatDate } from "@/lib/utils";

export type AnnouncementItem = {
  id: string;
  title: string;
  message: string;
  publishedAt: Date;
  expiresAt: Date | null;
  author: { name: string };
};

export function AnnouncementList({ items, compact = false }: { items: AnnouncementItem[]; compact?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((a) => (
        <li key={a.id} className="flex gap-3 px-4 py-4 sm:px-6">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-accent-soft text-accent">
            <Megaphone className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-ink">{a.title}</h3>
            <p className={compact ? "mt-0.5 line-clamp-2 text-sm text-muted" : "mt-1 whitespace-pre-line text-sm text-ink"}>
              {a.message}
            </p>
            <p className="mt-1.5 text-[12px] text-muted">
              {formatDate(a.publishedAt)} · {a.author.name}
              {a.expiresAt ? ` · until ${formatDate(a.expiresAt)}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
