import { useEffect, useState } from 'react'

export function useNow(isActive: boolean): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isActive) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [isActive])

  return now
}
