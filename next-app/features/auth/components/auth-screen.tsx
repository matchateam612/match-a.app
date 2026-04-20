import { AuthShell } from "./auth-shell";
import { AuthForm } from "./auth-form";
import type { AuthMode } from "../lib/auth-types";

type AuthScreenProps = {
  mode: AuthMode;
};

export function AuthScreen({ mode }: AuthScreenProps) {
  return (
    <AuthShell mode={mode}>
      <AuthForm mode={mode} />
    </AuthShell>
  );
}
