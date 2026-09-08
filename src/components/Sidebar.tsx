import { IconDrive, IconFolder, IconPlus, IconTrash, IconUpload } from "./Icons"

export const Sidebar = () => {
  return (
    <aside id="sidebar">
      <div class="brand">
        <div class="brand-logo"></div>
        <span class="brand-text">SimpanMaya</span>
      </div>

      <div class="new-btn-container" id="new-container">
        <button class="btn-new" onclick="toggleDropdown('new-dropdown', event)">
          <IconPlus /> New
        </button>
        <div class="dropdown-menu" id="new-dropdown">
          <button class="dropdown-item" onclick="createNewFolder()">
            <IconFolder /> New folder
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" onclick="document.getElementById('file-upload').click()">
            <IconUpload /> File upload
          </button>
        </div>
        <input type="file" id="file-upload" multiple hidden onchange="handleFileInput(event)" />
      </div>

      <nav class="nav-menu">
        <a class="nav-item" id="nav-drive" onclick="switchView('drive')">
          <IconDrive /> My Drive
        </a>
        <a class="nav-item" id="nav-trash" onclick="switchView('trash')">
          <IconTrash /> Trash
        </a>
      </nav>

      <div class="storage-tracker">
        <p class="storage-text">13.2 GB used</p>
        {/*<div class="progress-bar">
          <div class="progress-fill"></div>
        </div>*/}
      </div>
    </aside>
  )
}

export const SidebarOverlay = () => {
  return <div id="sidebar-overlay" class="sidebar-overlay" onclick="toggleSidebar()"></div>
}
