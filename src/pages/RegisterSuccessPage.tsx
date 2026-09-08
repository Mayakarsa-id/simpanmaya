import { AuthLayout } from "../components/AuthLayout"

type Props = {
  username: string
  email: string
  secret: string
  otpauthUrl: string
}

export const RegisterSuccessPage = ({ username, email, secret, otpauthUrl }: Props) => {
  const qrExternal = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(otpauthUrl)}`
  return (
    <AuthLayout
      title="Scan QR TOTP"
      subtitle={`Akun ${username} (${email}) berhasil dibuat — scan QR di authenticator, lalu login pakai kode 6-digit`}
      footer={
        <a href="/auth/login" class="auth-btn" style="text-decoration:none; text-align:center; display:block;">
          Lanjut ke Login →
        </a>
      }
    >
      <div class="qr-card">
        <div class="qr-image-wrap">
          <img
            class="qr-image"
            src={qrExternal}
            alt="TOTP QR"
            width={240}
            height={240}
            loading="eager"
          />
        </div>

        <div class="qr-details">
          <div class="share-pill" style="background: var(--brutal-yellow);">Username: {username}</div>
          <div class="share-pill">Email: {email}</div>
        </div>

        <div class="secret-box">
          <div class="secret-label">Secret (manual entry)</div>
          <code class="secret-code">{secret}</code>
          <button
            class="share-copy-btn"
            style="width:100%; justify-content:center;"
            onclick={`navigator.clipboard.writeText('${secret}'); this.textContent='Copied secret!'; setTimeout(()=>this.textContent='Copy secret',1500)`}
          >
            Copy secret
          </button>
        </div>

        <details class="qr-details-collapsible">
          <summary style="font-weight:900; cursor:pointer; text-transform:uppercase; font-size:0.8rem;">Lihat otpauth URL</summary>
          <code class="secret-code" style="word-break: break-all; font-size:0.7rem; margin-top:0.5rem; display:block;">
            {otpauthUrl}
          </code>
          <button
            class="share-copy-btn"
            style="margin-top:0.5rem;"
            onclick={`navigator.clipboard.writeText('${otpauthUrl}'); this.textContent='Copied URL!'; setTimeout(()=>this.textContent='Copy otpauth URL',1500)`}
          >
            Copy otpauth URL
          </button>
        </details>

        <div class="share-warning">
          Buka Google Authenticator / Authy / 1Password → Scan QR → Kode 6-digit akan muncul & berganti tiap 30 detik.
        </div>
      </div>
    </AuthLayout>
  )
}
