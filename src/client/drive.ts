// Client-side logic sliced from example.html <script>
// Keeps identical behavior: view switching, selection, bulk actions, context menu, clipboard, paste, trash/restore
// This file is loaded as a module via <script type="module" src="/src/client/drive.ts">

import { initialFiles } from "../data/files"
import type { FileEntry, FileType } from "../data/files"

declare global {
  interface Window {
    switchView: (view: string) => void
    toggleSelect: (id: string, e: Event) => void
    toggleSelectAll: (e: Event) => void
    clearSelection: () => void
    execBulk: (action: string) => void
    openContextMenu: (e: MouseEvent, id: string) => void
    execSingle: (action: string) => void
    handlePaste: () => void
    handleRowClick: (fileId: string) => void
    navigateToDepth: (depthIndex: number) => void
    toggleSidebar: () => void
    toggleDropdown: (id: string, event: MouseEvent) => void
    createNewFolder: () => void
    handleFileInput: (e: Event) => void
  }
}

// --- 1. STATE & DATA ---
const fileSystem: FileEntry[] = JSON.parse(JSON.stringify(initialFiles))

let currentView: "drive" | "trash" = "drive"
let currentPath: FileEntry[] = [fileSystem.find((f) => f.id === "root")!]
let selectedItems = new Set<string>()
let displayedFiles: FileEntry[] = []

// clipboard: { action: 'copy'|'cut', itemIds: [] }
let clipboard: { action: "copy" | "cut"; itemIds: string[] } | null = null
let contextMenuTargetId: string | null = null

// Elements
const tableBody = document.getElementById("file-list-body") as HTMLTableSectionElement
const breadcrumbsContainer = document.getElementById("breadcrumbs") as HTMLDivElement
const btnPaste = document.getElementById("btn-paste") as HTMLButtonElement
const contextMenu = document.getElementById("context-menu") as HTMLDivElement
const selectAllCheckbox = document.getElementById("selectAll") as HTMLInputElement
const bulkToolbar = document.getElementById("bulk-toolbar") as HTMLDivElement
const dropOverlay = document.getElementById("drop-overlay") as HTMLDivElement
const dropZone = document.getElementById("drop-zone") as HTMLElement

// Icons (string templates for dynamic row rendering)
const icons: Record<string, string> = {
  folder: `<svg class="icon-folder" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  doc: `<svg class="icon-doc" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  sheet: `<svg class="icon-sheet" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  image: `<svg class="icon-image" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  shared: `<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; margin-left: 6px; color: var(--icon-blue)"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  dots: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`,
}

// --- 2. VIEW MANAGEMENT ---
window.switchView = function (view: string) {
  currentView = view as "drive" | "trash"
  clearSelection()

  // Update Sidebar Highlight
  document.getElementById("nav-drive")?.classList.toggle("active", view === "drive")
  document.getElementById("nav-trash")?.classList.toggle("active", view === "trash")

  if (view === "drive") {
    currentPath = [fileSystem.find((f) => f.id === "root")!]
  }
  renderApp()
}

