# One-shot prompt — paste everything below this line into Claude Sonnet 4.6

---

Build a complete, production-quality Angular application called **NagarVaani** — a civic complaint portal for Indian municipalities. Citizens file complaints through a chat-style intake (text + photo), an AI classifies them into department/category/severity, and department admins triage a queue. Frontend only; all data and AI calls go to a NestJS backend (not part of this task) under `/api/*`. Build every file: project config, design system, routing, services, guards, all pages, all shared components. Follow this spec exactly.

## 1. Stack & project setup

- Angular 22, **standalone components only** (no NgModules), lazy `loadComponent` routes.
- **Signals** for all component state (`signal()`, `computed()`, `update()`); RxJS Observables only for HTTP.
- New template control flow only: `@if` / `@for (… ; track …)` / `@switch`. Never `*ngIf`/`*ngFor`.
- Tailwind CSS 4 wired through PostCSS — **not** the Vite plugin (Angular CLI ignores root `vite.config.ts`). Create `.postcssrc.json` at project root:
  ```json
  { "plugins": { "@tailwindcss/postcss": {} } }
  ```
  Dev deps: `tailwindcss`, `@tailwindcss/postcss`.
- File naming: bare names, no suffixes — `login.ts`, `login.html`, `login.scss` (NOT `login.component.ts`). Class names without "Component" suffix: `Login`, `Dashboard`, `ComplaintIntake`, etc.
- `angular.json` styles array: `["src/tailwind.css", "src/styles.scss"]`. Schematics: `skipTests: true`, style `scss`.
- `src/app/app.html` contains exactly `<router-outlet />` and nothing else.
- `src/index.html`: title "NagarVaani — Civic Complaint Portal", meta description, `<meta name="theme-color" content="#16264e">`, and Google Fonts preconnect + stylesheet for: **Bricolage Grotesque (600,700,800), Inter (400,500,600,700), JetBrains Mono (500,600), Noto Sans Devanagari (400,600)**.

## 2. Design system — "Paper & Ink"

Aesthetic: an Indian municipal record office, modernised. Warm paper surfaces instead of cold gray, deep ink-navy primary, saffron signature accent, India-green for success. Trustworthy govt-portal feel but fresh, never generic. Bilingual touches (Devanagari taglines).

`src/tailwind.css` — exactly this:

