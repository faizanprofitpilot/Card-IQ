"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Plus, 
  Brain, 
  Download, 
  Upload, 
  FileText,
  Calendar,
  Trash2,
  Edit,
  Play,
  Star,
  Target,
  Clock,
  TrendingUp,
  RotateCcw,
  Sparkles,
  BarChart3,
  Zap,
  X
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { downloadCSV, downloadTXT } from '@/lib/utils'
import type { Deck, Flashcard } from '@/types/database'

export default function DeckPage() {
  const params = useParams()
  const deckId = params.id as string
  const [deck, setDeck] = useState<Deck | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCardQuestion, setNewCardQuestion] = useState('')
  const [newCardAnswer, setNewCardAnswer] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [deckStats, setDeckStats] = useState({
    masteryPercentage: 0,
    studyStreak: 0,
    lastStudied: null as string | null,
    totalStudyTime: 0,
    accuracy: 0
  })
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (deckId) {
      fetchDeck()
      fetchFlashcards()
    }
  }, [deckId])

  useEffect(() => {
    if (flashcards.length > 0) {
      calculateDeckStats()
    }
  }, [flashcards, deckId])

  const calculateDeckStats = async () => {
    try {
      // Fetch study sessions for this deck
      const { data: sessionsData } = await supabase
        .from('study_sessions')
        .select('status, created_at')
        .eq('deck_id', deckId)

      // Calculate mastery percentage based on actual study performance
      let masteryPercentage = 0
      if (sessionsData && sessionsData.length > 0) {
        const knownCount = sessionsData.filter(session => session.status === 'known').length
        const totalCount = sessionsData.length
        masteryPercentage = totalCount > 0 ? Math.round((knownCount / totalCount) * 100) : 0
      }

      // Calculate study streak
      let studyStreak = 0
      if (sessionsData && sessionsData.length > 0) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const currentDate = new Date(today)
        let consecutiveDays = 0
        
        // Sort sessions by date (most recent first)
        const sortedSessions = sessionsData.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        for (const session of sortedSessions) {
          const sessionDate = new Date(session.created_at)
          sessionDate.setHours(0, 0, 0, 0)
          
          if (sessionDate.getTime() === currentDate.getTime()) {
            consecutiveDays++
            currentDate.setDate(currentDate.getDate() - 1)
          } else if (sessionDate.getTime() < currentDate.getTime()) {
            break
          }
        }
        
        studyStreak = consecutiveDays
      }

      // Calculate last studied date
      const lastStudied = sessionsData && sessionsData.length > 0 
        ? sessionsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null

      // Calculate total study time (in minutes)
      const totalStudyTime = sessionsData ? sessionsData.length * 5 : 0 // Assuming 5 minutes per session

      // Calculate accuracy
      const accuracy = masteryPercentage

      setDeckStats({
        masteryPercentage,
        studyStreak,
        lastStudied,
        totalStudyTime,
        accuracy
      })
    } catch (error) {
      console.error('Error calculating deck stats:', error)
      setDeckStats({
        masteryPercentage: 0,
        studyStreak: 0,
        lastStudied: null,
        totalStudyTime: 0,
        accuracy: 0
      })
    }
  }

  const fetchDeck = async () => {
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single()

      if (error) {
        console.error('Error fetching deck:', error)
      } else {
        setDeck(data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchFlashcards = async () => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching flashcards:', error)
      } else {
        setFlashcards(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCardQuestion.trim() || !newCardAnswer.trim()) return

    setIsCreating(true)
    try {
      const { error } = await supabase
        .from('flashcards')
        .insert({
          deck_id: deckId,
          question: newCardQuestion.trim(),
          answer: newCardAnswer.trim()
        })

      if (error) {
        console.error('Error creating card:', error)
        alert('Error creating card. Please try again.')
        return
      }

      // Reset form
      setNewCardQuestion('')
      setNewCardAnswer('')
      setShowCreateForm(false)
      
      // Refresh flashcards
      await fetchFlashcards()
      
      alert('Card created successfully!')
    } catch (error) {
      console.error('Error creating card:', error)
      alert('Error creating card. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const deleteFlashcard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId)

      if (error) {
        console.error('Error deleting flashcard:', error)
      } else {
        setFlashcards(flashcards.filter(card => card.id !== cardId))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleExportCSV = () => {
    if (flashcards.length === 0) return
    downloadCSV(flashcards, `${deck?.title || 'deck'}-flashcards.csv`)
  }

  const handleExportTXT = () => {
    if (flashcards.length === 0) return
    downloadTXT(flashcards, `${deck?.title || 'deck'}-flashcards.txt`)
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

  const getDeckBackgroundPattern = (title: string) => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('history') || lowerTitle.includes('ancient') || lowerTitle.includes('social')) return 'bg-parchment-pattern'
    if (lowerTitle.includes('science') || lowerTitle.includes('biology') || lowerTitle.includes('chemistry') || lowerTitle.includes('physics')) return 'bg-grid-pattern'
    if (lowerTitle.includes('math') || lowerTitle.includes('calculus')) return 'bg-math-pattern'
    if (lowerTitle.includes('computer') || lowerTitle.includes('code') || lowerTitle.includes('programming')) return 'bg-code-pattern'
    if (lowerTitle.includes('art') || lowerTitle.includes('design')) return 'bg-art-pattern'
    if (lowerTitle.includes('music')) return 'bg-music-pattern'
    return 'bg-default-pattern'
  }

  const getDifficultyColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900'
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900'
    if (percentage >= 40) return 'text-orange-600 bg-orange-100 dark:bg-orange-900'
    return 'text-red-600 bg-red-100 dark:bg-red-900'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading deck...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Deck not found</h2>
            <p className="text-muted-foreground mb-4">The deck you&apos;re looking for doesn&apos;t exist.</p>
            <Button asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" asChild className="hover:scale-105 transition-transform cursor-pointer">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center gap-4 flex-1">
              <div className="text-4xl">{getDeckEmoji(deck.title)}</div>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">{deck.title}</h1>
                {deck.description && (
                  <p className="text-lg text-muted-foreground">{deck.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-1 hover:bg-card/80 transition-all duration-200">
              <Button asChild size="lg" className="!bg-gradient-to-r !from-primary !to-primary/90 !hover:from-primary/90 !hover:to-primary !text-primary-foreground font-semibold hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer">
                <Link href={`/study/${deckId}`}>
                  <Play className="h-5 w-5 mr-2" />
                  Study Now
                </Link>
              </Button>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-1 hover:bg-card/80 transition-all duration-200">
              <Button onClick={() => setShowCreateForm(true)} size="lg" className="!bg-secondary !hover:bg-secondary/90 !text-secondary-foreground font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer">
                <Plus className="h-5 w-5 mr-2" />
                Add Cards
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cards</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{flashcards.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {flashcards.length === 0 ? 'No cards yet' : 
                     flashcards.length === 1 ? '1 flashcard ready' :
                     `${flashcards.length} flashcards ready to study`}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10 dark:bg-blue-500/20">
                  <FileText className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mastery</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{deckStats.masteryPercentage}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {deckStats.studyStreak > 0 ? `${deckStats.studyStreak} day streak` : 'Start studying to build mastery!'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10 dark:bg-green-500/20">
                  <Target className="h-6 w-6 text-green-500 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-3 w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${deckStats.masteryPercentage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Flashcards</h2>
          {flashcards.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExportCSV} className="hover:scale-105 transition-transform cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={handleExportTXT} className="hover:scale-105 transition-transform cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                Export TXT
              </Button>
            </div>
          )}
        </div>

        {/* Flashcards Grid */}
        {flashcards.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="text-8xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-foreground mb-2">No flashcards yet</h3>
              <p className="text-muted-foreground text-lg mb-6">
                Add flashcards to this deck to start your study journey
              </p>
            </div>
            <Button onClick={() => setShowCreateForm(true)} size="lg" className="hover:scale-105 transition-transform cursor-pointer">
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Card
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashcards.map((card, index) => (
              <Card key={card.id} className={`group hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card/90 relative overflow-hidden ${getDeckBackgroundPattern(deck?.title || '')}`}>
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        <FileText className="h-3 w-3 mr-1" />
                        Card {index + 1}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(card.created_at)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFlashcard(card.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border-l-4 border-primary">
                      <p className="text-sm font-semibold text-primary mb-2">Question:</p>
                      <p className="text-base text-foreground font-medium line-clamp-3">{card.question}</p>
                    </div>
                    <div className="p-4 bg-secondary/5 dark:bg-secondary/10 rounded-lg border-l-4 border-secondary">
                      <p className="text-sm font-semibold text-secondary mb-2">Answer:</p>
                      <p className="text-base text-foreground line-clamp-3">{card.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Card Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => {
              setShowCreateForm(false)
              setNewCardQuestion('')
              setNewCardAnswer('')
            }}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <Card className="bg-background border-border shadow-2xl">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Add New Card</h2>
                      <p className="text-sm text-muted-foreground">Create a new flashcard for this deck</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewCardQuestion('')
                      setNewCardAnswer('')
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form onSubmit={createCard} className="space-y-6">
                  {/* Question Field */}
                  <div className="space-y-2">
                    <Label htmlFor="question">Question</Label>
                    <Textarea
                      id="question"
                      value={newCardQuestion}
                      onChange={(e) => setNewCardQuestion(e.target.value)}
                      placeholder="Enter the question for this flashcard..."
                      className="min-h-[100px] resize-none"
                      required
                    />
                  </div>

                  {/* Answer Field */}
                  <div className="space-y-2">
                    <Label htmlFor="answer">Answer</Label>
                    <Textarea
                      id="answer"
                      value={newCardAnswer}
                      onChange={(e) => setNewCardAnswer(e.target.value)}
                      placeholder="Enter the answer for this flashcard..."
                      className="min-h-[100px] resize-none"
                      required
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="submit" 
                      disabled={isCreating || !newCardQuestion.trim() || !newCardAnswer.trim()}
                      className="flex-1 h-10 font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary disabled:opacity-50"
                    >
                      {isCreating ? (
                        <>
                          <Brain className="h-4 w-4 mr-2 animate-pulse" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Card
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateForm(false)
                        setNewCardQuestion('')
                        setNewCardAnswer('')
                      }}
                      disabled={isCreating}
                      className="h-10 px-6"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
