'use client'

import SerialCalendarView from '@/components/calendar/SerialCalendarView'

export default function TenantCalendarPage() {
  return <SerialCalendarView bookingsPath="/tenant/bookings" />
}
