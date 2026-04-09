/** Format stored numeric amounts using tenant / global currency (ISO 4217). */
export function formatCurrencyAmount(amount: number, currency: string, locale?: string): string {
  const cur = (currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat(locale || 'en', { style: 'currency', currency: cur }).format(Number(amount) || 0)
  } catch {
    return `${cur} ${Number(amount).toFixed(2)}`
  }
}
