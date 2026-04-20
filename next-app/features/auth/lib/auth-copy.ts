import type { AuthMode } from "./auth-types";

export const futureMethods = [
  {
    title: "Continue with Google",
    copy: "Reserved for the next auth method rollout.",
  },
  {
    title: "More sign-in options",
    copy: "Apple, magic links, or phone can live here later.",
  },
];

export function getAuthPageCopy(mode: AuthMode) {
  if (mode === "signup") {
    return {
      topLinkHref: "/signin",
      topLinkLabel: "Already a member?",
      heroEyebrow: "Mobile-first signup",
      heroTitlePrefix: "Find out how dating should",
      heroTitleHighlight: "feel",
      heroCopy:
        "Start with email and password today, then add more ways to sign in as the experience grows.",
      heroBadges: ["Safer onboarding", "Room for Google and more"],
      formEyebrow: "Create your account",
      formTitle: "Join Matcha",
      formCopy:
        "Use your email and a password to get started. We'll keep this page ready for future sign-in methods too.",
      footerPrompt: "Already have an account?",
      footerLinkLabel: "Sign in here",
      footerLinkHref: "/signin",
      submitLabel: "Sign up",
      submittingLabel: "Creating account...",
    };
  }

  return {
    topLinkHref: "/signup",
    topLinkLabel: "No account yet?",
    heroEyebrow: "Welcome back",
    heroTitlePrefix: "Pick up right where your connection",
    heroTitleHighlight: "started",
    heroCopy:
      "Sign in with your email and password, then jump back into onboarding or the dashboard without friction.",
    heroBadges: ["Secure sign-in", "Recovery flow ready"],
    formEyebrow: "Sign in to continue",
    formTitle: "Welcome back to Matcha",
    formCopy:
      "Use the same account you created during signup. We'll guide new members toward onboarding automatically.",
    footerPrompt: "No account yet?",
    footerLinkLabel: "Sign up here",
    footerLinkHref: "/signup",
    submitLabel: "Sign in",
    submittingLabel: "Signing in...",
  };
}

export function getForgotPasswordCopy() {
  return {
    topLinkHref: "/signin",
    topLinkLabel: "Back to sign in",
    heroEyebrow: "Password recovery",
    heroTitlePrefix: "Get back into your account without losing",
    heroTitleHighlight: "momentum",
    heroCopy:
      "Enter the email tied to your account and we'll send a reset link if the address is eligible.",
    heroBadges: ["Recovery email flow", "Rate-limit friendly copy"],
    formEyebrow: "Reset your password",
    formTitle: "Forgot your password?",
    formCopy:
      "We'll email reset instructions to the address you use for Matcha. For privacy, the message stays broad either way.",
    submitLabel: "Send reset email",
    submittingLabel: "Sending reset email...",
  };
}

export function getResetPasswordCopy() {
  return {
    topLinkHref: "/signin",
    topLinkLabel: "Back to sign in",
    heroEyebrow: "Finish recovery",
    heroTitlePrefix: "Set a fresh password and get back to",
    heroTitleHighlight: "matching",
    heroCopy:
      "Use a new password for your account, then we'll send you back to sign in with a success banner.",
    heroBadges: ["Recovery session check", "Redirect back to sign-in"],
    formEyebrow: "Choose a new password",
    formTitle: "Reset your password",
    formCopy:
      "Open this page from your recovery email. If the link is valid, you can save a new password right here.",
    submitLabel: "Update password",
    submittingLabel: "Updating password...",
  };
}
