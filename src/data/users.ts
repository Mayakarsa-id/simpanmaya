export type User = {
  username: string
  email: string
  secret: string
  createdAt: string
}

// In-memory store — persists via globalThis for HMR / Workers isolate reuse
declare global {
  var __simpanmaya_users: Map<string, User> | undefined
  var __simpanmaya_users_by_email: Map<string, string> | undefined
}

const users: Map<string, User> = (globalThis as any).__simpanmaya_users ??= new Map()
const emailIndex: Map<string, string> = (globalThis as any).__simpanmaya_users_by_email ??= new Map()

export function findUser(username: string): User | undefined {
  return users.get(username.toLowerCase())
}

export function findUserByEmail(email: string): User | undefined {
  const u = emailIndex.get(email.toLowerCase())
  return u ? users.get(u) : undefined
}

export function createUser(username: string, email: string, secret: string): User {
  const key = username.toLowerCase()
  const emailKey = email.toLowerCase()
  if (users.has(key)) throw new Error("Username already taken")
  if (emailIndex.has(emailKey)) throw new Error("Email already registered")
  const user: User = {
    username,
    email,
    secret,
    createdAt: new Date().toISOString(),
  }
  users.set(key, user)
  emailIndex.set(emailKey, key)
  return user
}

export function listUsers(): User[] {
  return [...users.values()]
}

// Seed a demo user for quick testing (username: demo, email: demo@simpanmaya.id, secret for TOTP)
// To keep demo deterministic, we use a fixed secret: JBSWY3DPEHPK3PXP (base32 for "Hello!..." classic demo)
// TOTP for this secret at a given time can be generated via /utils/totp
// We lazily seed on first import if not exists
if (!users.has("demo")) {
  try {
    createUser("demo", "demo@simpanmaya.id", "JBSWY3DPEHPK3PXP")
  } catch {}
}
