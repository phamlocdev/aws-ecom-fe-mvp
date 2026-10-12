import Link from 'next/link'
import { ExternalLink, Pencil } from 'lucide-react'
import { DeleteProductDialog } from '@/components/products/delete-product-dialog'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { formatDateTime, formatVnd } from '@/lib/format'
import {
  getInventoryStockBadgeVariant,
  getInventoryStockLabel,
  getInventoryStockStatus,
} from '@/lib/inventory'
import { getProductImageSrc } from '@/lib/product-images'
import type { Category, InventorySummary, Product } from '@/lib/types'

export function ProductsTable({
  products,
  categories,
  inventoryByProductId,
}: {
  products: Product[]
  categories: Category[]
  inventoryByProductId?: Map<string, InventorySummary>
}) {
  const categoryNames = new Map(categories.map((category) => [category.categoryId, category.name]))

  const columns: ColumnDef<Product>[] = [
    {
      id: 'product',
      header: 'Product',
      headerClassName: 'w-[30%]',
      cell: (product) => {
        const imageSrc = getProductImageSrc(product)
        return (
          <div className='min-w-0 space-y-1'>
            <div className='flex items-center gap-2'>
              <p className='truncate font-medium'>{product.name}</p>
              {imageSrc ? (
                <a href={imageSrc} target='_blank' rel='noreferrer' title='Open image URL'>
                  <ExternalLink className='size-3.5 text-muted-foreground' />
                </a>
              ) : null}
            </div>
            <p className='line-clamp-2 text-xs text-muted-foreground'>{product.description}</p>
            <p className='font-mono text-[11px] text-muted-foreground'>{product.productId}</p>
          </div>
        )
      },
    },
    {
      id: 'category',
      header: 'Category',
      cell: (product) => (
        <div className='space-y-1'>
          <p className='text-sm'>{categoryNames.get(product.categoryId) ?? product.categoryId}</p>
          <p className='font-mono text-[11px] text-muted-foreground'>{product.categoryId}</p>
        </div>
      ),
    },
    {
      id: 'price',
      header: 'Price',
      cell: (product) => formatVnd(product.price),
    },
    {
      id: 'inventory',
      header: 'Inventory',
      cell: (product) => {
        const inventory = inventoryByProductId?.get(product.productId)
        if (!inventory) {
          return <span className='text-sm text-muted-foreground'>Unavailable</span>
        }

        const stockStatus = getInventoryStockStatus(inventory.availableQuantity)
        return (
          <div className='space-y-1'>
            <p className='text-sm font-medium'>{inventory.availableQuantity} available</p>
            <p className='text-xs text-muted-foreground'>{inventory.reservedQuantity} reserved</p>
            <Badge variant={getInventoryStockBadgeVariant(stockStatus)}>
              {getInventoryStockLabel(stockStatus)}
            </Badge>
          </div>
        )
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: (product) => (
        <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {product.status}
        </Badge>
      ),
    },
    {
      id: 'updated',
      header: 'Updated',
      cell: (product) => (
        <span className='text-sm text-muted-foreground'>{formatDateTime(product.updatedAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'w-24 text-right',
      cell: (product) => (
        <div className='flex justify-end gap-1'>
          <Link
            href={`/admin/products/${product.productId}/edit`}
            className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
            title='Edit product'
            aria-label='Edit product'
          >
            <Pencil />
          </Link>
          <DeleteProductDialog product={product} />
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={products}
      rowKey={(product) => product.productId}
      emptyTitle='No products yet'
      emptyDescription='Create the first product to populate the table.'
      mobileCard={(product) => {
        const inventory = inventoryByProductId?.get(product.productId)
        const stockStatus = inventory ? getInventoryStockStatus(inventory.availableQuantity) : null

        return (
          <div className='space-y-2 p-4'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <p className='truncate font-medium'>{product.name}</p>
                <p className='font-mono text-[11px] text-muted-foreground'>{product.productId}</p>
              </div>
              <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {product.status}
              </Badge>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span>{formatVnd(product.price)}</span>
              {stockStatus ? (
                <Badge variant={getInventoryStockBadgeVariant(stockStatus)}>
                  {getInventoryStockLabel(stockStatus)}
                </Badge>
              ) : null}
            </div>
            <div className='flex justify-end gap-1'>
              <Link
                href={`/admin/products/${product.productId}/edit`}
                className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                title='Edit product'
                aria-label='Edit product'
              >
                <Pencil />
              </Link>
              <DeleteProductDialog product={product} />
            </div>
          </div>
        )
      }}
    />
  )
}
