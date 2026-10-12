'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Button variant='ghost' size='icon' disabled aria-hidden className='opacity-0' />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun /> : <Moon />}
      <span className='sr-only'>Toggle theme</span>
    </Button>
  )
}
