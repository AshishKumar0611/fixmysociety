import type { FieldErrors } from "./validation";

/** Result returned by every form server action (safe to import from client components). */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
  /** Echo of submitted values so forms keep the user's input after a server-side error. */
  values?: Record<string, string>;
  /** Changes on every submission so client components can react to repeated results. */
  at?: number;
};

export const initialActionState: ActionState = { ok: false };
