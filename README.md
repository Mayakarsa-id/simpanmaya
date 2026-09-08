# SimpanMaya — Drive Clone with Neobrutalism

> Google Drive-inspired file manager rebuilt with **Hono + Vite + Cloudflare Workers**, modular TSX architecture, flat neobrutalism design, public share links, and password-less TOTP authentication.

<p align="left">
  <img src="https://img.shields.io/badge/Hono-4.13-black?style=for-the-badge" alt="Hono"/>
  <img src="https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge" alt="Vite"/>
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge" alt="Cloudflare"/>
  <img src="https://img.shields.io/badge/pnpm-11.24-F69220?style=for-the-badge&logo=pnpm" alt="pnpm"/>
  <img src="https://img.shields.io/badge/Style-Neobrutalism-FFDE59?style=for-the-badge" alt="Neobrutalism"/>
  <img src="https://img.shields.io/badge/Auth-TOTP-00E5FF?style=for-the-badge" alt="TOTP"/>
  <img src="https://img.shields.io/badge/QR-uqr-000000?style=for-the-badge" alt="uqr"/>
</p>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Routes](#routes)
- [Authentication Flow](#authentication-flow)
- [Public Share](#public-share)
- [File Operations](#file-operations)
- [Theming](#theming)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Environment & Security](#environment--security)
- [Contributing](#contributing)
- [License](#license)

---

## Features

**Core**
- Modular Hono TSX — `example.html` (574 lines) sliced into `Icons`, `Sidebar`, `Header`, `DropOverlay`, `ViewControls`, `FileTable`, `ContextMenu`, `Layout`, `DrivePage`
- **SimpanMaya** branding (title, sidebar, search placeholder)
- Flat neobrutalism — 3px black borders, hard shadows (`4px 4px 0 #000`), vibrant flat palette, `Space Grotesk` + `JetBrains Mono`
- Responsive — sidebar drawer on mobile, bulk actions collapse

**File Manager**
- Breadcrumb navigation, drag & drop overlay, file upload (folder upload removed)
- Selection — checkbox, select-all, bulk toolbar over breadcrumbs
- Context menu per-item, bulk actions: Share/Unshare, Copy, Cut, Paste, Trash/Restore, Delete Forever
- Recursive operations — share/trash propagate to children, copy deep-clones folders, paste validates `isDescendant` guard

**Sharing**
- `GET /share/:id` — **public, unauthenticated, published** — no sidebar/search
- Owner banner **on top of item list**: avatar, `Owner: me`, date/size, child count, `SHARED/PRIVATE` badge, `/share/:id` + Copy link
- Share list is selectable — custom context menu **only Open & Download**, bulk toolbar **only Download** (via `src/client/share.ts`)
- Folder deep-download collects descendants recursively and triggers blob downloads

**Auth (Password-less TOTP)**
- `Register` — only `username` + `email` → generate 20-byte base32 secret → `otpauth://totp/SimpanMaya:user?secret=...` → QR **via `uqr` lib (SVG data URL, offline, no nodejs_compat)** + manual secret
- `Login` — only `username` + 6-digit TOTP (30s window ±1, SHA1, WebCrypto)
- In-memory users (`src/data/users.ts`, `globalThis` persisted), session cookie `simpanmaya_session` (httpOnly, 7d, Lax), `demo` seeded (`JBSWY3DPEHPK3PXP`)
- Drive (`/`) protected — unauthenticated → `302 /auth/login`; Share remains public
- Profile avatar — initials from username, dropdown shows `username/email` + **Logout** (`GET /auth/logout`)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Cloudflare Workers (`wrangler 4.11`, `compatibility_date 2025-08-03`) |
| Framework | Hono 4.13 (`hono/jsx`, `jsxRenderer`) |
| Build | Vite 8.1 + `@cloudflare/vite-plugin` + `vite-ssr-components` (auto `Script`/`Link` manifest) |
| Package Manager | **pnpm 11.24** (primary, `pnpm-lock.yaml` + `pnpm-workspace.yaml`) — npm also works |
| Language | TypeScript (jsxImportSource `hono/jsx`) |
| Crypto | Web Crypto (`SubtleCrypto` HMAC-SHA1) — no external OTP deps |
| QR | **uqr 0.1.3** (`renderSVG` → `data:image/svg+xml;utf8,...` pure JS, no Node deps, normal Workers runtime) |
| Style | Vanilla CSS, CSS variables, neobrutalism, Google Fonts (`Space Grotesk`, `JetBrains Mono`) |
| State | Client-side `fileSystem` + `clipboard` + `selectedItems` (drive) / `sharePath` (share) |

---

## Project Structure

```
src/
├── client/
│   ├── drive.ts      # Drive interactivity (view, selection, bulk, context, clipboard, DND)
│   └── share.ts      # Public share interactivity (select + Open/Download only, bulk Download only)
├── components/
│   ├── AuthLayout.tsx
│   ├── ContextMenu.tsx
│   ├── DropOverlay.tsx
│   ├── FileTable.tsx
│   ├── Header.tsx            # avatar + profile-dropdown with Logout
│   ├── Icons.tsx             # 15+ SVG icons (Folder, Doc, Sheet, Image, etc.)
│   ├── Layout.tsx            # sidebar + main (Drive) — hideViewControls for share/auth
│   ├── ShareOwnerBanner.tsx  # owner banner + not-found banner
│   ├── Sidebar.tsx           # brand SimpanMaya, New dropdown (New folder, File upload), My Drive/Trash
│   └── ViewControls.tsx      # breadcrumbs + Paste + bulk toolbar
├── data/
│   ├── files.ts      # FileEntry type, initialFiles seed (single source for server & client)
│   └── users.ts      # in-memory users Map (globalThis persisted), demo seeded
├── pages/
│   ├── DrivePage.tsx
│   ├── SharePage.tsx         # public-share layout (no sidebar/search)
│   ├── RegisterPage.tsx
│   ├── RegisterSuccessPage.tsx # QR (uqr SVG data URL) + secret + otpauth URL
│   └── LoginPage.tsx
├── utils/
│   └── totp.ts       # base32, generateSecret, getOTPAuthUrl, verifyTOTP
├── renderer.tsx      # html shell + ViteClient + Link style
├── index.tsx         # Hono app + routes + session helper
└── style.css         # neobrutalism theme (paper dots, thick borders, hard shadows)
```

Additional:
- `pnpm-workspace.yaml`, `pnpm-lock.yaml` — pnpm primary lockfile
- `wrangler.jsonc` — Workers config
- `vite.config.ts` — `cloudflare()` + `ssrPlugin()`

---

## Quick Start

**Requirements:** Node 18+, **pnpm 11+** (main) — `npm` also works but pnpm is canonical.

```bash
# 1. install (pnpm is primary)
pnpm install
# npm alternative (not preferred): npm install

# 2. dev (Vite + Cloudflare Workers, HMR)
pnpm dev
# open http://localhost:5173

# 3. build (client + worker)
pnpm build

# 4. preview built worker
pnpm preview

# 5. deploy to Cloudflare
pnpm deploy

# 6. generate CloudflareBindings types
pnpm cf-typegen
```

**Demo account (seeded):**
- username: `demo`
- email: `demo@simpanmaya.id`
- secret: `JBSWY3DPEHPK3PXP`
- Use any TOTP app (Google Authenticator, Authy) → `otpauth://totp/SimpanMaya:demo?secret=JBSWY3DPEHPK3PXP&issuer=SimpanMaya`

> **Package manager note:** This repo uses **pnpm** as main tool. `pnpm-lock.yaml` is committed, `packageManager` is not pinned but CI/dev should use `pnpm@11.24.0`. `npm` commands in `package.json` use `$npm_execpath` so `pnpm dev/build/preview/deploy` works transparently.

---

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | required | Drive — My Drive / Trash, file table, bulk & context actions |
| `GET` | `/share/:id` | public | Published share — owner banner on top, selectable list (Open/Download only) |
| `GET` | `/auth/register` | public | Register form (username, email) |
| `POST` | `/auth/register` | public | Create user → generate QR via `uqr` lib (SVG) → render QR page |
| `GET` | `/auth/login` | public | Login form (username, TOTP 6-digit) |
| `POST` | `/auth/login` | public | Verify TOTP → set `simpanmaya_session` → 302 `/` |
| `GET` | `/auth/logout` | any | Clear cookie → 302 `/auth/login` |
| `GET` | `/login`, `/register` | public | Redirects to `/auth/*` |

**Share examples:** `/share/2` (Brand Guidelines folder, shared), `/share/1` (Q3 Report file), `/share/2-1` (Company Logo.png)

---

## Authentication Flow

```
Register: username + email 
  → POST /auth/register 
  → generateSecret(20) base32 → createUser → getOTPAuthUrl
  → renderSVG(otpauthUrl) → data:image/svg+xml;utf8,... (uqr pure JS)
  → RegisterSuccessPage: QR (uqr SVG data URL, offline, no nodejs_compat) + secret + otpauth URL + Copy buttons

Login: username + token (6-digit)
  → POST /auth/login
  → findUser → verifyTOTP(secret, token, window=1)
  → setCookie simpanmaya_session (httpOnly, 7d) → 302 /

Drive: GET / → getCookie → findUser → if null 302 /auth/login else render DrivePage

Logout: GET /auth/logout → deleteCookie → 302 /auth/login

Share: GET /share/:id → no auth check → always 200 (banner + list)
```

**TOTP Details (`src/utils/totp.ts`):**
- `generateSecret(20)` → `crypto.getRandomValues` → base32
- `getOTPAuthUrl({username, secret})` → `otpauth://totp/SimpanMaya:${username}?secret=...&issuer=SimpanMaya&algorithm=SHA1&digits=6&period=30`
- `verifyTOTP(secret, token)` → `hotp` via `crypto.subtle.sign(HMAC-SHA1)`, counter `floor(Date.now()/1000/30)`, checks `counter-1..counter+1`

**QR Details (`uqr`):**
- `src/index.tsx` `POST /auth/register` → `renderSVG(otpauthUrl, {border:1})` → `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` → passed as `qrDataUrl` to `RegisterSuccessPage`
- No external `api.qrserver.com`, no `qrcode`/`pngjs` Node deps, no `nodejs_compat` flag — pure JS, normal Workers runtime, smaller bundle

---

## Public Share

- **Unauthenticated & published** — no `aside#sidebar`, no `search-input`, minimal `public-header` (`SimpanMaya` + `PUBLIC SHARE` badge + `Open SimpanMaya`)
- Owner banner is **first element inside `share-page-container`**, above `view-controls` and `table-container`
- Table is selectable (`share-selectAll`, `share-file-list-body`), bulk toolbar appears when `selected > 0` but **only Download**
- Context menu (`#share-context-menu`, `#context-menu` shared brutalism) — **only Open** (folder → navigate deeper via `sharePath`, file → download) and **Download** (blob trigger, folder deep-collect)
- Styling: `.public-share`, `.share-banner`, `.share-badge.shared/private`, `.share-title` yellow, `.share-link-box` — all 3px black + hard shadow

---

## File Operations

| Operation | Scope | Behavior |
|-----------|-------|----------|
| Share | single/bulk | `setShareStatusRecursive(id, true/false)` propagates to children |
| Copy / Cut | single/bulk | `clipboard = {action, itemIds}`, Paste button shows `Paste N item(s)` |
| Paste | current folder | `deepCopyItem` (folder deep clone with ` (Copy)` suffix) or `parentId` move; `isDescendant` guard prevents moving into self |
| Trash | single/bulk | `setTrashedRecursive(true)`, removes from clipboard |
| Restore | trash view | if parent missing/trashed → `parentId = root`, `trashed=false` recursive |
| Delete Forever | trash | `deleteRecursive` (children first) + confirm |
| Upload | Drive | `handleFileInput` (File → type by ext, size human-readable, parentId current) + DND overlay |
| Download | Share | `triggerDownload` blob `SimpanMaya shared download\nFile: ...` per file, folder collects descendants |

---

## Theming

Flat neobrutalism — `src/style.css`:
- Variables: `--brutal-yellow #ffde59`, `--brutal-pink #ff90e8`, `--brutal-lime #bef264`, `--brutal-cyan #00e5ff`, `--border-thick 3px`, `--shadow-brutal 4px 4px 0 #000`
- Paper background `radial-gradient` dots, `aside` 280px `border-right 3px` + shadow, `brand` rotated, `btn-new` yellow hard shadow with translate hover
- `header` 68-72px `border-bottom 3px`, `search-input` white 3px + shadow focus yellow, `avatar` 42px pink 3px
- `table` `border 3px` + `shadow-lg`, `th` black bg yellow text uppercase, `tr:hover` yellow, `tr.selected` cyan, checkbox custom 22px `✓`
- Auth & share cards same language — `auth-card` rotated, `secret-code` mono, `qr-image` 240px bordered

---

## Deployment

Wrangler config `wrangler.jsonc`:
```json
{
  "name": "simpanmaya",
  "compatibility_date": "2025-08-03",
  "main": "./src/index.tsx"
}
```

```bash
pnpm build   # vite builds client (dist/client) + worker (dist/simpanmaya)
pnpm deploy  # build + wrangler deploy
# npm alternative: npm run build && npm run deploy
```

`vite-ssr-components` auto-discovers `Script src="/src/client/drive.ts"` and `"/src/client/share.ts"` + `Link href="/src/style.css"` via manifest.

---

## Scripts

| Script | Package Manager | Description |
|--------|-----------------|-------------|
| `pnpm dev` | pnpm (primary) | Vite dev with Cloudflare plugin + HMR + `ViteClient` |
| `pnpm build` | pnpm | Vite production build (client + worker) |
| `pnpm preview` | pnpm | Build + `vite preview` |
| `pnpm deploy` | pnpm | Build + `wrangler deploy` |
| `pnpm cf-typegen` | pnpm | `wrangler types` → `CloudflareBindings` |
| `npm run dev` etc. | npm | Also works via `$npm_execpath`, but pnpm is canonical |

Pass `CloudflareBindings` to Hono when needed:
```ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

---

## Environment & Security

- **No password** — TOTP only (6-digit, SHA1, 30s, window 1)
- **No external OTP deps** — pure Web Crypto, Workers-compatible
- **QR via `uqr` lib** — `renderSVG` generates `data:image/svg+xml;utf8,...` offline (no `api.qrserver.com`, no Node `fs`/`zlib`, normal Workers runtime)
- **Store** is in-memory `Map` (demo) — for production, replace `src/data/users.ts` with D1/KV/R2; session cookie is `httpOnly` but not `Secure` in dev
- **Share** is intentionally public — do not store sensitive files as `shared:true` in seed for demo
- **FileSystem** is client-side mutable; server `initialFiles` is seed — for persistence, add D1 + API
- **Package manager** is **pnpm** — `pnpm-lock.yaml` committed, use `pnpm@11.24.0` for reproducible installs

---

## Contributing

```bash
git clone <repo>
pnpm install        # use pnpm, not npm
pnpm dev
# edit src/ → HMR
pnpm build          # ensure no TS errors
```

Conventional commits: `feat:`, `fix:`, `chore:` — example `feat: add share download bulk`.

---

## License

MIT — see `LICENSE` (if not present, treat as MIT for demo).

Built from `example.html` (Drive Clone - Trash & Bulk Actions) → modular Hono TSX for SimpanMaya.
