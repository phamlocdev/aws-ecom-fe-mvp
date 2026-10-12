import type { ProductFilterParams } from '@/lib/types'

export function toLocalDateInput(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function localDateStartIso(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString()
}

export function localDateEndIso(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString()
}

export function parsePositiveInteger(value: string): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined
}

export function countActiveFilters(filters: ProductFilterParams): number {
  return [
    filters.categoryId,
    filters.status,
    filters.minPrice !== undefined || filters.maxPrice !== undefined ? 'price' : undefined,
    filters.updatedFrom || filters.updatedTo ? 'updated' : undefined,
    filters.q,
  ].filter((value) => value !== undefined && value !== '').length
}

export function removeEmptyFilters(filters: ProductFilterParams): ProductFilterParams {
  return {
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.minPrice !== undefined ? { minPrice: filters.minPrice } : {}),
    ...(filters.maxPrice !== undefined ? { maxPrice: filters.maxPrice } : {}),
    ...(filters.updatedFrom ? { updatedFrom: filters.updatedFrom } : {}),
    ...(filters.updatedTo ? { updatedTo: filters.updatedTo } : {}),
    ...(filters.q?.trim() ? { q: filters.q.trim() } : {}),
  }
}
