import { AuthLayout } from "../components/AuthLayout"

type Props = {
  error?: string
  username?: string
}

export const LoginPage = ({ error, username }: Props) => {
  return (
    <AuthLayout
      title="Login"
      subtitle="Hanya butuh username & kode TOTP 6-digit dari authenticator"
      footer={
        <p style="font-weight:800; font-size:0.8rem; text-align:center;">
          Belum punya akun? <a href="/auth/register" style="text-decoration: underline; font-weight:900;">Register</a>
        </p>
      }
    >
      {error && <div class="auth-error">{error}</div>}

      <form method="POST" action="/auth/login" class="auth-form">
        <label class="auth-label">
          Username
          <input
            class="auth-input"
            type="text"
            name="username"
            placeholder="johndoe"
            required
            value={username ?? ""}
          />
        </label>

        <label class="auth-label">
          TOTP Code — 6 digit
          <input
            class="auth-input"
            type="text"
            name="token"
            placeholder="123456"
            required
            inputmode="numeric"
            pattern="[0-9]{6}"
            maxlength={6}
            autocomplete="one-time-code"
            style="letter-spacing: 0.3em; font-family: JetBrains Mono, monospace; font-weight:900; text-align:center; font-size:1.2rem;"
          />
          <span class="auth-hint">Buka authenticator, masukkan kode yang berganti tiap 30s</span>
        </label>

        <button type="submit" class="auth-btn">
          Login →
        </button>
      </form>
    </AuthLayout>
  )
}
