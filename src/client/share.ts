// Public share page client — selection + custom context menu (only Open & Download)
// Multiple select action only able to do Download
import { initialFiles } from "../data/files"
import type { FileEntry } from "../data/files"

declare global {
  interface Window {
    toggleShareSelect: (id: string, e: Event) => void
    toggleShareSelectAll: (e: Event) => void
    clearShareSelection: () => void
    execShareBulk: (action: string) => void
    openShareContextMenu: (e: MouseEvent, id: string) => void
    execShareSingle: (action: string) => void
    handleShareRowClick: (id: string) => void
    navigateShareDepth: (idx: number) => void
  }
}

const shareId = window.location.pathname.split("/").filter(Boolean).pop() ?? ""
const shareRoot = initialFiles.find((f) => f.id === shareId) as FileEntry | undefined

// Elements (share-specific, no sidebar/search)
const shareTableBody = document.getElementById("share-file-list-body") as HTMLTableSectionElement | null
const shareBreadcrumbs = document.getElementById("share-breadcrumbs") as HTMLDivElement | null
const shareSelectAll = document.getElementById("share-selectAll") as HTMLInputElement | null
const shareBulkToolbar = document.getElementById("share-bulk-toolbar") as HTMLDivElement | null
const shareBulkCount = document.getElementById("share-bulk-count") as HTMLSpanElement | null
const shareBulkActions = document.getElementById("share-bulk-actions") as HTMLDivElement | null
const shareContextMenu = document.getElementById("share-context-menu") as HTMLDivElement | null

let sharePath: FileEntry[] = shareRoot ? [shareRoot] : []
let shareSelected = new Set<string>()
let shareDisplayed: FileEntry[] = []
let shareContextTarget: string | null = null

const shareIcons: Record<string, string> = {
  folder: `<svg class="icon-folder" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  doc: `<svg class="icon-doc" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  sheet: `<svg class="icon-sheet" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  image: `<svg class="icon-image" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  dots: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`,
}

function triggerDownload(file: FileEntry) {
  // Generate dummy file content for demo — in real app fetch from storage / R2
  const content = `SimpanMaya shared download\nFile: ${file.name}\nType: ${file.type}\nOwner: ${file.owner}\nDate: ${file.date}\nSize: ${file.size}\n\nThis is a placeholder file for published share /share/${shareId}.`
  const blob = new Blob([content], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = file.name || `download-${file.id}.txt`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function collectDownloadTargets(ids: string[]): FileEntry[] {
  const targets: FileEntry[] = []
  for (const id of ids) {
    const item = initialFiles.find((f) => f.id === id)
    if (!item) continue
    if (item.type === "folder") {
      // For folder, collect all descendant non-folder files recursively (published)
      const stack: string[] = [item.id]
      const visited = new Set<string>()
      while (stack.length) {
        const cur = stack.pop()!
        if (visited.has(cur)) continue
        visited.add(cur)
        for (const child of initialFiles.filter((f) => f.parentId === cur && !f.trashed)) {
          if (child.type === "folder") stack.push(child.id)
          else targets.push(child)
        }
      }
      // If folder is empty, still download a placeholder for the folder itself
      if (targets.length === 0 || !targets.some((t) => t.parentId === item.id || visited.has(t.parentId ?? ""))) {
        // no files inside, create folder placeholder target
        // we will handle by downloading folder placeholder directly if no files
        if (initialFiles.filter((f) => f.parentId === item.id).length === 0) {
          targets.push(item) // will generate folder placeholder
        }
      }
    } else {
      targets.push(item)
    }
  }
  // Dedupe by id
  const uniq = new Map<string, FileEntry>()
  for (const t of targets) uniq.set(t.id, t)
  return [...uniq.values()]
}

function renderShare() {
  if (!shareRoot || !shareTableBody) return

  // If root is file (not folder), display just itself. If folder, display children of current path head
  const current = sharePath[sharePath.length - 1]
  if (!current) return

  // Breadcrumbs for shared navigation (only inside shared tree)
  if (shareBreadcrumbs) {
    shareBreadcrumbs.innerHTML = sharePath
      .map((folder, idx) => {
        const isLast = idx === sharePath.length - 1
        return `<span class="breadcrumb-item ${isLast ? "active" : ""}" onclick="${!isLast ? `navigateShareDepth(${idx})` : ""}">${folder.name}</span>${!isLast ? `<span class="breadcrumb-separator">›</span>` : ""}`
      })
      .join("")
  }

  if (current.type === "folder") {
    const children = initialFiles.filter((f) => f.parentId === current.id && !f.trashed)
    shareDisplayed = [...children].sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1
      if (a.type !== "folder" && b.type === "folder") return 1
      return a.name.localeCompare(b.name)
    })
  } else {
    // Root is file itself
    shareDisplayed = [current]
  }

  // Bulk toolbar (only Download for multiple)
  if (shareBulkToolbar && shareBulkCount && shareBulkActions) {
    if (shareSelected.size > 0) {
      shareBulkToolbar.classList.remove("hidden")
      shareBulkCount.textContent = `${shareSelected.size} selected`
      shareBulkActions.innerHTML = `
        <button class="btn-bulk" onclick="execShareBulk('download')"><svg viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> <span class="btn-text">Download</span></button>
      `
    } else {
      shareBulkToolbar.classList.add("hidden")
    }
  }

  if (shareSelectAll) shareSelectAll.checked = shareDisplayed.length > 0 && shareSelected.size === shareDisplayed.length

  if (shareDisplayed.length === 0) {
    shareTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; font-weight: 800; text-transform: uppercase; border: 3px dashed #000; background: #fff;">Folder is empty</td></tr>`
  } else {
    shareTableBody.innerHTML = shareDisplayed
      .map(
        (file) => `
          <tr class="${shareSelected.has(file.id) ? "selected" : ""}" onclick="handleShareRowClick('${file.id}')" oncontextmenu="openShareContextMenu(event, '${file.id}')">
            <td class="col-check" onclick="event.stopPropagation()">
              <input type="checkbox" onchange="toggleShareSelect('${file.id}', event)" ${shareSelected.has(file.id) ? "checked" : ""}>
            </td>
            <td>
              <div class="file-name-cell">
                ${shareIcons[file.type] || shareIcons.doc}
                <span>${file.name}</span>
              </div>
            </td>
            <td>${file.owner ?? "-"}</td>
            <td>${file.date ?? "-"}</td>
            <td>${file.size ?? "-"}</td>
            <td onclick="event.stopPropagation()">
              <button class="btn-icon" onclick="openShareContextMenu(event, '${file.id}')">${shareIcons.dots}</button>
            </td>
          </tr>
        `,
      )
      .join("")
  }
}

