export const AUTH_SUCCESS_MESSAGES = {
  passwordResetSuccess: "Your password has been updated. Sign in with the new password.",
  forgotPasswordEmailSent:
    "If that email can receive a reset link, we've sent password recovery instructions.",
} as const;

export function getPostSignInRoute() {
  return "/onboarding";
}

export function getPostSignUpRoute() {
  return "/onboarding";
}

export function getPasswordResetSuccessRoute() {
  return "/signin?message=password-reset-success";
}
