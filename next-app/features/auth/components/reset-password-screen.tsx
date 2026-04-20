"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  exchangeCodeForSession,
  setRecoverySession,
  updateCurrentUserPassword,
} from "@/lib/supabase/auth";

import styles from "../auth-page.module.scss";
import { getResetPasswordCopy } from "../lib/auth-copy";
import { getAuthFeedback, getPasswordHint } from "../lib/auth-errors";
import { getPasswordResetSuccessRoute } from "../lib/auth-routes";
import { AuthShell } from "./auth-shell";
import { PasswordField } from "./password-field";

type RecoveryStatus = "checking" | "ready" | "invalid";

type ResetPasswordScreenProps = {
  code?: string;
};

export function ResetPasswordScreen({ code }: ResetPasswordScreenProps) {
  const router = useRouter();
  const copy = getResetPasswordCopy();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>("checking");
  const [errorMessage, setErrorMessage] = useState("");

  const passwordHint = getPasswordHint(password);

  useEffect(() => {
    let isActive = true;

    async function prepareRecoverySession() {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashError = hashParams.get("error_description") ?? hashParams.get("error");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashType = hashParams.get("type");

      if (hashError) {
        if (isActive) {
          setRecoveryStatus("invalid");
          setErrorMessage(decodeURIComponent(hashError));
        }
        return;
      }

      if (hashType === "recovery" && accessToken && refreshToken) {
        try {
          await setRecoverySession(accessToken, refreshToken);

          if (isActive) {
            setRecoveryStatus("ready");
          }
        } catch (error) {
          if (isActive) {
            setRecoveryStatus("invalid");
            setErrorMessage(getAuthFeedback(error));
          }
        }
        return;
      }

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
  }, [code]);

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