```css
@import "tailwindcss";

@theme {
  /* Ink — primary brand (deep civic navy-blue) */
  --color-primary-50:  #eef3fc;
  --color-primary-100: #d9e4f8;
  --color-primary-200: #b3c8f0;
  --color-primary-300: #82a3e3;
  --color-primary-400: #4f7bd2;
  --color-primary-500: #2f5cbe;
  --color-primary-600: #2349a3;  /* main action color */
  --color-primary-700: #1d3b85;  /* hover */
  --color-primary-800: #1a3068;
  --color-primary-900: #16264e;  /* "ink" headings, sidebar bg */
  --color-primary-950: #0e1830;

  /* Saffron — signature accent (CTAs highlights, eyebrows, focus) */
  --color-saffron-50:  #fef7ec;
  --color-saffron-100: #fdebc8;
  --color-saffron-400: #f0a83a;
  --color-saffron-500: #e8830c;  /* brand saffron */
  --color-saffron-600: #c96a06;
  --color-saffron-700: #a5530a;

  /* India green — success / resolved */
  --color-green-600: #1a7f4b;
  --color-green-700: #15673d;

  /* Paper — warm neutrals (replaces cold gray-50/100 surfaces) */
  --color-paper-50:  #fdfcfa;   /* card surface */
  --color-paper-100: #faf8f4;   /* page background */
  --color-paper-200: #f1ede5;   /* hover fills */
  --color-paper-300: #e5dfd3;   /* borders */
  --color-paper-400: #c9c1b2;   /* strong borders / disabled */

  /* Ink text scale (warm-dark, not pure gray) */
  --color-ink-900: #1c2533;     /* headings */
  --color-ink-700: #3d4759;     /* body */
  --color-ink-500: #6b7283;     /* secondary */
  --color-ink-400: #9298a6;     /* placeholders, meta — min size 12px */

  /* Semantic */
  --color-danger-600: #d92d20;
  --color-danger-50:  #fef3f2;
  --color-warning-600: #dc6803;
  --color-warning-50:  #fffaeb;

  /* Typography */
  --font-display: "Bricolage Grotesque", "Noto Sans Devanagari", system-ui, sans-serif;
  --font-sans: "Inter", "Noto Sans Devanagari", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Radius — three tiers only */
  --radius-chip: 9999px;
  --radius-control: 0.625rem;  /* 10px — inputs, buttons, selects */
  --radius-card: 1rem;         /* 16px — cards, panels */

  /* Shadows — soft, warm, layered */
  --shadow-card: 0 1px 2px rgb(28 37 51 / 0.04), 0 4px 12px rgb(28 37 51 / 0.06);
  --shadow-raised: 0 2px 4px rgb(28 37 51 / 0.06), 0 12px 32px rgb(28 37 51 / 0.10);
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: none; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

@layer components {
  /* Signature tricolor hairline */
  .tricolor-rule {
    height: 2px;
    background: linear-gradient(90deg,
      var(--color-saffron-500) 0%, var(--color-saffron-500) 30%,
      var(--color-paper-100) 45%, var(--color-paper-100) 55%,
      var(--color-green-600) 70%, var(--color-green-600) 100%);
  }

  /* Subtle dot grid for dark brand panels */
  .dot-grid {
    background-image: radial-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  /* Ticket stub — wraps a mono ticket ID */
  .ticket-stub {
    @apply relative inline-flex items-center gap-2 font-mono font-semibold
           text-ink-900 border border-dashed border-paper-400
           bg-paper-50 rounded-control px-4 py-2;
  }
  .ticket-stub::before, .ticket-stub::after {
    content: ''; position: absolute; top: 50%; width: 10px; height: 10px;
    border-radius: 50%; background: var(--color-paper-100);
    border: 1px dashed var(--color-paper-400); transform: translateY(-50%);
  }
  .ticket-stub::before { left: -5px; }
  .ticket-stub::after  { right: -5px; }

  /* Chakra loader — the ONLY spinner in the app */
  .chakra-spinner {
    @apply inline-block size-5 rounded-full border-2 border-dashed
           border-primary-600 animate-spin;
    animation-duration: 1.2s;
  }
  .chakra-spinner--light { @apply border-white; }

  /* Skeleton */
  .skeleton { @apply animate-pulse rounded-control bg-paper-200; }

  /* Rubber-stamp status flourish */
  .stamp {
    @apply inline-block -rotate-6 border-2 font-display font-bold uppercase
           tracking-widest text-xs px-2 py-0.5 rounded-sm;
  }
}
```

`src/styles.scss`: `html, body { height: 100%; }`, body uses `font-sans` colors `bg-paper-100 text-ink-700`; headings use `--font-display`; global `:focus-visible { outline: 2px solid var(--color-saffron-500); outline-offset: 2px; }`; `::selection` saffron-tinted; `@media (prefers-reduced-motion: reduce)` guard disabling animations.

**Signature motifs — use consistently everywhere:**
- **Tricolor hairline** (`.tricolor-rule`) under navbar, atop key cards/panels.
- **Ticket-stub** treatment (`.ticket-stub`) for every mono ticket ID display.
- **Chakra spinner** (`.chakra-spinner`) — dashed-border circle, the only loading spinner.
- **Rubber stamps** (`.stamp`, rotated −6°) for RESOLVED (green) / REJECTED (red) / NOT FOUND states.
- **Bilingual taglines**: "नगरवाणी — आपकी आवाज़, आपका शहर" in Devanagari next to the brand.
- Buttons/inputs use `rounded-control`; cards `rounded-card` + `shadow-card`; chips/pills `rounded-chip`.

## 3. Data models (`src/app/core/models/`)

