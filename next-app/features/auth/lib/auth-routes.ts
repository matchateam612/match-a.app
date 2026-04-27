export const AUTH_SUCCESS_MESSAGES = {
  passwordResetSuccess: "Your password has been updated. Sign in with the new password.",
  forgotPasswordEmailSent:
    "If that email can receive a reset link, we've sent password recovery instructions.",
  emailVerificationResent:
    "Confirmation email sent again. Check your inbox for the latest verification link.",
  emailVerificationReady:
    "Account created. Check your inbox to confirm your email before signing in.",
  emailVerified:
    "Your email has been confirmed. Sign in to continue.",
} as const;

export function getPasswordResetSuccessRoute() {
  return "/signin?message=password-reset-success";
}

export function getCheckEmailRoute(email: string) {
  return `/signup/check-email?email=${encodeURIComponent(email)}`;
}
