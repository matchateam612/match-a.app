"use client";

import Link from "next/link";
import { useState } from "react";

import { resendSignupVerificationEmail } from "@/lib/supabase/auth";

import styles from "../auth-page.module.scss";
import { getAuthFeedback } from "../lib/auth-errors";
import { AUTH_SUCCESS_MESSAGES } from "../lib/auth-routes";
import { AuthShell } from "./auth-shell";

type CheckEmailScreenProps = {
  email: string;
};

export function CheckEmailScreen({ email }: CheckEmailScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(AUTH_SUCCESS_MESSAGES.emailVerificationReady);

  async function handleResend() {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await resendSignupVerificationEmail(email);
      setSuccessMessage(AUTH_SUCCESS_MESSAGES.emailVerificationResent);
    } catch (error) {
      setErrorMessage(getAuthFeedback(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      mode="signup"
      copy={{
        topLinkHref: "/signin",
        topLinkLabel: "Already a member?",
        heroEyebrow: "Email verification",
        heroTitlePrefix: "One last step before you can start",
        heroTitleHighlight: "matching",
        heroCopy:
          "Verify the email address tied to your new account, then come back to sign in and continue onboarding.",
        heroBadges: ["Verification step", "Resend email support"],
      }}
    >
      <div className={styles.formHeader}>
        <p className={styles.eyebrow}>Check your email</p>
        <h2 className={styles.formTitle}>Confirm your address</h2>
        <p className={styles.formCopy}>
          We sent a verification link to <strong>{email}</strong>. Open that link, then return here to sign
          in.
        </p>
      </div>

      {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
      {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}

      <div className={styles.checkEmailPanel}>
        <button
          className={styles.submitButton}
          type="button"
          disabled={isSubmitting}
          onClick={handleResend}
        >
          {isSubmitting ? "Sending confirmation..." : "Resend confirmation email"}
        </button>

        <p className={styles.signinRow}>
          Verified already?{" "}
          <Link href="/signin" className={styles.link}>
            Sign in here
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