```typescript
// complaint.model.ts
export type ComplaintCategory = 'infrastructure' | 'sanitation' | 'water' | 'electricity' | 'road' | 'other';
export type ComplaintSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ComplaintStatus = 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'rejected';
export type Department = 'infrastructure' | 'sanitation';

export interface Location { lat: number; lng: number; address?: string; }

export interface Complaint {
  id?: string; ticketId?: string; description: string;
  category: ComplaintCategory; severity: ComplaintSeverity;
  status: ComplaintStatus; department: Department; location: Location;
  imageUrl?: string; citizenName?: string; citizenPhone?: string;
  createdAt?: Date; updatedAt?: Date;
}

export interface ChatMessage { role: 'user' | 'bot'; text: string; timestamp?: Date; imageUrl?: string; }

// user.model.ts
export type UserRole = 'citizen' | 'admin_infrastructure' | 'admin_sanitation';
export interface User {
  id?: string; name: string; digilockerId?: string; phone?: string;
  email?: string; role: UserRole; token?: string;
}
```

## 4. Core layer (`src/app/core/`)

**`services/auth.ts` — `AuthService`** (providedIn root):
- Session in `localStorage`: keys `nv_token`, `nv_user`. `currentUser = signal<User | null>(loadUser())`.
- `loginWithDigiLocker()` — redirects `window.location.href` to DigiLocker OAuth (API Setu sandbox `https://sandbox.api-setu.in/digilocker/oauth/authorize`).
- `handleOAuthCallback(code)` → POST `/api/auth/digilocker/callback` returns `{ token, user }`.
- `adminLogin(username, password)` → POST `/api/auth/admin/login` returns `{ token, user }`.
- `saveSession(token, user)`, `logout()` (clears storage, navigates `/login`), `getToken()`, `isAuthenticated()` (token presence), `isAdmin()` (role is `admin_infrastructure` or `admin_sanitation`).

**`services/complaint.ts` — `ComplaintService`**: CRUD against `/api/complaints`. Submission is **multipart `FormData`** (description, category, severity, location JSON, optional image file). Methods: `submitComplaint(formData)`, `getComplaints(filters?)`, `getComplaintById(id)`, `getComplaintByTicketId(ticketId)`, `updateStatus(id, status)`.

**`services/gemini.ts` — `GeminiService`**: AI classification proxied through the backend at `/api/gemini` (API key stays server-side — never call Gemini directly from the browser). `classify(text, imageBase64?)` returns `GeminiClassification { category, severity, department, summary }`; `chat(messages)` returns a conversational reply turn.

**`services/location.ts` — `LocationService`**: browser geolocation (`navigator.geolocation.getCurrentPosition`) + reverse geocoding via OpenStreetMap Nominatim `https://nominatim.openstreetmap.org/reverse` (the only direct external HTTP call).

**`interceptors/auth-interceptor.ts`**: functional `HttpInterceptorFn` attaching `Authorization: Bearer <token>` to every request when a token exists.

**`guards/`**: functional `CanActivateFn` — `authGuard` (token present, else redirect `/login`), `adminGuard` (token + admin role, else redirect `/admin/login`).

Register interceptor + `provideRouter(routes)` + `provideHttpClient(withInterceptors([...]))` in `app.config.ts`.

## 5. Routes (`src/app/app.routes.ts`) — exactly

```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/auth/login/login').then(m => m.Login) },
  {
    path: 'citizen', canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/citizen/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'complaint', loadComponent: () => import('./pages/citizen/complaint-intake/complaint-intake').then(m => m.ComplaintIntake) },
      { path: 'track', loadComponent: () => import('./pages/citizen/ticket-tracker/ticket-tracker').then(m => m.TicketTracker) },
    ],
  },
  { path: 'admin/login', loadComponent: () => import('./pages/admin/admin-login/admin-login').then(m => m.AdminLogin) },
  {
    path: 'admin', canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'queue', pathMatch: 'full' },
      { path: 'queue', loadComponent: () => import('./pages/admin/complaint-queue/complaint-queue').then(m => m.ComplaintQueue) },
      { path: 'complaint/:id', loadComponent: () => import('./pages/admin/complaint-detail/complaint-detail').then(m => m.ComplaintDetail) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
```

## 6. Shared components (`src/app/shared/components/`)

