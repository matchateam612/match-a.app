"use client";

import Link from "next/link";
import { useState } from "react";

import { signUpWithEmailPassword } from "@/lib/supabase/auth";

import styles from "../page.module.scss";

type SignupFormState = {
  email: string;
  password: string;
};

const initialState: SignupFormState = {
  email: "",
  password: "",
};

function getPasswordHint(password: string) {
  if (!password) {
    return "Use at least 8 characters so the account starts on stronger footing.";
  }

  if (password.length < 8) {
    return "Password is still short. Aim for 8+ characters.";
  }

  return "Looks good. Consider mixing letters, numbers, and symbols for extra strength.";
}

function getAuthFeedback(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "We couldn't create your account right now. Please try again.";
}

export function SignupForm() {
  const [formState, setFormState] = useState<SignupFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const passwordHint = getPasswordHint(formState.password);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await signUpWithEmailPassword(formState);
      const requiresEmailConfirmation = !data.session;

      setSuccessMessage(
        requiresEmailConfirmation
          ? "Account created. Check your inbox to confirm your email before signing in."
          : "Account created. You're signed in and ready to continue.",
      );
      setFormState(initialState);
    } catch (error) {
      setErrorMessage(getAuthFeedback(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="signup-email">
          Email
        </label>
        <input
          id="signup-email"
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

      <div className={styles.field}>
        <label className={styles.label} htmlFor="signup-password">
          Password
        </label>
        <input
          id="signup-password"
          className={styles.input}
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          value={formState.password}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          minLength={8}
          required
        />
        <p className={styles.passwordHint}>{passwordHint}</p>
      </div>

      {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
      {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}

      <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Sign up"}
      </button>

      <p className={styles.footnote}>
        By continuing, you agree to the Terms of Service and Privacy Policy.
      </p>

      <p className={styles.signinRow}>
        Already have an account?{" "}
        <Link href="/signin" className={styles.link}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
