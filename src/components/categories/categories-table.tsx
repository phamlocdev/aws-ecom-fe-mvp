import { formatDateTime } from '@/lib/format'
import type { Category } from '@/lib/types'
import { CategoryFormDialog } from '@/components/categories/category-form-dialog'
import { DeleteCategoryDialog } from '@/components/categories/delete-category-dialog'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'

export function CategoriesTable({ categories }: { categories: Category[] }) {
  const columns: ColumnDef<Category>[] = [
    {
      id: 'name',
      header: 'Name',
      cellClassName: 'font-medium',
      cell: (category) => category.name,
    },
    {
      id: 'categoryId',
      header: 'Category ID',
      cellClassName: 'font-mono text-xs text-muted-foreground',
      cell: (category) => category.categoryId,
    },
    {
      id: 'description',
      header: 'Description',
      cellClassName: 'max-w-md',
      cell: (category) => (
        <p className='line-clamp-2 text-sm text-muted-foreground'>
          {category.description ?? 'No description'}
        </p>
      ),
    },
    {
      id: 'updated',
      header: 'Updated',
      cell: (category) => (
        <span className='text-sm text-muted-foreground'>{formatDateTime(category.updatedAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'w-24 text-right',
      cell: (category) => (
        <div className='flex justify-end gap-1'>
          <CategoryFormDialog category={category} />
          <DeleteCategoryDialog category={category} />
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={categories}
      rowKey={(category) => category.categoryId}
      emptyTitle='No categories yet'
      emptyDescription='Create a category before adding products.'
    />
  )
}
