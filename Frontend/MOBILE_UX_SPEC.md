# NagarVaani — Mobile UX Specification

**Audit date:** 2026-06-13  
**Target minimum viewport:** 360 px wide  
**Breakpoints in use:** sm 640 · md 768 · lg 1024 · xl 1280  
**Angular version:** 22 · Styling: Tailwind CSS 4

---

## Priority legend

| Code | Meaning |
|---|---|
| P0 | Layout breaks — content overflows, becomes inaccessible, or the page is unusable on mobile |
| P1 | Usability pain — works technically but creates friction that causes task abandonment |
| P2 | Polish — suboptimal experience that does not block task completion |

---

## Executive summary of issues found

| Page | P0 | P1 | P2 |
|---|---|---|---|
| Citizen login | 1 | 2 | 1 |
| Admin login | 0 | 1 | 1 |
| Citizen dashboard | 0 | 1 | 1 |
| Complaint intake | 1 | 3 | 1 |
| Ticket tracker | 0 | 2 | 1 |
| Admin complaint queue | 2 | 2 | 1 |
| Admin complaint detail | 1 | 2 | 1 |
| Navbar | 0 | 1 | 1 |
| Sidebar | 2 | 1 | 0 |

---

## 1. Shared components

### 1.1 Navbar (`navbar.html`)

**Issues found**

| Priority | Issue | Location |
|---|---|---|
| P1 | Logout button shows only icon on mobile (≤ sm). The icon-only touch target (`px-2 py-1.5`) computes to approximately 32 × 32 px — below the 44 × 44 px minimum. | `button[logout]` |
| P2 | Devanagari subtitle hidden on mobile via `hidden md:block` is intentional but makes the brand look thin; a shorter Hindi tagline at `text-[10px]` visible on all widths would improve identity | `.text-xs.hidden.md:block` |

**Changes required**

```
Logout button touch target — increase padding to min 44×44 px on mobile:
  CURRENT:  class="... px-2 py-1.5 ..."
  ADD:      class="... px-2 py-1.5 sm:py-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 ..."

Alternative (cleaner): wrap icon in a 44×44 tap region on mobile
  class="flex items-center gap-1.5 text-sm ... p-2.5 sm:px-2 sm:py-1.5"
```

---

### 1.2 Admin sidebar (`sidebar.html`) — P0

**Issue:** The sidebar is a fixed-width (`w-64` or `w-16`) `h-screen` aside. On any viewport below 768 px it occupies the full left side of the screen, leaving zero or negative width for the main content. There is no mobile breakpoint, no overlay, and no close gesture. The page is completely unusable on mobile.

**Recommended solution: slide-over drawer with overlay**

The sidebar should:
1. Be hidden entirely on mobile (`< md`), replaced by a hamburger button in the top-left of the page header.
2. On trigger, slide in as a full-height fixed drawer from the left (`translate-x-0`), overlaid by a semi-transparent backdrop.
3. Close on: overlay tap, Escape key press, or navigation (routerLinkActive change).
4. On `md+` viewports, revert to the existing collapsed/expanded rail behaviour.

**Tailwind class changes — sidebar element**

```
CURRENT:
  <aside
    [class.w-64]="!isCollapsed()"
    [class.w-16]="isCollapsed()"
    class="relative flex flex-col h-screen bg-[color:var(--color-primary-950)] transition-[width] duration-200 ease-in-out overflow-hidden shrink-0 dot-grid"

REPLACE WITH:
  <aside
    [class.w-64]="!isCollapsed()"
    [class.w-16]="isCollapsed() && !isMobileOpen()"
    [class.-translate-x-full]="!isMobileOpen()"
    [class.translate-x-0]="isMobileOpen()"
    class="fixed md:relative z-40 flex flex-col h-screen bg-[color:var(--color-primary-950)]
           transition-transform md:transition-[width] duration-200 ease-in-out
           overflow-hidden shrink-0 dot-grid
           w-72 md:w-auto
           -translate-x-full md:translate-x-0"
```

**Overlay backdrop (add as sibling of aside, inside the layout shell)**

```html
<!-- Mobile sidebar overlay -->
@if (isMobileOpen()) {
  <div
    class="fixed inset-0 z-30 bg-[color:var(--color-primary-950)]/60 md:hidden"
    aria-hidden="true"
    (click)="closeMobileSidebar()">
  </div>
}
```

**Hamburger button — add to every admin page header**

Place inside the existing header `div.flex.flex-wrap.items-center.justify-between` as the first child on mobile:

