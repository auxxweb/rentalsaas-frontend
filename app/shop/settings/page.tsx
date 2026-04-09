'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { COMMON_TIMEZONES } from '@/lib/commonTimezones'

type CountryOpt = {
  _id: string
  name: string
  isoCode: string
  dialCode: string
  currency: string
  timezone: string
  taxName: string
  taxPercentage: number
  taxIncluded: boolean
}

export default function ShopSettingsPage() {
  const { t } = useTranslation('shop')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [countries, setCountries] = useState<CountryOpt[]>([])

  const [countryId, setCountryId] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [timezone, setTimezone] = useState('UTC')
  const [dialCode, setDialCode] = useState('')
  const [phone, setPhone] = useState('')
  const [taxName, setTaxName] = useState('VAT')
  const [taxPercent, setTaxPercent] = useState(0)
  const [taxInclusive, setTaxInclusive] = useState(false)
  const [language, setLanguage] = useState('en')
  const [termsAndConditions, setTermsAndConditions] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [settingsRes, countriesRes] = await Promise.all([
        api.get('/shop/settings'),
        api.get('/shop/settings/available-countries'),
      ])
      const list = countriesRes.data || []
      setCountries(list)
      const { shop, tenant } = settingsRes.data

      setTermsAndConditions(shop?.termsAndConditions || '')
      setDialCode(tenant?.dialCode || shop?.settings?.dialCode || '')
      setPhone(tenant?.phone || '')
      setLanguage(tenant?.language || shop?.settings?.language || 'en')
      setTimezone(tenant?.timezone || shop?.settings?.timezone || 'UTC')
      setCurrency(tenant?.currency || shop?.settings?.currency || 'USD')

      if (tenant) {
        const cid = tenant.countryId as { _id?: string } | string | undefined
        setCountryId(typeof cid === 'object' && cid?._id ? cid._id : (cid as string) || '')
        const tr = tenant.taxProfile
        if (tr?.vatRate != null) setTaxPercent(Math.round(Number(tr.vatRate) * 10000) / 100)
        if (tr?.taxInclusive != null) setTaxInclusive(!!tr.taxInclusive)
        if (tr?.taxName) setTaxName(tr.taxName)
      } else {
        const iso = shop?.settings?.countryCode as string | undefined
        if (iso && list.length) {
          const match = list.find((c: CountryOpt) => c.isoCode === iso)
          if (match) setCountryId(match._id)
        }
        setTaxPercent(Number(shop?.settings?.taxRate) || 0)
        setTaxInclusive(!!shop?.settings?.taxInclusive)
      }
    } catch {
      toast.error(t('settings.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onCountryChange = (id: string) => {
    setCountryId(id)
    const c = countries.find((x) => x._id === id)
    if (c) {
      setCurrency(c.currency)
      setTimezone(c.timezone)
      setDialCode(c.dialCode || '')
      setTaxName(c.taxName || 'VAT')
      setTaxPercent(Number(c.taxPercentage) || 0)
      setTaxInclusive(!!c.taxIncluded)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!countryId && countries.length > 0) {
      toast.error(t('settings.selectCountryError'))
      return
    }
    setSaving(true)
    try {
      const vatRate = Math.min(1, Math.max(0, taxPercent / 100))
      await api.patch('/shop/settings', {
        countryId: countryId || undefined,
        currency,
        timezone,
        dialCode,
        phone,
        language,
        termsAndConditions,
        taxProfile: {
          vatRate,
          taxInclusive,
          taxName,
        },
      })
      toast.success(t('settings.saved'))
      await load()
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('tenant-locale-changed'))
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.saveError'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="px-4 py-6 text-sm text-[var(--text-secondary)]">{t('settings.loading')}</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-3xl mx-auto space-y-6">
        <PageHeader title={t('settings.heading')} description={t('settings.subtitle')} />

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-[var(--text-secondary)]">{t('settings.quickLinks')}</span>
          <Link href="/shop/settings/password" className="text-[var(--accent)] font-medium hover:underline">
            {t('settings.changePassword')}
          </Link>
        </div>

        <Card>
          <form onSubmit={save} className="space-y-5">
            <h3 className="font-semibold text-[var(--text-primary)]">{t('settings.regionTax')}</h3>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t('settings.country')}</label>
              <select
                className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)]"
                value={countryId}
                onChange={(e) => onCountryChange(e.target.value)}
              >
                <option value="">{t('settings.selectCountry')}</option>
                {countries.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.isoCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t('settings.currency')}</label>
              <select
                className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {['USD', 'GBP', 'EUR', 'AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR']
                  .concat(
                    currency && !['USD', 'GBP', 'EUR', 'AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR'].includes(currency)
                      ? [currency]
                      : []
                  )
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t('settings.timezone')}</label>
              <select
                className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{t('settings.timezoneHint')}</p>
            </div>

            <h3 className="font-semibold text-[var(--text-primary)] pt-2">{t('settings.contact')}</h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input label={t('settings.phoneCode')} value={dialCode} onChange={(e) => setDialCode(e.target.value)} placeholder="+971" />
              <Input
                label={t('settings.phoneNumber')}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="501234567"
                helperText={t('settings.phoneHint')}
              />
            </div>

            <h3 className="font-semibold text-[var(--text-primary)] pt-2">{t('settings.tax')}</h3>

            <Input label={t('settings.taxLabel')} value={taxName} onChange={(e) => setTaxName(e.target.value)} placeholder="VAT" />
            <Input
              type="number"
              label={t('settings.taxRate')}
              min={0}
              max={100}
              step={0.01}
              value={taxPercent}
              onChange={(e) => setTaxPercent(Number(e.target.value))}
            />
            <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <input type="checkbox" checked={taxInclusive} onChange={(e) => setTaxInclusive(e.target.checked)} />
              {t('settings.taxInclusive')}
            </label>

            <h3 className="font-semibold text-[var(--text-primary)] pt-2">{t('settings.language')}</h3>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t('settings.panelLanguage')}</label>
              <select
                className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">{t('settings.langEn')}</option>
                <option value="ar">{t('settings.langAr')}</option>
              </select>
            </div>

            <h3 className="font-semibold text-[var(--text-primary)] pt-2">{t('settings.terms')}</h3>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t('settings.termsHint')}</label>
              <textarea
                className="w-full min-h-[160px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-primary)]"
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder={t('settings.termsPlaceholder')}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? t('settings.saving') : t('settings.save')}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
