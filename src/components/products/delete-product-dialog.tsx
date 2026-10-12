'use client'

import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog'
import { apiErrorDescription, toApiClientError } from '@/lib/api/errors'
import { useDeleteProductMutation } from '@/hooks/use-products'
import type { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'

export function DeleteProductDialog({ product }: { product: Product }) {
  const deleteMutation = useDeleteProductMutation()
  const isPending = deleteMutation.isLoading

  async function onDelete(close: () => void) {
    try {
      await deleteMutation.mutateAsync(product.productId)
      toast.success('Product deleted')
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
          <span className='sr-only'>Delete product</span>
        </Button>
      )}
      title='Delete product?'
      description={
        <>
          This will permanently delete{' '}
          <span className='font-medium text-foreground'>{product.name}</span> from the backend API.
        </>
      }
      isPending={isPending}
      onConfirm={onDelete}
    />
  )
}
