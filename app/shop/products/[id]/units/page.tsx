'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'

type Unit = {
  _id: string
  serialNumber: string
  uniqueCode?: string
  status: string
  isRetired?: boolean
}

type Counts = {
  totalUnits: number
  available: number
  rented: number
  maintenance: number
  damaged: number
}

const statusVariant = (s: string): 'active' | 'pending' | 'overdue' | 'cancelled' => {
  if (s === 'ACTIVE') return 'active'
  if (s === 'RENTED') return 'pending'
  if (s === 'MAINTENANCE') return 'overdue'
  return 'cancelled'
}

export default function ProductUnitsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [units, setUnits] = useState<Unit[]>([])
  const [counts, setCounts] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    api
      .get(`/products/${id}/units`)
      .then((r) => {
        setUnits(r.data.units)
        setCounts(r.data.counts)
      })
      .catch(() => toast.error('Failed to load units'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [id])

  return (
    <Layout>
      <PageHeader
        title="Product units"
        description="Per-serial status. Only ACTIVE units can be assigned to new jobs."
        action={{
          label: 'Back to product',
          onClick: () => router.push(`/shop/products/${id}/edit`),
        }}
      />

      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            ['Total', counts.totalUnits, 'default'],
            ['Active', counts.available, 'active'],
            ['Rented', counts.rented, 'pending'],
            ['Maintenance', counts.maintenance, 'overdue'],
            ['Damaged', counts.damaged, 'cancelled'],
          ].map(([label, n, v]) => (
            <Card key={String(label)} className="p-4">
              <p className="text-xs text-[var(--text-secondary)]">{label}</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{n as number}</p>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)] text-left text-[var(--text-secondary)]">
              <tr>
                <th className="px-6 py-3">Serial / code</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {units.map((u) => (
                <tr key={u._id}>
                  <td className="px-6 py-4 font-mono">
                    {u.serialNumber}
                    {u.isRetired && <span className="ml-2 text-xs text-[var(--text-tertiary)]">(retired)</span>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusVariant(u.status)}>{u.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/shop/jobs/new?unit=${u._id}`}>
                      <Button size="sm" variant="outline" disabled={u.status !== 'ACTIVE' || u.isRetired}>
                        Rent
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={u.status !== 'ACTIVE' || u.isRetired}
                      onClick={() => router.push(`/shop/inventory/maintenance?unit=${u._id}`)}
                    >
                      Maintenance
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={u.status === 'RENTED' || u.isRetired}
                      onClick={() => router.push(`/shop/inventory/damage?unit=${u._id}`)}
                    >
                      Damage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {units.length === 0 && (
            <div className="px-6 py-12 text-center text-[var(--text-secondary)]">
              No serial units — add serials on the product edit flow.
            </div>
          )}
        </Card>
      )}
    </Layout>
  )
}
