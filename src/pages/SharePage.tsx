import { Script } from "vite-ssr-components/hono"
import { ShareOwnerBanner, ShareNotFoundBanner } from "../components/ShareOwnerBanner"
import { initialFiles } from "../data/files"
import type { FileEntry } from "../data/files"

type Props = { id: string }

function iconFor(type: string) {
  if (type === "folder") return `<svg class="icon-folder" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`
  if (type === "sheet") return `<svg class="icon-sheet" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>`
  if (type === "image") return `<svg class="icon-image" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
  return `<svg class="icon-doc" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
}

export const SharePage = ({ id }: Props) => {
  const file = initialFiles.find((f) => f.id === id) as FileEntry | undefined

  if (!file) {
    return (
      <div class="public-share">
        <header class="public-header">
          <div class="brand" style="margin-bottom:0;">
            <div class="brand-logo"></div>
            <span class="brand-text">SimpanMaya</span>
            <span class="public-badge">PUBLIC</span>
          </div>
          <a href="/" class="btn-bulk" style="text-decoration:none;">
            Open SimpanMaya
          </a>
        </header>
        <div class="share-page-container">
          <ShareNotFoundBanner id={id} />
        </div>
      </div>
    )
  }

  const isFolder = file.type === "folder"
  const children = isFolder ? initialFiles.filter((f) => f.parentId === file.id && !f.trashed) : []
  const displayFiles: FileEntry[] = isFolder ? children : [file]
  const sorted = [...displayFiles].sort((a, b) => {
    if (a.type === "folder" && b.type !== "folder") return -1
    if (a.type !== "folder" && b.type === "folder") return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div class="public-share">
      <header class="public-header">
        <div class="brand" style="margin-bottom:0;">
          <div class="brand-logo"></div>
          <span class="brand-text">SimpanMaya</span>
          <span class="public-badge">PUBLIC SHARE — PUBLISHED</span>
        </div>
        <a href="/" class="btn-bulk" style="text-decoration:none;">
          Open SimpanMaya
        </a>
      </header>

      <div class="share-page-container">
        {/* Owner information on top of item list — unauthenticated public view */}
        <ShareOwnerBanner file={file} childCount={isFolder ? children.length : undefined} />

        {/* Share controls: breadcrumbs + bulk toolbar (only Download) */}
        <div class="view-controls" style="border:3px solid #000; background:#fff; box-shadow: var(--shadow-brutal-sm);">
          <div id="share-breadcrumbs" class="breadcrumbs"></div>
          <div id="share-bulk-toolbar" class="bulk-toolbar hidden">
            <div class="bulk-left">
              <button class="btn-icon" onclick="clearShareSelection()">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <span id="share-bulk-count">1 selected</span>
            </div>
            <div class="bulk-actions" id="share-bulk-actions"></div>
          </div>
        </div>

        {/* Item list — selectable, custom context menu (Open & Download only) */}
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="col-check">
                  <input type="checkbox" id="share-selectAll" onclick="toggleShareSelectAll(event)" />
                </th>
                <th>Name</th>
                <th>Owner</th>
                <th>Last modified</th>
                <th>File size</th>
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody id="share-file-list-body">
              {sorted.length === 0 ? (
                <tr>
                  <td colspan={6} style="text-align: center; padding: 2.5rem; font-weight: 800; text-transform: uppercase; border: 3px dashed #000; background: #fff;">
                    Folder is empty
                  </td>
                </tr>
              ) : (
                sorted.map((f) => (
                  <tr onclick={`handleShareRowClick('${f.id}')`} oncontextmenu={`openShareContextMenu(event, '${f.id}')`}>
                    <td class="col-check" onclick="event.stopPropagation()">
                      <input type="checkbox" onchange={`toggleShareSelect('${f.id}', event)`} />
                    </td>
                    <td>
                      <div class="file-name-cell">
                        <span dangerouslySetInnerHTML={{ __html: iconFor(f.type) }}></span>
                        <span>{f.name}</span>
                        {f.shared ? (
                          <span style="margin-left:6px; background: var(--brutal-lime); border:2px solid #000; padding:1px 5px; font-size:0.65rem; font-weight:900;">SHARED</span>
                        ) : null}
                      </div>
                    </td>
                    <td>{f.owner ?? "-"}</td>
                    <td>{f.date ?? "-"}</td>
                    <td>{f.size ?? "-"}</td>
                    <td onclick="event.stopPropagation()">
                      <button class="btn-icon" onclick={`openShareContextMenu(event, '${f.id}')`}>
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {isFolder && (
            <div style="margin-top: 0.9rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
              <span style="font-weight:800; font-size:0.75rem; align-self:center; background:#000; color:#ffde59; border:2px solid #000; padding:4px 8px;">
                Published folder: {file.name} — select to download
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Custom context menu — only Open & Download */}
      <div id="share-context-menu" style="position:fixed; background:#fff; border:3px solid #000; box-shadow:6px 6px 0 #000; border-radius:0; z-index:100; display:none; flex-direction:column; padding:0.4rem; width:220px; gap:2px;"></div>

      <Script src="/src/client/share.ts" />
    </div>
  )
}
