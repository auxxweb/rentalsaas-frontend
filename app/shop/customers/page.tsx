'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/ui/PageHeader'

interface Customer {
  _id: string
  name: string
  email: string
  phone: string
  address: any
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
  })

  const [draftSearch, setDraftSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params =
        appliedSearch.trim() ? { search: appliedSearch.trim() } : undefined
      const response = await api.get<Customer[]>('/customers', params ? { params } : undefined)
      setCustomers(response.data)
    } catch {
      toast.error('Error fetching customers')
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [appliedSearch])

  const runSearch = () => setAppliedSearch(draftSearch)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/customers', formData)
      toast.success('Customer created successfully')
      setShowModal(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: { street: '', city: '', state: '', zipCode: '' },
      })
      fetchCustomers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating customer')
    }
  }

  if (initialLoad && customers.length === 0) {
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
        <PageHeader
          title="Customers"
          description="Manage your customer directory"
          action={{
            label: 'Add Customer',
            onClick: () => setShowModal(true),
          }}
        />

        <Card padding="md" className="mb-6">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Search by name, email, or phone. Click Search to apply.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search customers…"
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    runSearch()
                  }
                }}
              />
            </div>
            <Button type="button" onClick={runSearch} isLoading={loading}>
              Search
            </Button>
          </div>
        </Card>

        <Card padding="none">
          <ul className="divide-y divide-[var(--border)]">
            {!loading && customers.length === 0 ? (
              <li className="px-6 py-6 text-center text-[var(--text-secondary)]">No customers match your search</li>
            ) : (
              customers.map((customer) => (
                <li key={customer._id} className="px-6 py-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{customer.name}</h3>
                    <div className="mt-2 text-sm text-[var(--text-secondary)]">
                      <p>Phone: {customer.phone}</p>
                      {customer.email && <p>Email: {customer.email}</p>}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
            <div className="relative top-20 mx-auto w-full max-w-md px-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Add New Customer</h3>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <Input
                    label="Phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create</Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