// --- 3. RENDER LOGIC ---
function renderApp() {
  // Guard if DOM not ready (HMR)
  if (!breadcrumbsContainer || !tableBody) return

  // 1. Filter files based on View Mode
  if (currentView === "drive") {
    const currentFolder = currentPath[currentPath.length - 1]
    const dropName = document.getElementById("drop-folder-name")
    if (dropName) dropName.textContent = currentFolder.name

    breadcrumbsContainer.innerHTML = currentPath
      .map((folder, index) => {
        const isLast = index === currentPath.length - 1
        return `<span class="breadcrumb-item ${isLast ? "active" : ""}" onclick="${!isLast ? `navigateToDepth(${index})` : ""}">${folder.name}</span>
                  ${!isLast ? `<span class="breadcrumb-separator">›</span>` : ""}`
      })
      .join("")

    const folderChildren = fileSystem.filter((file) => file.parentId === currentFolder.id && !file.trashed)
    displayedFiles = folderChildren.sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1
      if (a.type !== "folder" && b.type === "folder") return 1
      return a.name.localeCompare(b.name)
    })
  } else if (currentView === "trash") {
    breadcrumbsContainer.innerHTML = `<span class="breadcrumb-item active">Trash</span>`
    // In trash, show only top-level trashed items (parents aren't trashed)
    displayedFiles = fileSystem.filter(
      (f) => f.trashed && f.id !== "root" && (!f.parentId || !fileSystem.find((p) => p.id === f.parentId)?.trashed),
    )
    displayedFiles.sort((a, b) => a.name.localeCompare(b.name))
  }

  // 2. Render Bulk Toolbar
  if (selectedItems.size > 0) {
    bulkToolbar.classList.remove("hidden")
    const bulkCount = document.getElementById("bulk-count")
    if (bulkCount) bulkCount.textContent = `${selectedItems.size} selected`

    let bulkBtns = ""
    if (currentView === "drive") {
      bulkBtns = `
            <button class="btn-bulk" onclick="execBulk('share')"><svg viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> <span class="btn-text">Share</span></button>
            <button class="btn-bulk" onclick="execBulk('copy')"><svg viewBox="0 0 24 24" style="width:16px;height:16px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> <span class="btn-text">Copy</span></button>
            <button class="btn-bulk" onclick="execBulk('cut')"><svg viewBox="0 0 24 24" style="width:16px;height:16px;"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg> <span class="btn-text">Cut</span></button>
            <button class="btn-bulk btn-danger" onclick="execBulk('trash')"><svg viewBox="0 0 24 24" style="width:16px;height:16px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> <span class="btn-text">Trash</span></button>
          `
    } else {
      bulkBtns = `
            <button class="btn-bulk" onclick="execBulk('restore')"><svg viewBox="0 0 24 24" style="width:16px;height:16px;"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg> <span class="btn-text">Restore</span></button>
            <button class="btn-bulk btn-danger" onclick="execBulk('deleteForever')"><svg viewBox="0 0 24 24" style="width:16px;height:16px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> <span class="btn-text">Delete Forever</span></button>
          `
    }
    const bulkContainer = document.getElementById("bulk-actions-container")
    if (bulkContainer) bulkContainer.innerHTML = bulkBtns
  } else {
    bulkToolbar.classList.add("hidden")
  }

  // 3. Render Paste Button
  if (currentView === "drive" && clipboard && clipboard.itemIds && clipboard.itemIds.length > 0) {
    btnPaste.classList.add("active")
    btnPaste.innerHTML = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> Paste ${clipboard.itemIds.length} item(s)`
  } else {
    btnPaste.classList.remove("active")
  }

  // 4. Render Table
  if (selectAllCheckbox) selectAllCheckbox.checked = displayedFiles.length > 0 && selectedItems.size === displayedFiles.length

  if (displayedFiles.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-gray-500);">No items here.</td></tr>`
  } else {
    tableBody.innerHTML = displayedFiles
      .map(
        (file) => `
          <tr class="${selectedItems.has(file.id) ? "selected" : ""}" onclick="handleRowClick('${file.id}')" oncontextmenu="openContextMenu(event, '${file.id}')">
            <td class="col-check" onclick="event.stopPropagation()">
              <input type="checkbox" onchange="toggleSelect('${file.id}', event)" ${selectedItems.has(file.id) ? "checked" : ""}>
            </td>
            <td>
              <div class="file-name-cell">
                ${icons[file.type] || icons.doc} 
                <span>${file.name}</span>
                ${file.shared && currentView === "drive" ? icons.shared : ""}
              </div>
            </td>
            <td>${file.owner ?? "-"}</td>
            <td>${file.date ?? "-"}</td>
            <td>${file.size ?? "-"}</td>
            <td onclick="event.stopPropagation()">
               <button class="btn-icon" onclick="openContextMenu(event, '${file.id}')">${icons.dots}</button>
            </td>
          </tr>
        `,
      )
      .join("")
  }
}

// --- 4. SELECTION LOGIC ---
window.toggleSelect = function (id: string, e: Event) {
  const target = e.target as HTMLInputElement
  if (target.checked) selectedItems.add(id)
  else selectedItems.delete(id)
  renderApp()
}

window.toggleSelectAll = function (e: Event) {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    displayedFiles.forEach((f) => selectedItems.add(f.id))
  } else {
    clearSelection()
    return
  }
  renderApp()
}

window.clearSelection = function () {
  selectedItems.clear()
  renderApp()
}

// --- 5. BULK ACTIONS ---
window.execBulk = function (action: string) {
  if (selectedItems.size === 0) return

  const ids = Array.from(selectedItems)

  if (action === "share") {
    ids.forEach((id) => setShareStatusRecursive(id, true))
  } else if (action === "copy") {
    clipboard = { action: "copy", itemIds: ids }
  } else if (action === "cut") {
    clipboard = { action: "cut", itemIds: ids }
  } else if (action === "trash") {
    ids.forEach((id) => setTrashedRecursive(id, true))
    // Remove from clipboard if trashed
    if (clipboard) clipboard.itemIds = clipboard.itemIds.filter((cid) => !ids.includes(cid))
  } else if (action === "restore") {
    ids.forEach((id) => restoreItem(id))
  } else if (action === "deleteForever") {
    if (confirm(`Permanently delete ${ids.length} item(s)? This cannot be undone.`)) {
      ids.forEach((id) => deleteRecursive(id))
    }
  }

  if (["trash", "restore", "deleteForever"].includes(action)) clearSelection()
  else renderApp()
}