```html
<button
  type="button"
  (click)="openMobileSidebar()"
  aria-label="Open navigation menu"
  aria-expanded="false"
  class="md:hidden flex items-center justify-center size-11 rounded-lg
         text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-paper-200)]
         transition-colors focus-visible:outline-none
         focus-visible:ring-2 focus-visible:ring-[color:var(--color-saffron-500)]">
  <svg class="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
    <path d="M3 5h14M3 10h14M3 15h14" stroke-linecap="round"/>
  </svg>
</button>
```

**Component changes required in `sidebar.component.ts`**

- Add signal: `isMobileOpen = signal(false)`
- Add methods: `openMobileSidebar()`, `closeMobileSidebar()`
- Subscribe to router events to auto-close on navigation: `router.events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed()).subscribe(() => this.isMobileOpen.set(false))`
- Listen for Escape: `@HostListener('document:keydown.escape')` calls `closeMobileSidebar()`

**Layout shell change — admin pages (`complaint-queue.html`, `complaint-detail.html`)**

```
CURRENT:  <div class="flex h-screen overflow-hidden bg-[color:var(--color-paper-100)]">
REPLACE:  <div class="flex h-screen overflow-hidden bg-[color:var(--color-paper-100)] relative">
```

---

## 2. Per-page changes

### 2.1 Citizen login (`login.html`)

**Issues found**

| Priority | Issue |
|---|---|
| P0 | Left brand panel (`lg:w-[45%]`) is visible on all viewports below `lg` — it stacks above the form, adding 300–400 px of scroll before the user reaches the login button. On 360 px with trust bullets it can push the button entirely off-screen. |
| P1 | Brand panel hero text (`text-3xl md:text-4xl lg:text-5xl`) is fine in size, but the trust bullet list inside adds substantial height with no `max-h` or collapse on mobile. |
| P1 | Login card padding `-mx-8 md:-mx-10 -mt-8 md:-mt-10` for the tricolor strip uses negative margins that at 360 px can cause 1 px horizontal overflow on the right. |
| P2 | Footer "© 2024 NagarVaani" inside the brand panel is hidden on mobile since the panel is de-prioritised, but the admin link below the card is the last thing shown — acceptable. |

**Changes required**

```
Left brand panel — hide on mobile, show from lg:
  CURRENT:  <div class="lg:w-[45%] bg-[...] flex flex-col justify-between px-8 py-12 md:px-12 lg:px-16">
  REPLACE:  <div class="hidden lg:flex lg:w-[45%] bg-[...] flex-col justify-between px-8 py-12 md:px-12 lg:px-16">

Right form panel — on mobile it should be the only content, full height:
  CURRENT:  <div class="flex-1 bg-[...] flex items-center justify-center px-6 py-16 lg:px-12">
  REPLACE:  <div class="flex-1 bg-[...] flex items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-12">

Login card — safe negative margins on mobile:
  CURRENT inner strip:  class="tricolor-rule -mx-8 md:-mx-10 -mt-8 md:-mt-10 mb-8 rounded-t-[var(--radius-card)]"
  REPLACE:              class="tricolor-rule -mx-8 md:-mx-10 -mt-8 md:-mt-10 mb-6 md:mb-8 rounded-t-[var(--radius-card)]"

Login card padding — prevent card from being too tight on 360 px:
  CURRENT:  class="... p-8 md:p-10"
  REPLACE:  class="... p-6 sm:p-8 md:p-10"

Login button — ensure 44px min height on mobile:
  Already py-4 = 32 px content + 2×16 px padding = 64 px. OK — no change needed.

Mobile-only brand compact header — add above the card on small screens:
  Insert inside the form panel, before the w-full.max-w-md div, visible only on <lg:
  
  <div class="lg:hidden flex items-center justify-center gap-3 mb-8">
    <svg class="size-8 shrink-0" ...>...</svg>
    <div>
      <p class="text-lg font-bold text-[color:var(--color-primary-900)]" style="font-family: var(--font-display)">NagarVaani</p>
      <p class="text-xs text-[color:var(--color-ink-500)]" style="font-family: var(--font-sans)">नगरवाणी — आपकी आवाज़, आपका शहर</p>
    </div>
  </div>
```

---

### 2.2 Admin login (`admin-login.html`)

**Issues found**

| Priority | Issue |
|---|---|
| P1 | Card padding `p-8` inside a `px-4` page container means the card uses `w-full max-w-md`. At 360 px that gives 360 − 32 = 328 px card. With `p-8` (32 px) inner padding, usable content width is 264 px. Text at `text-sm` (14 px) is fine, but the password reveal button (`px-3`) may be tight alongside `pr-11` input on narrow screens. |
| P2 | Shake animation `shakeCard()` triggers layout shift on mobile; should use `transform: translateX` instead of `margin`-based approaches — currently defined in global CSS, verify no margin shift. |

