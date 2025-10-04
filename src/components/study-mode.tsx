"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  ArrowRight,
  Play,
  RotateCw
} from 'lucide-react'
import type { Flashcard } from '@/lib/openai'

interface StudyModeProps {
  flashcards: Flashcard[]
  deckId: string
  onComplete: () => void
}

export function StudyMode({ flashcards, deckId, onComplete }: StudyModeProps) {
  const supabase = createClientComponentClient()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [studySession, setStudySession] = useState<{
    known: number[]
    unknown: number[]
    current: number
    streak: number
    startTime: number
    totalTime: number
  }>({
    known: [],
    unknown: [],
    current: 0,
    streak: 0,
    startTime: 0,
    totalTime: 0
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [sessionStats, setSessionStats] = useState({
    correctStreak: 0,
    bestStreak: 0,
    accuracy: 0,
    timeSpent: 0
  })

  const currentCard = flashcards[currentIndex]
  const progress = ((currentIndex + 1) / flashcards.length) * 100
  const isLastCard = currentIndex === flashcards.length - 1
  const accuracy = studySession.known.length > 0 ? (studySession.known.length / (studySession.known.length + studySession.unknown.length)) * 100 : 0

  // Removed auto-flip timer - cards are now manual flip only

  const handleFlip = useCallback(() => {
    if (isFlipping) return
    
    setIsFlipping(true)
    setTimeout(() => {
      setIsFlipped(!isFlipped)
      setIsFlipping(false)
    }, 300)
  }, [isFlipping, isFlipped])

  const saveStudySession = async (cardIndex: number, correct: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all flashcards for this deck to match by index
      const { data: flashcardData } = await supabase
        .from('flashcards')
        .select('id')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: false })

      if (flashcardData && flashcardData[cardIndex]) {
        await supabase
          .from('study_sessions')
          .insert({
            user_id: user.id,
            deck_id: deckId,
            card_id: flashcardData[cardIndex].id,
            status: correct ? 'known' : 'unknown'
          })
      }
    } catch (error) {
      console.error('Error saving study session:', error)
    }
  }

  const handleAnswer = useCallback(async (correct: boolean) => {
    const newSession = { ...studySession }
    const newStats = { ...sessionStats }
    
    // Save to database
    await saveStudySession(currentIndex, correct)
    
    if (correct) {
      newSession.known.push(currentIndex)
      newSession.streak += 1
      newStats.correctStreak += 1
      newStats.bestStreak = Math.max(newStats.bestStreak, newStats.correctStreak)
      
      // Show confetti for streaks of 5, 10, 15, etc.
      if (newStats.correctStreak % 5 === 0 && newStats.correctStreak > 0) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 2000)
      }
    } else {
      newSession.unknown.push(currentIndex)
      newSession.streak = 0
      newStats.correctStreak = 0
    }

    newStats.accuracy = newSession.known.length > 0 ? 
      (newSession.known.length / (newSession.known.length + newSession.unknown.length)) * 100 : 0

    setStudySession(newSession)
    setSessionStats(newStats)

    if (isLastCard) {
      setShowResults(true)
    } else {
      nextCard()
    }
  }, [studySession, sessionStats, currentIndex, isLastCard, saveStudySession])

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle keyboard events when study mode is active
      if (!isPlaying || showResults) return
      
      // Prevent default behavior for space key
      if (event.code === 'Space') {
        event.preventDefault()
        
        if (!isFlipped) {
          // First space: flip the card
          handleFlip()
        } else {
          // Second space: answer "Got It!" and go to next card
          handleAnswer(true)
        }
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyPress)
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [isPlaying, showResults, isFlipped, handleFlip, handleAnswer])

  const nextCard = () => {
    setCurrentIndex(currentIndex + 1)
    setIsFlipped(false)
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const resetSession = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsFlipping(false)
    setStudySession({ 
      known: [], 
      unknown: [], 
      current: 0, 
      streak: 0, 
      startTime: Date.now(), 
      totalTime: 0 
    })
    setSessionStats({
      correctStreak: 0,
      bestStreak: 0,
      accuracy: 0,
      timeSpent: 0
    })
    setShowResults(false)
    setShowConfetti(false)
  }

  const startSession = () => {
    setIsPlaying(true)
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsFlipping(false)
    setStudySession({ 
      known: [], 
      unknown: [], 
      current: 0, 
      streak: 0, 
      startTime: Date.now(), 
      totalTime: 0 
    })
    setSessionStats({
      correctStreak: 0,
      bestStreak: 0,
      accuracy: 0,
      timeSpent: 0
    })
    setShowConfetti(false)
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          No flashcards to study. Add some cards to this deck first.
        </div>
        <Button onClick={onComplete} className="cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Deck
        </Button>
      </div>
    )
  }

  if (showResults) {
    const knownCount = studySession.known.length
    const unknownCount = studySession.unknown.length
    const totalCount = flashcards.length
    const accuracy = (knownCount / totalCount) * 100

    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Study Complete!</h2>
                <p className="text-muted-foreground">
                  You&apos;ve finished studying all {totalCount} flashcards
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {knownCount}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Known</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {unknownCount}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">Need Review</div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-2">
                  {accuracy.toFixed(0)}%
                </div>
                <div className="text-muted-foreground">Accuracy</div>
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={resetSession} className="cursor-pointer">
                  <RotateCw className="h-4 w-4 mr-2" />
                  Study Again
                </Button>
                <Button variant="outline" onClick={onComplete} className="cursor-pointer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Deck
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isPlaying) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Ready to Study?</h2>
                <p className="text-muted-foreground">
                  You have {flashcards.length} flashcards to study
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Total Cards:</span>
                  <span className="font-medium">{flashcards.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Estimated Time:</span>
                  <span className="font-medium">{Math.ceil(flashcards.length * 0.5)} minutes</span>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={startSession} size="lg" className="!bg-primary !hover:bg-primary/90 !text-primary-foreground font-semibold shadow-lg hover:shadow-xl cursor-pointer">
                  <Play className="h-4 w-4 mr-2" />
                  Start Studying
                </Button>
                <Button variant="outline" onClick={onComplete} className="cursor-pointer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Deck
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">
            🎉
          </div>
        </div>
      )}


      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Card {currentIndex + 1} of {flashcards.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* 3D Card */}
      <div className="mb-8">
        <div className="perspective-1000">
          <div 
            className={`relative w-full h-96 transition-transform duration-700 transform-style-preserve-3d ${
              isFlipping ? 'animate-pulse' : ''
            }`}
            style={{
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Question Side */}
            <Card className={`absolute inset-0 w-full h-full backface-hidden bg-card/90 backdrop-blur-md border border-border/50 shadow-2xl ${
              isFlipped ? 'opacity-0' : 'opacity-100'
            } transition-opacity duration-300`}>
              <CardContent className="p-8 h-full flex flex-col justify-center relative z-10">
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Badge variant="secondary" className="text-sm">
                      Question
                    </Badge>
                  </div>
                  
                  <div className="min-h-[200px] flex items-center justify-center">
                    <p className="text-xl leading-relaxed font-medium">
                      {currentCard.question}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleFlip}
                      disabled={isFlipping}
                      className="w-40 h-12 text-base font-medium hover:scale-105 transition-transform cursor-pointer"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Show Answer
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> to flip
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Answer Side */}
            <Card className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-card/90 backdrop-blur-md border border-border/50 shadow-2xl ${
              isFlipped ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-300`}>
              <CardContent className="p-8 h-full flex flex-col justify-center relative z-10">
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Badge variant="default" className="text-sm">
                      Answer
                    </Badge>
                  </div>
                  
                  <div className="min-h-[200px] flex items-center justify-center">
                    <p className="text-xl leading-relaxed">
                      {currentCard.answer}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleFlip}
                      disabled={isFlipping}
                      className="w-40 h-12 text-base font-medium hover:scale-105 transition-transform cursor-pointer"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Show Question
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> to continue
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Gamified Answer Buttons */}
      {isFlipped && (
        <div className="flex justify-center gap-6 mt-8">
          <Button
            variant="destructive"
            onClick={() => handleAnswer(false)}
            className="flex-1 max-w-48 h-14 text-lg font-semibold hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
          >
            <XCircle className="h-5 w-5 mr-2" />
            Review Again
          </Button>
          <Button
            onClick={() => handleAnswer(true)}
            className="flex-1 max-w-48 h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Got It!
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="hover:scale-105 transition-transform cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={nextCard}
            disabled={isLastCard}
            className="hover:scale-105 transition-transform cursor-pointer"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onComplete}
            className="hover:scale-105 transition-transform cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  )
}
