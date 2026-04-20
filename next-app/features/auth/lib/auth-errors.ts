export function getAuthFeedback(error: unknown) {
  if (!(error instanceof Error) || !error.message) {
    return "We couldn't complete that request right now. Please try again.";
  }

  const message = error.message.toLowerCase();

  if (message.includes("rate limit")) {
    return "Too many attempts just now. Please wait a moment before trying again.";
  }

  if (message.includes("invalid login credentials")) {
    return "That email and password combination didn't match our records.";
  }

  if (message.includes("email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }

  return error.message;
}

export function getPasswordHint(password: string) {
  if (!password) {
    return "Use at least 8 characters so the account starts on stronger footing.";
  }

  if (password.length < 8) {
    return "Password is still short. Aim for 8+ characters.";
  }

  return "Looks good. Consider mixing letters, numbers, and symbols for extra strength.";
}