**Changes required**

```
Card inner padding — reduce on mobile:
  CURRENT:  <div class="p-8">
  REPLACE:  <div class="p-6 sm:p-8">

Password input right padding — already pr-11 which equals 44 px. OK at 360 px.

Page vertical padding — avoid excessive top space on short mobile screens:
  CURRENT:  class="min-h-screen ... px-4 py-12"
  REPLACE:  class="min-h-screen ... px-4 py-8 sm:py-12"
```

---

### 2.3 Citizen dashboard (`dashboard.html`)

**Issues found**

| Priority | Issue |
|---|---|
| P1 | Hero section padding `py-14 md:py-20 px-6 md:px-12` — at 360 px with `py-14` (56 px top/bottom) and the large h1 (`text-3xl md:text-4xl`), the hero consumes ~240 px before the action cards appear. On a 640 px tall phone this pushes the CTAs below the fold. |
| P2 | Helpline strip uses `flex items-center` with the `<p>` containing inline spans. At 360 px the phone number and hours can wrap awkwardly inside the inline text flow. |

**Changes required**

```
Hero padding — reduce on mobile:
  CURRENT:  class="... px-6 py-14 md:px-12 md:py-20"
  REPLACE:  class="... px-4 py-8 sm:px-6 sm:py-14 md:px-12 md:py-20"

Hero h1 — current text-3xl is appropriate at 360 px (30 px). OK.

Tricolor rule bottom margin in hero:
  CURRENT:  class="tricolor-rule mt-12 max-w-4xl mx-auto"
  REPLACE:  class="tricolor-rule mt-8 sm:mt-12 max-w-4xl mx-auto"

Main content padding:
  CURRENT:  class="flex-1 max-w-4xl mx-auto w-full px-6 md:px-12 py-10"
  REPLACE:  class="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-12 py-8 sm:py-10"

Action cards — already grid-cols-1 md:grid-cols-2. OK.

Card padding — at 360 px p-7 (28 px) is generous; can reduce on mobile:
  CURRENT:  class="... p-7 ..."
  REPLACE:  class="... p-5 sm:p-7 ..."

Helpline strip — make phone number and hours stack on very narrow screens:
  CURRENT:  <p class="text-sm text-[...]">
              <span>AMC Helpline:</span>
              <a href="tel:...">1800-123-4567</a>
              <span class="text-[...] ml-2">· Mon–Sat, 8 AM – 8 PM</span>
            </p>
  REPLACE:  wrap in flex-col on mobile:
  <div class="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-0">
    <p class="text-sm ..."><span>AMC Helpline:</span> <a>1800-123-4567</a></p>
    <span class="text-xs text-[...] sm:ml-2">Mon–Sat, 8 AM – 8 PM</span>
  </div>
```

---

### 2.4 Complaint intake / chat interface (`complaint-intake.html`)

**Issues found**

| Priority | Issue |
|---|---|
| P0 | The page uses `h-dvh flex flex-col` which is correct for keyboard-aware layout. However, the composer footer (`p-4` = 16 px all sides) is `shrink-0` which pins it. The risk is: on iOS Safari with the address bar visible + the keyboard open, the `dvh` unit correctly shrinks, but older iOS (< 15.4) treats `100dvh` as `100svh`. Since this targets India where mid-range Android is dominant (Chrome/WebView), `dvh` is well-supported but should be tested. The critical issue is the `Enter to send · Shift+Enter for new line` hint text — this is desktop-only behaviour. On mobile, Enter on a physical keyboard sends, but most users will use the soft keyboard and tap the send button. This instructional copy should be mobile-conditionally hidden. |
| P1 | Quick suggestion chips use `text-xs px-3 py-1.5` which gives ~28 px height — below the 44 px touch target minimum. |
| P1 | File upload component sits above the textarea inside the composer. On a narrow screen this can push the textarea and send button partially below the visible area when the keyboard is open. The file upload should collapse to a single icon button on mobile. |
| P1 | `max-h-32` on the textarea caps it at 128 px. On mobile this is fine, but combined with the file upload component and hint text, the total composer height can reach 120–150 px, which eats into the message area when keyboard is up. |
| P2 | The success ticket block uses `text-base` which renders at 16 px — acceptable, but `ticket-stub` class styling should be verified to not use fixed pixel widths. |

**Changes required**

