"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  Menu, 
  X, 
  User as UserIcon, 
  LogOut,
  BookOpen,
  Brain,
  BarChart3
} from 'lucide-react'
import type { User } from '@supabase/auth-helpers-nextjs'

export function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    if (path === '/study') {
      return pathname.startsWith('/study')
    }
    if (path === '/account') {
      return pathname === '/account'
    }
    return false
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <img 
              src="/Card IQ logo.png" 
              alt="Card IQ Logo" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-foreground">Card IQ</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 mx-auto">
            <Link 
              href="/dashboard" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                isActive('/dashboard') 
                  ? 'text-primary bg-primary/20 border border-primary/30' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Dashboard
            </Link>
            <Link 
              href="/study" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                isActive('/study') 
                  ? 'text-primary bg-primary/20 border border-primary/30' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              <Brain className="h-4 w-4" />
              Study
            </Link>
            <Link 
              href="/account" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                isActive('/account') 
                  ? 'text-primary bg-primary/20 border border-primary/30' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              <UserIcon className="h-4 w-4" />
              Account
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            )}
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/50 py-4">
            {user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 px-2">
                <UserIcon className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            )}
            <nav className="flex flex-col gap-2">
              <Link 
                href="/dashboard" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                  isActive('/dashboard') 
                    ? 'text-primary bg-primary/20 border border-primary/30' 
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="h-4 w-4" />
                Dashboard
              </Link>
              <Link 
                href="/study" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                  isActive('/study') 
                    ? 'text-primary bg-primary/20 border border-primary/30' 
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Brain className="h-4 w-4" />
                Study
              </Link>
              <Link 
                href="/account" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                  isActive('/account') 
                    ? 'text-primary bg-primary/20 border border-primary/30' 
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <UserIcon className="h-4 w-4" />
                Account
              </Link>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <button
                onClick={() => {
                  handleSignOut()
                  setIsMenuOpen(false)
                }}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
