'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import api from '@/lib/api'
import { format } from 'date-fns'

type InvoiceRow = {
  _id: string
  invoiceNumber?: string
  status: string
  total: number
  currency?: string
  createdAt: string
  customer?: { name?: string; email?: string }
  job?: { jobNumber?: string } | string
}

export default function ShopInvoicesPage() {
  const [draft, setDraft] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  })
  const [applied, setApplied] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  })

  const params = useMemo(() => {
    const p: Record<string, string> = {}
    if (applied.search.trim()) p.search = applied.search.trim()
    if (applied.status && applied.status !== 'all') p.status = applied.status
    if (applied.dateFrom) p.dateFrom = applied.dateFrom
    if (applied.dateTo) p.dateTo = applied.dateTo
    return p
  }, [applied])

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['shop-invoices', params],
    queryFn: async () => (await api.get<InvoiceRow[]>('/invoices', { params })).data,
  })

  const runSearch = useCallback(() => {
    setApplied({ ...draft })
  }, [draft])

  const statusLabel = (s: string) =>
    s === 'pending'
      ? 'Pending'
      : s === 'paid'
        ? 'Paid'
        : s === 'partial'
          ? 'Partial'
          : s === 'overdue'
            ? 'Overdue'
            : s

  return (
    <Layout>
      <PageHeader
        title="Invoices"
        description="Create invoices from rental jobs and track payment status."
      />

      <div className="mb-4 flex flex-wrap gap-3 justify-end">
        <Link href="/shop/invoices/new">
          <Button>Create invoice</Button>
        </Link>
      </div>

      <Card padding="lg" className="mb-6 space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Search and filters apply when you click Search.
        </p>
        <div className="flex flex-wrap gap-4 items-end">
          <label className="text-sm flex-1 min-w-[200px]">
            <span className="text-[var(--text-secondary)]">Search</span>
            <input
              type="search"
              placeholder="Invoice #, customer name or email"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Status
            <select
              className="mt-1 block rounded-xl border border-[var(--border)] px-3 py-2 min-w-[140px]"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <label className="text-sm">
            From
            <input
              type="date"
              className="mt-1 block rounded-xl border border-[var(--border)] px-3 py-2"
              value={draft.dateFrom}
              onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            To
            <input
              type="date"
              className="mt-1 block rounded-xl border border-[var(--border)] px-3 py-2"
              value={draft.dateTo}
              onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
            />
          </label>
          <Button type="button" onClick={runSearch} disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Search'}
          </Button>
        </div>
      </Card>

      <Card padding="none" className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
              <th className="text-left px-4 py-3 font-medium">Invoice</th>
              <th className="text-left px-4 py-3 font-medium">Job</th>
              <th className="text-left px-4 py-3 font-medium">Customer</th>
              <th className="text-right px-4 py-3 font-medium">Total</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="text-right px-4 py-3 font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                  No invoices match your filters.
                </td>
              </tr>
            )}
            {!isLoading &&
              invoices.map((inv) => (
                <tr key={inv._id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]/50">
                  <td className="px-4 py-3 font-mono text-[var(--text-primary)]">
                    {inv.invoiceNumber || '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {typeof inv.job === 'object' && inv.job?.jobNumber ? inv.job.jobNumber : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">{inv.customer?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {inv.currency || 'USD'} {Number(inv.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${
                        inv.status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : inv.status === 'overdue'
                            ? 'bg-red-500/15 text-red-700 dark:text-red-400'
                            : inv.status === 'partial'
                              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                              : 'bg-zinc-500/15 text-[var(--text-secondary)]'
                      }`}
                    >
                      {statusLabel(inv.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {inv.createdAt ? format(new Date(inv.createdAt), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/shop/invoices/${inv._id}`}
                      className="font-medium text-[var(--accent)] hover:brightness-95"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </Layout>
  )
}
