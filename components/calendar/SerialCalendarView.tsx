'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { addDays, endOfDay, endOfWeek, format, parseISO, startOfDay, startOfWeek } from 'date-fns'
import Layout from '@/components/Layout'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import api from '@/lib/api'
import { useTenantReady } from '@/lib/hooks/useTenantReady'
import {
  type BookingSeg,
  type CalendarPayload,
  cellClass,
  cellKind,
  dayBounds,
} from '@/components/calendar/serialCalendarHelpers'

type Product = { _id: string; name: string; modelNumber: string }
type Category = { _id: string; name: string }

type Props = {
  bookingsPath: string
  pageTitle?: string
  pageDescription?: string
}

export default function SerialCalendarView({
  bookingsPath,
  pageTitle = 'Rental calendar',
  pageDescription = 'Serial-level availability. Filters apply when you click Search.',
}: Props) {
  const router = useRouter()
  const ready = useTenantReady()
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [anchor, setAnchor] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [draftProductId, setDraftProductId] = useState('')
  const [draftCategoryId, setDraftCategoryId] = useState('')
  const [queryRange, setQueryRange] = useState<{ start: Date; end: Date } | null>(null)
  const [appliedProductId, setAppliedProductId] = useState('')
  const [appliedCategoryId, setAppliedCategoryId] = useState('')
  const [detail, setDetail] = useState<{ booking: BookingSeg; serial: string } | null>(null)

  const { data: productsList = [] } = useQuery({
    queryKey: ['v2-catalog-products', Cookies.get('tenantId')],
    queryFn: async () => (await api.get<Product[]>('/v2/catalog-products')).data,
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  })

  const { data: categoriesList = [] } = useQuery({
    queryKey: ['v2-categories', Cookies.get('tenantId')],
    queryFn: async () => (await api.get<Category[]>('/v2/categories')).data,
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  })

  /** After Search, columns follow the loaded range; before Search, follow anchor preview. */
  const displayDays = useMemo(() => {
    if (queryRange) {
      const out: Date[] = []
      let d = startOfDay(queryRange.start)
      const last = startOfDay(queryRange.end)
      while (d <= last) {
        out.push(d)
        d = addDays(d, 1)
      }
      return out
    }
    const a = parseISO(anchor)
    let rs: Date
    let re: Date
    if (viewMode === 'day') {
      rs = startOfDay(a)
      re = endOfDay(a)
    } else {
      rs = startOfWeek(a, { weekStartsOn: 1 })
      re = endOfWeek(a, { weekStartsOn: 1 })
    }
    const out: Date[] = []
    let d = startOfDay(rs)
    const last = startOfDay(re)
    while (d <= last) {
      out.push(d)
      d = addDays(d, 1)
    }
    return out
  }, [queryRange, anchor, viewMode])

  const calendarQuery = useQuery({
    queryKey: [
      'v2-calendar',
      queryRange?.start.toISOString(),
      queryRange?.end.toISOString(),
      appliedProductId,
      appliedCategoryId,
      Cookies.get('tenantId'),
    ],
    queryFn: async () => {
      if (!queryRange) throw new Error('No range')
      const { data } = await api.get<CalendarPayload>('/v2/calendar', {
        params: {
          startDate: queryRange.start.toISOString(),
          endDate: queryRange.end.toISOString(),
          ...(appliedProductId ? { productId: appliedProductId } : {}),
          ...(appliedCategoryId ? { categoryId: appliedCategoryId } : {}),
        },
      })
      return data
    },
    enabled: ready && !!queryRange,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const runSearch = useCallback(() => {
    const a = parseISO(anchor)
    let rs: Date
    let re: Date
    if (viewMode === 'day') {
      rs = startOfDay(a)
      re = endOfDay(a)
    } else {
      rs = startOfWeek(a, { weekStartsOn: 1 })
      re = endOfWeek(a, { weekStartsOn: 1 })
    }
    setQueryRange({ start: rs, end: re })
    setAppliedProductId(draftProductId)
    setAppliedCategoryId(draftCategoryId)
  }, [anchor, viewMode, draftProductId, draftCategoryId])

  const data = calendarQuery.data
  const loading = calendarQuery.isFetching

  function axiosMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const dataMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      if (dataMsg) return dataMsg
    }
    if (err instanceof Error && err.message) return err.message
    return 'Failed to load calendar'
  }

  const errMsg = calendarQuery.isError ? axiosMessage(calendarQuery.error) : null

  if (Cookies.get('role') === 'super_admin' && !Cookies.get('tenantId')) {
    return (
      <Layout>
        <Card padding="lg">Select a tenant in the header first.</Card>
      </Layout>
    )
  }

  if (!ready) {
    return (
      <Layout>
        <Card padding="lg">Loading…</Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageHeader title={pageTitle} description={pageDescription} />

      <Card padding="lg" className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <label className="text-sm">
            <span className="text-[var(--text-secondary)]">Anchor date</span>
            <input
              type="datetime-local"
              className="mt-1 block rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
            />
          </label>
          <label className="text-sm">
            View
            <select
              className="mt-1 block rounded-xl border border-[var(--border)] px-3 py-2"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'week' | 'day')}
            >
              <option value="week">Week</option>
              <option value="day">Day</option>
            </select>
          </label>
          <label className="text-sm">
            Product
            <select
              className="mt-1 block rounded-xl border border-[var(--border)] px-3 py-2 min-w-[180px]"
              value={draftProductId}
              onChange={(e) => setDraftProductId(e.target.value)}
            >
              <option value="">All</option>
              {productsList.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Category
            <select
              className="mt-1 block rounded-xl border border-[var(--border)] px-3 py-2 min-w-[160px]"
              value={draftCategoryId}
              onChange={(e) => setDraftCategoryId(e.target.value)}
            >
              <option value="">All</option>
              {categoriesList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" onClick={runSearch} disabled={loading}>
            {loading ? 'Loading…' : 'Search'}
          </Button>
        </div>
        {queryRange && (
          <p className="text-sm text-[var(--text-secondary)]">
            Range: {format(queryRange.start, 'PPp')} — {format(queryRange.end, 'PPp')}
          </p>
        )}
      </Card>

      {data?.summary && queryRange && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card padding="md">
            <p className="text-xs text-[var(--text-secondary)]">Total serials</p>
            <p className="text-xl font-semibold">{data.summary.totalSerials}</p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-[var(--text-secondary)]">Available (status)</p>
            <p className="text-xl font-semibold text-emerald-600">{data.summary.availableCount}</p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-[var(--text-secondary)]">With booking in range</p>
            <p className="text-xl font-semibold text-red-600">{data.summary.bookedCount}</p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-[var(--text-secondary)]">Damaged / maintenance</p>
            <p className="text-xl font-semibold text-zinc-500">{data.summary.damagedOrMaintenanceCount}</p>
          </Card>
        </div>
      )}

      {errMsg && queryRange && <p className="text-sm text-red-600 mb-4">{errMsg}</p>}

      <Card padding="none" className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-[var(--surface-2)]">
              <th className="sticky left-0 z-10 bg-[var(--surface-2)] border border-[var(--border)] px-2 py-2 text-left">
                Serial
              </th>
              {displayDays.map((d) => (
                <th
                  key={d.toISOString()}
                  className="border border-[var(--border)] px-1 py-2 font-normal text-[var(--text-secondary)]"
                >
                  {format(d, 'EEE M/d')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!queryRange ? (
              <tr>
                <td
                  className="border border-[var(--border)] px-4 py-8 text-center text-[var(--text-secondary)]"
                  colSpan={displayDays.length + 1}
                >
                  Set filters and click Search to load serials. The grid shows your selected week or day range.
                </td>
              </tr>
            ) : calendarQuery.isError ? (
              <tr>
                <td
                  className="border border-[var(--border)] px-4 py-8 text-center text-red-600"
                  colSpan={displayDays.length + 1}
                >
                  {errMsg}
                </td>
              </tr>
            ) : loading && !data ? (
              <tr>
                <td
                  className="border border-[var(--border)] px-4 py-8 text-center text-[var(--text-secondary)] animate-pulse"
                  colSpan={displayDays.length + 1}
                >
                  Loading calendar…
                </td>
              </tr>
            ) : data && data.serialItems.length > 0 ? (
              data.serialItems.map((row) => (
                <tr key={row._id}>
                  <td className="sticky left-0 z-10 bg-[var(--surface)] border border-[var(--border)] px-2 py-1 font-mono whitespace-nowrap">
                    {row.serialNumber}
                  </td>
                  {displayDays.map((d) => {
                    const { dayStart, dayEnd } = dayBounds(d)
                    const { kind, booking } = cellKind(row, dayStart, dayEnd)
                    return (
                      <td key={d.toISOString()} className="border border-[var(--border)] p-0 align-top">
                        <button
                          type="button"
                          className={`w-full min-h-[36px] border ${cellClass[kind]} ${kind === 'available' ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (kind === 'booked' || kind === 'reserved') {
                              if (booking) setDetail({ booking, serial: row.serialNumber })
                              return
                            }
                            if (kind === 'damaged') return
                            const qs = new URLSearchParams({
                              productItemId: row._id,
                              ...(row.productId ? { productId: String(row.productId) } : {}),
                              startDate: dayStart.toISOString(),
                              endDate: addDays(dayStart, 1).toISOString(),
                            })
                            router.push(`${bookingsPath}?${qs.toString()}`)
                          }}
                          title={booking ? `${booking.customerName} (${booking.status})` : kind}
                        >
                          {booking ? '●' : ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="border border-[var(--border)] px-4 py-8 text-center text-[var(--text-secondary)]"
                  colSpan={displayDays.length + 1}
                >
                  {queryRange && !loading
                    ? 'No serials in this filter for the selected range. No bookings to show.'
                    : '—'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card padding="lg" className="max-w-md w-full">
            <h3 className="font-semibold text-[var(--text-primary)]">Booking</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2 font-mono">{detail.serial}</p>
            <p className="text-sm mt-2">Customer: {detail.booking.customerName}</p>
            <p className="text-sm">Status: {detail.booking.status}</p>
            <p className="text-sm">
              {format(parseISO(detail.booking.startDate), 'PPp')} —{' '}
              {format(parseISO(detail.booking.endDate), 'PPp')}
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setDetail(null)}>
                Close
              </Button>
              <Link href={bookingsPath}>
                <Button variant="outline">Bookings list</Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-emerald-500/40 border border-emerald-600/50" /> Available
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-red-500/40 border border-red-600/50" /> Booked
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-amber-400/40 border border-amber-600/50" /> Reserved (draft)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-zinc-500/40 border border-zinc-600/50" /> Damaged / maintenance
        </span>
      </div>
    </Layout>
  )
}
