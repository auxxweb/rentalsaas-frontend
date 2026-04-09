'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface Category {
  _id: string
  name: string
}

function toastApiError(error: { response?: { data?: { message?: string; errors?: { msg: string }[] } } }) {
  const d = error.response?.data
  if (d?.errors?.length) {
    toast.error(d.errors.map((e) => e.msg).join('. '))
  } else {
    toast.error(d?.message || 'Request failed')
  }
}

function parseSerialBulk(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    localName: '',
    categoryId: '',
    modelNumber: '',
    description: '',
    stock: '0',
    pricing: {
      hourly: '',
      daily: '',
      monthly: ''
    }
  })
  const [serialInput, setSerialInput] = useState('')
  const [serialList, setSerialList] = useState<string[]>([])
  const [bulkSerialText, setBulkSerialText] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Category[]>('/shop-categories')
        setCategories(res.data)
      } catch {
        toast.error('Could not load categories')
      } finally {
        setCategoriesLoading(false)
      }
    }
    load()
  }, [])

  const addSerialFromInput = () => {
    const s = serialInput.trim()
    if (!s) return
    if (serialList.includes(s)) {
      toast.error('Serial already in list')
      return
    }
    setSerialList([...serialList, s])
    setSerialInput('')
  }

  const removeSerial = (index: number) => {
    setSerialList(serialList.filter((_, i) => i !== index))
  }

  const addBulkSerials = () => {
    const parsed = parseSerialBulk(bulkSerialText)
    if (parsed.length === 0) {
      toast.error('No serial numbers found')
      return
    }
    const combined = [...serialList, ...parsed]
    const merged = Array.from(new Set(combined))
    if (merged.length !== combined.length) {
      toast.error('Duplicate serial numbers in bulk entry or list')
      return
    }
    setSerialList(merged)
    setBulkSerialText('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.categoryId) {
      toast.error('Please select a category')
      return
    }
    if (!formData.modelNumber.trim()) {
      toast.error('Model number is required')
      return
    }

    setLoading(true)

    try {
      const submitData = {
        name: formData.name.trim(),
        localName: formData.localName.trim() || undefined,
        categoryId: formData.categoryId,
        modelNumber: formData.modelNumber.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        stock: parseInt(formData.stock.toString(), 10) || 0,
        pricing: {
          hourly: parseFloat(formData.pricing.hourly.toString()) || 0,
          daily: parseFloat(formData.pricing.daily.toString()) || 0,
          monthly: parseFloat(formData.pricing.monthly.toString()) || 0
        }
      }

      const createRes = await api.post<{ _id: string }>('/products', submitData)
      const productId = createRes.data._id

      if (serialList.length > 0) {
        await api.post(`/products/${productId}/serials`, {
          serialNumbers: serialList
        })
      }

      toast.success('Product saved successfully')
      router.push('/shop/products')
    } catch (error: unknown) {
      toastApiError(error as { response?: { data?: { message?: string; errors?: { msg: string }[] } } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div>
        <PageHeader
          title="Add New Product"
          description="Add a new product to your inventory"
        />

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Product Name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                />
                <Input
                  label="Local Name"
                  type="text"
                  value={formData.localName}
                  onChange={(e) => setFormData({ ...formData, localName: e.target.value })}
                  placeholder="Optional local language name"
                />
                <Input
                  label="Model Number"
                  type="text"
                  required
                  value={formData.modelNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, modelNumber: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. DRLTR"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    disabled={categoriesLoading}
                    className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories…' : 'Select a category'}
                    </option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {!categoriesLoading && categories.length === 0 && (
                    <p className="mt-1 text-sm text-amber-700">
                      No categories yet. Create one under your shop settings or categories first.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Product description (optional)"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h3>
              <p className="text-sm text-gray-500 mb-4">
                Stock updates automatically when you add serial numbers below. You can leave this at 0 until
                serials are saved.
              </p>
              <div className="max-w-xs">
                <Input
                  label="Stock Quantity"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.stock}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d+$/.test(value)) {
                      setFormData({ ...formData, stock: value })
                    }
                  }}
                  onBlur={(e) => {
                    const numValue = parseInt(e.target.value, 10) || 0
                    setFormData({ ...formData, stock: numValue.toString() })
                  }}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
              <p className="text-sm text-gray-500 mb-4">Set rental rates for different time periods</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Hourly Rate ($)"
                  type="text"
                  inputMode="decimal"
                  required
                  value={formData.pricing.hourly}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, hourly: value }
                      })
                    }
                  }}
                  onBlur={(e) => {
                    const numValue = parseFloat(e.target.value) || 0
                    setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, hourly: numValue.toString() }
                    })
                  }}
                  placeholder="0.00"
                />
                <Input
                  label="Daily Rate ($)"
                  type="text"
                  inputMode="decimal"
                  required
                  value={formData.pricing.daily}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, daily: value }
                      })
                    }
                  }}
                  onBlur={(e) => {
                    const numValue = parseFloat(e.target.value) || 0
                    setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, daily: numValue.toString() }
                    })
                  }}
                  placeholder="0.00"
                />
                <Input
                  label="Monthly Rate ($)"
                  type="text"
                  inputMode="decimal"
                  required
                  value={formData.pricing.monthly}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, monthly: value }
                      })
                    }
                  }}
                  onBlur={(e) => {
                    const numValue = parseFloat(e.target.value) || 0
                    setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, monthly: numValue.toString() }
                    })
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Serial Numbers</h3>
              <p className="text-sm text-gray-500 mb-4">
                Each serial is a trackable unit. Add one at a time or use bulk entry (comma, space, or line
                separated). Duplicates are not allowed.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1">
                  <Input
                    label="Serial number"
                    type="text"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSerialFromInput()
                      }
                    }}
                    placeholder="e.g. DRLTR-001"
                  />
                </div>
                <div className="sm:pt-7">
                  <Button type="button" variant="outline" onClick={addSerialFromInput}>
                    Add
                  </Button>
                </div>
              </div>

              {serialList.length > 0 && (
                <ul className="mb-6 rounded-lg border border-gray-200 divide-y divide-gray-200 max-h-48 overflow-y-auto">
                  {serialList.map((sn, index) => (
                    <li
                      key={`${sn}-${index}`}
                      className="flex items-center justify-between px-4 py-2 text-sm text-gray-800"
                    >
                      <span>{sn}</span>
                      <button
                        type="button"
                        onClick={() => removeSerial(index)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-2">Bulk entry</label>
              <textarea
                value={bulkSerialText}
                onChange={(e) => setBulkSerialText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                rows={4}
                placeholder={'DRLTR-001, DRLTR-002\nDRLTR-003'}
              />
              <div className="mt-2">
                <Button type="button" variant="outline" onClick={addBulkSerials}>
                  Add bulk to list
                </Button>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} fullWidth>
                Cancel
              </Button>
              <Button type="submit" isLoading={loading} fullWidth>
                Create Product
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
