import { useCallback } from 'react'
import { useTranslations } from 'use-intl'
import { AppError } from '../../../shared/errors'

export function useErrorMessage(): (error: unknown) => string {
  const t = useTranslations('Errors')

  return useCallback((error: unknown) => t(error instanceof AppError ? error.code : 'UNKNOWN'), [t])
}
