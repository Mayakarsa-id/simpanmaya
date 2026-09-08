type Props = {
  title: string
  subtitle?: string
  children: any
  footer?: any
}

export const AuthLayout = ({ title, subtitle, children, footer }: Props) => {
  return (
    <div class="auth-wrapper">
      <header class="public-header" style="position: sticky; top:0; z-index:10;">
        <div class="brand" style="margin-bottom:0;">
          <div class="brand-logo"></div>
          <span class="brand-text">SimpanMaya</span>
          <span class="public-badge">AUTH</span>
        </div>
        <a href="/" class="btn-bulk" style="text-decoration:none;">
          ← Home
        </a>
      </header>

      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-card-header">
            <h1 class="auth-title">{title}</h1>
            {subtitle && <p class="auth-subtitle">{subtitle}</p>}
          </div>
          {children}
          {footer && <div class="auth-footer">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
