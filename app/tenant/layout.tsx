'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

/**
 * /tenant index redirects to unified shop dashboard.
 * Sub-routes (/tenant/bookings, /tenant/calendar, …) render children for v2 tenant UIs.
 */
export default function TenantSectionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    if (pathname === '/tenant' || pathname === '/tenant/dashboard') {
      router.replace('/shop/dashboard')
      return
    }
    setOk(true)
  }, [router, pathname])

  if (pathname === '/tenant' || pathname === '/tenant/dashboard') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-secondary)]">
        Redirecting…
      </div>
    )
  }

  if (!ok) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-secondary)]">
        Loading…
      </div>
    )
  }

  return <>{children}</>
}