```
Quick suggestion chips — increase touch target:
  CURRENT:  class="text-xs font-medium px-3 py-1.5 rounded-full border ..."
  REPLACE:  class="text-xs font-medium px-3 py-2 sm:py-1.5 rounded-full border ..."
  This gives ~32 px height + surrounding flex gap. For full 44 px compliance:
  class="text-xs font-medium px-3 min-h-[44px] sm:min-h-0 sm:py-1.5 py-2.5 rounded-full border ..."

Desktop keyboard hint — hide on mobile:
  CURRENT:  <p class="text-xs text-[...] mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
  REPLACE:  <p class="hidden sm:block text-xs text-[...] mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>

File upload — collapse to icon on mobile (requires change in file-upload component):
  In the composer div:
  CURRENT:  <div class="mb-3"><app-file-upload ...></app-file-upload></div>
  REPLACE:  <div class="flex items-end gap-2">
              <!-- Icon-only file attach on mobile, full upload on sm+ -->
              <div class="sm:hidden shrink-0">
                <!-- Attach icon button — delegates to app-file-upload click -->
                <button type="button" aria-label="Attach photo"
                  class="size-11 flex items-center justify-center rounded-[var(--radius-control)]
                         border border-[color:var(--color-paper-400)] bg-white
                         text-[color:var(--color-ink-500)] transition-colors
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[color:var(--color-saffron-500)]">
                  <svg class="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                    <path d="M4 16V6a2 2 0 012-2h8a2 2 0 012 2v10" stroke-linecap="round"/>
                    <path d="M10 4v8M7 9l3-3 3 3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div class="hidden sm:block mb-3 w-full"><app-file-upload ...></app-file-upload></div>
              <!-- Textarea + send moved inside this flex row on mobile -->
              ...
            </div>
  
  Simpler approach — keep current structure but wrap the upload in:
  <div class="mb-3 hidden sm:block"><app-file-upload ...></app-file-upload></div>
  And add an attach icon inline with the textarea row:
  Textarea row becomes:
  <div class="flex items-end gap-2">
    <!-- Attach icon (mobile only) -->
    <button class="sm:hidden size-11 shrink-0 ..."><!-- paperclip icon --></button>
    <textarea ...></textarea>
    <button type="submit" class="size-11 sm:size-12 ...">...</button>
  </div>

Composer total height — add safe-area padding for iOS home bar:
  CURRENT:  <div class="bg-[...] border-t ... p-4 shrink-0">
  REPLACE:  <div class="bg-[...] border-t ... p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0">
```

---

### 2.5 Ticket tracker (`ticket-tracker.html`)

**Issues found**

| Priority | Issue |
|---|---|
| P1 | Search row `flex gap-2` with a `flex-1` input and a `px-5 py-3` Track button. At 360 px the button becomes ~68 px wide and the input ~268 px. The button height from `py-3` is 48 px — OK. However the input `py-3` also gives 48 px height. Both are fine. The issue is the Track button label "Track" is four characters; if the locale changes or the label grows it will break. Minor. The larger issue: `flex gap-2` means at 360 px with browser font scaling the button could crowd the input. Recommend `shrink-0` on the button. |
| P1 | The horizontal progress stepper (`hidden sm:flex`) appears at ≥ 640 px. Below that, the vertical stepper is shown. The vertical stepper step circles are `size-6` (24 × 24 px) — below 44 px touch target. These are non-interactive display elements (no click handler), so this is a visual concern rather than a functional one. However the step labels use `text-sm` which is correct. |
| P2 | Complaint detail card padding `p-6 md:p-8` — at 360 px that is 24 px each side, leaving 360 − 2×24 = 312 px. Combined with `max-w-2xl mx-auto w-full px-4` outer padding, actual inner width is 360 − 8 − 8 − 24 − 24 = 296 px. Tight but functional. |

**Changes required**

```
Track button — prevent shrink:
  CURRENT:  <button type="button" (click)="search()" [disabled]="..." class="px-5 py-3 ...">Track</button>
  ADD:      class="px-5 py-3 shrink-0 ..."

Ticket stub + copy button row — already flex-wrap. OK.

Complaint card padding:
  CURRENT:  class="... p-6 md:p-8"
  REPLACE:  class="... p-4 sm:p-6 md:p-8"

Image zoom modal — already covers full screen with p-4. Fine on mobile.
```

---

### 2.6 Admin complaint queue (`complaint-queue.html`)

**Issues found**

