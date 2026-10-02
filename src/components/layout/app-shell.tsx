'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Boxes,
  CreditCard,
  History,
  Layers3,
  ListChecks,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  Store,
  Tags,
  UserCircle,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useUserProfileQuery } from '@/hooks/use-user-profile'
import { getClaimString, useAuthStore } from '@/store/auth-store'
import { Permission, hasPermission } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const setPasswordRoute = '/auth/set-password'

const navItems = [
  {
    href: '/admin/products',
    label: 'Products',
    icon: Package,
    permission: Permission.PRODUCTS_READ,
  },
  {
    href: '/admin/inventories',
    label: 'Inventories',
    icon: Layers3,
    permission: Permission.INVENTORIES_READ,
  },
  {
    href: '/admin/categories',
    label: 'Categories',
    icon: Tags,
    permission: Permission.CATEGORIES_READ,
  },
  { href: '/admin/orders', label: 'Orders', icon: CreditCard, permission: Permission.ORDERS_READ },
  { href: '/admin/users', label: 'Accounts', icon: Users, permission: Permission.USERS_READ },
  {
    href: '/admin/users/login-audit',
    label: 'Login audit',
    icon: ListChecks,
    permission: Permission.USERS_LOGIN_AUDIT_READ,
  },
  {
    href: '/admin/audit',
    label: 'Audit log',
    icon: History,
    adminOnly: true,
  },
  { href: '/admin/profile', label: 'Profile', icon: UserCircle },
]

