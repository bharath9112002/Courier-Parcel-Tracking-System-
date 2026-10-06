import { useCallback, useEffect, useState } from 'react'

// Runs an async loader and tracks loading / error / data. `reload()` retries.
// Results from a stale run (e.g. after the component re-renders with a new
// key, or unmounts) are ignored.
export function useAsync(loader, deps) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [attempt, setAttempt] = useState(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps)

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, status: 'loading', error: null }))
    run()
      .then((data) => active && setState({ status: 'success', data, error: null }))
      .catch((error) => active && setState({ status: 'error', data: null, error }))
    return () => {
      active = false
    }
  }, [run, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  const setData = useCallback(
    (update) => setState((s) => ({ ...s, data: typeof update === 'function' ? update(s.data) : update })),
    [],
  )

  return { ...state, reload, setData }
}