| Priority | Issue |
|---|---|
| P0 | The entire page layout is `flex h-screen overflow-hidden` with `app-sidebar` as a sibling. As described in §1.2, the sidebar occupies the full left on mobile, making the queue invisible. This is resolved by the sidebar drawer fix. |
| P0 | Once the sidebar fix is applied, the main content div has `p-6` outer padding. At 360 px this leaves 360 − 2×24 = 312 px for content. Stat strip `grid-cols-2 lg:grid-cols-4 gap-4` correctly shows 2 columns on mobile. This is OK. |
| P1 | Filter bar: status filter buttons `px-3 py-1.5 text-xs` give ~28 px height. Below 44 px touch target. |
| P1 | Search input `px-3 py-1.5` gives ~28 px height. The search uses `ml-auto` meaning on narrow screens it may be pushed to a new row (already using `flex-wrap`) but then its width is unconstrained. Add `w-full sm:w-auto` to make it fill the row on mobile. |
| P2 | Mobile card list already implemented (`md:hidden space-y-3`) — this is well-designed. Cards have `p-4` which is sufficient. |

**Changes required**

```
Content padding — reduce on mobile:
  CURRENT:  <div class="p-6">
  REPLACE:  <div class="p-4 sm:p-6">

Header padding:
  CURRENT:  class="... px-6 py-5 ..."
  REPLACE:  class="... px-4 sm:px-6 py-4 sm:py-5 ..."

Stat strip — keep grid-cols-2 on mobile; padding reduction:
  CURRENT:  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  OK — no change needed to grid. Stat card p-4 is fine.

Filter buttons — increase touch target:
  CURRENT:  class="px-3 py-1.5 text-xs font-semibold rounded-full border ..."
  REPLACE:  class="px-3 py-2 sm:py-1.5 text-xs font-semibold rounded-full border ..."
  This gives ~32 px — closer to target. To hit 44 px use min-h-[44px] with flex items-center.

Search input — fill row on mobile:
  CURRENT:  <div class="ml-auto">
  REPLACE:  <div class="ml-auto w-full sm:w-auto">
  Input itself:
  CURRENT:  class="px-3 py-1.5 text-sm ..."
  REPLACE:  class="w-full sm:w-auto px-3 py-2 sm:py-1.5 text-sm ..."

Filter bar container — ensure search always below filter chips on mobile:
  CURRENT:  <div class="flex flex-wrap items-center gap-2 mb-5">
  OK — flex-wrap already handles this.

Mobile card touch target — cards are large enough (full-width tap area). OK.
```

---

### 2.7 Admin complaint detail (`complaint-detail.html`)

**Issues found**

| Priority | Issue |
|---|---|
| P0 | Same sidebar P0 as complaint queue — resolved by the sidebar drawer fix. |
| P1 | Two-column layout `lg:grid-cols-[1fr_340px]` collapses to single column below `lg`. On mobile (below `lg`) the right "Update status" panel appears below the main complaint card. This is correct stacking behaviour. However the `lg:sticky lg:top-6` on the status panel is desktop-only. On mobile, the status panel sits after potentially long complaint content. Add a floating "Update Status" action button on mobile that scrolls to or expands the panel. |
| P1 | Content padding `p-6` inside `flex-1 overflow-y-auto` — at 360 px this gives 312 px usable. Adequate. But the `p-8` on the left card becomes `p-6 md:p-8` — the `md:p-8` increase only kicks at 768 px, leaving `p-6` from 360–767 px. OK. |
| P2 | Absolute positioned stamps (`absolute -top-2 -right-2 rotate-6`) can clip outside the card's overflow on very narrow screens. The card has `overflow-hidden` which will clip them. At 360 px with `p-6` card padding, the stamp area is fine. |

**Changes required**

```
Main content padding — reduce on mobile:
  CURRENT:  <div class="flex-1 overflow-y-auto p-6">
  REPLACE:  <div class="flex-1 overflow-y-auto p-4 sm:p-6">

Back link touch target:
  CURRENT:  class="flex items-center gap-1.5 text-sm ... mb-5 ..."
  The link has no explicit min-height. Add:
  class="flex items-center gap-1.5 text-sm ... mb-5 min-h-[44px] ..."

Left card padding — already responsive via tricolor rule negative margins:
  CURRENT:  <div class="... p-6 md:p-8 overflow-hidden">
  REPLACE:  <div class="... p-4 sm:p-6 md:p-8 overflow-hidden">
  And tricolor strip:
  CURRENT:  class="tricolor-rule -mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-6 rounded-t-[var(--radius-card)]"
  REPLACE:  class="tricolor-rule -mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 mb-5 sm:mb-6 rounded-t-[var(--radius-card)]"

Status panel — add mobile shortcut anchor:
  Add an id to the status panel for scroll-target:
  CURRENT:  <div class="lg:sticky lg:top-6">
  REPLACE:  <div id="status-panel" class="lg:sticky lg:top-6">

  Add floating FAB on mobile above the panel (inside the complaint detail @if block, 
  before the grid, shown only when complaint is loaded and not resolved/rejected):
  
  @if (!isResolved() && !isRejected()) {
    <a href="#status-panel"
      class="lg:hidden flex items-center gap-2 mb-4 text-sm font-semibold
             px-4 py-3 rounded-[var(--radius-control)] w-full justify-center
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-saffron-500)]"
      style="background: var(--color-primary-600); color: white; font-family: var(--font-sans);">
      <svg class="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 2v12M3 10l5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Update status
    </a>
  }

Radio tile touch target — already px-3 py-2.5 which gives ~44 px height. OK.
Apply status button — py-3 gives ~48 px. OK.
```

