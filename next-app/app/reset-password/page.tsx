import { ResetPasswordScreen } from "@/features/auth/components/reset-password-screen";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    code?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return <ResetPasswordScreen code={resolvedSearchParams?.code} />;
}
