import { Hono } from "hono"
import { getCookie, setCookie, deleteCookie } from "hono/cookie"
import { renderer } from "./renderer"
import { DrivePage } from "./pages/DrivePage"
import { SharePage } from "./pages/SharePage"
import { RegisterPage } from "./pages/RegisterPage"
import { RegisterSuccessPage } from "./pages/RegisterSuccessPage"
import { LoginPage } from "./pages/LoginPage"
import { findUser, createUser } from "./data/users"
import { generateSecret, getOTPAuthUrl, verifyTOTP } from "./utils/totp"
import { renderSVG } from "uqr"

const app = new Hono()

app.use(renderer)

// Helper to get session user
function getSessionUser(c: any) {
  const username = getCookie(c, "simpanmaya_session")
  if (!username) return null
  return findUser(username) ?? null
}

// Protect Drive — require TOTP login
app.get("/", (c) => {
  const user = getSessionUser(c)
  if (!user) return c.redirect("/auth/login", 302)
  return c.render(<DrivePage user={{ username: user.username, email: user.email }} />)
})

// Public share — no auth
app.get("/share/:id", (c) => {
  const id = c.req.param("id")
  return c.render(<SharePage id={id} />)
})

// --- AUTH ---
app.get("/auth/register", (c) => {
  const user = getSessionUser(c)
  if (user) return c.redirect("/", 302)
  return c.render(<RegisterPage />)
})

app.post("/auth/register", async (c) => {
  const body = await c.req.parseBody()
  const rawUsername = typeof body["username"] === "string" ? body["username"].trim() : ""
  const rawEmail = typeof body["email"] === "string" ? body["email"].trim() : ""

  const username = rawUsername
  const email = rawEmail.toLowerCase()

  // Validation
  if (!username || username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9._-]+$/.test(username)) {
    return c.render(<RegisterPage error="Username 3-20 chars, hanya huruf/angka/._- " username={username} email={rawEmail} />)
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.render(<RegisterPage error="Email tidak valid" username={username} email={rawEmail} />)
  }
  if (findUser(username)) {
    return c.render(<RegisterPage error="Username sudah terpakai" username={username} email={rawEmail} />)
  }

  try {
    const secret = generateSecret(20)
    createUser(username, email, secret)
    const otpauthUrl = getOTPAuthUrl({ username, secret, issuer: "SimpanMaya" })
    // Pure JS SVG — no Node deps, works on normal Workers runtime (no nodejs_compat needed)
    const svg = renderSVG(otpauthUrl, { border: 1, blackColor: "#000000", whiteColor: "#ffffff" })
    const qrDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
    // Show QR — do not auto-login, user must login with TOTP next
    return c.render(
      <RegisterSuccessPage username={username} email={email} secret={secret} otpauthUrl={otpauthUrl} qrDataUrl={qrDataUrl} />,
    )
  } catch (e: any) {
    return c.render(<RegisterPage error={e.message ?? "Gagal register"} username={username} email={rawEmail} />)
  }
})

app.get("/auth/login", (c) => {
  const user = getSessionUser(c)
  if (user) return c.redirect("/", 302)
  return c.render(<LoginPage />)
})

app.post("/auth/login", async (c) => {
  const body = await c.req.parseBody()
  const rawUsername = typeof body["username"] === "string" ? body["username"].trim() : ""
  const rawToken = typeof body["token"] === "string" ? body["token"].trim() : ""

  if (!rawUsername || !rawToken) {
    return c.render(<LoginPage error="Username dan kode TOTP wajib diisi" username={rawUsername} />)
  }
  const user = findUser(rawUsername)
  if (!user) {
    return c.render(<LoginPage error="User tidak ditemukan — register dulu" username={rawUsername} />)
  }
  if (!/^\d{6}$/.test(rawToken)) {
    return c.render(<LoginPage error="Kode TOTP harus 6 digit" username={rawUsername} />)
  }
  const ok = await verifyTOTP(user.secret, rawToken, 1)
  if (!ok) {
    return c.render(<LoginPage error="Kode TOTP salah atau kadaluarsa — coba kode baru (30s)" username={rawUsername} />)
  }

  setCookie(c, "simpanmaya_session", user.username, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "Lax",
    // secure: true // enable in production with HTTPS
  })
  return c.redirect("/", 302)
})

app.get("/auth/logout", (c) => {
  deleteCookie(c, "simpanmaya_session", { path: "/" })
  return c.redirect("/auth/login", 302)
})

// Optional: redirect /login etc
app.get("/login", (c) => c.redirect("/auth/login", 302))
app.get("/register", (c) => c.redirect("/auth/register", 302))

export default app
