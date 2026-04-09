'use client'

import { useTranslation } from 'react-i18next'
import api from '@/lib/api'
import { applyDocumentLanguage } from '@/lib/rtl'
import { toast } from 'react-toastify'

const OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
]

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation('shop')
  const base = (i18n.language || 'en').split('-')[0]

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lng = e.target.value
    try {
      await i18n.changeLanguage(lng)
      applyDocumentLanguage(lng, 'business')
      window.dispatchEvent(new Event('tenant-locale-changed'))
      await api.patch('/shop/settings', { language: lng })
    } catch {
      toast.error(t('settings.saveError'))
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-xs text-[var(--text-secondary)] whitespace-nowrap">
        {t('layout.language')}
      </span>
      <select
        value={OPTIONS.some((o) => o.value === base) ? base : 'en'}
        onChange={onChange}
        className="h-9 min-w-[110px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs text-[var(--text-primary)]"
        aria-label={t('layout.language')}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
