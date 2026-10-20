import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="20 October 2026">
      <h2>About this service</h2>
      <p>
        FixMySociety is a prototype maintenance management application developed for an entrepreneurship assignment. It
        is provided as-is for demonstration and evaluation.
      </p>
      <h2>Accounts</h2>
      <ul>
        <li>Residents register with a join code provided by their society manager.</li>
        <li>You are responsible for keeping your password confidential.</li>
        <li>Managers may deactivate accounts that misuse the service.</li>
      </ul>
      <h2>Acceptable use</h2>
      <ul>
        <li>Submit genuine maintenance issues relating to your residential society.</li>
        <li>Do not upload offensive content, other people&apos;s personal data, or files that are not photos of the issue.</li>
        <li>Do not attempt to access data belonging to other residents or societies.</li>
      </ul>
      <h2>Emergencies</h2>
      <p>
        FixMySociety is not an emergency service. For fire, gas leaks, electrical hazards or medical emergencies, contact
        the relevant emergency services (112 in India) and your society security desk immediately.
      </p>
      <h2>Demo data</h2>
      <p>All people, flats and societies shown in the demo are fictional.</p>
      <h2>Pricing</h2>
      <p>
        Prices shown on the website are proposals being validated for the assignment. No payments are collected by this
        prototype.
      </p>
    </LegalPage>
  );
}