// --- 6. CONTEXT MENU & SINGLE ACTIONS ---
window.openContextMenu = function (e: MouseEvent, id: string) {
  e.preventDefault()
  e.stopPropagation()
  contextMenuTargetId = id
  const item = fileSystem.find((f) => f.id === id)
  if (!item) return

  let html = ""
  if (currentView === "drive") {
    html = `
          <button class="dropdown-item" onclick="execSingle('open')"><svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> Open</button>
          <button class="dropdown-item" onclick="execSingle('share')"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${item.shared ? "Unshare" : "Share"}</button>
          ${item.shared ? `<button class="dropdown-item" onclick="execSingle('copylink')"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Copy Link</button>` : ""}
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" onclick="execSingle('copy')"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</button>
          <button class="dropdown-item" onclick="execSingle('cut')"><svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg> Cut</button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item text-red" onclick="execSingle('trash')"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Move to Trash</button>
        `
  } else {
    html = `
          <button class="dropdown-item" onclick="execSingle('restore')"><svg viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg> Restore</button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item text-red" onclick="execSingle('deleteForever')"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Delete Forever</button>
        `
  }

  contextMenu.innerHTML = html
  contextMenu.style.display = "flex"

  let x = e.pageX,
    y = e.pageY
  if (x + 200 > window.innerWidth) x = window.innerWidth - 210
  if (y + 250 > window.innerHeight) y = window.innerHeight - 260
  contextMenu.style.left = `${x}px`
  contextMenu.style.top = `${y}px`
}

document.addEventListener("click", () => {
  if (contextMenu) contextMenu.style.display = "none"
  // close new-dropdown when clicking outside
  document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
    if (!(menu as HTMLElement).contains(document.activeElement)) {
      // keep behavior: only close if click not inside new-container
      const container = document.getElementById("new-container")
      if (container && !container.contains(event?.target as Node)) {
        menu.classList.remove("show")
      }
    }
  })
})

window.execSingle = function (action: string) {
  const id = contextMenuTargetId
  if (!id) return

  // If the item isn't in current selection, select it exclusively for single-actions
  if (!selectedItems.has(id)) {
    selectedItems.clear()
    selectedItems.add(id)
  }

  if (action === "open") handleRowClick(id)
  else if (action === "share") {
    const item = fileSystem.find((f) => f.id === id)
    if (item) setShareStatusRecursive(id, !item.shared)
    renderApp()
  } else if (action === "copylink") {
    const url = `${window.location.origin}/share/${id}`
    navigator.clipboard?.writeText(url).catch(() => {})
    alert(`Link copied: ${url}`)
  } else execBulk(action) // Route others through bulk executor
}

// --- 7. CORE FILE SYSTEM OPERATIONS ---
function setShareStatusRecursive(itemId: string, status: boolean) {
  const item = fileSystem.find((f) => f.id === itemId)
  if (!item) return
  item.shared = status
  if (item.type === "folder") {
    fileSystem.filter((f) => f.parentId === itemId).forEach((child) => setShareStatusRecursive(child.id, status))
  }
}

function setTrashedRecursive(itemId: string, status: boolean) {
  const item = fileSystem.find((f) => f.id === itemId)
  if (!item) return
  item.trashed = status
  if (item.type === "folder") {
    fileSystem.filter((f) => f.parentId === itemId).forEach((child) => setTrashedRecursive(child.id, status))
  }
}

function restoreItem(itemId: string) {
  const item = fileSystem.find((f) => f.id === itemId)
  if (!item) return

  // If restoring and parent is still trashed or missing, restore to Root Drive
  const parent = fileSystem.find((p) => p.id === item.parentId)
  if (!parent || parent.trashed) {
    item.parentId = "root"
  }
  setTrashedRecursive(itemId, false)
}

function deleteRecursive(itemId: string) {
  fileSystem.filter((f) => f.parentId === itemId).forEach((child) => deleteRecursive(child.id))
  const idx = fileSystem.findIndex((f) => f.id === itemId)
  if (idx > -1) fileSystem.splice(idx, 1)
}

function deepCopyItem(itemId: string, newParentId: string) {
  const original = fileSystem.find((f) => f.id === itemId)
  if (!original) return
  const newId = original.type + "-" + Math.random().toString(36).substr(2, 9)
  const nameSuffix = original.parentId !== newParentId ? " (Copy)" : ""
  fileSystem.push({ ...original, id: newId, parentId: newParentId, name: original.name + nameSuffix })
  if (original.type === "folder") {
    fileSystem.filter((f) => f.parentId === itemId).forEach((child) => deepCopyItem(child.id, newId))
  }
}

