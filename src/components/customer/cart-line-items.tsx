'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatVnd } from '@/lib/format'
import type { CartLineItem } from '@/hooks/use-cart-product-details'

export function CartLineItems({
  items,
  isPending,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  items: CartLineItem[]
  isPending: boolean
  onDecrease: (productId: string, quantity: number) => void
  onIncrease: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}) {
  return (
    <div className='space-y-4'>
      {items.map((item) => (
        <Card key={item.product.id}>
          <CardHeader className='gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 space-y-1'>
              <CardTitle className='line-clamp-2'>{item.product.name}</CardTitle>
              <p className='text-sm text-muted-foreground'>{formatVnd(item.product.price)} / item</p>
            </div>
            <div className='text-right text-sm font-medium'>{formatVnd(item.lineTotal)}</div>
          </CardHeader>
          <CardContent className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <Link
              href={`/products/${encodeURIComponent(item.product.id)}`}
              className='text-sm text-primary hover:underline'
            >
              View product
            </Link>
            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                size='icon-sm'
                disabled={isPending || item.quantity <= 1}
                onClick={() => onDecrease(item.product.id, item.quantity)}
              >
                <Minus />
              </Button>
              <div className='min-w-10 text-center text-sm font-medium'>{item.quantity}</div>
              <Button
                type='button'
                variant='outline'
                size='icon-sm'
                disabled={isPending}
                onClick={() => onIncrease(item.product.id, item.quantity)}
              >
                <Plus />
              </Button>
            </div>
          </CardContent>
          <CardFooter className='justify-end'>
            <Button
              type='button'
              variant='destructive'
              size='sm'
              disabled={isPending}
              onClick={() => onRemove(item.product.id)}
            >
              <Trash2 />
              Remove
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