window.toggleShareSelect = function (id: string, e: Event) {
  const target = e.target as HTMLInputElement
  if (target.checked) shareSelected.add(id)
  else shareSelected.delete(id)
  renderShare()
}

window.toggleShareSelectAll = function (e: Event) {
  const target = e.target as HTMLInputElement
  if (target.checked) shareDisplayed.forEach((f) => shareSelected.add(f.id))
  else {
    shareSelected.clear()
  }
  renderShare()
}

window.clearShareSelection = function () {
  shareSelected.clear()
  renderShare()
}

window.execShareBulk = function (action: string) {
  if (action !== "download") return
  if (shareSelected.size === 0) return
  const ids = [...shareSelected]
  const targets = collectDownloadTargets(ids)
  if (targets.length === 0) {
    alert("No downloadable files in selection")
    return
  }
  // For multiple, download sequentially with slight delay to avoid browser blocking
  targets.forEach((file, idx) => {
    setTimeout(() => triggerDownload(file), idx * 400)
  })
  // Keep selection? Clear after download? Keep for UX, but we can clear
  // shareSelected.clear(); renderShare();
}

window.openShareContextMenu = function (e: MouseEvent, id: string) {
  e.preventDefault()
  e.stopPropagation()
  if (!shareContextMenu) return
  shareContextTarget = id
  const item = initialFiles.find((f) => f.id === id)
  if (!item) return

  // Custom context menu: only Open and Download
  shareContextMenu.innerHTML = `
    <button class="dropdown-item" onclick="execShareSingle('open')"><svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> Open</button>
    <button class="dropdown-item" onclick="execShareSingle('download')"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download</button>
  `
  shareContextMenu.style.display = "flex"
  shareContextMenu.style.flexDirection = "column"
  // Position
  let x = e.pageX, y = e.pageY
  if (x + 230 > window.innerWidth) x = window.innerWidth - 240
  if (y + 150 > window.innerHeight) y = window.innerHeight - 160
  shareContextMenu.style.left = `${x}px`
  shareContextMenu.style.top = `${y}px`
}

document.addEventListener("click", () => {
  if (shareContextMenu) shareContextMenu.style.display = "none"
})

window.execShareSingle = function (action: string) {
  const id = shareContextTarget
  if (!id) return
  // Ensure selection includes target for open/download consistency
  if (!shareSelected.has(id)) {
    shareSelected.clear()
    shareSelected.add(id)
    renderShare()
  }
  const item = initialFiles.find((f) => f.id === id)
  if (!item) return
  if (action === "open") {
    handleShareRowClick(id)
  } else if (action === "download") {
    // Single download: if folder, download its contents
    const targets = collectDownloadTargets([id])
    if (targets.length === 0) {
      triggerDownload(item)
    } else {
      targets.forEach((file, idx) => setTimeout(() => triggerDownload(file), idx * 300))
    }
  }
}

window.handleShareRowClick = function (id: string) {
  const file = initialFiles.find((f) => f.id === id)
  if (!file) return
  if (file.type === "folder") {
    sharePath.push(file)
    shareSelected.clear()
    renderShare()
  } else {
    // For file, open = download/preview
    triggerDownload(file)
  }
}

window.navigateShareDepth = function (idx: number) {
  sharePath = sharePath.slice(0, idx + 1)
  shareSelected.clear()
  renderShare()
}

// Initial render
if (shareRoot) {
  // Mark share page as public — no sidebar highlight needed
  renderShare()
} else {
  // If shareRoot not found, let SSR not-found banner stay, no table to render
  if (shareTableBody) {
    // hide bulk etc
    shareBulkToolbar?.classList.add("hidden")
  }
}
