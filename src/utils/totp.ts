// TOTP utility — pure Web Crypto, no external deps, Workers-compatible
// Implements RFC 6238 (TOTP) over RFC 4226 (HOTP) with SHA1, 30s period, 6 digits

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ""
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  while (output.length % 8 !== 0) output += "="
  return output
}

export function base32Decode(str: string): Uint8Array {
  const cleaned = str.replace(/=+$/, "").toUpperCase()
  let bits = 0
  let value = 0
  const out: number[] = []
  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i])
    if (idx === -1) throw new Error(`Invalid base32 character: ${cleaned[i]}`)
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return new Uint8Array(out)
}

export function generateSecret(byteLength = 20): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  // Remove padding for otpauth compatibility
  return base32Encode(bytes).replace(/=+$/, "")
}

export function getOTPAuthUrl(opts: { username: string; secret: string; issuer?: string }): string {
  const issuer = opts.issuer ?? "SimpanMaya"
  const label = `${issuer}:${opts.username}`
  const params = new URLSearchParams({
    secret: opts.secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  })
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`
}

// HOTP core
async function hmacSha1(key: Uint8Array, counter: number): Promise<Uint8Array> {
  const counterBuf = new ArrayBuffer(8)
  const view = new DataView(counterBuf)
  // High 4 bytes are 0 for 32-bit counter range (covers until year 2038+ for TOTP)
  view.setUint32(4, counter, false) // big-endian
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, counterBuf)
  return new Uint8Array(sig)
}

async function hotp(secret: string, counter: number, digits = 6): Promise<string> {
  const key = base32Decode(secret)
  const hmac = await hmacSha1(key, counter)
  const offset = hmac[hmac.length - 1] & 0x0f
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  const otp = binCode % 10 ** digits
  return otp.toString().padStart(digits, "0")
}

export async function verifyTOTP(secret: string, token: string, window = 1, period = 30): Promise<boolean> {
  const cleaned = token.replace(/\s+/g, "")
  if (!/^\d{6}$/.test(cleaned)) return false
  const counter = Math.floor(Date.now() / 1000 / period)
  for (let i = -window; i <= window; i++) {
    const expected = await hotp(secret, counter + i, 6)
    if (expected === cleaned) return true
  }
  return false
}

// For debugging / testing
export async function generateCurrentTOTP(secret: string): Promise<string> {
  const counter = Math.floor(Date.now() / 1000 / 30)
  return hotp(secret, counter, 6)
}
