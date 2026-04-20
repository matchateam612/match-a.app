"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { exchangeCodeForSession, updateCurrentUserPassword } from "@/lib/supabase/auth";

import styles from "../auth-page.module.scss";
import { getResetPasswordCopy } from "../lib/auth-copy";
import { getAuthFeedback, getPasswordHint } from "../lib/auth-errors";
import { getPasswordResetSuccessRoute } from "../lib/auth-routes";
import { AuthShell } from "./auth-shell";
import { PasswordField } from "./password-field";

type RecoveryStatus = "checking" | "ready" | "invalid";

export function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = getResetPasswordCopy();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>("checking");
  const [errorMessage, setErrorMessage] = useState("");

  const passwordHint = getPasswordHint(password);

  useEffect(() => {
    let isActive = true;

    async function prepareRecoverySession() {
      const code = searchParams.get("code");

      if (!code) {
        if (isActive) {
          setRecoveryStatus("invalid");
          setErrorMessage("This recovery link is missing the code we need. Request a new reset email.");
        }
        return;
      }

      try {
        await exchangeCodeForSession(code);

        if (isActive) {
          setRecoveryStatus("ready");
        }
      } catch (error) {
        if (isActive) {
          setRecoveryStatus("invalid");
          setErrorMessage(getAuthFeedback(error));
        }
      }
    }

    void prepareRecoverySession();

    return () => {
      isActive = false;
    };
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await updateCurrentUserPassword(password);
      router.push(getPasswordResetSuccessRoute());
    } catch (error) {
      setErrorMessage(getAuthFeedback(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell mode="signin" copy={copy}>
      <div className={styles.formHeader}>
        <p className={styles.eyebrow}>{copy.formEyebrow}</p>
        <h2 className={styles.formTitle}>{copy.formTitle}</h2>
        <p className={styles.formCopy}>{copy.formCopy}</p>
      </div>

      {recoveryStatus === "checking" ? (
        <div className={styles.infoMessage}>Checking your recovery link and preparing a secure session.</div>
      ) : null}

      {recoveryStatus === "invalid" ? (
        <div className={styles.form}>
          {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
          <p className={styles.signinRow}>
            Need a fresh recovery email?{" "}
            <Link href="/forgot-password" className={styles.link}>
              Request another reset link
            </Link>
          </p>
        </div>
      ) : null}

      {recoveryStatus === "ready" ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <PasswordField
            id="reset-password-password"
            autoComplete="new-password"
            label="New password"
            minLength={8}
            placeholder="Create a new password"
            value={password}
            onChange={setPassword}
          />

          <p className={styles.passwordHint}>{passwordHint}</p>
          {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}

          <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
            {isSubmitting ? copy.submittingLabel : copy.submitLabel}
          </button>
        </form>
      ) : null}
    </AuthShell>
  );
}
