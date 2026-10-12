import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type PageHeaderProps = {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col justify-between gap-4 sm:flex-row sm:items-end', className)}>
      <div>
        <h1 className='text-2xl font-semibold tracking-normal'>{title}</h1>
        {subtitle ? <p className='mt-1 text-sm text-muted-foreground'>{subtitle}</p> : null}
      </div>
      {actions ? (
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>{actions}</div>
      ) : null}
    </div>
  )
}
