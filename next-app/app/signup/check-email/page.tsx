import { redirect } from "next/navigation";

import { CheckEmailScreen } from "@/features/auth/components/check-email-screen";

type CheckEmailPageProps = {
  searchParams?: Promise<{
    email?: string;
  }>;
};

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const email = resolvedSearchParams?.email;

  if (!email) {
    redirect("/signup");
  }

  return <CheckEmailScreen email={email} />;
}
