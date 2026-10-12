'use client'

import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteCategoryMutation } from '@/hooks/use-categories'
import { apiErrorDescription, toApiClientError } from '@/lib/api/errors'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog'
import type { Category } from '@/lib/types'
import { Button } from '@/components/ui/button'

export function DeleteCategoryDialog({ category }: { category: Category }) {
  const deleteMutation = useDeleteCategoryMutation()
  const isPending = deleteMutation.isLoading

  async function onDelete(close: () => void) {
    try {
      await deleteMutation.mutateAsync(category.categoryId)
      toast.success('Category deleted')
      close()
    } catch (error) {
      toast.error(toApiClientError(error).message, { description: apiErrorDescription(error) })
    }
  }

  return (
    <ConfirmDeleteDialog
      trigger={(triggerProps) => (
        <Button variant='destructive' size='icon-sm' {...triggerProps}>
          <Trash2 />
          <span className='sr-only'>Delete category</span>
        </Button>
      )}
      title='Delete category?'
      description={
        <>
          This will delete <span className='font-medium text-foreground'>{category.name}</span>.
          Products that still reference this category are not updated by the backend.
        </>
      }
      isPending={isPending}
      onConfirm={onDelete}
    />
  )
}