const customerNavItems = [
  { href: '/', label: 'Catalog', icon: Store },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/orders', label: 'Orders', icon: CreditCard },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { accessTokenClaims, idTokenClaims, isAuthenticated, signOut } = useAuthStore()
  const profileResult = useUserProfileQuery({
    enabled: isAuthenticated && pathname !== '/auth/callback',
  })
  const email = getClaimString(idTokenClaims, 'email')
  const username = getClaimString(idTokenClaims, 'cognito:username')
  const displayName = email ?? username
  const isAdmin = hasRole(idTokenClaims, 'admin')
  const hasAdminAccess = isAdmin || hasRole(idTokenClaims, 'manager')
  const isCustomerSignedIn = isAuthenticated && !hasAdminAccess
  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) {
      return false
    }

    return !item.permission || hasPermission(accessTokenClaims, item.permission)
  })

  useEffect(() => {
    if (
      isAuthenticated &&
      profileResult.data?.passwordStatus === 'REQUIRED' &&
      pathname !== setPasswordRoute &&
      pathname !== '/auth/callback'
    ) {
      router.replace(`${setPasswordRoute}?next=${encodeURIComponent(pathname)}`)
    }
  }, [isAuthenticated, pathname, profileResult.data?.passwordStatus, router])

  async function handleSignOut() {
    try {
      await signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sign out')
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      {hasAdminAccess ? (
        <aside
          className={cn(
            'fixed inset-y-0 left-0 hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] lg:flex lg:flex-col',
            isSidebarExpanded ? 'w-64' : 'w-20',
          )}
        >
          <div className='flex h-16 items-center gap-3 border-b border-sidebar-border px-5'>
            <div className='flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground'>
              <Boxes className='size-5' />
            </div>
            <div className={cn('min-w-0', !isSidebarExpanded && 'hidden')}>
              <p className='text-sm font-semibold'>DynamoDB MVP</p>
              <p className='text-xs text-sidebar-foreground/65'>Admin client</p>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={cn('ml-auto size-9 p-0', !isSidebarExpanded && 'ml-0')}
              aria-label={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              title={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              onClick={() => setIsSidebarExpanded((current) => !current)}
            >
              {isSidebarExpanded ? <PanelLeftClose /> : <PanelLeftOpen />}
            </Button>
          </div>
          <nav className='space-y-1 p-3'>
            <Link
              href='/'
              className={cn(
                'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                pathname === '/'
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Store className='size-4 shrink-0' />
              <span className={cn(!isSidebarExpanded && 'sr-only')}>Catalog</span>
            </Link>
            <div
              className={cn(
                'px-3 py-2 text-xs font-medium text-sidebar-foreground/50',
                !isSidebarExpanded && 'sr-only',
              )}
            >
              Admin
            </div>
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon className='size-4 shrink-0' />
                  <span className={cn(!isSidebarExpanded && 'sr-only')}>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>
      ) : null}

      <div className={cn(hasAdminAccess && (isSidebarExpanded ? 'lg:pl-64' : 'lg:pl-20'))}>
        <header className='sticky top-0 z-30 border-b bg-background/90 backdrop-blur'>
          <div className='flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8'>
            {hasAdminAccess ? (
              <>
                <Link href='/' className='flex items-center gap-2 font-semibold lg:hidden'>
                  <Store className='size-5 text-primary' />
                  Catalog
                </Link>
                <nav className='flex gap-1 lg:hidden'>
                  <Link
                    href='/'
                    aria-label='Catalog'
                    title='Catalog'
                    className={cn(
                      'flex size-9 items-center justify-center rounded-md transition-colors',
                      pathname === '/' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                    )}
                  >
                    <Store className='size-4' />
                  </Link>
                  {visibleNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-label={item.label}
                        title={item.label}
                        className={cn(
                          'flex size-9 items-center justify-center rounded-md transition-colors',
                          isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                        )}
                      >
                        <Icon className='size-4' />
                      </Link>
                    )
                  })}
                </nav>
                <div className='hidden text-sm text-muted-foreground lg:block'>
                  {displayName ? (
                    <span className='font-medium text-foreground'>{displayName}</span>
                  ) : (
                    <span>Direct API Gateway client</span>
                  )}
                </div>
              </>
            ) : (
              <div className='flex min-w-0 items-center gap-4'>
                <Link href='/' className='flex items-center gap-2 font-semibold'>
                  <Store className='size-5 text-primary' />
                  <span className='hidden sm:inline'>Catalog</span>
                </Link>
                <nav className='hidden items-center gap-1 md:flex'>
                  {customerNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    const requiresAuth = item.href !== '/'

                    if (requiresAuth && !isAuthenticated) {
                      return null
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <Icon className='size-4' />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            )}
            <div className='flex items-center gap-2'>
              {isCustomerSignedIn ? (
                <>
                  <Link
                    href='/'
                    aria-label='Catalog'
                    title='Catalog'
                    className={cn(
                      'inline-flex size-9 items-center justify-center rounded-md border transition-colors hover:bg-muted md:hidden',
                      pathname === '/' && 'bg-primary text-primary-foreground hover:bg-primary/80',
                    )}
                  >
                    <Store className='size-4' />
                  </Link>
                  <Link
                    href='/customer/profile'
                    className='inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted'
                  >
                    <UserCircle className='size-4' />
                    <span className='hidden sm:inline'>Profile</span>
                  </Link>
                  <Link
                    href='/cart'
                    className='inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted md:hidden'
                  >
                    <ShoppingCart className='size-4' />
                    <span className='hidden sm:inline'>Cart</span>
                  </Link>
                  <Link
                    href='/orders'
                    className='inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted md:hidden'
                  >
                    <CreditCard className='size-4' />
                    <span className='hidden sm:inline'>Orders</span>
                  </Link>
                </>
              ) : null}
              {isAuthenticated ? (
                <Button type='button' variant='outline' size='sm' onClick={handleSignOut}>
                  <LogOut />
                  Sign out
                </Button>
              ) : (
                <Link
                  href='/auth/login'
                  className='text-sm font-medium text-primary hover:underline'
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className='px-4 py-6 sm:px-6 lg:px-8'>{children}</main>
      </div>
    </div>
  )
}

function hasRole(claims: Record<string, unknown> | null, role: string): boolean {
  const groups = claims?.['cognito:groups']
  const directRole = claims?.role ?? claims?.['custom:role']

  if (Array.isArray(groups) && groups.some((value) => String(value).toLowerCase() === role)) {
    return true
  }

  if (typeof directRole === 'string') {
    return directRole.toLowerCase() === role
  }

  return false
}
