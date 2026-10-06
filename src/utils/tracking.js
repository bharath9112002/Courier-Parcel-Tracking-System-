// No 0/O or 1/I so tracking numbers are easy to read out over the phone.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const TRACKING_PATTERN = /^CR\d{6}[A-HJ-NP-Z2-9]{5}$/

// Format: CR + YYMMDD (shipping date) + 5 random characters, e.g. CR261006K7M2Q.
export function generateTrackingNumber(date = new Date(), existing = [], rand = Math.random) {
  const d = new Date(date)
  const yymmdd =
    String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')

  const taken = new Set(existing)
  let tracking
  do {
    let suffix = ''
    for (let i = 0; i < 5; i++) suffix += ALPHABET[Math.floor(rand() * ALPHABET.length)]
    tracking = `CR${yymmdd}${suffix}`
  } while (taken.has(tracking))
  return tracking
}
