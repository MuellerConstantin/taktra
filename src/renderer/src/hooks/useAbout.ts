import { useContext } from 'react'
import { AboutContext, type AboutContextValue } from '../contexts/AboutContext'

export function useAbout(): AboutContextValue {
  const context = useContext(AboutContext)

  if (!context) throw new Error('useAbout must be used within an AboutProvider')

  return context
}
