'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import ResponsiveTable from '@/components/ui/ResponsiveTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import ProductAvailabilityPie from '@/components/inventory/ProductAvailabilityPie'

interface AvailabilitySummary {
  usesSerialTracking: boolean
  totalUnits: number
  available: number
  rented: number
  maintenance: number
  damaged: number
  stockField?: number
}

interface Product {
  _id: string
  name: string
  localName?: string
  modelNumber?: string
  category: string
  categoryId?: { name: string } | string
  stock: number
  pricing: {
    hourly: number
    daily: number
    monthly: number
  }
  isActive: boolean
  availability?: AvailabilitySummary | null
}

interface ShopCategoryOption {
  _id: string
  name: string
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ShopCategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({
    search: '',
    categoryId: '',
    isActive: '' as '' | 'true' | 'false',
  })
  const [applied, setApplied] = useState({
    search: '',
    categoryId: '',
    isActive: '' as '' | 'true' | 'false',
  })

  useEffect(() => {
    api
      .get<ShopCategoryOption[]>('/shop-categories')
      .then((r) => setCategories(r.data))
      .catch(() => toast.error('Error loading categories'))
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const params: Record<string, string> = { includeAvailability: '1' }
      if (applied.search.trim()) params.search = applied.search.trim()
      if (applied.categoryId) params.categoryId = applied.categoryId
      if (applied.isActive === 'true' || applied.isActive === 'false') params.isActive = applied.isActive

      const response = await api.get('/products', { params })
      setProducts(response.data)
    } catch (error) {
      toast.error('Error fetching products')
    } finally {
      setLoading(false)
    }
  }, [applied])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const applyFilters = () => {
    setLoading(true)
    setApplied({ ...draft })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      await api.delete(`/products/${id}`)
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error deleting product')
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Product Name',
      render: (value: string, row: Product) => (
        <div>
          <p className="font-medium text-[var(--text-primary)]">{value}</p>
          {row.modelNumber && (
            <p className="text-xs text-[var(--text-secondary)]">Model: {row.modelNumber}</p>
          )}
          {(typeof row.categoryId === 'object' && row.categoryId?.name) || row.category ? (
            <p className="text-sm text-[var(--text-secondary)]">
              {typeof row.categoryId === 'object' && row.categoryId?.name
                ? row.categoryId.name
                : row.category}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock / units',
      render: (value: number, row: Product) => {
        const a = row.availability
        if (a?.usesSerialTracking) {
          return (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <ProductAvailabilityPie
                active={a.available}
                rented={a.rented}
                maintenance={a.maintenance}
                damaged={a.damaged}
              />
              <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
                <p>
                  A:{a.available} R:{a.rented}
                </p>
                <p>
                  M:{a.maintenance} D:{a.damaged}
                </p>
              </div>
            </div>
          )
        }
        return (
          <span className={`font-medium ${value > 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
            {value} units
          </span>
        )
      },
    },
    {
      key: 'pricing',
      label: 'Pricing',
      render: (value: any) => (
        <div className="text-sm">
          <p className="text-[var(--text-primary)]">${value.hourly}/hr</p>
          <p className="text-[var(--text-secondary)]">${value.daily}/day</p>
          <p className="text-[var(--text-secondary)]">${value.monthly}/mo</p>
        </div>
      ),
      mobileHidden: true,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'active' : 'cancelled'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  if (loading && products.length === 0) {
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
      <div>
        <PageHeader
          title="Products"
          description="Manage your rental product inventory"
          action={{
            label: 'Add Product',
            onClick: () => router.push('/shop/products/new'),
          }}
        />

        <Card className="mb-6" padding="md">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Search by name, model, or category text. Choose category and status, then click Search to apply all filters.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2 lg:col-span-2">
              <Input
                type="text"
                placeholder="Search by name, model, category..."
                value={draft.search}
                onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyFilters()
                  }
                }}
                leftIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Category</label>
              <select
                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
                value={draft.categoryId}
                onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
              <select
                className="w-full h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
                value={draft.isActive}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, isActive: e.target.value as '' | 'true' | 'false' }))
                }
              >
                <option value="">Active and inactive</option>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <Button type="button" onClick={applyFilters} isLoading={loading}>
                Search
              </Button>
            </div>
          </div>
        </Card>

        <ResponsiveTable
          columns={columns}
          data={products}
          emptyMessage="No products found. Create your first product to get started."
          actions={(row) => (
            <div className="flex items-center gap-2">
              {row.availability?.usesSerialTracking && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/shop/products/${row._id}/units`)
                  }}
                  className="text-xs"
                >
                  Units
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/shop/products/${row._id}/edit`)
                }}
                className="text-xs"
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(row._id, row.name)
                }}
                className="text-xs"
              >
                Delete
              </Button>
            </div>
          )}
          onRowClick={(row) => router.push(`/shop/products/${row._id}/edit`)}
        />

        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={() => router.push('/shop/products/new')}
            className="h-14 w-14 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-lg hover:bg-[var(--accent-dark)] flex items-center justify-center transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </Layout>
  )
}
