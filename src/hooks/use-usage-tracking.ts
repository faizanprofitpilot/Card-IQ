"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface UsageStats {
  dailyFlashcards: number
  totalFlashcards: number
  canGenerate: boolean
}

export function useUsageTracking() {
  const [usage, setUsage] = useState<UsageStats>({
    dailyFlashcards: 0,
    totalFlashcards: 0,
    canGenerate: true
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUsageStats()
  }, [])

  const fetchUsageStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's subscription status
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()

      const isPro = profile?.subscription_status === 'pro'

      // Get today's flashcard generation count
      const today = new Date().toISOString().split('T')[0]
      const { count: dailyCount } = await supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('event_type', 'flashcard_generated')
        .gte('created_at', today)

      // Get total flashcard count
      const { count: totalCount } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      setUsage({
        dailyFlashcards: dailyCount || 0,
        totalFlashcards: totalCount || 0,
        canGenerate: isPro || (dailyCount || 0) < 10
      })
    } catch (error) {
      console.error('Error fetching usage stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const trackEvent = async (eventType: string, metadata?: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('events')
        .insert({
          user_id: user.id,
          event_type: eventType,
          metadata
        })

      // Refresh usage stats
      fetchUsageStats()
    } catch (error) {
      console.error('Error tracking event:', error)
    }
  }

  return {
    usage,
    loading,
    trackEvent,
    refreshUsage: fetchUsageStats
  }
}
