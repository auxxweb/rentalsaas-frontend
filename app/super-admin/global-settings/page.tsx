'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { SearchToolbar } from '@/components/SearchToolbar'

interface CountryRow {
  _id: string
  name: string
  isoCode: string
  dialCode?: string
  currency: string
  timezone: string
  taxName: string
  taxPercentage: number
  taxIncluded: boolean
  dateFormat: string
  numberFormat: string
  isActive: boolean
}

export default function GlobalSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [savingGlobal, setSavingGlobal] = useState(false)

  const [globalForm, setGlobalForm] = useState({
    defaultLanguage: 'en',
    direction: 'ltr' as 'ltr' | 'rtl',
    defaultCurrency: 'USD',
    timezone: 'UTC',
    allowedCountries: [] as string[],
  })

  const [countries, setCountries] = useState<CountryRow[]>([])
  const [countrySearchDraft, setCountrySearchDraft] = useState('')
  const [countrySearchApplied, setCountrySearchApplied] = useState('')
  const [editing, setEditing] = useState<CountryRow | null>(null)

  const [newCountry, setNewCountry] = useState({
    name: '',
    isoCode: '',
    dialCode: '',
    currency: 'USD',
    timezone: 'UTC',
    taxName: 'VAT',
    taxPercentage: 0,
    taxIncluded: false,
    dateFormat: 'yyyy-MM-dd',
    numberFormat: 'en-GB',
  })

  const fetchGlobal = async () => {
    const res = await api.get('/admin/global-settings')
    const g = res.data
    setGlobalForm({
      defaultLanguage: g.defaultLanguage || 'en',
      direction: g.direction === 'rtl' ? 'rtl' : 'ltr',
      defaultCurrency: g.defaultCurrency || 'USD',
      timezone: g.timezone || 'UTC',
      allowedCountries: (g.allowedCountries || []).map((c: any) => (typeof c === 'string' ? c : c._id)),
    })
  }

  const fetchCountries = async () => {
    const params = new URLSearchParams()
    if (countrySearchApplied.trim()) params.set('search', countrySearchApplied.trim())
    const q = params.toString()
    const res = await api.get(`/admin/countries${q ? `?${q}` : ''}`)
    setCountries(res.data)
  }

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        await fetchGlobal()
      } catch {
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (loading) return
    fetchCountries()
  }, [countrySearchApplied, loading])

  const saveGlobal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingGlobal(true)
    try {
      await api.patch('/admin/global-settings', globalForm)
      toast.success('Global settings saved')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSavingGlobal(false)
    }
  }

  const createCountry = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/admin/countries', newCountry)
      toast.success('Country created')
      setNewCountry({
        name: '',
        isoCode: '',
        dialCode: '',
        currency: 'USD',
        timezone: 'UTC',
        taxName: 'VAT',
        taxPercentage: 0,
        taxIncluded: false,
        dateFormat: 'yyyy-MM-dd',
        numberFormat: 'en-GB',
      })
      fetchCountries()
      fetchGlobal()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Create failed')
    }
  }

  const saveCountry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    try {
      await api.patch(`/admin/countries/${editing._id}`, {
        name: editing.name,
        isoCode: editing.isoCode,
        dialCode: editing.dialCode,
        currency: editing.currency,
        timezone: editing.timezone,
        taxName: editing.taxName,
        taxPercentage: editing.taxPercentage,
        taxIncluded: editing.taxIncluded,
        dateFormat: editing.dateFormat,
        numberFormat: editing.numberFormat,
        isActive: editing.isActive,
      })
      toast.success('Country updated')
      setEditing(null)
      fetchCountries()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  const toggleAllowed = (id: string) => {
    setGlobalForm((f) => {
      const has = f.allowedCountries.includes(id)
      return {
        ...f,
        allowedCountries: has ? f.allowedCountries.filter((x) => x !== id) : [...f.allowedCountries, id],
      }
    })
  }

  if (loading) {
    return (
      <Layout>
        <div className="px-4 py-6 text-[var(--text-secondary)] text-sm">Loading…</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-4xl mx-auto space-y-8">
        <PageHeader
          title="Global settings"
          description="Country rules, tax, currency, timezone, and language defaults for all business owners"
        />

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Defaults</h3>
          <form onSubmit={saveGlobal} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Default language</label>
              <select
                className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                value={globalForm.defaultLanguage}
                onChange={(e) => setGlobalForm((f) => ({ ...f, defaultLanguage: e.target.value }))}
              >
                <option value="en">English (en)</option>
                <option value="ar">Arabic (ar)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Layout direction</label>
              <select
                className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                value={globalForm.direction}
                onChange={(e) => setGlobalForm((f) => ({ ...f, direction: e.target.value as 'ltr' | 'rtl' }))}
              >
                <option value="ltr">LTR</option>
                <option value="rtl">RTL</option>
              </select>
            </div>
            <Input
              label="Default currency (ISO)"
              value={globalForm.defaultCurrency}
              onChange={(e) => setGlobalForm((f) => ({ ...f, defaultCurrency: e.target.value.toUpperCase() }))}
            />
            <Input
              label="Default timezone (IANA)"
              value={globalForm.timezone}
              onChange={(e) => setGlobalForm((f) => ({ ...f, timezone: e.target.value }))}
              helperText="e.g. UTC, Asia/Dubai"
            />
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Allowed countries (registration)</p>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto border border-[var(--border)] rounded-xl p-3">
                {countries.map((c) => (
                  <label key={c._id} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={globalForm.allowedCountries.includes(c._id)}
                      onChange={() => toggleAllowed(c._id)}
                    />
                    {c.name} ({c.isoCode})
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={savingGlobal}>
              {savingGlobal ? 'Saving…' : 'Save global settings'}
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Countries</h3>
          <SearchToolbar
            draft={countrySearchDraft}
            onDraftChange={setCountrySearchDraft}
            onSearch={() => setCountrySearchApplied(countrySearchDraft)}
            placeholder="Search countries (click Search)"
          />

          <div className="overflow-x-auto border border-[var(--border)] rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface-2)] text-left text-[var(--text-secondary)]">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">ISO</th>
                  <th className="px-3 py-2">Dial</th>
                  <th className="px-3 py-2">Currency</th>
                  <th className="px-3 py-2">Tax %</th>
                  <th className="px-3 py-2">Active</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {countries.map((c) => (
                  <tr key={c._id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2">{c.isoCode}</td>
                    <td className="px-3 py-2">{c.dialCode}</td>
                    <td className="px-3 py-2">{c.currency}</td>
                    <td className="px-3 py-2">{c.taxPercentage}</td>
                    <td className="px-3 py-2">{c.isActive ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => setEditing({ ...c })}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="font-semibold text-[var(--text-primary)] mt-8 mb-3">Add country</h4>
          <form onSubmit={createCountry} className="grid gap-3 sm:grid-cols-2 max-w-3xl">
            <Input label="Name" value={newCountry.name} onChange={(e) => setNewCountry((n) => ({ ...n, name: e.target.value }))} />
            <Input label="ISO code" value={newCountry.isoCode} onChange={(e) => setNewCountry((n) => ({ ...n, isoCode: e.target.value }))} />
            <Input label="Dial code" value={newCountry.dialCode} onChange={(e) => setNewCountry((n) => ({ ...n, dialCode: e.target.value }))} />
            <Input label="Currency" value={newCountry.currency} onChange={(e) => setNewCountry((n) => ({ ...n, currency: e.target.value }))} />
            <Input label="Timezone" value={newCountry.timezone} onChange={(e) => setNewCountry((n) => ({ ...n, timezone: e.target.value }))} />
            <Input label="Tax name" value={newCountry.taxName} onChange={(e) => setNewCountry((n) => ({ ...n, taxName: e.target.value }))} />
            <Input
              type="number"
              label="Tax %"
              value={newCountry.taxPercentage}
              onChange={(e) => setNewCountry((n) => ({ ...n, taxPercentage: Number(e.target.value) }))}
            />
            <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] sm:col-span-2">
              <input
                type="checkbox"
                checked={newCountry.taxIncluded}
                onChange={(e) => setNewCountry((n) => ({ ...n, taxIncluded: e.target.checked }))}
              />
              Tax included in prices
            </label>
            <Button type="submit" className="sm:col-span-2 w-fit">
              Add country
            </Button>
          </form>
        </Card>

        {editing && (
          <Card>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Edit {editing.name}</h3>
            <form onSubmit={saveCountry} className="grid gap-3 sm:grid-cols-2 max-w-3xl">
              <Input label="Name" value={editing.name} onChange={(e) => setEditing((x) => (x ? { ...x, name: e.target.value } : x))} />
              <Input label="ISO code" value={editing.isoCode} onChange={(e) => setEditing((x) => (x ? { ...x, isoCode: e.target.value } : x))} />
              <Input label="Dial code" value={editing.dialCode || ''} onChange={(e) => setEditing((x) => (x ? { ...x, dialCode: e.target.value } : x))} />
              <Input label="Currency" value={editing.currency} onChange={(e) => setEditing((x) => (x ? { ...x, currency: e.target.value } : x))} />
              <Input label="Timezone" value={editing.timezone} onChange={(e) => setEditing((x) => (x ? { ...x, timezone: e.target.value } : x))} />
              <Input label="Tax name" value={editing.taxName} onChange={(e) => setEditing((x) => (x ? { ...x, taxName: e.target.value } : x))} />
              <Input
                type="number"
                label="Tax %"
                value={editing.taxPercentage}
                onChange={(e) => setEditing((x) => (x ? { ...x, taxPercentage: Number(e.target.value) } : x))}
              />
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={editing.taxIncluded}
                  onChange={(e) => setEditing((x) => (x ? { ...x, taxIncluded: e.target.checked } : x))}
                />
                Tax included
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => setEditing((x) => (x ? { ...x, isActive: e.target.checked } : x))}
                />
                Active
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">Save country</Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </Layout>
  )
}
