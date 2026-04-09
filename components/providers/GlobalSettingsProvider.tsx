'use client'

import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'
import api from '@/lib/api'
import { applyDocumentLanguage } from '@/lib/rtl'

export default function GlobalSettingsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get('/global-settings')
        const lang = (data?.defaultLanguage as string) || 'en'
        const globalDirection = (data?.direction as string) === 'rtl' ? 'rtl' : 'ltr'
        await i18n.changeLanguage(lang)
        applyDocumentLanguage(lang, 'global', globalDirection)
      } catch {
        applyDocumentLanguage('en', 'global', 'ltr')
        await i18n.changeLanguage('en')
      }
    })()
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
