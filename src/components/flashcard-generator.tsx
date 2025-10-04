"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain,
  Zap,
  Clock,
  Target,
  BookOpen,
  PenTool
} from 'lucide-react'
import { generateFlashcards } from '@/lib/openai'
import { useUsageTracking } from '@/hooks/use-usage-tracking'
import type { Flashcard } from '@/lib/openai'

interface FlashcardGeneratorProps {
  deckId: string
  onCardsGenerated: (cards: Flashcard[]) => void
}

export function FlashcardGenerator({ deckId, onCardsGenerated }: FlashcardGeneratorProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([])
  const [error, setError] = useState('')
  const [aiTyping, setAiTyping] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [currentGeneratingCard, setCurrentGeneratingCard] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const { usage, trackEvent } = useUsageTracking()

  const handleGenerate = async () => {
    if (!notes.trim()) {
      setError('Please enter some notes to generate flashcards from.')
      return
    }

    if (!usage.canGenerate) {
      setError('You have reached your daily limit of 10 flashcards. Upgrade to Pro for unlimited access.')
      return
    }

    setLoading(true)
    setAiTyping(true)
    setError('')
    setGeneratedCards([])
    setGenerationProgress(0)
    setCurrentGeneratingCard(0)

    try {
      // Simulate AI thinking and typing animation
      const thinkingTime = 2000
      const typingTime = 3000
      
      // Phase 1: AI Thinking
      await new Promise(resolve => setTimeout(resolve, thinkingTime))
      setGenerationProgress(25)
      
      // Phase 2: Generate cards
      const cards = await generateFlashcards(notes)
      setGenerationProgress(50)
      
      // Phase 3: Simulate AI typing each card
      const cardsToShow: Flashcard[] = []
      for (let i = 0; i < cards.length; i++) {
        setCurrentGeneratingCard(i + 1)
        await new Promise(resolve => setTimeout(resolve, typingTime / cards.length))
        cardsToShow.push(cards[i])
        setGeneratedCards([...cardsToShow])
        setGenerationProgress(50 + ((i + 1) / cards.length) * 40)
      }
      
      setGenerationProgress(100)
      setAiTyping(false)
      
      // Track the generation event
      await trackEvent('flashcard_generated', {
        deck_id: deckId,
        card_count: cards.length
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards')
      setAiTyping(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCards = () => {
    onCardsGenerated(generatedCards)
    setGeneratedCards([])
    setNotes('')
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setNotes(text)
    setWordCount(text.trim().split(/\s+/).filter(word => word.length > 0).length)
    setCharCount(text.length)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setNotes(text)
        setWordCount(text.trim().split(/\s+/).filter(word => word.length > 0).length)
        setCharCount(text.length)
      }
      reader.readAsText(file)
    } else if (file.type === 'application/pdf') {
      // For now, show a message that PDF support is coming
      setError('PDF support is coming soon! Please paste your text instead.')
    } else {
      setError('Please upload a .txt file or paste your text directly.')
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Generation Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            AI Flashcard Generator
          </CardTitle>
          <CardDescription className="text-base">
            Transform your notes into smart flashcards with AI magic ✨
          </CardDescription>
          
          {/* Usage Indicator */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Daily Usage</span>
              </div>
              <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
                {usage.dailyFlashcards}/10 cards
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                style={{ width: `${(usage.dailyFlashcards / 10) * 100}%` }}
              ></div>
            </div>
            {!usage.canGenerate && (
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Upgrade to Pro for unlimited access! 🚀
              </p>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Notebook Style Editor */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-l-lg border border-r-0 border-border"></div>
            <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center pt-4 space-y-1">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="w-1 h-1 bg-secondary/60 dark:bg-secondary rounded-full"></div>
              ))}
            </div>
            <Textarea
              id="notes"
              placeholder="📝 Paste your study notes here...&#10;&#10;Example:&#10;Photosynthesis is the process by which plants convert sunlight into energy. It occurs in the chloroplasts and produces glucose and oxygen. The equation is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2"
              value={notes}
              onChange={handleNotesChange}
              rows={8}
              className="pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 rounded-lg font-mono text-base leading-relaxed resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              style={{
                backgroundImage: 'linear-gradient(transparent 0%, transparent 1.5em, #e5e7eb 0%)',
                backgroundSize: '100% 1.5em',
                lineHeight: '1.5em'
              }}
            />
            
            {/* Word/Char Count */}
            <div className="absolute bottom-2 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              {wordCount} words • {charCount} characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                id="file-upload"
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="w-full h-12 hover:scale-105 transition-transform cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
            <Button 
              onClick={handleGenerate} 
              disabled={loading || !notes.trim() || !usage.canGenerate}
              className="flex-1 h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {aiTyping ? 'AI is thinking...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Generate Cards
                </>
              )}
            </Button>
          </div>

          {/* AI Generation Progress */}
          {loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary animate-pulse" />
                  <span className="font-medium">
                    {aiTyping ? `Generating card ${currentGeneratingCard}...` : 'AI is analyzing your notes...'}
                  </span>
                </div>
                <span className="text-muted-foreground">{generationProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-primary to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Cards Preview */}
      {generatedCards.length > 0 && (
        <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              Generated Flashcards ({generatedCards.length})
            </CardTitle>
            <CardDescription className="text-base">
              ✨ AI has created {generatedCards.length} smart flashcards for you! Review and save them to your deck.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {generatedCards.map((card, index) => (
                <div key={index} className="group border border-border/50 rounded-xl p-5 space-y-3 bg-card/80 backdrop-blur-sm hover:bg-card/90 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <BookOpen className="h-3 w-3 mr-1" />
                      Card {index + 1}
                    </Badge>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <PenTool className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-blue-400">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">Question:</p>
                      <p className="text-base text-blue-900 dark:text-blue-100 font-medium">{card.question}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border-l-4 border-green-400">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">Answer:</p>
                      <p className="text-base text-green-900 dark:text-green-100">{card.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleSaveCards} 
                className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Save {generatedCards.length} Cards to Deck
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setGeneratedCards([])}
                className="h-12 px-6 hover:scale-105 transition-transform cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
