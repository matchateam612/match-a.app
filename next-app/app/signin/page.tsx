import { AUTH_SUCCESS_MESSAGES } from "@/features/auth/lib/auth-routes";
import { AuthScreen } from "@/features/auth/components/auth-screen";

type SignInPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const message = resolvedSearchParams?.message;
  const initialMessage =
    message === "password-reset-success"
      ? AUTH_SUCCESS_MESSAGES.passwordResetSuccess
      : message === "email-verified"
        ? AUTH_SUCCESS_MESSAGES.emailVerified
        : "";

  return <AuthScreen mode="signin" initialMessage={initialMessage} />;
}
