import { Script } from "vite-ssr-components/hono"
import { Layout } from "../components/Layout"
import { FileTable } from "../components/FileTable"

type Props = {
  user?: { username: string; email: string }
}

export const DrivePage = ({ user }: Props) => {
  return (
    <>
      <Layout user={user}>
        <FileTable />
      </Layout>
      {/* Client-side interactivity sliced from example.html <script> -> src/client/drive.ts */}
      <Script src="/src/client/drive.ts" />
    </>
  )
}
