"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getCurrentUser,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from "@/lib/supabase/auth";

import styles from "../auth-page.module.scss";
import { getAuthPageCopy } from "../lib/auth-copy";
import { getAuthFeedback, getPasswordHint } from "../lib/auth-errors";
import {
  getCheckEmailRoute,
  getPostSignInRoute,
  getPostSignUpRoute,
} from "../lib/auth-routes";
import type { AuthMode } from "../lib/auth-types";
import { AuthMethods } from "./auth-methods";
import { PasswordField } from "./password-field";
import { TermsModal } from "./terms-modal";

type AuthFormProps = {
  initialMessage?: string;
  mode: AuthMode;
};

type AuthFormState = {
  email: string;
  password: string;
  rememberMe: boolean;
  agreedToTerms: boolean;
};

const initialState: AuthFormState = {
  email: "",
  password: "",
  rememberMe: false,
  agreedToTerms: false,
};

export function AuthForm({ initialMessage = "", mode }: AuthFormProps) {
  const router = useRouter();
  const copy = getAuthPageCopy(mode);
  const [formState, setFormState] = useState<AuthFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(initialMessage);
  const [infoMessage, setInfoMessage] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const passwordHint = getPasswordHint(formState.password);

  useEffect(() => {
    let isActive = true;

    async function checkCurrentSession() {
      try {
        const user = await getCurrentUser();

        if (user && isActive) {
          router.replace(getPostSignInRoute());
          return;
        }
      } catch {
        // If the session check fails, keep the auth page usable rather than blocking.
      } finally {
        if (isActive) {
          setIsCheckingSession(false);
        }
      }
    }

    void checkCurrentSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  useEffect(() => {
    setSuccessMessage(initialMessage);
  }, [initialMessage]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    setInfoMessage("");

    try {
      if (mode === "signin") {
        await signInWithEmailPassword({
          email: formState.email,
          password: formState.password,
        });
        router.push(getPostSignInRoute());
        return;
      }

      if (!formState.agreedToTerms) {
        throw new Error("Please agree to the Terms and Conditions before creating your account.");
      }

      const data = await signUpWithEmailPassword({
        email: formState.email,
        password: formState.password,
      });

      if (data.session) {
        router.push(getPostSignUpRoute());
        return;
      }

      router.push(getCheckEmailRoute(formState.email));
    } catch (error) {
      setErrorMessage(getAuthFeedback(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return (
      <div className={styles.formWrap}>
        <div className={styles.formHeader}>
          <p className={styles.eyebrow}>{copy.formEyebrow}</p>
          <h2 className={styles.formTitle}>{copy.formTitle}</h2>
          <p className={styles.formCopy}>Checking your session and getting your auth flow ready.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.formHeader}>
        <p className={styles.eyebrow}>{copy.formEyebrow}</p>
        <h2 className={styles.formTitle}>{copy.formTitle}</h2>
        <p className={styles.formCopy}>{copy.formCopy}</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${mode}-email`}>
            Email
          </label>
          <input
            id={`${mode}-email`}
            className={styles.input}
            type="email"
            autoComplete="email"
            placeholder="alex@example.com"
            value={formState.email}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            required
          />
        </div>

        <PasswordField
          id={`${mode}-password`}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          label="Password"
          minLength={mode === "signup" ? 8 : undefined}
          placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
          value={formState.password}
          onChange={(value) =>
            setFormState((current) => ({
              ...current,
              password: value,
            }))
          }
        />

        {mode === "signup" ? <p className={styles.passwordHint}>{passwordHint}</p> : null}

        {mode === "signin" ? (
          <div className={styles.helperRow}>
            <label className={styles.checkboxWrap}>
              <input
                className={styles.checkbox}
                type="checkbox"
                checked={formState.rememberMe}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    rememberMe: event.target.checked,
                  }))
                }
              />
              <span className={styles.checkboxText}>Remember me</span>
            </label>

            <Link href="/forgot-password" className={styles.link}>
              Forgot password?
            </Link>
          </div>
        ) : null}

        {mode === "signup" ? (
          <div className={styles.checkboxRow}>
            <label className={styles.checkboxWrap}>
              <input
                className={styles.checkbox}
                type="checkbox"
                checked={formState.agreedToTerms}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    agreedToTerms: event.target.checked,
                  }))
                }
              />
              <span className={styles.checkboxText}>
                I agree to the{" "}
                <button
                  className={styles.textButton}
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                >
                  Terms and Conditions
                </button>
                .
              </span>
            </label>
          </div>
        ) : null}

        {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
        {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}
        {infoMessage ? <p className={styles.infoMessage}>{infoMessage}</p> : null}

        <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
          {isSubmitting ? copy.submittingLabel : copy.submitLabel}
        </button>

        {mode === "signup" ? (
          <p className={styles.footnote}>
            By continuing, you agree to the Terms of Service and Privacy Policy.
          </p>
        ) : null}

        <p className={styles.signinRow}>
          {copy.footerPrompt}{" "}
          <Link href={copy.footerLinkHref} className={styles.link}>
            {copy.footerLinkLabel}
          </Link>
        </p>
      </form>
      <AuthMethods />
      <TermsModal open={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </>
  );
}
