'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'

type Alerts = {
  overdueMaintenanceCount: number
  openDamageCount: number
  lowAvailabilityProducts: { productId: string; name: string; active: number; total: number }[]
  highDamageRatio: { damagedUnits: number; totalUnits: number; ratio: number } | null
}

export default function InventoryHubPage() {
  const [alerts, setAlerts] = useState<Alerts | null>(null)

  useEffect(() => {
    api
      .get('/inventory/alerts')
      .then((r) => setAlerts(r.data))
      .catch(() => setAlerts(null))
  }, [])

  return (
    <Layout>
      <PageHeader
        title="Inventory & units"
        description="Maintenance, damage, availability, and booking calendar for serial-tracked units."
      />

      {alerts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4 border-l-4 border-amber-500">
            <p className="text-sm font-medium text-[var(--text-primary)]">Overdue maintenance</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{alerts.overdueMaintenanceCount}</p>
          </Card>
          <Card className="p-4 border-l-4 border-rose-500">
            <p className="text-sm font-medium text-[var(--text-primary)]">Open damage reports</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{alerts.openDamageCount}</p>
          </Card>
          {alerts.lowAvailabilityProducts.length > 0 && (
            <Card className="p-4 md:col-span-2 border-l-4 border-orange-500">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Low availability (&lt; 15% active)</p>
              <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                {alerts.lowAvailabilityProducts.map((p) => (
                  <li key={p.productId}>
                    {p.name}: {p.active} / {p.total} active
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {alerts.highDamageRatio && (
            <Card className="p-4 md:col-span-2 border-l-4 border-red-600">
              <p className="text-sm text-[var(--text-primary)]">
                High damage ratio: {(alerts.highDamageRatio.ratio * 100).toFixed(0)}% of units damaged (
                {alerts.highDamageRatio.damagedUnits}/{alerts.highDamageRatio.totalUnits})
              </p>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/shop/inventory/maintenance', label: 'Maintenance', desc: 'Schedule & complete' },
          { href: '/shop/inventory/damage', label: 'Damage', desc: 'Report & resolve' },
          { href: '/shop/inventory/calendar', label: 'Calendar', desc: 'Jobs & maintenance' },
          { href: '/shop/products', label: 'Products', desc: 'Unit breakdown' },
        ].map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="p-5 h-full hover:border-[var(--accent)] transition-colors">
              <h3 className="font-semibold text-[var(--text-primary)]">{l.label}</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{l.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  )
}
