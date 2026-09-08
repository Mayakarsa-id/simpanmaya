import { IconPaste, IconX } from "./Icons"

export const ViewControls = () => {
  return (
    <div class="view-controls">
      {/* Standard Breadcrumbs - populated by client JS */}
      <div id="breadcrumbs" class="breadcrumbs"></div>

      {/* Paste Button */}
      <button id="btn-paste" class="btn-paste" onclick="handlePaste()">
        <IconPaste /> Paste Here
      </button>

      {/* Bulk Action Toolbar (Overlays breadcrumbs when items selected) */}
      <div id="bulk-toolbar" class="bulk-toolbar hidden">
        <div class="bulk-left">
          <button class="btn-icon" onclick="clearSelection()">
            <IconX />
          </button>
          <span id="bulk-count">1 selected</span>
        </div>
        <div class="bulk-actions" id="bulk-actions-container">
          {/* Populated by JS based on view */}
        </div>
      </div>
    </div>
  )
}
