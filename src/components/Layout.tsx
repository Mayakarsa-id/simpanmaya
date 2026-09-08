import { Sidebar, SidebarOverlay } from "./Sidebar"
import { Header } from "./Header"
import { DropOverlay } from "./DropOverlay"
import { ViewControls } from "./ViewControls"
import { FileTable } from "./FileTable"
import { ContextMenu } from "./ContextMenu"

type LayoutProps = {
  children?: any
  hideViewControls?: boolean
  user?: { username: string; email: string }
}

export const Layout = ({ children, hideViewControls, user }: LayoutProps) => {
  return (
    <>
      <SidebarOverlay />
      <Sidebar />
      <main id="drop-zone">
        <DropOverlay />
        <Header user={user} />
        {!hideViewControls && <ViewControls />}
        {children ?? <FileTable />}
      </main>
      <ContextMenu />
    </>
  )
}
