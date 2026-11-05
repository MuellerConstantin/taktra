import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'

export const createRequest = { create: true } as const

export function useCreateRequest(onCreate: () => void): void {
  const location = useLocation()
  const navigate = useNavigate()
  const onCreateRef = useRef(onCreate)

  useEffect(() => {
    onCreateRef.current = onCreate
  }, [onCreate])

  useEffect(() => {
    const state = location.state as Partial<typeof createRequest> | null
    if (!state?.create) return
    onCreateRef.current()
    navigate({ pathname: location.pathname, search: location.search }, { replace: true })
  }, [location, navigate])
}
