import type { ReactNode } from "react";

type OnboardingSectionStatusProps = {
  errorMessage: string;
  successMessage: string;
  errorClassName: string;
  successClassName: string;
};

export function OnboardingSectionStatus({
  errorMessage,
  successMessage,
  errorClassName,
  successClassName,
}: OnboardingSectionStatusProps): ReactNode {
  if (errorMessage) {
    return <p className={errorClassName}>{errorMessage}</p>;
  }

  if (successMessage) {
    return <p className={successClassName}>{successMessage}</p>;
  }

  return null;
}
