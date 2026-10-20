# FixMySociety — Assignment summary

*Individual entrepreneurship assignment · prototype status as of 21 October 2026*

## 1. Startup overview

**FixMySociety** is a web application that gives housing societies one organised place to report,
track and resolve residential maintenance issues.
Tagline: **Your Community. Better Managed.** Supporting message: **Report it. Track it. Resolve it.**

## 2. Problem statement

In many residential societies, maintenance complaints are raised by phone calls, conversations
with staff and messages in busy community chat groups. Requests get buried or forgotten, residents
cannot see whether anyone is working on their issue, and managers have no reliable record for
prioritising urgent work or spotting recurring problems.

## 3. Target customers

- Housing societies and apartment complexes in India
- Resident welfare associations (RWAs) and their management committees
- Apartment and facility managers, and residential property administrators

The **customer** (who pays) is the society or its management committee. The **users** are the
managers and the residents.

## 4. Value proposition

- **Residents:** report an issue in under a minute, always know its status, and get a clear outcome.
- **Managers:** one prioritised queue instead of scattered messages, accountability through
  assignment and history, and less time spent answering "any update?" calls.
- **Committees:** evidence for meetings, such as volumes, resolution rate, resolution times,
  categories and resident ratings.

## 5. Core features (implemented)

Resident dashboard · complaint form with photo upload · searchable, filterable complaint list ·
complaint timeline from real history records · comments · 1–5 feedback after resolution ·
resolved history · announcements · in-app notifications · profile.
Manager dashboard and charts · complaint queue · assignment · validated status workflow ·
mandatory resolution notes · internal notes hidden from residents · analytics with date ranges
and CSV export · resident directory · announcements · society settings and join codes.
Light and dark themes, responsive from 320 px to large desktops.

## 6. Technology stack

Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript (strict),
Tailwind CSS 4, Prisma 6 ORM (SQLite for development, PostgreSQL for production), Zod 4
validation, bcrypt password hashing, Recharts, Lucide icons, Vitest and Playwright.

## 7. Database architecture

Normalised relational model: `Society`, `User` (RESIDENT/MANAGER), `Complaint`,
`ComplaintStatusHistory`, `ComplaintComment` (with `isInternal`), `ComplaintAttachment`,
`Feedback` (one per complaint), `Notification`, `Announcement`, plus `Session` and `LoginAttempt`
for security. Enums for roles, categories, priorities and statuses. Unique constraints and indexes
support data integrity and fast dashboards. Full details and migration safety steps:
[`DATABASE.md`](DATABASE.md).

## 8. Security approach

Server-side authorisation on every request (role, ownership, society), hashed session tokens in
secure httpOnly cookies, bcrypt passwords, Zod validation, login rate limiting, CSRF protection
through Server Actions and SameSite cookies, validated image uploads, security headers, and no
secrets in code. The threat model and remaining limitations are in [`SECURITY.md`](SECURITY.md).

## 9. Business model

**B2B subscription software (SaaS).** The society subscribes monthly, and residents use the app
for free. Revenue scales with the number of subscribing societies. Possible future revenue includes
add-ons (WhatsApp/SMS notifications, technician accounts) and annual plans.

## 10. Proposed pricing (hypotheses to validate)

| Plan | Price | Intended for |
|---|---|---|
| Starter | Free trial | Trying the workflow before committing |
| Society Basic | ₹499 / month | Smaller societies needing an organised complaint desk |
| Society Plus | ₹999 / month | Larger communities needing analytics, export and multiple managers |

These prices are **untested hypotheses**, not established market prices. They should be checked
through interviews about current spending on maintenance coordination and willingness to pay.

## 11. Testing methodology

- **Static checks:** TypeScript in strict mode and ESLint (Next.js core-web-vitals rules).
- **Unit tests (Vitest):** validation schemas, workflow transitions, metric formulas (including empty
  data and division by zero), trend bucketing, date ranges, and image signature checks.