All use signal inputs (`input.required()`) + `computed()` for derived classes.

- **`navbar`** — sticky top, `bg-paper-50/80 backdrop-blur`, `.tricolor-rule` hairline along the bottom edge. Left: logo mark + "NagarVaani" in `font-display` + Devanagari tagline (hidden below `md`). Right: user avatar chip (initials in a saffron-tinted circle) + ghost logout button with icon and `aria-label="Log out"`. Safe at 360px width.
- **`sidebar`** (admin) — `bg-primary-950 dot-grid`, saffron logo tile, `.tricolor-rule` under header. Nav items: Queue (active = saffron left rail + lighter bg), disabled "Analytics — soon" item. Collapses to icon rail below `lg`.
- **`chat-bubble`** — `input.required<ChatMessage>()`. User bubbles: right-aligned, `bg-primary-700 text-white`, rounded-card with one square corner. Bot bubbles: left, `bg-paper-50 border border-paper-300`. Optional image thumbnail. `fadeInUp` entrance animation. Timestamp in `text-ink-400 text-xs`.
- **`severity-badge`** — `input.required<ComplaintSeverity>()`. Pill (`rounded-chip`) with leading dot: low = paper/ink muted, medium = warning amber, high = saffron, critical = danger red with **pulsing** dot.
- **`status-chip`** — `input.required<ComplaintStatus>()`. Pill with dot: submitted = primary-100/primary-700, under_review = warning, in_progress = saffron with pulsing dot, resolved = green, rejected = danger.
- **`file-upload`** — drag-and-drop zone (`border-dashed border-paper-400`, saffron border + `bg-saffron-50` on drag-over), image preview with keyboard-operable remove button (`aria-label="Remove image"`).

## 7. Pages — exact layouts

### `/login` — Citizen login (`pages/auth/login/`)
Full-screen split panel (stacks vertically below `lg`):
- **Left brand panel** (~45%): `bg-primary-950 dot-grid` with `.tricolor-rule` accent. Logo, "NagarVaani" in large `font-display`, Devanagari tagline, then 3 trust bullets with icons ("Verified via DigiLocker", "Track every complaint", "Direct to your municipal department").
- **Right form panel**: `bg-paper-100`, centered card. Heading "Welcome, citizen", sub-copy, big primary button "Login with DigiLocker" (DigiLocker styling cue), tiny "Government of India · API Setu" trust line. On click → `isRedirecting` signal shows chakra-spinner + "Redirecting to DigiLocker…". Footer link to `/admin/login` ("Department admin? Sign in here").

### `/admin/login` (`pages/admin/admin-login/`)
Centered card on `bg-primary-950 dot-grid` full-screen. Card has `.tricolor-rule` strip on top, "Department Sign-in" heading, username + password fields (proper `label for`/`id`, show-password toggle button with `aria-label` + `aria-pressed`), submit with chakra-spinner loading state. Error: `role="alert"` red banner + `shake` animation on the card. On success: `saveSession`, navigate `/admin/queue`.

### `/citizen/dashboard` (`pages/citizen/dashboard/`)
`<app-navbar />` then hero band: `bg-primary-900 dot-grid text-white`, saffron eyebrow text "CITIZEN PORTAL", "Namaste, {name}" in `font-display`, sub-copy. Below, on paper bg: two large action cards in a 2-col grid (1-col below `md`) — "File a complaint" (chat icon, saffron accent) and "Track your complaint" (ticket icon, green accent); cards `rounded-card shadow-card`, hover lifts (`-translate-y-0.5 shadow-raised`) with animated chevron. Below: muted AMC helpline strip (phone icon + "Helpline 1800-XXX-XXXX").

