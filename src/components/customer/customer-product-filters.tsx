import { Search } from 'lucide-react'
import type { Category, ProductFilterParams } from '@/lib/types'

export function CustomerProductFilters({
  categories,
  filters,
}: {
  categories: Category[]
  filters: ProductFilterParams
}) {
  return (
    <form action='/customer/products' className='rounded-[1.5rem] border bg-muted/35 p-5'>
      <p className='text-sm font-medium'>Filter products</p>
      <div className='mt-4 grid gap-3 sm:grid-cols-2'>
        <label className='space-y-1'>
          <span className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>
            Keyword
          </span>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <input
              name='q'
              defaultValue={filters.q ?? ''}
              className='h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm'
              placeholder='Search name or description'
            />
          </div>
        </label>

        <label className='space-y-1'>
          <span className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>
            Category
          </span>
          <select
            name='categoryId'
            defaultValue={filters.categoryId ?? ''}
            className='h-11 w-full rounded-xl border bg-background px-3 text-sm'
          >
            <option value=''>All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className='space-y-1'>
          <span className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>
            Min price
          </span>
          <input
            name='minPrice'
            type='number'
            min={1}
            defaultValue={filters.minPrice ?? ''}
            className='h-11 w-full rounded-xl border bg-background px-3 text-sm'
            placeholder='100000'
          />
        </label>

        <label className='space-y-1'>
          <span className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>
            Max price
          </span>
          <input
            name='maxPrice'
            type='number'
            min={1}
            defaultValue={filters.maxPrice ?? ''}
            className='h-11 w-full rounded-xl border bg-background px-3 text-sm'
            placeholder='500000'
          />
        </label>
      </div>
      <div className='mt-4 flex flex-wrap gap-2'>
        <button
          type='submit'
          className='inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90'
        >
          Apply filters
        </button>
        <a
          href='/customer/products'
          className='inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-background'
        >
          Clear
        </a>
      </div>
    </form>
  )
}