- **Integration tests (Vitest):** the service layer against a real seeded database. They run on
  SQLite and were also run against PostgreSQL 16.
- **End-to-end tests (Playwright):** real browser runs against a production build, on SQLite and on
  PostgreSQL.
- **Responsive checks:** automated horizontal-overflow checks at 375, 390, 768, 1024 and 1440 px (320 px
  for public pages), plus a scripted audit of every app page at 320 px and visual screenshot review.

### Mapping to the specification's required tests

| # | Requirement | Where it is tested |
|---|---|---|
| 1 | Landing page renders | e2e `auth.spec` "landing page renders" |
| 2 | Login with a valid account | e2e "login works…" |
| 3 | Invalid login rejected | e2e "invalid login…" (generic message) and "deactivated accounts…" |
| 4 | Logout works | e2e "logout ends the session" |
| 5 | Protected routes reject unauthenticated users | e2e "protected routes…" and "forged session cookie…" |
| 6 | Residents cannot access manager routes | e2e "residents cannot access manager routes…" |
| 7 | Residents cannot read others' complaints | integration "access control" and e2e "cannot read restricted complaints" |
| 8 | Residents cannot change role or society | unit "drops role and society fields…", integration "public registration always creates a resident", e2e registration test |
| 9 | Resident can create a valid complaint | e2e lifecycle and integration "complaint creation" |
| 10 | Invalid submissions rejected | unit validation and e2e "invalid complaint submissions…" |
| 11 | Complaint numbers unique | integration "unique complaint numbers, even for concurrent submissions" |
| 12 | Initial status history created | integration "creates a complaint with OPEN status, initial history…" and e2e lifecycle |
| 13 | Manager views authorised complaints | integration "managers see their whole society…" and e2e lifecycle |
| 14 | Manager updates status | integration "full lifecycle" and e2e lifecycle |
| 15 | Resolution notes required | unit, integration and e2e lifecycle |
| 16 | Status history updates correctly | integration (exact transition sequence) and e2e (4 timeline events) |
| 17 | Notifications created | integration (counts) and e2e (resident and manager notification text) |
| 18 | Dashboard statistics update after mutations | integration "dashboard metrics update…" and e2e lifecycle (KPI +1) |
| 19 | Search and filters work | integration "search and filters…" and e2e "search, filters and clear filters…" |
| 20 | Feedback only when eligible | integration "feedback is only accepted once…" and e2e feedback steps |
| 21 | Internal notes hidden from residents | integration and e2e (checked in the page HTML too) |
| 22 | Other societies cannot access restricted records | integration (read, update, comment, assign, announcements) and e2e |
| 23 | Refreshing nested routes | e2e lifecycle (reloads complaint detail pages) |
| 24 | Empty datasets don't crash | unit (`summarize`, `averageHours`) and integration "empty society…" |
| 25 | Mobile navigation works | e2e "mobile navigation drawer and bottom bar work" |

## 12. Actual testing outcomes

Runs performed 20–21 October 2026:

| Check | Outcome |
|---|---|
| TypeScript and ESLint | 0 errors |
| Vitest (unit + integration), SQLite | 52 / 52 passed |
| Vitest integration, PostgreSQL 16 | 24 / 24 passed |
| Playwright e2e, production build on SQLite | 23 / 23 passed |
| Playwright e2e, production build on PostgreSQL 16 | 23 / 23 passed |
| Production build | succeeded |

**Defects found by testing and fixed during development**

1. After a failed "resolve" attempt, React's automatic form reset changed the status dropdown back to
   its first option while the screen still showed "Resolved". The next submit could quietly
   set the wrong status. *Fixed:* the form remounts after every result, and the dropdown has no
   preselected status.
2. After "Clear filters", stale filter values stayed in the form and were re-applied on the next
   search. *Fixed:* filter forms reset whenever the URL changes.
