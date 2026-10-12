'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '@/hooks/use-categories'
import { apiErrorDescription, toApiClientError } from '@/lib/api/errors'
import {
  categoryCreateSchema,
  type CategoryCreateInput,
  type CategoryCreateValues,
} from '@/lib/schemas'
import type { Category } from '@/lib/types'
import { FormDialog } from '@/components/shared/form-dialog'
import { RequiredMark } from '@/components/shared/required-mark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const emptyCategory: CategoryCreateInput = {
  categoryId: '',
  name: '',
  description: undefined,
}

export function CategoryFormDialog({ category }: { category?: Category }) {
  const [open, setOpen] = useState(false)
  const createMutation = useCreateCategoryMutation()
  const updateMutation = useUpdateCategoryMutation()
  const isEdit = Boolean(category)
  const isPending = createMutation.isLoading || updateMutation.isLoading

  const form = useForm<CategoryCreateInput, unknown, CategoryCreateValues>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: emptyCategory,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(
      category
        ? {
            categoryId: category.categoryId,
            name: category.name,
            description: category.description,
          }
        : emptyCategory,
    )
  }, [category, form, open])

  async function onSubmit(values: CategoryCreateValues) {
    try {
      if (category) {
        const input = {
          name: values.name,
          description: values.description,
        }
        await updateMutation.mutateAsync({ categoryId: category.categoryId, input })
      } else {
        await createMutation.mutateAsync(values)
      }
      toast.success(category ? 'Category updated' : 'Category created')
      setOpen(false)
    } catch (error) {
      toast.error(toApiClientError(error).message, { description: apiErrorDescription(error) })
    }
  }

  return (
    <FormDialog
      trigger={(triggerProps) => (
        <Button
          variant={isEdit ? 'ghost' : 'default'}
          size={isEdit ? 'icon-sm' : 'default'}
          {...triggerProps}
        >
          {isEdit ? <Pencil /> : <Plus />}
          <span className={isEdit ? 'sr-only' : ''}>
            {isEdit ? 'Edit category' : 'New category'}
          </span>
        </Button>
      )}
      title={isEdit ? 'Edit category' : 'Create category'}
      description='Category IDs are stable lowercase slugs and cannot be changed after creation.'
      open={open}
      onOpenChange={setOpen}
      isPending={isPending}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {!isEdit ? (
        <div className='space-y-2'>
          <Label htmlFor='categoryId'>
            Category ID
            <RequiredMark />
          </Label>
          <Input
            id='categoryId'
            placeholder='electronics'
            aria-invalid={Boolean(
              'categoryId' in form.formState.errors && form.formState.errors.categoryId,
            )}
            {...form.register('categoryId' as keyof CategoryCreateValues)}
          />
          {'categoryId' in form.formState.errors && form.formState.errors.categoryId ? (
            <p className='text-xs text-destructive'>{form.formState.errors.categoryId.message}</p>
          ) : null}
        </div>
      ) : (
        <div className='space-y-2'>
          <Label>Category ID</Label>
          <Input value={category?.categoryId ?? ''} disabled />
        </div>
      )}

      <div className='space-y-2'>
        <Label htmlFor='name'>
          Name
          <RequiredMark />
        </Label>
        <Input
          id='name'
          aria-invalid={Boolean(form.formState.errors.name)}
          {...form.register('name')}
        />
        {form.formState.errors.name ? (
          <p className='text-xs text-destructive'>{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>Description</Label>
        <Textarea id='description' rows={4} {...form.register('description')} />
        {form.formState.errors.description ? (
          <p className='text-xs text-destructive'>{form.formState.errors.description.message}</p>
        ) : null}
      </div>
    </FormDialog>
  )
}
