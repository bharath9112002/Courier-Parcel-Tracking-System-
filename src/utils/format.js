export const formatNumber = (n) => new Intl.NumberFormat('en-IN').format(n)

export const formatDate = (ms, options = { dateStyle: 'medium' }) =>
  new Date(ms).toLocaleString('en-IN', options)

export function timeAgo(ms, now = Date.now()) {
  const minutes = Math.round((now - ms) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