### `/citizen/complaint` — Chat intake (`pages/citizen/complaint-intake/`)
True full-height chat: `h-dvh` flex column.
- Slim header: back button (`aria-label`), "File a complaint" title, small status text.
- Scrollable message area (auto-scrolls to bottom on new message — `viewChild` + effect after render). Seed bot message: "Namaste! Describe your problem — add a photo if you can."
- While `messages().length <= 1`, show 5 quick-suggestion chips (e.g. "Pothole on my street", "Garbage not collected", "Street light not working", "Water leakage", "Broken footpath") that send on click.
- Typing indicator (3 bouncing dots, `aria-live="polite"`) while bot is responding.
- Composer pinned at bottom: attach button (image picker, shows attachment chip with filename + remove), auto-growing textarea (max ~5 lines), send button **disabled when empty**, all icon buttons with `aria-label`.
- Flow: user describes issue → call `GeminiService.classify()` → bot reply shows a classification summary card (category, severity badge, department) → confirm → `LocationService` grabs location → `ComplaintService.submitComplaint(FormData)` → success bubble with `.ticket-stub` ticket ID + link to tracker. (If backend absent, mock the bot turn with a `setTimeout` and a TODO comment.)

### `/citizen/track` — Ticket tracker (`pages/citizen/ticket-tracker/`)
Navbar + centered column. Search input for ticket ID + button. States:
- Initial: friendly empty state (icon + "Enter your ticket ID to see status").
- Loading: skeleton card.
- Error: red-bordered input + `role="alert"` message.
- Found: card with `.ticket-stub` ID + copy-to-clipboard button ("Copied" tooltip feedback), `status-chip`, `severity-badge`, description, photo thumbnail (click to zoom), and a **progress stepper** of the 4 happy-path statuses (submitted → under_review → in_progress → resolved): horizontal on `sm+`, vertical timeline below; done steps = green check dots, current = pulsing saffron dot, future = paper. If rejected: red REJECTED `.stamp` banner instead of stepper.

### `/admin/queue` (`pages/admin/complaint-queue/`)
Sidebar + main area (`bg-paper-100`).
- Header row: "Complaint queue" `font-display` + department name.
- **Stat strip**: 4 small cards (Total, Critical, In progress, Resolved today) computed from loaded data.
- Filter bar: segmented status chips (All / Submitted / Under review / In progress / Resolved / Rejected) + free-text search input filtering client-side (`searchText` signal + `visibleComplaints` computed).
- Desktop (`md+`): table — columns Ticket, Description (truncated), Category, Severity (badge), Status (chip), Created. **Whole row clickable** (navigates to detail, also Enter-key accessible, `cursor-pointer`, hover `bg-paper-200`), severity-colored 3px left rail on each row, critical rows tinted `bg-danger-50/40`.
- Below `md`: card list with same data.
- Loading: 6 skeleton rows. Empty: distinguish "no complaints at all" vs "nothing matches filters" (offer clear-filters button).

### `/admin/complaint/:id` (`pages/admin/complaint-detail/`)
Sidebar + main. Back link to queue. Two-column (`lg+`; stacks below): 
- **Left**: card with `.ticket-stub` header, status-chip + severity-badge, full description, photo (click to zoom), meta rows with icons (citizen name, phone, created/updated dates), location address + "Open in map ↗" link to OpenStreetMap (`https://www.openstreetmap.org/?mlat={lat}&mlon={lng}`).
- **Right (sticky)**: "Update status" panel — radio-tile list of the 5 statuses (selected tile = saffron ring, use `has-checked:` styling), Apply button with loading spinner. **Rejecting requires two-step confirm** ("Confirm rejection" appears for 3 s). Success: `role="status"` green banner. If resolved/rejected, show rotated `.stamp` across the card corner.
- Not-found state: NOT FOUND `.stamp` + back link. Loading: layout skeleton.

## 8. Accessibility & quality bar

- Every form input has `label[for]` + `id`. Every icon-only button has `aria-label`. Errors use `role="alert"`; async success uses `role="status"`. Typing indicator `aria-live="polite"`.
- Visible saffron `:focus-visible` outline everywhere. Keyboard: rows/cards activatable with Enter.
- `prefers-reduced-motion` disables animations.
- Responsive: 360px → desktop. Tables get card fallbacks below `md`. Sidebar collapses below `lg`.
- No `any` types. Strong typing from the models above. No `console.log`.
- Final check: `ng build` must pass with zero errors.

Build the entire application now — every file, complete and runnable with `npm install && ng serve`.