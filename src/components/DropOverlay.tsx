import { IconUpload } from "./Icons"

export const DropOverlay = () => {
  return (
    <div id="drop-overlay" class="drop-overlay">
      <IconUpload />
      {/* manually apply icon size via wrapper because IconUpload default 20px; override via class */}
      <style>{`.drop-overlay svg { width: 64px; height: 64px; color: var(--text-blue-700); margin-bottom: 1rem; }`}</style>
      <div class="drop-overlay-text">
        Drop files to upload into <br />
        <span id="drop-folder-name" style="font-weight: 600;">
          My Drive
        </span>
      </div>
    </div>
  )
}
