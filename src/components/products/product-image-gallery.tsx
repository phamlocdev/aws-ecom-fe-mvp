'use client'

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  getPrimaryProductImage,
  getProductImageAlt,
  getProductImagePublicSrc,
  getProductImageSrc,
} from '@/lib/product-images'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

const MIN_SCALE = 1
const MAX_SCALE = 4
const ZOOM_STEP = 0.5
const SWIPE_THRESHOLD_PX = 50
const DRAG_THRESHOLD_PX = 5

type GalleryImage = {
  key: string
  src: string
  alt: string
}

export function ProductImageGallery({ product }: { product: Product }) {
  const images = buildGalleryImages(product)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const dragRef = useRef<{ startX: number; moved: boolean } | null>(null)

  const active = images[activeIndex]
  const hasMultiple = images.length > 1

  if (!active) {
    return (
      <div className='flex aspect-square items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground'>
        No image
      </div>
    )
  }

  function goTo(index: number) {
    setActiveIndex(((index % images.length) + images.length) % images.length)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isInteractiveTarget(event.target)) {
      dragRef.current = null
      return
    }
    dragRef.current = { startX: event.clientX, moved: false }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) {
      return
    }
    if (Math.abs(event.clientX - dragRef.current.startX) > DRAG_THRESHOLD_PX) {
      dragRef.current.moved = true
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) {
      return
    }

    const delta = event.clientX - drag.startX
    if (hasMultiple && Math.abs(delta) > SWIPE_THRESHOLD_PX) {
      goTo(activeIndex + (delta < 0 ? 1 : -1))
      return
    }

    if (!drag.moved) {
      setLightboxOpen(true)
    }
  }

  return (
    <div className='space-y-3'>
      <div
        className='group relative aspect-square cursor-zoom-in touch-pan-y select-none overflow-hidden rounded-xl border bg-muted'
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragRef.current = null
        }}
      >
        <img
          src={active.src}
          alt={active.alt}
          className='h-full w-full object-contain'
          draggable={false}
        />

        {hasMultiple ? (
          <div className='pointer-events-none absolute inset-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100'>
            <Button
              type='button'
              variant='secondary'
              size='icon'
              className='pointer-events-auto rounded-full shadow'
              onClick={(event) => {
                event.stopPropagation()
                goTo(activeIndex - 1)
              }}
              aria-label='Previous image'
            >
              <ChevronLeft />
            </Button>
            <Button
              type='button'
              variant='secondary'
              size='icon'
              className='pointer-events-auto rounded-full shadow'
              onClick={(event) => {
                event.stopPropagation()
                goTo(activeIndex + 1)
              }}
              aria-label='Next image'
            >
              <ChevronRight />
            </Button>
          </div>
        ) : null}

        <Button
          type='button'
          variant='secondary'
          size='icon-sm'
          className='absolute right-2 bottom-2 rounded-full opacity-0 shadow transition-opacity group-hover:opacity-100'
          onClick={(event) => {
            event.stopPropagation()
            setLightboxOpen(true)
          }}
          aria-label='Zoom image'
        >
          <Maximize2 />
        </Button>

        {hasMultiple ? (
          <div className='pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5'>
            {images.map((image, index) => (
              <span
                key={image.key}
                className={cn(
                  'h-1.5 w-1.5 rounded-full bg-background/70 transition-all',
                  index === activeIndex && 'w-4 bg-background',
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className='flex gap-2 overflow-x-auto pb-1'>
          {images.map((image, index) => (
            <button
              key={image.key}
              type='button'
              onClick={() => goTo(index)}
              className={cn(
                'size-16 shrink-0 overflow-hidden rounded-md border-2 bg-muted transition-colors',
                index === activeIndex ? 'border-primary' : 'border-transparent hover:border-border',
              )}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex}
            >
              <img
                src={image.src}
                alt={image.alt}
                className='h-full w-full object-cover'
                draggable={false}
              />
            </button>
          ))}
        </div>
      ) : null}

      <ProductImageLightbox
        images={images}
        index={activeIndex}
        onIndexChange={setActiveIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  )
}

function ProductImageLightbox({
  images,
  index,
  onIndexChange,
  open,
  onOpenChange,
}: {
  images: GalleryImage[]
  index: number
  onIndexChange: (index: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const panRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startTranslate: { x: number; y: number }
  } | null>(null)
  const pinchRef = useRef<{ startDistance: number; startScale: number } | null>(null)
  const isInteractingRef = useRef(false)

  const active = images[index]
  const hasMultiple = images.length > 1

  useEffect(() => {
    if (!open) {
      return
    }
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }, [open, index])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (hasMultiple && event.key === 'ArrowLeft') {
        resetZoom()
        onIndexChange((index - 1 + images.length) % images.length)
      } else if (hasMultiple && event.key === 'ArrowRight') {
        resetZoom()
        onIndexChange((index + 1) % images.length)
      } else if (event.key === '+' || event.key === '=') {
        zoomBy(ZOOM_STEP)
      } else if (event.key === '-') {
        zoomBy(-ZOOM_STEP)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, images.length, hasMultiple])

  function clampTranslate(next: { x: number; y: number }, nextScale: number) {
    const container = containerRef.current
    if (!container || nextScale <= MIN_SCALE) {
      return { x: 0, y: 0 }
    }

    const maxX = (container.clientWidth * (nextScale - 1)) / 2
    const maxY = (container.clientHeight * (nextScale - 1)) / 2

    return {
      x: Math.min(Math.max(next.x, -maxX), maxX),
      y: Math.min(Math.max(next.y, -maxY), maxY),
    }
  }

  function zoomBy(delta: number) {
    setScale((current) => {
      const next = Math.min(Math.max(current + delta, MIN_SCALE), MAX_SCALE)
      setTranslate((currentTranslate) => clampTranslate(currentTranslate, next))
      return next
    })
  }

  function resetZoom() {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault()
    zoomBy((-event.deltaY / 500) * MAX_SCALE)
  }

  function handleDoubleClick() {
    if (scale > 1) {
      resetZoom()
    } else {
      setScale(2.5)
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isInteractiveTarget(event.target)) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()]
      pinchRef.current = { startDistance: pointDistance(a, b), startScale: scale }
      panRef.current = null
      isInteractingRef.current = true
      return
    }

    if (scale > 1) {
      panRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startTranslate: translate,
      }
      isInteractingRef.current = true
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) {
      return
    }
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [a, b] = [...pointersRef.current.values()]
      const ratio = pointDistance(a, b) / pinchRef.current.startDistance
      const nextScale = Math.min(
        Math.max(pinchRef.current.startScale * ratio, MIN_SCALE),
        MAX_SCALE,
      )
      setScale(nextScale)
      setTranslate((current) => clampTranslate(current, nextScale))
      return
    }

    if (panRef.current?.pointerId === event.pointerId) {
      const dx = event.clientX - panRef.current.startX
      const dy = event.clientY - panRef.current.startY
      setTranslate(
        clampTranslate(
          {
            x: panRef.current.startTranslate.x + dx,
            y: panRef.current.startTranslate.y + dy,
          },
          scale,
        ),
      )
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId)
    if (panRef.current?.pointerId === event.pointerId) {
      panRef.current = null
    }
    if (pointersRef.current.size < 2) {
      pinchRef.current = null
    }
    if (pointersRef.current.size === 0) {
      isInteractingRef.current = false
    }
  }

  if (!active) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className='flex h-screen w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-background/95 p-0 ring-0 backdrop-blur sm:max-w-none'
      >
        <div className='flex items-center justify-between gap-2 border-b p-3'>
          <p className='text-sm text-muted-foreground'>
            {hasMultiple ? `${index + 1} / ${images.length}` : active.alt}
          </p>
          <div className='flex items-center gap-1'>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              onClick={() => zoomBy(-ZOOM_STEP)}
              disabled={scale <= MIN_SCALE}
              aria-label='Zoom out'
            >
              <ZoomOut />
            </Button>
            <span className='w-12 text-center text-xs text-muted-foreground'>
              {Math.round(scale * 100)}%
            </span>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              onClick={() => zoomBy(ZOOM_STEP)}
              disabled={scale >= MAX_SCALE}
              aria-label='Zoom in'
            >
              <ZoomIn />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              onClick={resetZoom}
              disabled={scale === 1}
              aria-label='Reset zoom'
            >
              <RotateCcw />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              onClick={() => onOpenChange(false)}
              aria-label='Close'
            >
              <X />
            </Button>
          </div>
        </div>

        <div
          ref={containerRef}
          className={cn(
            'relative flex-1 touch-none overflow-hidden',
            scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
          )}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            src={active.src}
            alt={active.alt}
            draggable={false}
            className='h-full w-full touch-none object-contain select-none'
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transition: isInteractingRef.current ? 'none' : 'transform 150ms ease-out',
            }}
          />

          {hasMultiple ? (
            <>
              <Button
                type='button'
                variant='secondary'
                size='icon'
                className='absolute top-1/2 left-3 -translate-y-1/2 rounded-full shadow'
                onClick={(event) => {
                  event.stopPropagation()
                  resetZoom()
                  onIndexChange((index - 1 + images.length) % images.length)
                }}
                aria-label='Previous image'
              >
                <ChevronLeft />
              </Button>
              <Button
                type='button'
                variant='secondary'
                size='icon'
                className='absolute top-1/2 right-3 -translate-y-1/2 rounded-full shadow'
                onClick={(event) => {
                  event.stopPropagation()
                  resetZoom()
                  onIndexChange((index + 1) % images.length)
                }}
                aria-label='Next image'
              >
                <ChevronRight />
              </Button>
            </>
          ) : null}
        </div>

        {hasMultiple ? (
          <div className='flex justify-center gap-2 overflow-x-auto border-t p-3'>
            {images.map((image, imageIndex) => (
              <button
                key={image.key}
                type='button'
                onClick={() => {
                  resetZoom()
                  onIndexChange(imageIndex)
                }}
                className={cn(
                  'size-14 shrink-0 overflow-hidden rounded-md border-2 bg-muted',
                  imageIndex === index
                    ? 'border-primary'
                    : 'border-transparent hover:border-border',
                )}
                aria-label={`Show image ${imageIndex + 1}`}
                aria-current={imageIndex === index}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className='h-full w-full object-cover'
                  draggable={false}
                />
              </button>
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function buildGalleryImages(product: Product): GalleryImage[] {
  const sortedImages = (product.images ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)

  if (sortedImages.length > 0) {
    return sortedImages
      .map((image) => {
        const src = getProductImagePublicSrc(image)
        return src ? { key: image.key, src, alt: getProductImageAlt(product, image) } : null
      })
      .filter((image): image is GalleryImage => image !== null)
  }

  const fallbackSrc = getProductImageSrc(product)
  if (!fallbackSrc) {
    return []
  }

  return [
    {
      key: 'primary',
      src: fallbackSrc,
      alt: getProductImageAlt(product, getPrimaryProductImage(product)),
    },
  ]
}

function pointDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('button') !== null
}
