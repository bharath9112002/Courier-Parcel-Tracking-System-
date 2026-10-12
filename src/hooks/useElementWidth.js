import { useLayoutEffect, useRef, useState } from 'react'

// Width of an element, kept up to date as it resizes. Charts draw at their
// real pixel width so text and line weights stay crisp. Measured before the
// first paint, so a chart never renders wider than its container.
export function useElementWidth(initial = 300) {
  const ref = useRef(null)
  const [width, setWidth] = useState(initial)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(Math.round(el.getBoundingClientRect().width))
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}
