import type { FileEntry } from "../data/files"

type Props = {
  file: FileEntry
  childCount?: number
}

function ownerInitials(owner?: string) {
  if (!owner) return "?"
  if (owner === "me") return "JD"
  return owner.slice(0, 2).toUpperCase()
}

export const ShareOwnerBanner = ({ file, childCount }: Props) => {
  const isShared = file.shared
  const ownerLabel = file.owner === "me" ? "John Doe (me) — john@simenmaya.id" : file.owner ?? "Unknown"
  return (
    <div class="share-banner">
      <div class="share-banner-top">
        <div class="share-avatar-lg">{ownerInitials(file.owner)}</div>
        <div class="share-meta">
          <div class="share-label">
            {isShared ? "Shared item" : "Private item"} • Owner information
          </div>
          <div class="share-owner-name">{ownerLabel}</div>
          <div class="share-owner-sub">
            <span class="share-pill">Owner: {file.owner ?? "-"}</span>
            <span class="share-pill">{file.date ?? "-"}</span>
            <span class="share-pill">{file.size ?? "-"}</span>
            {file.type === "folder" && typeof childCount === "number" && (
              <span class="share-pill">{childCount} item{childCount !== 1 ? "s" : ""} inside</span>
            )}
          </div>
        </div>
        <div class={`share-badge ${isShared ? "shared" : "private"}`}>
          {isShared ? "SHARED" : "PRIVATE"}
        </div>
      </div>

      <h2 class="share-title">
        <span class="share-title-icon">
          {file.type === "folder" ? "▣" : file.type === "sheet" ? "▤" : file.type === "image" ? "◧" : "▭"}
        </span>
        {file.name}
      </h2>

      <div class="share-link-box">
        <span class="share-link-text">/share/{file.id}</span>
        <button
          class="share-copy-btn"
          onclick={`navigator.clipboard.writeText(window.location.href); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy link', 1500)`}
        >
          Copy link
        </button>
      </div>

      {!isShared && (
        <div class="share-warning">
          This item is not shared yet. Use Share action in My Drive to make it accessible via this link.
        </div>
      )}
    </div>
  )
}

export const ShareNotFoundBanner = ({ id }: { id: string }) => {
  return (
    <div class="share-banner not-found">
      <div class="share-banner-top">
        <div class="share-avatar-lg">!</div>
        <div class="share-meta">
          <div class="share-label">Not found</div>
          <div class="share-owner-name">Item "{id}" does not exist or was deleted</div>
        </div>
        <div class="share-badge private">404</div>
      </div>
      <h2 class="share-title">Item not found</h2>
      <p class="share-owner-sub">Check the link or go back to <a href="/" style="text-decoration: underline; font-weight: 900;">My Drive</a></p>
    </div>
  )
}
