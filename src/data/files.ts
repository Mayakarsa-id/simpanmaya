export type FileType = "folder" | "doc" | "sheet" | "image"

export type FileEntry = {
  id: string
  name: string
  type: FileType
  owner?: string
  date?: string
  size?: string
  parentId: string | null
  shared: boolean
  trashed: boolean
}

export const initialFiles: FileEntry[] = [
  { id: "root", name: "My Drive", type: "folder", parentId: null, shared: false, trashed: false },
  { id: "1", name: "Q3 Financial Report.xlsx", type: "sheet", owner: "me", date: "Aug 24, 2026", size: "2.4 MB", parentId: "root", shared: false, trashed: false },
  { id: "2", name: "Brand Guidelines", type: "folder", owner: "me", date: "Aug 20, 2026", size: "-", parentId: "root", shared: true, trashed: false },
  { id: "2-1", name: "Company Logo.png", type: "image", owner: "me", date: "Aug 25, 2026", size: "1.2 MB", parentId: "2", shared: true, trashed: false },
]

export function findFile(id: string) {
  return initialFiles.find((f) => f.id === id)
}

export function listChildren(parentId: string) {
  return initialFiles.filter((f) => f.parentId === parentId && !f.trashed)
}
