import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy information" updated="20 October 2026">
      <h2>What we collect</h2>
      <ul>
        <li>Account details: name, email address, unit number and (optionally) phone number.</li>
        <li>Complaint details you submit: category, title, description, location, priority and optional photos.</li>
        <li>Comments, feedback ratings and in-app notifications related to your complaints.</li>
        <li>A session cookie that keeps you signed in. We do not use advertising or tracking cookies.</li>
      </ul>
      <h2>How it is used</h2>
      <p>
        Your information is used only to operate the maintenance desk for your housing society: routing complaints to
        your society&apos;s managers, showing progress, and producing aggregate reports for the management committee.
      </p>
      <h2>Who can see it</h2>
      <ul>
        <li>You can see your own complaints, public replies and society announcements.</li>
        <li>Managers of your society can see complaints raised in that society and the resident directory.</li>
        <li>Residents never see other residents&apos; complaints or managers&apos; internal notes.</li>
        <li>People in other societies cannot see your society&apos;s data.</li>
      </ul>
      <h2>Security</h2>
      <p>
        Passwords are stored only as bcrypt hashes. Sessions use secure, httpOnly cookies. Access rules are enforced on
        the server for every request.
      </p>
      <h2>Messages</h2>
      <p>
        The prototype sends in-app notifications only. It does not send email, SMS or WhatsApp messages.
      </p>
      <h2>Your choices</h2>
      <p>
        You can update your name and phone number on your profile page. To correct other details or close your account,
        contact your society manager.
      </p>
    </LegalPage>
  );
}
