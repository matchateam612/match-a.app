"use client";

import { useState } from "react";

import {
  getCurrentUser,
  signInWithEmailPassword,
  signOutCurrentUser,
} from "@/lib/supabase/auth";

type AuthTestFormState = {
  email: string;
  password: string;
};

const initialState: AuthTestFormState = {
  email: "",
  password: "",
};

export function AuthTestForm() {
  const [formState, setFormState] = useState<AuthTestFormState>(initialState);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateTestSession() {
    setIsSubmitting(true);
    console.log(formState.email, formState.password)
    try {
      await signInWithEmailPassword({
        email: formState.email,
        password: formState.password,
      });
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to start auth flow.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCheckCurrentUser() {
    try {
      const user = await getCurrentUser();
      setCurrentUserEmail(user?.email ?? "");
      setStatusMessage(user ? "Loaded current session." : "No active session.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to read session.",
      );
    }
  }

  async function handleSignOut() {
    try {
      await signOutCurrentUser();
      setCurrentUserEmail("");
      setStatusMessage("Signed out.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to sign out.",
      );
    }
  }

  return (
    <form>
      <fieldset>
        <legend>Supabase Auth Test</legend>

        <p>
          test page
        </p>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            type="email"
            value={formState.email}
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            type="text"
            value={formState.password}
          />
        </div>


        <button disabled={isSubmitting} onClick={handleCreateTestSession} type="button">
          {isSubmitting ? "Sending..." : "Create Test Session"}
        </button>
        <button onClick={handleCheckCurrentUser} type="button">
          Check Current User
        </button>
        <button onClick={handleSignOut} type="button">
          Sign Out
        </button>

        <output>{statusMessage}</output>
        <p>Current user email: {currentUserEmail || "-"}</p>
      </fieldset>
    </form>
  );
}
