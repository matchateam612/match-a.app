"use client";

import Link from "next/link";
import { useState } from "react";

import { sendPasswordResetEmail } from "@/lib/supabase/auth";

import styles from "../auth-page.module.scss";
import { getForgotPasswordCopy } from "../lib/auth-copy";
import { getAuthFeedback } from "../lib/auth-errors";
import { AUTH_SUCCESS_MESSAGES } from "../lib/auth-routes";
import { AuthShell } from "./auth-shell";

type ForgotPasswordFormState = {
  email: string;
};

const initialState: ForgotPasswordFormState = {
  email: "",
};

export function ForgotPasswordScreen() {
  const copy = getForgotPasswordCopy();
  const [formState, setFormState] = useState<ForgotPasswordFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await sendPasswordResetEmail(formState.email);
      setSuccessMessage(AUTH_SUCCESS_MESSAGES.forgotPasswordEmailSent);
      setFormState(initialState);
    } catch (error) {
      setErrorMessage(getAuthFeedback(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      mode="signin"
      copy={copy}
    >
      <div className={styles.formHeader}>
        <p className={styles.eyebrow}>{copy.formEyebrow}</p>
        <h2 className={styles.formTitle}>{copy.formTitle}</h2>
        <p className={styles.formCopy}>{copy.formCopy}</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="forgot-password-email">
            Email
          </label>
          <input
            id="forgot-password-email"
            className={styles.input}
            type="email"
            autoComplete="email"
            placeholder="alex@example.com"
            value={formState.email}
            onChange={(event) =>
              setFormState({
                email: event.target.value,
              })
            }
            required
          />
        </div>

        {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
        {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}

        <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
          {isSubmitting ? copy.submittingLabel : copy.submitLabel}
        </button>

        <p className={styles.signinRow}>
          Remembered it?{" "}
          <Link href="/signin" className={styles.link}>
            Return to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
