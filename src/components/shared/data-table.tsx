import type { ReactNode } from 'react'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type ColumnDef<T> = {
  id: string
  header: ReactNode
  cell: (row: T, rowIndex: number) => ReactNode
  headerClassName?: string
  cellClassName?: string
}

export type DataTableProps<T> = {
  columns: ColumnDef<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  isLoading?: boolean
  skeletonRows?: number
  emptyTitle?: string
  emptyDescription?: string
  /** Optional opt-in stacked-card renderer shown on narrow viewports instead of the table. */
  mobileCard?: (row: T) => ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  skeletonRows = 5,
  emptyTitle = 'No results found',
  emptyDescription,
  mobileCard,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton rows={skeletonRows} cols={columns.length} className={className} />
  }

  if (data.length === 0) {
    return (
      <div className='rounded-md border bg-card p-8 text-center'>
        <p className='font-medium'>{emptyTitle}</p>
        {emptyDescription ? (
          <p className='mt-1 text-sm text-muted-foreground'>{emptyDescription}</p>
        ) : null}
      </div>
    )
  }

  const table = (
    <div className={className ?? 'overflow-hidden rounded-md border bg-card'}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.headerClassName}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowKey(row)}>
              {columns.map((column) => (
                <TableCell key={column.id} className={column.cellClassName}>
                  {column.cell(row, rowIndex)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  if (!mobileCard) {
    return table
  }

  return (
    <>
      <div className='hidden sm:block'>{table}</div>
      <div className='divide-y rounded-md border bg-card sm:hidden'>
        {data.map((row) => (
          <div key={rowKey(row)}>{mobileCard(row)}</div>
        ))}
      </div>
    </>
  )
}
