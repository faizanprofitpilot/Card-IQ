"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AppHeader } from '@/components/app-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  BookOpen, 
  FileText, 
  TrendingUp,
  Loader2,
  Shield
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface AdminStats {
  totalUsers: number
  totalDecks: number
  totalFlashcards: number
  recentEvents: Array<{
    id: string
    event_type: string
    created_at: string
    user_id: string
  }>
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      // Check if user is admin (in a real app, you'd have proper admin role checking)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all stats
      const [usersResult, decksResult, flashcardsResult, eventsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('decks').select('id', { count: 'exact' }),
        supabase.from('flashcards').select('id', { count: 'exact' }),
        supabase.from('events').select('*').order('created_at', { ascending: false }).limit(10)
      ])

      setStats({
        totalUsers: usersResult.count || 0,
        totalDecks: decksResult.count || 0,
        totalFlashcards: flashcardsResult.count || 0,
        recentEvents: eventsResult.data || []
      })
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Overview of Card IQ usage and analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalDecks || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Decks</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10 dark:bg-green-500/20">
                  <BookOpen className="h-6 w-6 text-green-500 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalFlashcards || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Flashcards</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/10">
                  <FileText className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.recentEvents.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Recent Events</p>
                </div>
                <div className="p-3 rounded-full bg-orange-500/10 dark:bg-orange-500/20">
                  <TrendingUp className="h-6 w-6 text-orange-500 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest events and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent events
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {event.event_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        User: {event.user_id.slice(0, 8)}...
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(event.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
