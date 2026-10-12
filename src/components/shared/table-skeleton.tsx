import { Skeleton } from '@/components/ui/skeleton'

export type TableSkeletonProps = {
  rows?: number
  cols?: number
  className?: string
}

export function TableSkeleton({ rows = 5, cols = 4, className }: TableSkeletonProps) {
  return (
    <div className={className ?? 'overflow-hidden rounded-md border bg-card'}>
      <div className='flex gap-4 border-b p-4'>
        {Array.from({ length: cols }).map((_, index) => (
          <Skeleton key={index} className='h-4 flex-1' />
        ))}
      </div>
      <div className='divide-y'>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className='flex gap-4 p-4'>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton key={colIndex} className='h-4 flex-1' />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