3. Success messages disappeared when the form that triggered them unmounted (for example the
   feedback form). *Fixed:* messages are raised from the action itself.
4. Horizontal overflow on phones and tablets, caused by screen-reader-only labels escaping table
   scroll areas and grid items refusing to shrink. *Fixed* and covered by automated checks.
5. Priority sorting differed between SQLite and PostgreSQL. *Fixed* with a numeric priority rank.

## 13. User research findings

**No user research has been conducted yet.** Nothing in this project claims customer interviews,
survey results or market validation. Suggested plan before the deadline:

- Interview 5–8 people: society managers and committee members, plus residents.
- Questions: how complaints are reported today; how often they get lost; how long fixes take;
  whether they would use an app; what they pay today for society management tools; reaction to
  ₹499 and ₹999 per month.
- Run a usability test of the demo: ask a resident to raise and track a complaint, and a manager
  to resolve one. Note time taken and points of confusion.
- Record findings here, separating what people *said* from what they *did*.

## 14. Limitations

- Notifications are in-app only. No email, SMS, WhatsApp or push delivery is configured.
- No email verification or self-service password reset (no email provider is configured).
- Demo data is fictional, and the app is not yet used by a real society.
- Photos are stored in the database (simple, but object storage would scale better).
- Not yet deployed publicly (deployment-ready; see [`DEPLOYMENT.md`](DEPLOYMENT.md)).
- More security limitations are listed in [`SECURITY.md`](SECURITY.md).

## 15. Future roadmap

1. Validate the problem and pricing with real societies (see section 13).
2. Email notifications and password reset (via a transactional email provider).
3. WhatsApp and SMS updates, which match how Indian societies already communicate.
4. Maintenance technician accounts with a mobile job list.
5. QR codes in common areas for one-scan reporting.
6. Recurring maintenance schedules (lifts, tanks, generators).
7. Service-level targets and overdue alerts by priority.
8. AI-assisted complaint categorisation and duplicate detection.
9. Multiple languages (Hindi and regional languages).
10. Payments and subscription billing, and an installable progressive web app.

## 16. Deployment status

**Not deployed.** No public URL exists yet. The app builds successfully and is ready for Vercel and
PostgreSQL (Neon), following [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## Two-minute presentation script

*(About 280 words, roughly 2 minutes at a calm pace. Suggested screen in brackets.)*

**[Landing page] — The problem (20 s)**
"In most housing societies, a leaking pipe or a broken lift is reported by phone or in a crowded
chat group. Messages get buried, residents don't know if anyone is working on it, and managers have
no record of what's still open. FixMySociety fixes that. Report it, track it, resolve it."

**[Sign in as resident → Raise Complaint] — Resident workflow (30 s)**
"Here I'm Aarav, a resident. I raise a complaint: category, location, priority and an optional photo.
The form checks my input, and I get a complaint number straight away. On the details page I can see a
timeline of every status change, and I'm notified in the app when anything happens."

**[Sign in as manager → Dashboard → complaint] — Manager workflow (35 s)**
"Now I'm Priya, the society manager. My dashboard shows open work, resolution rate, average
resolution time and urgent issues. I open Aarav's complaint, assign it to our facilities manager,
move it to In Progress, and add an internal note that residents never see. To resolve it, the system
requires a resolution note. That's accountability built in. Aarav can then rate the fix."

**[Landing page pricing section] — Business model (20 s)**
"FixMySociety is B2B subscription software. The society pays and residents use it free. Our proposed
plans are a free trial, ₹499 and ₹999 per month. These are hypotheses I still need to validate with
real societies."

**[README testing table] — Testing (15 s)**
"I tested it with 52 automated unit and integration tests and 23 browser tests covering the full
complaint lifecycle, security rules and mobile layouts, on both SQLite and PostgreSQL. All pass."

**Next priorities (10 s)**
"Next: interviews with society managers, then email and WhatsApp notifications, and technician
accounts. Thank you."
