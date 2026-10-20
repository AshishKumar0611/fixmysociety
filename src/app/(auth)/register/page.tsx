import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser, homePathFor } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));
  return (
    <div>
      <h1 className="text-[26px] font-bold tracking-tight sm:text-[28px]">Create your resident account</h1>
      <p className="mt-1.5 text-sm text-muted">
        You&apos;ll need the join code from your society manager. Manager accounts are set up by FixMySociety.
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-secondary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
