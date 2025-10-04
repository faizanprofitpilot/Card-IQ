"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AppHeader } from '@/components/app-header'
import { StudyMode } from '@/components/study-mode'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { Flashcard } from '@/lib/openai'

export default function StudyPage() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.id as string
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (deckId) {
      fetchFlashcards()
    }
  }, [deckId])

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
        // Convert database flashcards to the format expected by StudyMode
        const formattedCards: Flashcard[] = (data || []).map(card => ({
          question: card.question,
          answer: card.answer
        }))
        setFlashcards(formattedCards)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    router.push(`/deck/${deckId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading flashcards...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleComplete}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deck
          </Button>
        </div>

        <StudyMode 
          flashcards={flashcards} 
          deckId={deckId}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}
