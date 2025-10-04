"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { AuthButton } from '@/components/auth/auth-button'
import { 
  Home, 
  BookOpen, 
  Brain, 
  User as UserIcon, 
  Zap,
  Menu,
  X,
  DollarSign,
  Star,
  Info
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/auth-helpers-nextjs'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'My Decks', href: '/dashboard', icon: BookOpen },
  { name: 'Study', href: '/study', icon: Brain },
  { name: 'Account', href: '/account', icon: UserIcon },
]

const publicNavigation = [
  { name: 'Pricing', href: '/#pricing', icon: DollarSign },
  { name: 'Features', href: '/#features', icon: Star },
  { name: 'FAQ', href: '/#faq', icon: Info },
  { name: 'About', href: '/#about', icon: Info },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex flex-shrink-0 items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/Card IQ logo.png" 
                alt="Card IQ Logo" 
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">Card IQ</span>
            </Link>
          </div>
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <div className="flex space-x-8">
              {user ? (
                navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors',
                        isActive
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })
              ) : (
                publicNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors',
                        isActive
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })
              )}
            </div>
            <div className="ml-6 flex items-center space-x-4">
              <ThemeToggle />
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-1 hover:bg-card/80 transition-all duration-200">
                <AuthButton />
              </div>
            </div>
          </div>
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="space-y-1 pb-3 pt-2">
            {user ? (
              navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'block px-3 py-2 text-base font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.name}
                    </div>
                  </Link>
                )
              })
            ) : (
              publicNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'block px-3 py-2 text-base font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.name}
                    </div>
                  </Link>
                )
              })
            )}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <div className="px-3 py-2">
                <AuthButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
