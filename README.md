# Balance — Personal Finance & Study Planner

A calm, bilingual (Arabic RTL / English LTR) web app for university students: track money, set budgets,
plan study time and tasks, and see reports. Plain HTML + CSS + JavaScript (ES modules), **Supabase** for
authentication and the database, hostable on **GitHub Pages** with no build step.

## Project structure

```
Balance/
├── index.html                 App shell (markup only)
├── css/style.css              All styles (logical properties → automatic RTL/LTR mirroring)
├── js/
│   ├── config.js              Supabase URL + publishable key (the only file you edit)
│   ├── supabase-client.js     Creates the Supabase client
│   ├── auth.js                Sign up / log in / log out / password reset
│   ├── app.js                 Session handling, routing, global controls
│   ├── data.js                Shared state, data loaders, finance calculations
│   ├── dashboard.js           Dashboard
│   ├── transactions.js        Money Manager (income & expenses)
│   ├── budgets.js             Budgets and savings goal
│   ├── tasks.js               Tasks
│   ├── study.js               Study sessions, weekly summary, Pomodoro
│   ├── daily.js               Daily planner
│   ├── reports.js / charts.js Insights and Chart.js charts
│   ├── settings.js            Profile, language, theme, currency, password
│   ├── admin.js               Admin dashboard
│   ├── i18n.js                All Arabic / English text
│   └── utils.js               Formatting, dialogs, validation helpers
├── database/supabase.sql      Tables, RLS policies, triggers, functions
├── assets/icons/              SVG icon sprite + favicon
└── README.md
```

## Setup

### 1. Create a Supabase project
Go to <https://supabase.com>, sign in, click **New project**, choose a name, a database password (keep it
private; the app never needs it) and a region near you. Wait until the project finishes provisioning.

### 2. Get the project URL and public key
Open **Project Settings → API** (or **API Keys**). Copy:
- **Project URL** (looks like `https://xxxx.supabase.co`)
- The **publishable key** (or the legacy **anon** key).

Never copy the `service_role` / secret key into this project.

### 3. Run the SQL file
Open **SQL Editor → New query**, paste the whole content of `database/supabase.sql`, and press **Run**.
It is safe to run again later. You should see "Success. No rows returned".

### 4. Configure the app
Edit `js/config.js`:
```js
export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'YOUR-PUBLISHABLE-OR-ANON-KEY';
```
The publishable/anon key is designed to be public; Row Level Security protects the data.

To try it locally, serve the folder over HTTP (ES modules do not work from `file://`):
```bash
cd Balance && python3 -m http.server 8000      # then open http://localhost:8000
```

### 5. Create the first account
Open the app, choose **Create account**, and register. If email confirmation is on (default), open the
link in the email, then log in.

### 6. Make that account the first admin (securely)
Admin rights can **only** be granted from the SQL Editor — a database trigger rejects any attempt to change
`role` from the browser. In **SQL Editor** run (using your own email):
```sql
update public.profiles set role = 'admin' where email = 'your-email@example.com';
```
Log out and in again; the **Admin Dashboard** entry appears. To demote, set `role = 'user'` the same way.

### 7. Authentication and redirect URLs
In **Authentication → URL Configuration**:
- **Site URL**: your published address, e.g. `https://USERNAME.github.io/REPO/`
- **Redirect URLs**: add the same address, plus `http://localhost:8000/` for local testing.

The app sends confirmation and reset links back to the page you are on (`origin + pathname`), so a repository
sub-path works. Optional: in **Authentication → Providers → Email** you can turn "Confirm email" off while testing.

### 8. Publish on GitHub Pages
1. Create a GitHub repository and upload the contents of this folder (so `index.html` is at the repo root).
2. **Settings → Pages → Build and deployment**: Source *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Wait a minute, then open `https://USERNAME.github.io/REPO/`. All paths are relative, and routing uses `#/hash`
   links, so refreshing any page works under the sub-path.

### 9. Test registration, login, logout and privacy
1. Register user A, confirm the email, log in, add a few transactions and tasks.
2. Log out (check **Admin → Login & logout activity** shows signup/login/logout once admin).
3. Register user B in a private window. B must see an empty dashboard — none of A's data.
4. As admin, open **Admin Dashboard**: you see users, dates, roles, login counts and *counts* of records, but no
   amounts, categories or task text.
5. In the browser console, a normal user running `supabase`-style queries on another user's rows gets nothing,
   and trying to `update profiles set role='admin'` returns a permission error.
6. Test the language switch (Arabic ↔ English): text, layout direction, dates, charts and messages all change, and the
   choice is remembered after reload.

### 10. Common errors
| Symptom | Fix |
|---|---|
| "Setup required" screen | `js/config.js` still holds the placeholders. |
| Blank page / module errors locally | Serve over HTTP, not `file://`. |
| "Your profile could not be loaded" | `database/supabase.sql` was not run (or run before registering — re-run it; it back-fills profiles). |
| "Please confirm your email first" | Open the confirmation link, or disable email confirmation while testing. |
| Email links go to the wrong site / "invalid link" | Fix **Site URL** and **Redirect URLs** (step 7); links also expire — request a new one. |
| "Too many attempts" | Supabase limits auth emails; wait a few minutes. |
| Admin menu missing | Run the promotion SQL (step 6), then log out and in. |
| "permission denied" / RLS errors | The SQL file was not fully executed. Re-run it. |

## How security works
- **Authentication**: Supabase Auth (hashed passwords, JWT sessions). No passwords are stored or logged by the app.
- **RLS on every table**: users can only read/write rows where `user_id = auth.uid()`. There is deliberately **no admin
  policy** on transactions, budgets, tasks, study sessions or the daily plan — admins cannot read private finances.
- **Roles**: `profiles.role` cannot be changed through the API (trigger `protect_profile_columns`). The frontend hides the
  admin menu, but the real enforcement is `is_admin()` inside RLS policies and the `admin_user_summary()` function.
- **Audit log** (`activity_logs`), append-only for clients:
  - `signup` and `login` are written by **database triggers on `auth.users`** → authoritative (`source = server`).
  - `logout` is only *reported* by the browser through `log_client_event()` → labelled **Client-reported**. A closed tab or lost
    connection produces no logout event, and the app never claims to know a user's online status.
  - No passwords or tokens are ever written to the log.
  - A Supabase Edge Function is not required: database triggers are the trusted server-side mechanism here.
  - A password-recovery link counts as a sign-in and creates a `login` event.
- Every value shown from user content is HTML-escaped; all queries go through the Supabase client (parameterized).

## Static hosting limitations
- No server code: email sending, auth and storage are handled by Supabase.
- Browser-only logout reporting (see above) and no live "online" indicator.
- Lists load up to 5,000 transactions (and 2,000 tasks/sessions) per user and are filtered in the browser.
- The Pomodoro timer needs the tab to stay open; background tabs may delay the tick but the time is computed from the clock.
- Fonts, Supabase JS and Chart.js load from public CDNs (pinned versions), so an internet connection is required.
- The language and theme are stored in `localStorage`; **financial data never is**.
