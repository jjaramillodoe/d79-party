# District 79 Mixer Registration App

Full-stack registration application using **Next.js 16** (App Router, TypeScript) and **MongoDB** for the District 79 Week Mixer: Borough Hall Bash.

## Setup

1. **Install dependencies** (already done if you cloned after `create-next-app`):

   ```bash
   npm install
   ```

2. **Environment variables**

   Copy `.env.example` to `.env.local` and set at least:

   - **`MONGODB_URI`** (required) — MongoDB connection string, e.g. `mongodb://localhost:27017/d79-party`

   Optional:

   - **`PA_SECRET`** — Shared secret for Power Automate email endpoints (header `x-pa-secret` or query `x-pa-secret`). If set, POST to `/api/email/confirmation` and `/api/email/waiting-list` must include this value.
   - **`ADMIN_SECRET`** — Secret for the admin registrations page (query `secret` or header `x-admin-secret`).
   - **`POWER_AUTOMATE_CONFIRMATION_URL`** — HTTP-triggered flow URL; the app POSTs registration data here after a confirmed registration.
   - **`POWER_AUTOMATE_WAITING_LIST_URL`** — Same for waiting-list registrations.

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Use **Register for the event** to reach the registration form, or **Admin: View registrations** (with `ADMIN_SECRET` in the query) to view and export registrations.

## Features

- **Registration** (`/register`) — DOE-style form with client-side validation (Zod + React Hook Form). Capacity: 30 confirmed per borough (150 total); overflow goes to waiting list. Atomic capacity logic via a `capacity` collection to avoid overbooking under concurrency.
- **API**  
  - `POST /api/register` — Validates body, ensures capacity docs, atomically claims a spot or assigns waiting list, inserts into `registrations`, optionally calls Power Automate URLs.  
  - `POST /api/email/confirmation` and `POST /api/email/waiting-list` — Validate payload (and optional `PA_SECRET`), return `{ subject, body }` for Power Automate to use in email (body uses `\n` for newlines).
- **Admin** (`/admin/registrations`) — Protected by `ADMIN_SECRET`. Lists registrations by borough and status, shows confirmed/waiting-list counts per borough, and **Export CSV**.

## Project structure

- `app/` — Routes and layouts (`register`, `admin/registrations`, API routes).
- `app/api/` — Route handlers: `register`, `email/confirmation`, `email/waiting-list`, `admin/registrations`.
- `lib/` — MongoDB client and helpers, validation (Zod), email formatting.
- `types/` — TypeScript types and interfaces.

## Data model

- **`registrations`** — `firstName`, `lastName`, `program`, `boro`, `title`, `email`, `status` (`"confirmed"` | `"waiting_list"`), `createdAt`, `updatedAt`.
- **`capacity`** — One document per borough (`_id` = borough name), `confirmedCount` updated atomically so confirmed count never exceeds 30 per borough.

## Deploy to Vercel

1. **Push to GitHub** and import the repo in [Vercel](https://vercel.com).

2. **Configure environment variables** in the Vercel project settings:

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `MONGODB_URI` | Yes | MongoDB connection string (e.g. MongoDB Atlas URI) |
   | `ADMIN_SECRET` | Recommended | Secret for `/admin/registrations` |
   | `REGISTRATION_POSTPONED` | Optional | Set to `true` to close registration indefinitely (event postponed) |
   | `REGISTRATION_OPENS_AT` | Optional | ISO 8601 date when registration opens (e.g. `2025-02-12T13:00:00.000Z` for 8 AM Eastern). Ignored if `REGISTRATION_POSTPONED` is set. |
   | `PA_SECRET` | Optional | Shared secret for Power Automate email endpoints |
   | `POWER_AUTOMATE_CONFIRMATION_URL` | Optional | Power Automate flow URL for confirmed registrations |
   | `POWER_AUTOMATE_WAITING_LIST_URL` | Optional | Power Automate flow URL for waiting-list registrations |

3. **MongoDB Atlas**: Use `mongodb+srv://...` and ensure your cluster allows connections from Vercel's IPs (Atlas Network Access → allow `0.0.0.0/0` for all IPs, or add Vercel's IP ranges).

4. **Deploy** — Vercel will build and deploy automatically.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/)
