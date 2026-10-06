const DEFAULT_TIMEOUT = 10000

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// fetch() wrapper: JSON in/out, a timeout, and human-readable errors.
export async function request(url, { method = 'GET', body, timeout = DEFAULT_TIMEOUT } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  let res
  try {
    res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    throw new ApiError(
      err.name === 'AbortError'
        ? 'The server took too long to respond. Please try again.'
        : 'Network error. Check your internet connection and try again.',
    )
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    throw new ApiError(`Request failed with status ${res.status}. Please try again.`, res.status)
  }
  return res.status === 204 ? null : res.json()
}
