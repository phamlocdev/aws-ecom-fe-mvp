'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ImagePlus, Save, Star, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCategoriesQuery } from '@/hooks/use-categories'
import { useCreateProductMutation, useUpdateProductMutation } from '@/hooks/use-products'
import { apiErrorDescription, toApiClientError } from '@/lib/api/errors'
import { presignUpload, uploadWithPresignedPost } from '@/lib/api/upload'
import { productFormSchema, type ProductFormInput, type ProductFormValues } from '@/lib/schemas'
import type { Product } from '@/lib/types'
import {
  getProductImageSrc,
  getProductImagePublicSrc,
  getPrimaryProductImage,
} from '@/lib/product-images'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResourceError } from '@/components/resource-error'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

type EditableImage = {
  id: string
  key?: string
  file?: File
  previewUrl?: string
  isObjectUrl: boolean
  altText: string
  isPrimary: boolean
}

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp'

const emptyProduct: ProductFormInput = {
  name: '',
  description: '',
  categoryId: '',
  price: 1,
  availableQuantity: 0,
  imageUrl: undefined,
  images: undefined,
  status: 'ACTIVE',
}

export function ProductFormPage({
  product,
  isLoadingProduct = false,
}: {
  product?: Product
  isLoadingProduct?: boolean
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imagesRef = useRef<EditableImage[]>([])
  const categoriesResult = useCategoriesQuery({ limit: 200 })
  const createMutation = useCreateProductMutation()
  const updateMutation = useUpdateProductMutation()
  const [images, setImages] = useState<EditableImage[]>(() => toEditableImages(product))
  const [isUploading, setIsUploading] = useState(false)
  const isEdit = Boolean(product)
  const isPending = createMutation.isLoading || updateMutation.isLoading || isUploading
  const categories = categoriesResult.data?.items ?? []
  const categoriesError = categoriesResult.error ? toApiClientError(categoriesResult.error) : null
  const legacyImageUrl = product ? getProductImageSrc(product) : undefined

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyProduct,
  })

  useEffect(() => {
    form.reset(
      product
        ? {
            name: product.name,
            description: product.description,
            categoryId: product.categoryId,
            price: product.price,
            availableQuantity: 0,
            imageUrl: product.imageUrl,
            images: toProductImagePayload(product),
            status: product.status === 'DELETED' ? 'INACTIVE' : product.status,
          }
        : emptyProduct,
    )
  }, [form, product])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => () => revokeObjectUrls(imagesRef.current), [])

  const primaryImage = useMemo(() => images.find((image) => image.isPrimary) ?? images[0], [images])

  function handleFilesSelected(files: FileList | null) {
    const selectedFiles = Array.from(files ?? [])
    if (selectedFiles.length === 0) {
      return
    }

    setImages((current) => {
      const hasPrimary = current.some((image) => image.isPrimary)
      const nextImages = [
        ...current,
        ...selectedFiles.map((file, index) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          isObjectUrl: true,
          altText: '',
          isPrimary: !hasPrimary && index === 0,
        })),
      ]

      return ensurePrimaryImage(nextImages)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function updateImage(
    imageId: string,
    patch: Partial<Pick<EditableImage, 'altText' | 'isPrimary'>>,
  ) {
    setImages((current) => {
      if (patch.isPrimary) {
        return current.map((image) => ({ ...image, isPrimary: image.id === imageId }))
      }

      return current.map((image) => (image.id === imageId ? { ...image, ...patch } : image))
    })
  }

  function removeImage(imageId: string) {
    setImages((current) => {
      const imageToRemove = current.find((image) => image.id === imageId)
      if (imageToRemove?.isObjectUrl && imageToRemove.previewUrl) {
        URL.revokeObjectURL(imageToRemove.previewUrl)
      }

      return ensurePrimaryImage(current.filter((image) => image.id !== imageId))
    })
  }

  async function onSubmit(values: ProductFormValues) {
    try {
      setIsUploading(true)
      const imagePayload = await uploadNewImages(images)
      const payload: ProductFormValues = {
        ...values,
        imageUrl: values.imageUrl,
        images: imagePayload.length > 0 ? imagePayload : [],
      }

      if (product) {
        await updateMutation.mutateAsync({ productId: product.productId, input: payload })
        toast.success('Product updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Product created')
      }

      router.push('/admin/products')
    } catch (error) {
      toast.error(toApiClientError(error).message, { description: apiErrorDescription(error) })
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoadingProduct || categoriesResult.isLoading) {
    return <ProductFormSkeleton />
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-end'>
        <div className='space-y-2'>
          <Link
            href='/admin/products'
            className={cn(buttonVariants({ variant: 'ghost', className: 'px-0' }))}
          >
            <ArrowLeft />
            Products
          </Link>
          <div>
            <h1 className='text-2xl font-semibold tracking-normal'>
              {isEdit ? 'Edit product' : 'Create product'}
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Save product data after direct S3 image uploads complete.
            </p>
          </div>
        </div>
      </div>

      {categoriesError ? (
        <ResourceError
          title='Categories endpoint error'
          message={categoriesError.message}
          details={categoriesError.details}
        />
      ) : null}

      <form className='grid gap-6 lg:grid-cols-12' onSubmit={form.handleSubmit(onSubmit)}>
        <section className='space-y-4 lg:col-span-7'>
          <div className='grid gap-4 rounded-md border bg-card p-4 sm:grid-cols-2'>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='name'>Name</Label>
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
              <Label htmlFor='price'>Price</Label>
              <Input
                id='price'
                min={1}
                step={1}
                type='number'
                aria-invalid={Boolean(form.formState.errors.price)}
                {...form.register('price', { valueAsNumber: true })}
              />
              {form.formState.errors.price ? (
                <p className='text-xs text-destructive'>{form.formState.errors.price.message}</p>
              ) : null}
            </div>

            {!isEdit ? (
              <div className='space-y-2'>
                <Label htmlFor='availableQuantity'>Available quantity</Label>
                <Input
                  id='availableQuantity'
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
            ) : null}

            <div className='space-y-2'>
              <Label>Category</Label>
              {categories.length > 0 ? (
                <Controller
                  control={form.control}
                  name='categoryId'
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? '')}
                    >
                      <SelectTrigger
                        className='h-9 w-full'
                        aria-invalid={Boolean(form.formState.errors.categoryId)}
                      >
                        <SelectValue placeholder='Select category' />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.categoryId} value={category.categoryId}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <Input
                  aria-invalid={Boolean(form.formState.errors.categoryId)}
                  placeholder='electronics'
                  {...form.register('categoryId')}
                />
              )}
              {form.formState.errors.categoryId ? (
                <p className='text-xs text-destructive'>
                  {form.formState.errors.categoryId.message}
                </p>
              ) : null}
            </div>

            <div className='space-y-2'>
              <Label>Status</Label>
              <Controller
                control={form.control}
                name='status'
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? 'ACTIVE')}
                  >
                    <SelectTrigger className='h-9 w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ACTIVE'>ACTIVE</SelectItem>
                      <SelectItem value='INACTIVE'>INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                rows={5}
                aria-invalid={Boolean(form.formState.errors.description)}
                {...form.register('description')}
              />
              {form.formState.errors.description ? (
                <p className='text-xs text-destructive'>
                  {form.formState.errors.description.message}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className='space-y-4 lg:col-span-5'>
          <div className='rounded-md border bg-card p-4'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <h2 className='text-base font-semibold'>Images</h2>
                <p className='text-sm text-muted-foreground'>{images.length} selected</p>
              </div>
              <Button type='button' variant='outline' onClick={() => fileInputRef.current?.click()}>
                <ImagePlus />
                Add
              </Button>
              <Input
                ref={fileInputRef}
                type='file'
                accept={ACCEPTED_IMAGE_TYPES}
                multiple
                className='hidden'
                onChange={(event) => handleFilesSelected(event.target.files)}
              />
            </div>

            <div className='mt-4 overflow-hidden rounded-md border bg-muted'>
              <div className='aspect-[4/3]'>
                {primaryImage?.previewUrl ? (
                  <img
                    src={primaryImage.previewUrl}
                    alt={primaryImage.altText || product?.name || 'Product image'}
                    className='h-full w-full object-cover'
                  />
                ) : legacyImageUrl ? (
                  <img
                    src={legacyImageUrl}
                    alt={product?.name ?? 'Product image'}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center text-sm text-muted-foreground'>
                    No image
                  </div>
                )}
              </div>
            </div>

            <div className='mt-4 space-y-3'>
              {images.map((image, index) => (
                <div key={image.id} className='grid gap-3 rounded-md border bg-background p-3'>
                  <div className='flex items-start gap-3'>
                    <div className='size-16 shrink-0 overflow-hidden rounded-md bg-muted'>
                      {image.previewUrl ? (
                        <img
                          src={image.previewUrl}
                          alt={image.altText || `Product image ${index + 1}`}
                          className='h-full w-full object-cover'
                        />
                      ) : null}
                    </div>
                    <div className='min-w-0 flex-1 space-y-2'>
                      <Input
                        value={image.altText}
                        placeholder='Alt text'
                        onChange={(event) => updateImage(image.id, { altText: event.target.value })}
                      />
                      <div className='flex flex-wrap items-center gap-2'>
                        <Button
                          type='button'
                          size='sm'
                          variant={image.isPrimary ? 'default' : 'outline'}
                          onClick={() => updateImage(image.id, { isPrimary: true })}
                        >
                          <Star />
                          Primary
                        </Button>
                        <Button
                          type='button'
                          size='sm'
                          variant='destructive'
                          onClick={() => removeImage(image.id)}
                        >
                          <Trash2 />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Link href='/admin/products' className={cn(buttonVariants({ variant: 'outline' }))}>
              <X />
              Cancel
            </Link>
            <Button type='submit' disabled={isPending}>
              <Save />
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </section>
      </form>
    </div>
  )
}

async function uploadNewImages(
  images: EditableImage[],
): Promise<NonNullable<ProductFormValues['images']>> {
  const imagesWithFiles = images.filter((image): image is EditableImage & { file: File } =>
    Boolean(image.file),
  )
  const uploadedKeyById = new Map<string, string>()

  if (imagesWithFiles.length > 0) {
    const presigned = await presignUpload({
      target: 'product-image',
      files: imagesWithFiles.map((image) => ({
        fileName: image.file.name,
        contentType: image.file.type,
        sizeBytes: image.file.size,
      })),
    })

    await Promise.all(
      imagesWithFiles.map(async (image, index) => {
        const upload = presigned.items[index]
        await uploadWithPresignedPost(image.file, upload)
        uploadedKeyById.set(image.id, upload.imageKey)
      }),
    )
  }

  const payload = images
    .map((image, index) => ({
      key: image.key ?? uploadedKeyById.get(image.id) ?? '',
      sortOrder: index,
      isPrimary: image.isPrimary,
      altText: image.altText.trim() || undefined,
    }))
    .filter((image) => image.key)

  return ensurePrimaryPayload(payload)
}

function toEditableImages(product: Product | undefined): EditableImage[] {
  const images =
    product?.images?.map((image) => ({
      id: image.key,
      key: image.key,
      previewUrl: getProductImagePublicSrc(image),
      isObjectUrl: false,
      altText: image.altText ?? '',
      isPrimary: image.isPrimary,
    })) ?? []

  if (images.length === 0) {
    return images
  }

  const primaryImage = getPrimaryProductImage(product!)
  return ensurePrimaryImage(
    images.map((image) => ({
      ...image,
      isPrimary: image.key === primaryImage?.key,
    })),
  )
}

function toProductImagePayload(product: Product | undefined): ProductFormValues['images'] {
  return product?.images?.map((image) => ({
    key: image.key,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
    altText: image.altText,
  }))
}

function ensurePrimaryImage(images: EditableImage[]): EditableImage[] {
  if (images.length === 0 || images.some((image) => image.isPrimary)) {
    return images
  }

  return images.map((image, index) => ({ ...image, isPrimary: index === 0 }))
}

function ensurePrimaryPayload(
  images: NonNullable<ProductFormValues['images']>,
): NonNullable<ProductFormValues['images']> {
  if (images.length === 0 || images.some((image) => image.isPrimary)) {
    return images
  }

  return images.map((image, index) => ({ ...image, isPrimary: index === 0 }))
}

function revokeObjectUrls(images: EditableImage[]): void {
  for (const image of images) {
    if (image.isObjectUrl && image.previewUrl) {
      URL.revokeObjectURL(image.previewUrl)
    }
  }
}

function ProductFormSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-10 w-40' />
      <div className='grid gap-6 lg:grid-cols-12'>
        <Skeleton className='h-96 lg:col-span-7' />
        <Skeleton className='h-96 lg:col-span-5' />
      </div>
    </div>
  )
}
