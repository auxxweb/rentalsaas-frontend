'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'

type Plan = {
  _id: string
  name: string
  title: string
  subtitle?: string
  price: number
  currency: string
  features: string[]
  validityDays: number
  isActive: boolean
  sortOrder: number
}

const emptyForm = {
  name: '',
  title: '',
  subtitle: '',
  price: 0,
  currency: 'USD',
  featuresText: '',
  validityDays: 30,
  sortOrder: 0,
  isActive: true,
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get('/admin/subscription-plans')
      setPlans(data)
    } catch {
      toast.error('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
  }

  const openEdit = (p: Plan) => {
    setEditing(p)
    setForm({
      name: p.name,
      title: p.title,
      subtitle: p.subtitle || '',
      price: p.price,
      currency: p.currency,
      featuresText: (p.features || []).join('\n'),
      validityDays: p.validityDays,
      sortOrder: p.sortOrder,
      isActive: p.isActive,
    })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const features = form.featuresText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const payload = {
      name: form.name.trim().toLowerCase(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      price: Number(form.price),
      currency: form.currency.trim().toUpperCase() || 'USD',
      features,
      validityDays: Math.max(1, parseInt(String(form.validityDays), 10)),
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    }
    try {
      if (editing) {
        await api.put(`/admin/subscription-plans/${editing._id}`, payload)
        toast.success('Plan updated')
      } else {
        await api.post('/admin/subscription-plans', payload)
        toast.success('Plan created')
      }
      setEditing(null)
      setForm(emptyForm)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (p: Plan) => {
    if (!confirm(`Deactivate plan "${p.title}"? Shops keep existing assignments until renewal.`)) return
    try {
      await api.delete(`/admin/subscription-plans/${p._id}`)
      toast.success('Plan deactivated')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  if (loading) {
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
      <PageHeader
        title="Subscription plans"
        description="Define plan name, title, price, features, and validity (days). These are offered to business owners; payment is verified manually until a gateway is connected."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-1 p-6 h-fit">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            {editing ? 'Edit plan' : 'Create plan'}
          </h3>
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Internal name (slug)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. pro_monthly"
              required
              disabled={!!editing}
            />
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <Input
              label="Subtitle"
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Price"
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                required
              />
              <Input
                label="Currency"
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Features (one per line)</label>
              <textarea
                className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
                value={form.featuresText}
                onChange={(e) => setForm((f) => ({ ...f, featuresText: e.target.value }))}
              />
            </div>
            <Input
              label="Validity (days)"
              type="number"
              min={1}
              value={form.validityDays}
              onChange={(e) => setForm((f) => ({ ...f, validityDays: Number(e.target.value) }))}
              required
            />
            <Input
              label="Sort order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            />
            <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active (shown to business owners)
            </label>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
              </Button>
              {editing && (
                <Button type="button" variant="secondary" onClick={openCreate}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="xl:col-span-2 p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center">
            <h3 className="font-semibold text-[var(--text-primary)]">All plans</h3>
            <Button size="sm" variant="secondary" onClick={openCreate}>
              New plan
            </Button>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {plans.length === 0 ? (
              <div className="px-6 py-12 text-center text-[var(--text-secondary)]">No plans yet</div>
            ) : (
              plans.map((p) => (
                <div key={p._id} className="px-6 py-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-lg font-semibold text-[var(--text-primary)]">{p.title}</h4>
                      <Badge variant={p.isActive ? 'active' : 'cancelled'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {p.name} · {p.price} {p.currency} / {p.validityDays} days
                    </p>
                    {p.subtitle && <p className="text-sm text-[var(--text-secondary)] mt-2">{p.subtitle}</p>}
                    <ul className="mt-3 text-sm text-[var(--text-primary)] list-disc list-inside space-y-1">
                      {(p.features || []).map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    {p.isActive && (
                      <Button size="sm" variant="danger" onClick={() => deactivate(p)}>
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
