'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'

interface Return {
  _id: string
  jobNumber: string
  customer: {
    name: string
    phone: string
  }
  expectedReturnDate: string
  actualReturnDate?: string
  status: string
  extraCharges: number
  total: number
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [selectedReturn, setSelectedReturn] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [returnDate, setReturnDate] = useState('')

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

  const fetchReturns = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (applied.search.trim()) params.search = applied.search.trim()
      if (applied.status && applied.status !== 'all') params.status = applied.status
      if (applied.dateFrom) params.dateFrom = applied.dateFrom
      if (applied.dateTo) params.dateTo = applied.dateTo
      const response = await api.get<Return[]>('/returns', { params: Object.keys(params).length ? params : undefined })
      setReturns(response.data)
    } catch {
      toast.error('Error fetching returns')
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  useEffect(() => {
    fetchReturns()
  }, [applied])

  const runSearch = () => setApplied({ ...draft })

  const handleReturn = (returnItem: any) => {
    setSelectedReturn(returnItem)
    setShowModal(true)
    setReturnDate(new Date().toISOString().slice(0, 16))
  }

  const processReturn = async () => {
    if (!selectedReturn) return

    try {
      await api.post(`/returns/${selectedReturn._id}`, {
        actualReturnDate: returnDate,
      })
      toast.success('Return processed successfully')
      setShowModal(false)
      setSelectedReturn(null)
      fetchReturns()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error processing return')
    }
  }

  if (initialLoad && returns.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <PageHeader title="Returns" description="Track returns and process late fees" />

        <Card padding="md" className="mb-6">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Search and filters apply when you click Search (expected return date range is optional).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <Input
                type="search"
                label="Search"
                placeholder="Job number, customer name, email, or phone…"
                value={draft.search}
                onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    runSearch()
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Status</label>
              <select
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                className="block w-full h-11 px-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text-primary)]"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="returned">Returned</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Expected from</label>
              <input
                type="date"
                value={draft.dateFrom}
                onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
                className="block w-full h-11 px-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Expected to</label>
              <input
                type="date"
                value={draft.dateTo}
                onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
                className="block w-full h-11 px-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text-primary)]"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={runSearch} isLoading={loading}>
              Search
            </Button>
          </div>
        </Card>

        <Card padding="none">
          <ul className="divide-y divide-[var(--border)]">
            {!loading && returns.length === 0 ? (
              <li className="px-6 py-6 text-center text-[var(--text-secondary)]">No returns match your filters</li>
            ) : (
              returns.map((returnItem) => (
                <li key={returnItem._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{returnItem.jobNumber}</h3>
                        <Badge
                          className="ml-2"
                          variant={
                            returnItem.status === 'active'
                              ? 'pending'
                              : returnItem.status === 'returned'
                                ? 'active'
                                : returnItem.status === 'overdue'
                                  ? 'overdue'
                                  : 'default'
                          }
                        >
                          {returnItem.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-[var(--text-secondary)]">
                        <p>
                          Customer: {returnItem.customer.name} ({returnItem.customer.phone})
                        </p>
                        <p>Expected Return: {format(new Date(returnItem.expectedReturnDate), 'MMM dd, yyyy HH:mm')}</p>
                        {returnItem.actualReturnDate && (
                          <p>Actual Return: {format(new Date(returnItem.actualReturnDate), 'MMM dd, yyyy HH:mm')}</p>
                        )}
                        {returnItem.extraCharges > 0 && (
                          <p className="text-[rgba(239,68,68,0.95)] font-semibold">
                            Extra Charges: ${returnItem.extraCharges.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-[var(--text-primary)]">${returnItem.total.toFixed(2)}</p>
                      {returnItem.status === 'active' && (
                        <div className="mt-2 flex justify-end">
                          <Button onClick={() => handleReturn(returnItem)} size="sm">
                            Process Return
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        {showModal && selectedReturn && (
          <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
            <div className="relative top-20 mx-auto w-full max-w-md px-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Process Return</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setSelectedReturn(null)
                    }}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Actual Return Date & Time"
                    type="datetime-local"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowModal(false)
                        setSelectedReturn(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={processReturn}>Process Return</Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
