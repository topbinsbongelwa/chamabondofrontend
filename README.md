# Chamabondo Teacher Portal: Signup Landing Page

A lightweight, mobile-first signup page for the **Chamabondo Teacher Portal**, a staff app for Chamabondo Primary School (Zimbabwe). Teachers use it to create an account before they can check in, submit KRAs and scheme books, and view school activities.

This is the **frontend** repo. It talks to the backend only over HTTP.

## Features

- Responsive landing page: hero on the left and signup card on the right (desktop), stacked with the form first (mobile)
- Green, white, and gold theme with gold used only for small accents
- Signup form with plain-language validation
- Loading, error, and success states
- Accessible: labelled fields, visible focus states, 44px minimum touch targets
- Small bundle, built for low-end Android phones

## Signup fields

| Field | Rules |
|---|---|
| First name | Required |
| Surname | Required |
| EC number | Required. Trimmed, uppercased, letters and digits only. Hint: "As shown on your payslip" |
| Phone / WhatsApp | Required. Zimbabwe format, e.g. `07XXXXXXXX` |
| Department / Grade taught | Dropdown: ECD A, ECD B, Grade 1 to Grade 7, Sports, Administration |
| Password | Minimum 8 characters, show/hide toggle |
| Confirm password | Must match password |

New accounts are created as **teachers** and stay **pending until the headmaster approves them**. The role is never chosen on this form.

## Tech stack

- React + Vite + TypeScript
- Tailwind CSS
- react-hook-form + zod

## Colors

| Use | Hex |
|---|---|
| Primary green | `#0B5D3B` |
| Background and cards | `#FFFFFF` |
| Gold accent | `#D4AF37` |

These are defined as custom colors in `tailwind.config`.

## Getting started

### Prerequisites

- Node.js (LTS) and npm. Check with `node -v` and `npm -v`

### Install and run

```bash
git clone <your-frontend-repo-url>
cd chamabondo-portal-frontend
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`.

### Environment variables

Create a `.env` file in the project root:

```
VITE_API_URL=http://localhost:3000/api/v1
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API. Change it to the live URL when deployed. |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |

## Connecting to the backend

The signup form sends:

```
POST {VITE_API_URL}/auth/signup
```

with a JSON body:

```json
{
  "firstName": "Jane",
  "surname": "Moyo",
  "ecNumber": "1234567A",
  "phone": "0771234567",
  "department": "Grade 3",
  "password": "********"
}
```

The backend should:

- Create the user with the role `TEACHER` and an `approved: false` (or `active: false`) flag
- Reject duplicate EC numbers and phone numbers with a clear error
- Return errors in the shape `{ "error": { "code": "...", "message": "..." } }`

The API call lives in a separate function (for example `src/api/auth.ts`), so it can be mocked while the backend is not ready.

### CORS

The backend must allow this app's origin. Set this in the backend `.env`:

```
CORS_ORIGIN=http://localhost:5173
```

## Project structure

```
src/
  api/          API functions (signup call)
  components/   Reusable UI (form fields, buttons)
  features/
    signup/     Signup form, validation schema, page
  assets/       Logo placeholder and icons
  App.tsx
  main.tsx
tailwind.config.js
.env.example
```

## Deployment

The build output is static, so it can be hosted on Netlify, Vercel, or any static host.

1. Run `npm run build`
2. Deploy the `dist/` folder
3. Set `VITE_API_URL` on the host to the live backend URL
4. Add the frontend's live URL to `CORS_ORIGIN` on the backend

## Roadmap

- Login page
- Offline check-in and sync
- KRA and scheme book submissions
- School activities calendar
- AI drafting assistant

## Related

- Backend repo: `<link to backend repo>`

## Author

Bongelwa B. Ndlovu, capstone project, 2026.
