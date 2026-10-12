import { Skeleton } from '@/components/ui/skeleton'

export function PageHeaderSkeleton({ hasActions = false }: { hasActions?: boolean }) {
  return (
    <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-72' />
      </div>
      {hasActions ? <Skeleton className='h-9 w-32' /> : null}
    </div>
  )
}
