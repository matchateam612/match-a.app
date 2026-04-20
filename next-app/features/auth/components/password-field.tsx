"use client";

import { useId, useState } from "react";

import styles from "../auth-page.module.scss";

type PasswordFieldProps = {
  autoComplete: string;
  id?: string;
  label: string;
  minLength?: number;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

export function PasswordField({
  autoComplete,
  id,
  label,
  minLength,
  onChange,
  placeholder,
  value,
}: PasswordFieldProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>

      <div className={styles.passwordField}>
        <input
          id={inputId}
          className={`${styles.input} ${styles.passwordInput}`}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={minLength}
          required
        />

        <button
          className={styles.toggleButton}
          type="button"
          onClick={() => setIsVisible((current) => !current)}
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
