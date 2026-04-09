'use client'

import { useEffect } from 'react'
import api from '@/lib/api'
import i18n from '@/lib/i18n'
import { getRole } from '@/lib/auth'
import { applyDocumentLanguage } from '@/lib/rtl'

/** After global defaults, apply business-owner tenant language and RTL when Arabic. */
export default function TenantLocaleSync() {
  useEffect(() => {
    if (getRole() !== 'business_owner') return

    let cancelled = false
    const apply = async () => {
      try {
        const { data } = await api.get('/auth/me')
        if (cancelled || data.role !== 'business_owner') return
        const lang = data.tenant?.language as string | undefined
        if (lang) {
          await i18n.changeLanguage(lang)
          applyDocumentLanguage(lang, 'business')
        }
      } catch {
        /* keep global defaults */
      }
    }
    apply()
    const onLocale = () => apply()
    if (typeof window !== 'undefined') window.addEventListener('tenant-locale-changed', onLocale)
    return () => {
      cancelled = true
      if (typeof window !== 'undefined') window.removeEventListener('tenant-locale-changed', onLocale)
    }
  }, [])

  return null
}
