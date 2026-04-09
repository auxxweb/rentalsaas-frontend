import { endOfDay, parseISO, startOfDay } from 'date-fns'

export type BookingSeg = {
  bookingId: string
  startDate: string
  endDate: string
  status: string
  customerName: string
}

export type SerialRow = {
  _id: string
  serialNumber: string
  status: string
  productId?: string
  bookings: BookingSeg[]
}

export type CalendarPayload = {
  serialItems: SerialRow[]
  summary: {
    totalSerials: number
    availableCount: number
    bookedCount: number
    damagedOrMaintenanceCount: number
  }
}

export function cellKind(
  serial: SerialRow,
  dayStart: Date,
  dayEnd: Date
): { kind: 'available' | 'booked' | 'reserved' | 'damaged'; booking?: BookingSeg } {
  if (serial.status === 'damaged' || serial.status === 'maintenance') {
    return { kind: 'damaged' }
  }
  for (const b of serial.bookings) {
    const bs = parseISO(String(b.startDate))
    const be = parseISO(String(b.endDate))
    if (bs < dayEnd && be > dayStart) {
      if (b.status === 'draft') return { kind: 'reserved', booking: b }
      return { kind: 'booked', booking: b }
    }
  }
  return { kind: 'available' }
}

export const cellClass: Record<string, string> = {
  available: 'bg-emerald-500/25 border-emerald-600/40',
  booked: 'bg-red-500/25 border-red-600/40',
  reserved: 'bg-amber-400/25 border-amber-600/40',
  damaged: 'bg-zinc-500/25 border-zinc-600/40',
}

export function dayBounds(d: Date) {
  return { dayStart: startOfDay(d), dayEnd: endOfDay(d) }
}
