import { AuthLayout } from "../components/AuthLayout"

type Props = {
  error?: string
  username?: string
  email?: string
}

export const RegisterPage = ({ error, username, email }: Props) => {
  return (
    <AuthLayout
      title="Create account"
      subtitle="Register hanya butuh username & email — QR TOTP akan muncul setelah daftar"
      footer={
        <p style="font-weight:800; font-size:0.8rem; text-align:center;">
          Sudah punya akun? <a href="/auth/login" style="text-decoration: underline; font-weight:900;">Login dengan TOTP</a>
        </p>
      }
    >
      {error && <div class="auth-error">{error}</div>}

      <form method="POST" action="/auth/register" class="auth-form">
        <label class="auth-label">
          Username
          <input
            class="auth-input"
            type="text"
            name="username"
            placeholder="johndoe"
            required
            minlength={3}
            maxlength={20}
            pattern="[a-zA-Z0-9._-]+"
            value={username ?? ""}
          />
          <span class="auth-hint">3-20 chars, letters/numbers/._-</span>
        </label>

        <label class="auth-label">
          Email
          <input
            class="auth-input"
            type="email"
            name="email"
            placeholder="john@simpanmaya.id"
            required
            value={email ?? ""}
          />
        </label>

        <button type="submit" class="auth-btn">
          Register & Generate QR →
        </button>
      </form>

      <div class="share-warning" style="margin-top: 1rem; font-size:0.75rem;">
        Demo user tersedia: <strong>demo / demo@simpanmaya.id</strong> dengan secret <code>JBSWY3DPEHPK3PXP</code>
      </div>
    </AuthLayout>
  )
}
