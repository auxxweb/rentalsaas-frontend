'use client'

import SerialCalendarView from '@/components/calendar/SerialCalendarView'

/** Serial-level rental calendar (v2). Same behavior as /tenant/calendar; entry from shop nav. */
export default function ShopInventoryCalendarPage() {
  return (
    <SerialCalendarView
      bookingsPath="/tenant/bookings"
      pageTitle="Rental calendar"
      pageDescription="Serial-level availability. Filters apply when you click Search."
    />
  )
}
