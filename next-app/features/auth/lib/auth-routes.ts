export const AUTH_SUCCESS_MESSAGES = {
  passwordResetSuccess: "Your password has been updated. Sign in with the new password.",
} as const;

export function getPostSignInRoute() {
  return "/onboarding";
}

export function getPostSignUpRoute() {
  return "/onboarding";
}
