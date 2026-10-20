# Security approach and threat model

## Assets

- Residents' personal data (name, email, phone, unit number) and complaint contents and photos.
- Managers' internal notes.
- The integrity of complaint records and status history (used as evidence in committee meetings).
- Accounts, especially manager accounts, which can change complaint state for a whole society.

## Actors and threats

| Threat | Mitigation |
|---|---|
| Unauthenticated access to app pages or data | `src/proxy.ts` redirects requests without a session cookie; **every** page, server action and route handler re-validates the session against the database (`requireResident`, `requireManager`, `getCurrentUser`). |
| A resident reading another resident's complaints | All complaint queries for residents filter by `residentId = session user`. Unauthorised IDs return the same not-found result as missing ones, so nothing leaks. Covered by integration and end-to-end tests. |
| A manager accessing another society | Every manager query and mutation filters by `societyId = session user's society`, and assignees must be active managers of the same society. Covered by tests. |
| Privilege escalation (a resident becoming a manager) | Public registration always creates `RESIDENT`. The society comes from a manager-issued join code. Profile updates only accept `name` and `phone`; role, society and email are never read from forms. |
| Tampered form fields (`residentId`, `societyId`, `status`) | Identity and scope come only from the session. All inputs are validated with Zod on the server. Status changes must pass the workflow map (`src/lib/workflow.ts`). |
| Internal notes exposed to residents | Filtered in the database query (`isInternal: false`) for residents, so they never reach resident pages or props. Residents cannot create internal notes. Tested. |
| Password theft | bcrypt (cost 12). Passwords are never logged or returned. Changing a password signs out other sessions. |
| Session theft or replay | 256-bit random tokens in `httpOnly`, `SameSite=Lax` cookies (`Secure` in production). Only a SHA-256 hash is stored in the database. Sessions expire after 7 days, and deactivating a user deletes their sessions. Nothing sensitive is kept in `localStorage`. |
| Brute-force login | Database-backed rate limiting (5 failures per email and 20 per IP in 15 minutes, then a 15-minute lockout). Generic "Incorrect email or password" messages, plus a dummy bcrypt comparison for unknown emails to reduce timing differences. |
| CSRF | Mutations are Next.js Server Actions, which reject requests whose `Origin` does not match the host. Session cookies are `SameSite=Lax`, so cross-site POSTs do not carry them. GET route handlers (photos, CSV export) are read-only. |
| Open redirects after login | `safeRedirectPath` only allows same-site relative paths, and only within the user's own role area. |
| Malicious uploads | Only JPEG, PNG and WebP, up to 2 MB. The declared MIME type must match the file's magic bytes, and filenames are sanitised. Images are served only to authorised users, with `X-Content-Type-Options: nosniff` and a restrictive per-response CSP. |
| CSV/formula injection in exports | Cells starting with `= + - @` are prefixed with `'`. Exports leave out internal notes and resident names, emails and phone numbers (unit numbers only). |
| XSS | React escapes all output. No `dangerouslySetInnerHTML` except the fixed theme script. CSP restricts sources to `'self'`. |
| Clickjacking and sniffing | `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, and HSTS in production (`next.config.ts`). |
| Error-message leakage | Unexpected errors are logged on the server and shown to users as a generic message. Prisma errors and stack traces are never sent to the browser. |
| Demo shortcuts left on in production | One-click demo logins only work when `DEMO_MODE="true"` is explicitly set. The seed refuses to run in production without `SEED_DEMO_PASSWORD`. The data reset script only works on a local SQLite file. |

## Remaining limitations (honest list)

- **CSP allows `'unsafe-inline'` scripts.** Next.js needs inline bootstrapping scripts. A nonce-based
  CSP (generated in `proxy.ts`) would remove this but makes every page dynamic. This is a
  recommended follow-up.
- **No email verification or password reset.** No email provider is configured. Residents must ask
  a manager, and there is no manager-side reset screen yet. A production version needs an email
  service.
- **No multi-factor authentication** for managers.
- **Rate limiting is per email and per IP.** A distributed attack across many IPs and emails is only
  slowed down. A production deployment should add platform-level protection (for example a WAF).
- **Photos are stored in the database.** This is simple and works on serverless hosts, but object
  storage (S3 or similar) would scale better. There is no malware scanning beyond strict
  type/signature checks.
- **Not-found responses after streaming return HTTP 200** (with `noindex` and the not-found page),
  because pages with loading skeletons start streaming before access checks complete. No data is
  rendered in that case.
- **No audit log** for manager actions beyond complaint status history and comments.
- **No automated dependency scanning** is configured. `npm audit` reports advisories in
  development-only lint tooling (`eslint-config-next`'s glob dependency), not in runtime packages.
- The privacy and terms pages are plain-English descriptions for a student project and have not
  been reviewed by a lawyer.
