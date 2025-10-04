"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AppHeader } from '@/components/app-header'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Play, 
  FileText,
  Calendar,
  Target,
  Star,
  Trash2,
  Eye,
  Edit
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Deck } from '@/types/database'

export default function StudyPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [deckStats, setDeckStats] = useState<Record<string, { cardCount: number; masteryPercentage: number }>>({})
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDecks()
  }, [])

  useEffect(() => {
    if (decks.length > 0) {
      fetchAllDeckStats()
    }
  }, [decks])

  const fetchAllDeckStats = async () => {
    const stats: Record<string, { cardCount: number; masteryPercentage: number }> = {}
    
    for (const deck of decks) {
      const deckStats = await getDeckStats(deck.id)
      stats[deck.id] = deckStats
    }
    
    setDeckStats(stats)
  }

  const getDeckStats = async (deckId: string) => {
    try {
      // Fetch flashcards count for this deck
      const { data: cardsData, error: cardsError } = await supabase
        .from('flashcards')
        .select('id')
        .eq('deck_id', deckId)

      if (cardsError) {
        console.error('Error fetching cards:', cardsError)
      }

      const cardCount = cardsData?.length || 0

      // Fetch study sessions for this deck to calculate mastery
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('status')
        .eq('deck_id', deckId)

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError)
      }

      let masteryPercentage = 0
      if (sessionsData && sessionsData.length > 0) {
        const knownCount = sessionsData.filter(session => session.status === 'known').length
        const totalCount = sessionsData.length
        masteryPercentage = totalCount > 0 ? Math.round((knownCount / totalCount) * 100) : 0
      }

      console.log(`Deck ${deckId} stats:`, { cardCount, masteryPercentage, sessionsCount: sessionsData?.length || 0 })
      return { cardCount, masteryPercentage }
    } catch (error) {
      console.error('Error fetching deck stats:', error)
      return { cardCount: 0, masteryPercentage: 0 }
    }
  }

  const fetchDecks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching decks:', error)
      } else {
        setDecks(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDeckEmoji = (title: string) => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('biology') || lowerTitle.includes('science')) return '🧬'
    if (lowerTitle.includes('math') || lowerTitle.includes('calculus')) return '📐'
    if (lowerTitle.includes('history') || lowerTitle.includes('social')) return '🏛️'
    if (lowerTitle.includes('language') || lowerTitle.includes('english')) return '📚'
    if (lowerTitle.includes('chemistry')) return '⚗️'
    if (lowerTitle.includes('physics')) return '⚡'
    if (lowerTitle.includes('computer') || lowerTitle.includes('programming')) return '💻'
    return '📖'
  }

  const getMasteryPercentage = (deckId: string) => {
    // Mock mastery percentage for demo
    return Math.floor(Math.random() * 40) + 30 // 30-70% range
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your study decks...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <AppHeader />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Study Mode</h1>
            <p className="text-lg text-muted-foreground">
              Choose a deck to start studying
            </p>
          </div>


          {/* Decks Grid */}
          {decks.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-6">
                <div className="text-8xl mb-4">📚</div>
                <h3 className="text-2xl font-bold text-foreground mb-2">No decks to study</h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Create some decks first to start studying
                </p>
              </div>
              <Button asChild size="lg" className="hover:scale-105 transition-transform cursor-pointer">
                <Link href="/dashboard">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {decks.map((deck) => {
                const stats = deckStats[deck.id] || { cardCount: 0, masteryPercentage: 0 }
                const deckEmoji = getDeckEmoji(deck.title)
                const isLoadingStats = !deckStats[deck.id]
                
                return (
                  <Card key={deck.id} className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-3xl">{deckEmoji}</div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-bold truncate">{deck.title}</CardTitle>
                            {deck.description && (
                              <CardDescription className="mt-1 text-sm line-clamp-2">
                                {deck.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {/* Add delete functionality */}}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Mastery Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium text-foreground">Mastery</span>
                          <span className="text-muted-foreground">
                            {isLoadingStats ? '...' : `${stats.masteryPercentage}%`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 dark:bg-gray-600 rounded-full h-3 border border-gray-600 dark:border-gray-500">
                          {isLoadingStats ? (
                            <div className="h-3 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 animate-pulse"></div>
                          ) : (
                            <div 
                              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                              style={{ width: `${Math.max(5, stats.masteryPercentage)}%` }}
                            ></div>
                          )}
                        </div>
                      </div>

                      {/* Deck Stats */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(deck.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {isLoadingStats ? '...' : `${stats.cardCount} cards`}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {isLoadingStats ? '...' : `${stats.masteryPercentage}% mastered`}
                          </Badge>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-1 hover:bg-card/80 transition-all duration-200 flex-1">
                          <Button asChild className="w-full h-10 font-semibold hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer">
                            <Link href={`/study/${deck.id}`}>
                              <Play className="h-4 w-4 mr-2" />
                              Study Now
                            </Link>
                          </Button>
                        </div>
                        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-1 hover:bg-card/80 transition-all duration-200">
                          <Button asChild variant="outline" className="hover:scale-105 transition-transform cursor-pointer">
                            <Link href={`/deck/${deck.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-1 hover:bg-card/80 transition-all duration-200">
                          <Button asChild variant="outline" className="hover:scale-105 transition-transform cursor-pointer">
                            <Link href={`/deck/${deck.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
