'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateInventoryMutation } from '@/hooks/use-inventories'
import { apiErrorDescription, toApiClientError } from '@/lib/api/errors'
import {
  inventoryAdjustmentSchema,
  type InventoryAdjustmentInput,
  type InventoryAdjustmentValues,
} from '@/lib/schemas'
import type { InventorySummary } from '@/lib/types'
import { FormDialog } from '@/components/shared/form-dialog'
import { RequiredMark } from '@/components/shared/required-mark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function InventoryAdjustDialog({ inventory }: { inventory: InventorySummary }) {
  const [open, setOpen] = useState(false)
  const updateMutation = useUpdateInventoryMutation()
  const isPending = updateMutation.isLoading
  const form = useForm<InventoryAdjustmentInput, unknown, InventoryAdjustmentValues>({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      availableQuantity: inventory.availableQuantity,
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      availableQuantity: inventory.availableQuantity,
    })
  }, [form, inventory.availableQuantity, open])

  async function onSubmit(values: InventoryAdjustmentValues) {
    try {
      await updateMutation.mutateAsync({
        productId: inventory.productId,
        input: values,
      })
      toast.success('Inventory updated')
      setOpen(false)
    } catch (error) {
      toast.error(toApiClientError(error).message, { description: apiErrorDescription(error) })
    }
  }

  return (
    <FormDialog
      trigger={(triggerProps) => (
        <Button variant='ghost' size='icon-sm' {...triggerProps}>
          <Pencil />
          <span className='sr-only'>Adjust inventory</span>
        </Button>
      )}
      title='Adjust inventory'
      description={
        <>
          Set the absolute available quantity for{' '}
          <span className='font-medium'>{inventory.productName}</span>.
        </>
      }
      open={open}
      onOpenChange={setOpen}
      isPending={isPending}
      onSubmit={form.handleSubmit(onSubmit)}
      contentClassName='sm:max-w-md'
    >
      <div className='space-y-2'>
        <Label htmlFor={`inventory-quantity-${inventory.productId}`}>
          Available quantity
          <RequiredMark />
        </Label>
        <Input
          id={`inventory-quantity-${inventory.productId}`}
          min={0}
          step={1}
          type='number'
          aria-invalid={Boolean(form.formState.errors.availableQuantity)}
          {...form.register('availableQuantity', { valueAsNumber: true })}
        />
        {form.formState.errors.availableQuantity ? (
          <p className='text-xs text-destructive'>
            {form.formState.errors.availableQuantity.message}
          </p>
        ) : null}
      </div>

      <div className='rounded-md border bg-muted/35 px-3 py-2 text-sm text-muted-foreground'>
        Reserved quantity is managed by the order flow and remains read-only here:{' '}
        {inventory.reservedQuantity}
      </div>
    </FormDialog>
  )
}
