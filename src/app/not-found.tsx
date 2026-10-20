import Link from "next/link";
import { SearchX } from "lucide-react";
import { LogoMark } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-[70dvh] flex-col items-center justify-center px-4 py-16 text-center">
      <LogoMark className="mb-6 size-12" />
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary-soft text-secondary">
        <SearchX className="size-6" aria-hidden />
      </div>
      <h1 className="text-[26px] font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-muted">
        This page doesn&apos;t exist, or you don&apos;t have permission to view it.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Go to homepage
        </Link>
        <Link href="/login" className={buttonVariants()}>
          Go to my dashboard
        </Link>
      </div>
    </main>
  );
}