window.handlePaste = function () {
  if (!clipboard || !clipboard.itemIds || clipboard.itemIds.length === 0) return
  const currentFolder = currentPath[currentPath.length - 1]

  clipboard.itemIds.forEach((itemId) => {
    const targetItem = fileSystem.find((f) => f.id === itemId)
    if (!targetItem) return

    if (clipboard!.action === "cut" && isDescendant(currentFolder.id, itemId)) {
      alert(`Cannot move "${targetItem.name}" into its own subfolder.`)
      return
    }

    if (clipboard!.action === "copy") deepCopyItem(itemId, currentFolder.id)
    else if (clipboard!.action === "cut") targetItem.parentId = currentFolder.id
  })

  if (clipboard.action === "cut") clipboard = null
  renderApp()
}

function isDescendant(potentialChildId: string, targetParentId: string): boolean {
  if (potentialChildId === targetParentId) return true
  const child = fileSystem.find((f) => f.id === potentialChildId)
  if (!child || !child.parentId) return false
  return isDescendant(child.parentId, targetParentId)
}

// Navigation Details
window.handleRowClick = function (fileId: string) {
  const file = fileSystem.find((f) => f.id === fileId)
  if (file && file.type === "folder") {
    currentPath.push(file)
    clearSelection()
    renderApp()
  }
}

window.navigateToDepth = function (depthIndex: number) {
  currentPath = currentPath.slice(0, depthIndex + 1)
  clearSelection()
  renderApp()
}

// Top Level UI
window.toggleSidebar = function () {
  document.getElementById("sidebar")?.classList.toggle("open")
  document.getElementById("sidebar-overlay")?.classList.toggle("active")
}

window.toggleDropdown = function (id: string, event: MouseEvent) {
  event.stopPropagation()
  const dropdown = document.getElementById(id)
  if (!dropdown) return
  document.querySelectorAll(".dropdown-menu").forEach((menu) => {
    if (menu.id !== id) menu.classList.remove("show")
  })
  dropdown.classList.toggle("show")
}

window.createNewFolder = function () {
  const folderName = prompt("Enter new folder name:")
  if (!folderName || folderName.trim() === "") return
  const targetFolder = currentPath[currentPath.length - 1]
  fileSystem.push({
    id: "folder-" + Math.random().toString(36).substr(2, 9),
    name: folderName.trim(),
    type: "folder",
    owner: "me",
    size: "-",
    trashed: false,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    parentId: targetFolder.id,
    shared: targetFolder.shared,
  })
  renderApp()
}

window.handleFileInput = function (e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return
  const targetFolder = currentPath[currentPath.length - 1]
  for (const file of Array.from(files)) {
    // Infer type from extension
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    let type: FileType = "doc"
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) type = "image"
    else if (["xlsx", "xls", "csv"].includes(ext)) type = "sheet"
    else if (file.name.includes(".")) type = "doc"

    fileSystem.push({
      id: `${type}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type,
      owner: "me",
      size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(1)} KB`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      parentId: targetFolder.id,
      shared: targetFolder.shared,
      trashed: false,
    })
  }
  // reset input so same file can be re-selected
  input.value = ""
  renderApp()
}

// Drag & Drop overlay
if (dropZone && dropOverlay) {
  let dragCounter = 0
  dropZone.addEventListener("dragenter", (e) => {
    e.preventDefault()
    dragCounter++
    if (currentView === "drive") dropOverlay.classList.add("active")
  })
  dropZone.addEventListener("dragover", (e) => e.preventDefault())
  dropZone.addEventListener("dragleave", () => {
    dragCounter--
    if (dragCounter <= 0) {
      dragCounter = 0
      dropOverlay.classList.remove("active")
    }
  })
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault()
    dragCounter = 0
    dropOverlay.classList.remove("active")
    const dt = e.dataTransfer
    if (!dt || currentView !== "drive") return
    const targetFolder = currentPath[currentPath.length - 1]
    for (const file of Array.from(dt.files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
      let type: FileType = "doc"
      if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) type = "image"
      else if (["xlsx", "xls", "csv"].includes(ext)) type = "sheet"
      fileSystem.push({
        id: `${type}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type,
        owner: "me",
        size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(1)} KB`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        parentId: targetFolder.id,
        shared: targetFolder.shared,
        trashed: false,
      })
    }
    renderApp()
  })
}

// Close dropdowns on outside click (also handled in contextMenu listener)
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement
  if (!target.closest("#new-container")) {
    document.getElementById("new-dropdown")?.classList.remove("show")
  }
  if (!target.closest("#profile-container")) {
    document.getElementById("profile-dropdown")?.classList.remove("show")
  }
})

// Initial render - set drive active
document.getElementById("nav-drive")?.classList.add("active")
renderApp()