---

## 3. Cross-cutting issues summary

### 3.1 Touch target audit

Elements confirmed below 44 × 44 px on mobile:

| Component | Element | Current size (approx) | Fix |
|---|---|---|---|
| Navbar | Logout button | 32 × 32 px | `min-h-[44px] min-w-[44px]` on mobile |
| Complaint intake | Quick suggestion chips | 28 px height | `py-2.5` instead of `py-1.5` |
| Complaint queue | Filter status pills | 28 px height | `py-2` instead of `py-1.5` |
| Complaint queue | Search input | 28 px height | `py-2` instead of `py-1.5` |
| Complaint detail | Back link | ~20 px height | `min-h-[44px]` |

### 3.2 Text size check

All body text uses `text-sm` (14 px) or `text-xs` (12 px). The `text-xs` instances used for:
- Eyebrow labels, meta timestamps, badge text — acceptable at 12 px for supplementary content.
- Validation error messages — `text-xs` on error copy is borderline. Consider `text-sm` for errors specifically to help users in outdoor / high-ambient-light conditions common in India.

```
Admin login error text:
  CURRENT:  <p class="mt-1 text-xs" style="color: var(--color-danger-600)">...</p>
  REPLACE:  <p class="mt-1 text-[13px] sm:text-xs" style="color: var(--color-danger-600)">...</p>
```

### 3.3 Horizontal scroll risk

No hard-coded pixel widths found that would cause overflow. The `max-w-xs` on description cells is table-only and already uses the `hidden md:block` guard. The `w-16` sidebar in collapsed state is explicit but safe since sidebar is `shrink-0`. No horizontal scroll risk after sidebar fix is applied.

### 3.4 Safe-area insets

Only the complaint intake composer needs `env(safe-area-inset-bottom)` padding because it is pinned to the bottom of the screen. No other pinned-bottom elements exist. Add `pb-[max(1rem,env(safe-area-inset-bottom))]` to the composer wrapper as specified in §2.4.

---

## 4. Admin sidebar mobile solution (detailed spec)

This section expands §1.2 into a complete implementable spec.

### Trigger mechanism
- On `< md` viewports: hamburger icon (`☰`) in the top-left of the admin page header.
- The hamburger replaces nothing — the existing header title stays; the hamburger is prepended.

### Drawer behaviour
- Width: `w-72` (288 px) — enough for label text, does not cover the full viewport width.
- Position: `fixed left-0 top-0 h-screen z-40`.
- Transition: `transform duration-200 ease-in-out` — `translate-x-0` open / `-translate-x-full` closed.
- Backdrop: `fixed inset-0 z-30 bg-primary-950/60` sibling overlay, click closes drawer.
- Escape key: `document:keydown.escape` closes drawer.
- Route change: `NavigationEnd` event closes drawer.
- Focus management: on open, focus the first nav link inside the sidebar; on close, return focus to the hamburger button.

### Collapsed-rail on desktop
- On `md+`: existing collapse/expand toggle remains. `isMobileOpen` signal is irrelevant above `md` since the CSS `md:translate-x-0` overrides the transform.

### Signal additions to `sidebar.component.ts`

```typescript
isMobileOpen = signal(false)

openMobileSidebar(): void {
  this.isMobileOpen.set(true)
}

closeMobileSidebar(): void {
  this.isMobileOpen.set(false)
}

constructor() {
  const router = inject(Router)
  const destroyRef = inject(DestroyRef)
  
  router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    takeUntilDestroyed(destroyRef)
  ).subscribe(() => this.isMobileOpen.set(false))
}

@HostListener('document:keydown.escape')
onEscape(): void {
  if (this.isMobileOpen()) this.closeMobileSidebar()
}
```

---

## 5. Complaint intake — keyboard-aware layout spec

### Current implementation
The page already uses `h-dvh flex flex-col` which is the correct approach. The composer is `shrink-0` and pinned at the bottom. The message area is `flex-1 overflow-y-auto`. This structure is correct.

### Remaining issues to fix

**dvh fallback for older Android WebView (< Chrome 108)**

