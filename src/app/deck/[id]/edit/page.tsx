"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AppHeader } from '@/components/app-header'
import { FlashcardGenerator } from '@/components/flashcard-generator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Plus, FileText } from 'lucide-react'
import type { Deck, Flashcard } from '@/types/database'
import type { Flashcard as GeneratedFlashcard } from '@/lib/openai'

export default function EditDeckPage() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.id as string
  const [deck, setDeck] = useState<Deck | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (deckId) {
      fetchDeck()
      fetchFlashcards()
    }
  }, [deckId])

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

  const handleCardsGenerated = async (generatedCards: GeneratedFlashcard[]) => {
    if (generatedCards.length === 0) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Convert generated cards to database format
      const cardsToInsert = generatedCards.map(card => ({
        deck_id: deckId,
        question: card.question,
        answer: card.answer,
        user_id: user.id
      }))

      const { data, error } = await supabase
        .from('flashcards')
        .insert(cardsToInsert)
        .select()

      if (error) {
        console.error('Error saving flashcards:', error)
      } else {
        // Add new cards to the existing list
        setFlashcards([...(data || []), ...flashcards])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    router.push(`/deck/${deckId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
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
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
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
        <div className="mb-8">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deck
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Add Cards to &quot;{deck.title}&quot;</h1>
          <p className="text-muted-foreground">
            Use AI to generate flashcards from your notes or add them manually
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Flashcard Generator */}
          <div>
            <FlashcardGenerator 
              deckId={deckId}
              onCardsGenerated={handleCardsGenerated}
            />
          </div>

          {/* Current Cards */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Current Cards ({flashcards.length})
                </CardTitle>
                <CardDescription>
                  Cards already in this deck
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flashcards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No cards yet. Generate some with AI or add them manually.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {flashcards.map((card, index) => (
                      <div key={card.id} className="border border-border/50 rounded-lg p-4 space-y-3 bg-card/60 backdrop-blur-sm hover:bg-card/80 transition-all duration-200 hover:shadow-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-muted px-2 py-1 rounded">Q{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Q:</p>
                          <p className="text-sm">{card.question}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">A:</p>
                          <p className="text-sm">{card.answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {saving && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="p-6 bg-background border-border shadow-2xl">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving flashcards...</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
