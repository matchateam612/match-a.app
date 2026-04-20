import { AuthShell } from "./auth-shell";
import { AuthForm } from "./auth-form";
import type { AuthMode } from "../lib/auth-types";

type AuthScreenProps = {
  initialMessage?: string;
  mode: AuthMode;
};

export function AuthScreen({ initialMessage, mode }: AuthScreenProps) {
  return (
    <AuthShell mode={mode}>
      <AuthForm initialMessage={initialMessage} mode={mode} />
    </AuthShell>
  );
}