```scss
/* In complaint-intake.component.scss or global styles */
.intake-shell {
  height: 100vh;         /* fallback */
  height: 100dvh;        /* modern */
}
```

In the template:
```
CURRENT:  <div class="h-dvh flex flex-col ...">
REPLACE:  <div class="h-[100vh] h-dvh flex flex-col ...">
```

Note: Tailwind 4 supports `h-dvh` natively. The `h-[100vh]` fallback is for browsers that do not recognise `dvh`. In Tailwind 4 you can use `@supports` in CSS instead if preferred.

**Composer layout on mobile — final spec**

```html
<!-- Composer pinned at bottom — mobile-optimised layout -->
@if (currentStep() !== 'done') {
  <div class="bg-[color:var(--color-paper-50)] border-t border-[color:var(--color-paper-300)]
              px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
    
    <!-- Full upload widget: visible on sm+, hidden on mobile -->
    <div class="hidden sm:block mb-3">
      <app-file-upload (fileChange)="onFileChange($event)"></app-file-upload>
    </div>

    <!-- Input row -->
    <div class="flex items-end gap-2">
      
      <!-- Attach icon: mobile only -->
      <button
        type="button"
        aria-label="Attach a photo"
        class="sm:hidden size-11 shrink-0 flex items-center justify-center
               rounded-[var(--radius-control)] border transition-colors
               text-[color:var(--color-ink-400)] hover:text-[color:var(--color-ink-700)]
               hover:bg-[color:var(--color-paper-200)]
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-saffron-500)]"
        style="border-color: var(--color-paper-400); background: white">
        <svg class="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor"
             stroke-width="1.6" aria-hidden="true">
          <path d="M15 8l-5-5-5 5M10 3v10" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 17h14" stroke-linecap="round"/>
        </svg>
      </button>

      <textarea
        [(ngModel)]="inputText"
        (keydown)="onTextareaKeydown($event)"
        rows="1"
        class="flex-1 resize-none rounded-[var(--radius-control)] px-3 sm:px-4 py-3
               text-sm border outline-none transition-all
               min-h-[44px] max-h-32 overflow-y-auto"
        style="border-color: var(--color-paper-400); background: white;
               color: var(--color-ink-900); font-family: var(--font-sans);"
        onfocus="this.style.borderColor='var(--color-saffron-500)';
                 this.style.boxShadow='0 0 0 3px rgba(232,131,12,0.15)'"
        onblur="this.style.boxShadow='none'"
        [attr.aria-label]="currentStep() === 'confirming'
          ? 'Reply yes to confirm or rephrase your complaint'
          : 'Describe your civic problem'"
        [placeholder]="currentStep() === 'confirming'
          ? 'Type yes to confirm or rephrase…'
          : 'Describe your problem…'">
      </textarea>

      <button
        type="button"
        (click)="onSend()"
        [disabled]="!canSend()"
        aria-label="Send message"
        class="size-11 shrink-0 rounded-[var(--radius-control)] flex items-center
               justify-center transition-all duration-150
               disabled:opacity-40 disabled:cursor-not-allowed
               focus-visible:outline-none focus-visible:ring-2
               focus-visible:ring-[color:var(--color-saffron-500)]"
        style="background: var(--color-primary-600);"
        onmouseover="if(!this.disabled) this.style.background='var(--color-primary-700)'"
        onmouseout="this.style.background='var(--color-primary-600)'">
        @if (isTyping()) {
          <span class="chakra-spinner chakra-spinner--light size-4" aria-hidden="true"></span>
        } @else {
          <svg class="size-5 text-white" viewBox="0 0 20 20" fill="none"
               stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M4 10h12M11 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        }
      </button>
    </div>

    <!-- Desktop hint only -->
    <p class="hidden sm:block text-xs text-[color:var(--color-ink-400)] mt-2 text-center"
       style="font-family: var(--font-sans)">
      Press Enter to send · Shift+Enter for new line
    </p>
  </div>
}
```

---

## 6. Table → card fallback spec for complaint queue

The complaint queue already implements a `hidden md:block` table + `md:hidden` card list pattern. This is architecturally correct. The following spec documents the card design in full for implementation reference and identifies the remaining gaps.

### Current card implementation (complaint-queue mobile cards)

