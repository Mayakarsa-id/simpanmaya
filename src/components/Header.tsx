import { IconHamburger, IconSearch } from "./Icons"

type HeaderProps = {
  user?: { username: string; email: string }
}

export const Header = ({ user }: HeaderProps) => {
  const initials = user ? user.username.slice(0, 2).toUpperCase() : "JD"
  const displayName = user?.username ?? "Guest"
  const displayEmail = user?.email ?? "—"
  return (
    <header>
      <button class="hamburger" onclick="toggleSidebar()">
        <IconHamburger />
      </button>
      <div class="search-container">
        <IconSearch />
        <input type="text" class="search-input" placeholder="Search in SimpanMaya" />
      </div>
      <div class="header-actions" id="profile-container" style="position: relative;">
        <div class="avatar" onclick="toggleDropdown('profile-dropdown', event)" title={displayName}>
          {initials}
        </div>
        <div class="dropdown-menu profile-menu" id="profile-dropdown">
          <div style="padding: 0.7rem 1rem; border-bottom: 3px solid #000; background: var(--brutal-yellow);">
            <div style="font-weight:900; font-size:0.9rem; text-transform:uppercase; letter-spacing:-0.01em;">{displayName}</div>
            <div style="font-size:0.7rem; font-weight:700; opacity:0.9; word-break:break-all;">{displayEmail}</div>
          </div>
          <a href="/auth/logout" class="dropdown-item" style="color:#e11d48; font-weight:900;">
            <svg viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Logout
          </a>
        </div>
      </div>
    </header>
  )
}
