'use client'

import { useCallback, useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'

type Row = {
  _id: string
  damageType: string
  severity: string
  description: string
  status: string
  productUnit?: { serialNumber: string }
}

type AppliedFilters = {
  status: string
  severity: string
  search: string
}

const defaultFilters: AppliedFilters = { status: '', severity: '', search: '' }

export default function DamagePage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<AppliedFilters>(defaultFilters)
  const [applied, setApplied] = useState<AppliedFilters>(defaultFilters)
  const [form, setForm] = useState({
    productUnitId: '',
    description: '',
    severity: 'MEDIUM',
    damageType: 'general',
  })
  const [resolveId, setResolveId] = useState<string | null>(null)
  const [resolveAction, setResolveAction] = useState<'REPAIR_TO_MAINTENANCE' | 'FIXED_ACTIVE' | 'SCRAPPED'>(
    'FIXED_ACTIVE'
  )
  const [resolveNote, setResolveNote] = useState('')

  const load = useCallback(() => {
    const params: Record<string, string> = {}
    if (applied.status) params.status = applied.status
    if (applied.severity) params.severity = applied.severity
    if (applied.search.trim()) params.search = applied.search.trim()

    setLoading(true)
    api
      .get('/inventory/damage', { params: Object.keys(params).length ? params : undefined })
      .then((r) => setRows(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [applied])

  useEffect(() => {
    load()
  }, [load])

  const applyFilters = () => {
    setApplied({ ...draft })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/inventory/damage', form)
      toast.success('Damage reported')
      setForm({ productUnitId: '', description: '', severity: 'MEDIUM', damageType: 'general' })
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const resolve = async () => {
    if (!resolveId) return
    try {
      await api.patch(`/inventory/damage/${resolveId}/resolve`, {
        action: resolveAction,
        resolutionNotes: resolveNote,
      })
      toast.success('Resolved')
      setResolveId(null)
      setResolveNote('')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  if (loading && rows.length === 0) {
    return (
      <Layout>
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageHeader title="Damage" description="Damaged units are removed from availability until resolved." />

      <Card className="p-6 mb-8">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">Report damage</h3>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Unit ID"
            value={form.productUnitId}
            onChange={(e) => setForm((f) => ({ ...f, productUnitId: e.target.value }))}
            required
          />
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Severity</label>
            <select
              className="w-full h-11 px-4 border rounded-xl bg-[var(--surface)] text-[var(--text-primary)]"
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
          <Button type="submit">Submit</Button>
        </form>
      </Card>

      <Card className="p-6 mb-6">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Filter by status, severity, or search description and serial. Click Search to apply.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
            <select
              className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            >
              <option value="">All</option>
              <option value="REPORTED">REPORTED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Severity</label>
            <select
              className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
              value={draft.severity}
              onChange={(e) => setDraft((d) => ({ ...d, severity: e.target.value }))}
            >
              <option value="">All</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Search"
              placeholder="Description or serial…"
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyFilters()
                }
              }}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <Button type="button" onClick={applyFilters} isLoading={loading}>
              Search
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0 divide-y divide-[var(--border)]">
        {rows.map((r) => (
          <div key={r._id} className="px-6 py-4 flex flex-wrap justify-between gap-4">
            <div>
              <p className="font-mono text-sm">{r.productUnit?.serialNumber}</p>
              <Badge variant={r.severity === 'CRITICAL' ? 'cancelled' : 'pending'}>{r.severity}</Badge>
              <p className="text-[var(--text-primary)] mt-2">{r.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={r.status === 'RESOLVED' ? 'active' : 'overdue'}>{r.status}</Badge>
              {r.status !== 'RESOLVED' && (
                <Button size="sm" onClick={() => setResolveId(r._id)}>
                  Resolve
                </Button>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-6 py-12 text-center text-[var(--text-secondary)]">No damage reports match your filters</div>
        )}
      </Card>

      {resolveId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Resolve damage</h3>
            <select
              className="w-full h-11 px-4 border rounded-xl bg-[var(--surface)] mb-4"
              value={resolveAction}
              onChange={(e) => setResolveAction(e.target.value as typeof resolveAction)}
            >
              <option value="FIXED_ACTIVE">Fixed — back to active</option>
              <option value="REPAIR_TO_MAINTENANCE">Send to maintenance</option>
              <option value="SCRAPPED">Scrap / retire unit</option>
            </select>
            <textarea
              className="w-full min-h-[60px] border rounded-lg p-2 text-sm mb-4"
              placeholder="Notes"
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setResolveId(null)}>
                Cancel
              </Button>
              <Button onClick={resolve}>Confirm</Button>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  )
}
