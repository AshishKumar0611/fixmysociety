import Link from "next/link";
import { Logo } from "../brand";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo inverted showTagline />
          <p className="mt-4 max-w-sm text-sm text-white/70">
            Report it. Track it. Resolve it. A maintenance management platform for housing societies and resident welfare associations.
          </p>
        </div>
        <nav aria-label="Product">
          <h2 className="text-sm font-semibold">Product</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li><Link className="hover:text-white" href="/#features">Features</Link></li>
            <li><Link className="hover:text-white" href="/#how-it-works">How It Works</Link></li>
            <li><Link className="hover:text-white" href="/#societies">For Housing Societies</Link></li>
          </ul>
        </nav>
        <nav aria-label="Account and legal">
          <h2 className="text-sm font-semibold">Account &amp; legal</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li><Link className="hover:text-white" href="/login">Sign In</Link></li>
            <li><Link className="hover:text-white" href="/register">Get Started</Link></li>
            <li><Link className="hover:text-white" href="/privacy">Privacy</Link></li>
            <li><Link className="hover:text-white" href="/terms">Terms</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-[13px] text-white/60 sm:px-6">
          © {year} FixMySociety. A student entrepreneurship project. All demo data is fictional.
        </p>
      </div>
    </footer>
  );
}
