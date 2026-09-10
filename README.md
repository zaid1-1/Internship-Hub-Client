# Jordan Internship Hub — Frontend

React + Vite client for the Jordan Internship Hub, a platform that
connects university students in Jordan with internship opportunities
posted by companies, with an admin layer for platform oversight. The UI
is built to match a Figma prototype exactly and talks to the
[Internship-Hub-Server](https://github.com/zaid1-1/Internship-Hub-Server)
API.

## Description

The app is a three-sided platform, built around one core feature: a
rule-based match score (Skills 40% / Career Field 25% / Location 15% /
Internship Type 10% / Education 10%) that tells a student how well they
fit a given opportunity, and helps a company rank its applicants.

## Users & user requirements

**Students** — sign up, build a profile (skills, education, projects,
experience, certifications, CV/photo upload), then:
- browse, search, and filter internships
- see a match % against their profile on every listing
- get a "Recommended for You" list, sorted best-match-first
- save internships for later and track applications through their
  lifecycle (Clicked Apply → Applied → Interview → Offer/Rejected/etc.)
- see a Skill Gaps breakdown of what's missing for a given opportunity
- manage account settings (email/password, delete account)

**Companies** — sign up, build a company profile, then:
- create, edit, publish (or save as draft), and preview internship
  listings
- view a dashboard of their own opportunities (views, applicant counts)
- see their Candidates list per opportunity, each with a computed match
  score, and open a full candidate profile
- manage account settings (email/password, deactivate account)

**Admins** — a separate oversight role:
- dashboard with platform-wide stats and recent activity
- manage student and company accounts (enable/disable, delete, view
  details)
- manage any company's opportunities (deactivate, remove, review
  reported listings)
- review and resolve reports filed by students/companies
- manage platform lookup data (skills, fields, locations, internship
  types, work arrangements, education levels)
- manage their own account settings

## Technologies

- React 19 (plain JS/JSX — no TypeScript)
- Vite — dev server & build tooling
- `react-router-dom` — client-side routing
- `axios` — HTTP requests to the backend API
- `react-bootstrap` + Bootstrap 5 — a couple of UI primitives (modals,
  spinner, alerts)
- Tailwind CSS — utility styling alongside per-screen CSS files
- ESLint — linting

## Getting started

### Prerequisites

- Node.js (v18+)
- The [backend server](https://github.com/zaid1-1/Internship-Hub-Server)
  running locally (see its own README for setup) — this app talks to it
  over HTTP and won't function without it

### 1. Clone and install

```bash
git clone https://github.com/zaid1-1/Internship-Hub-Client.git
cd Internship-Hub-Client
npm install
```

### 2. Configure environment variables

```bash
cp .env.sample .env
```

`.env` needs:

```
VITE_API_URL=http://localhost:5000
```

Point this at wherever your backend is actually running. Vite only
exposes env vars prefixed with `VITE_` to client code, and `.env`
changes require a dev server restart to take effect (they aren't
hot-reloaded).

### 3. Run the dev server

```bash
npm run dev
```

Vite will print a local URL (typically `http://localhost:5173`) — open
it in your browser. Make sure the backend is already running first, or
API calls will fail.

### Other scripts

```bash
npm run build     # production build
npm run preview   # preview the production build locally
npm run lint      # run ESLint
```