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
import { format } from 'date-fns'

type Row = {
  _id: string
  issueDescription: string
  startDate: string
  expectedEndDate?: string
  status: string
  productUnit?: { serialNumber: string }
}

type AppliedFilters = {
  status: string
  search: string
  from: string
  to: string
}

const defaultFilters: AppliedFilters = { status: '', search: '', from: '', to: '' }

export default function MaintenancePage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<AppliedFilters>(defaultFilters)
  const [applied, setApplied] = useState<AppliedFilters>(defaultFilters)
  const [form, setForm] = useState({ productUnitId: '', issueDescription: '', expectedEndDate: '' })

  const load = useCallback(() => {
    const params: Record<string, string> = {}
    if (applied.status) params.status = applied.status
    if (applied.search.trim()) params.search = applied.search.trim()
    if (applied.from) params.from = applied.from
    if (applied.to) params.to = applied.to

    setLoading(true)
    api
      .get('/inventory/maintenance', { params: Object.keys(params).length ? params : undefined })
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
      await api.post('/inventory/maintenance', {
        productUnitId: form.productUnitId.trim(),
        issueDescription: form.issueDescription.trim(),
        expectedEndDate: form.expectedEndDate || undefined,
      })
      toast.success('Maintenance started')
      setForm({ productUnitId: '', issueDescription: '', expectedEndDate: '' })
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const complete = async (id: string) => {
    try {
      await api.patch(`/inventory/maintenance/${id}/complete`, {})
      toast.success('Marked completed')
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
      <PageHeader title="Maintenance" description="Units in maintenance are blocked from new bookings." />

      <Card className="p-6 mb-8">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">Start maintenance</h3>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Unit ID"
            value={form.productUnitId}
            onChange={(e) => setForm((f) => ({ ...f, productUnitId: e.target.value }))}
            placeholder="Mongo id from Units page"
            required
          />
          <Input
            label="Expected end (optional)"
            type="datetime-local"
            value={form.expectedEndDate}
            onChange={(e) => setForm((f) => ({ ...f, expectedEndDate: e.target.value }))}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Issue</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
              value={form.issueDescription}
              onChange={(e) => setForm((f) => ({ ...f, issueDescription: e.target.value }))}
              required
            />
          </div>
          <Button type="submit">Create</Button>
        </form>
      </Card>

      <Card className="p-6 mb-6">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Filter by status, issue text or unit serial, and start date range. Click Search to apply.
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
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Search"
              placeholder="Issue text or serial number…"
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
          <div>
            <Input
              label="Start from"
              type="date"
              value={draft.from}
              onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
            />
          </div>
          <div>
            <Input
              label="Start to"
              type="date"
              value={draft.to}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
            />
          </div>
          <div className="lg:col-span-4 flex justify-end">
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
              <p className="font-mono text-sm text-[var(--text-secondary)]">{r.productUnit?.serialNumber}</p>
              <p className="text-[var(--text-primary)] mt-1">{r.issueDescription}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                {format(new Date(r.startDate), 'PPp')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={r.status === 'COMPLETED' ? 'active' : 'pending'}>{r.status}</Badge>
              {r.status !== 'COMPLETED' && (
                <Button size="sm" onClick={() => complete(r._id)}>
                  Mark completed
                </Button>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-6 py-12 text-center text-[var(--text-secondary)]">No records match your filters</div>
        )}
      </Card>
    </Layout>
  )
}
