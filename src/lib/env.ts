/** Demo shortcuts (one-click demo logins) are opt-in and off unless DEMO_MODE is exactly "true". */
export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

export const isProduction = process.env.NODE_ENV === "production";