```html
<!-- Each card — current state -->
<div class="rounded-[var(--radius-card)] bg-[color:var(--color-paper-50)]
            border border-l-4 p-4 cursor-pointer transition-all"
     [style.borderLeftColor]="severityBorderColor(complaint.severity)"
     [class.bg-red-50]="isCriticalRow(complaint.severity)"
     (click)="navigateToDetail(complaint.id)"
     style="box-shadow: var(--shadow-card)">
  <div class="flex items-start justify-between gap-2 mb-2">
    <span class="text-xs font-mono font-semibold text-[...]">{{ complaint.ticketId }}</span>
    <app-status-chip [status]="complaint.status"></app-status-chip>
  </div>
  <p class="text-sm text-[...] line-clamp-2 mb-2">{{ complaint.description }}</p>
  <div class="flex items-center gap-2 flex-wrap">
    <app-severity-badge [severity]="complaint.severity"></app-severity-badge>
    <span class="text-xs text-[...]">{{ categoryLabel(complaint.category) }}</span>
    <span class="ml-auto text-xs text-[...]">{{ complaint.createdAt | date:'MMM d' }}</span>
  </div>
</div>
```

### Issues with current card

| Issue | Fix |
|---|---|
| Card is not keyboard accessible — `(click)` only, no `tabindex`, no `(keydown.enter)` | Add `tabindex="0"` and `(keydown.enter)="navigateToDetail(complaint.id)"` and `role="button"` |
| No ARIA label for card as a whole | Add `[attr.aria-label]="'View complaint ' + complaint.ticketId"` |
| Critical row uses `[class.bg-red-50]` but `bg-red-50` may not align with the design token system | Replace with `[class]="isCriticalRow(complaint.severity) ? 'bg-[rgba(217,45,32,0.04)]' : ''"` |

### Complete corrected mobile card

```html
<div
  class="rounded-[var(--radius-card)] bg-[color:var(--color-paper-50)]
         border border-l-4 p-4 cursor-pointer transition-all
         focus-visible:outline-none focus-visible:ring-2
         focus-visible:ring-[color:var(--color-saffron-500)]"
  [style.borderLeftColor]="severityBorderColor(complaint.severity)"
  [class]="isCriticalRow(complaint.severity) ? 'bg-[rgba(217,45,32,0.04)]' : ''"
  (click)="navigateToDetail(complaint.id)"
  (keydown.enter)="navigateToDetail(complaint.id)"
  tabindex="0"
  role="button"
  [attr.aria-label]="'View complaint ' + (complaint.ticketId ?? complaint.id)"
  style="box-shadow: var(--shadow-card)">

  <!-- Row 1: ticket ID + status -->
  <div class="flex items-start justify-between gap-2 mb-2">
    <span class="text-xs font-mono font-semibold text-[color:var(--color-ink-700)] truncate">
      {{ complaint.ticketId ?? '—' }}
    </span>
    <app-status-chip [status]="complaint.status"></app-status-chip>
  </div>

  <!-- Row 2: description -->
  <p class="text-sm text-[color:var(--color-ink-700)] line-clamp-2 mb-2"
     style="font-family: var(--font-sans)">
    {{ complaint.description }}
  </p>

  <!-- Row 3: severity + category + date -->
  <div class="flex items-center gap-2 flex-wrap">
    <app-severity-badge [severity]="complaint.severity"></app-severity-badge>
    <span class="text-xs text-[color:var(--color-ink-400)]"
          style="font-family: var(--font-sans)">
      {{ categoryLabel(complaint.category) }}
    </span>
    <span class="ml-auto text-xs text-[color:var(--color-ink-400)]"
          style="font-family: var(--font-mono)">
      {{ complaint.createdAt | date:'MMM d' }}
    </span>
  </div>
</div>
```

### Skeleton cards — already implemented; no changes needed

---

## 7. Implementation priority order

Execute changes in this order to maximise impact per session:

1. **Sidebar drawer** — P0, blocks all admin pages on mobile. Implement signal, CSS class changes, overlay, hamburger. (§1.2 + §4)
2. **Citizen login brand panel** — P0, blocks form visibility below `lg`. One-line class change. (§2.1)
3. **Complaint intake composer** — P0/P1, safe-area + keyboard hint + attach icon. (§2.4 + §5)
4. **Touch targets** — P1, five elements across four components. Padding increments. (§3.1)
5. **Mobile card accessibility** — P1, tabindex + keydown + aria-label on queue cards. (§6)
6. **Dashboard hero padding** — P1, reduces scroll-to-CTA distance. (§2.3)
7. **Complaint detail back-link + scroll anchor** — P1. (§2.7)
8. **Admin login + tracker padding** — P2. (§2.2, §2.5)
9. **Validation error text size** — P2. (§3.2)
10. **Navbar Devanagari tagline** — P2, optional brand polish. (§1.1)

---

*Audit conducted by: UX Researcher (Claude Code)*  
*Based on: source read of all 9 Angular templates, no device emulator run*  
*Verification recommended: Chrome DevTools mobile emulation at 360×800 for each page before shipping*
