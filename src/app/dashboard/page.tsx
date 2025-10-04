"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AppHeader } from '@/components/app-header'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  BookOpen, 
  Trash2, 
  Edit, 
  Eye,
  FileText,
  Calendar,
  MoreHorizontal,
  Flame,
  Target,
  Clock,
  Trophy,
  Sparkles,
  Play,
  Brain,
  TrendingUp,
  Star,
  Upload,
  File,
  X
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { checkUsageLimits, trackDeckCreation, trackTokensProcessed, countTokens, estimateFlashcardTokens, getTokenUsageText, TOKEN_LIMITS } from '@/lib/usage-tracking'
import type { Deck } from '@/types/database'

export default function Dashboard() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newDeckTitle, setNewDeckTitle] = useState('')
  const [newDeckDescription, setNewDeckDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [notes, setNotes] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [userStats, setUserStats] = useState({
    totalCards: 0,
    studyStreak: 0,
    weeklyGoal: 50,
    weeklyProgress: 0,
    totalStudyTime: 0,
    accuracy: 0
  })
  const [deckStats, setDeckStats] = useState<Record<string, { cardCount: number; masteryPercentage: number }>>({})
  const [usageLimits, setUsageLimits] = useState<{
    canCreateDeck: boolean
    canProcessTokens: boolean
    decksRemaining: number
    tokensRemaining: number
    subscriptionPlan: 'free' | 'pro'
  }>({
    canCreateDeck: true,
    canProcessTokens: true,
    decksRemaining: 5,
    tokensRemaining: 50000,
    subscriptionPlan: 'free'
  })
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDecks()
    fetchUserStats()
    checkUsage()
  }, [])

  const checkUsage = async () => {
    try {
      const limits = await checkUsageLimits()
      setUsageLimits(limits)
    } catch (error) {
      console.error('Error checking usage limits:', error)
      // Fallback to safe defaults
      setUsageLimits({
        canCreateDeck: true,
        canProcessTokens: true,
        decksRemaining: 5,
        tokensRemaining: 50000,
        subscriptionPlan: 'free'
      })
    }
  }

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

  const fetchUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch study sessions to calculate streak
      const { data: sessionsData } = await supabase
        .from('study_sessions')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Calculate study streak
      let studyStreak = 0
      if (sessionsData && sessionsData.length > 0) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const currentDate = new Date(today)
        let consecutiveDays = 0
        
        for (const session of sessionsData) {
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

      setUserStats({
        totalCards: 0, // Not needed anymore
        studyStreak: studyStreak,
        weeklyGoal: 50,
        weeklyProgress: 0, // Will be calculated from actual study sessions
        totalStudyTime: 0, // Not needed anymore
        accuracy: 0 // Not needed anymore
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const createDeck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDeckTitle.trim()) return
    if (!notes.trim() && !uploadedFile) {
      alert('Please provide notes or upload a file to generate flashcards from.')
      return
    }

    // Check usage limits
    if (!usageLimits.canCreateDeck) {
      alert('You\'ve reached your monthly deck limit. Upgrade to Pro for unlimited decks!')
      return
    }

    setCreating(true)
    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create the deck first
      console.log('Creating deck with:', { title: newDeckTitle, userId: user.id })
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .insert({
          title: newDeckTitle,
          description: newDeckDescription || null,
          user_id: user.id
        })
        .select()
        .single()
      
      console.log('Deck creation result:', { deckData, deckError })

      if (deckError) {
        console.error('Error creating deck:', deckError)
        throw new Error(`Failed to create deck: ${deckError.message}`)
      }

      setGenerationProgress(20)

      // Prepare content for AI generation
      let contentToProcess = notes.trim()
      
        if (uploadedFile) {
          try {
            if (uploadedFile.type === 'application/pdf') {
              // Extract text from PDF client-side
              console.log('Extracting text from PDF client-side...')
              const arrayBuffer = await uploadedFile.arrayBuffer()
              const pdfjsLib = await import('pdfjs-dist')
              
              // Set up worker - use local worker file
              pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
              
              // Add error handling for PDF processing
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
              const numPages = pdf.numPages
              let fullText = ''
              
              for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i)
                const textContent = await page.getTextContent()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const pageText = textContent.items.map((item: any) => item.str).join(' ')
                fullText += pageText + '\n'
              }
              
              const extractedText = fullText.trim()
              
              if (!extractedText || extractedText.length < 50) {
                throw new Error('Could not extract meaningful text from PDF')
              }
              
              console.log('Extracted text length:', extractedText.length)
              
              // Calculate tokens for extracted text
              const inputTokens = countTokens(extractedText)
              const estimatedFlashcardTokens = estimateFlashcardTokens(10)
              const totalEstimatedTokens = inputTokens + estimatedFlashcardTokens

              // Check token limits
              if (!usageLimits.canProcessTokens || totalEstimatedTokens > usageLimits.tokensRemaining) {
                alert(`This PDF would use approximately ${totalEstimatedTokens.toLocaleString()} tokens, but you can only process ${usageLimits.tokensRemaining.toLocaleString()} tokens this month. Upgrade to Pro for unlimited processing!`)
                return
              }

              // Use the extracted text as contentToProcess
              contentToProcess = extractedText
            } else if (uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              // Read DOCX file - for now, show message to copy text
              alert('DOCX files are not yet supported. Please copy and paste the text content from your DOCX file into the notes field above.')
              return
            } else {
              // This shouldn't happen due to file type validation, but just in case
              alert('Please upload a PDF or DOCX file.')
              return
            }
          } catch (error) {
            console.error('Error processing file:', error)
            const errorMessage = error instanceof Error ? error.message : 'Error processing file. Please try again or paste the text directly.'
            alert(errorMessage)
            return
          }
        }

      // Check token limits
      const tokenCount = countTokens(contentToProcess)
      if (!usageLimits.canProcessTokens || tokenCount > usageLimits.tokensRemaining) {
        alert(`This content has ${tokenCount.toLocaleString()} tokens, but you can only process ${usageLimits.tokensRemaining.toLocaleString()} tokens this month. Upgrade to Pro for unlimited processing!`)
        return
      }

      setGenerationProgress(40)

      // Generate flashcards using AI via API route
      const response = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: contentToProcess,
          deckId: deckData.id
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to generate flashcards'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // If response is not JSON, get the text
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        }
        console.error('API Error:', { status: response.status, message: errorMessage })
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const flashcards = result.flashcards || []
      
      setGenerationProgress(100)

      // Track usage
      await trackDeckCreation()
      await trackTokensProcessed(tokenCount)
      
      // Update usage limits
      await checkUsage()

      // Update the decks list
      setDecks([deckData, ...decks])
      
      // Reset form
      setNewDeckTitle('')
      setNewDeckDescription('')
      setNotes('')
      setUploadedFile(null)
      setShowCreateForm(false)

      // Show success message
      alert(`Deck created successfully with ${flashcards.length} flashcards!`)

    } catch (error) {
      console.error('Error:', error)
      alert('Error creating deck. Please try again.')
    } finally {
      setCreating(false)
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF or DOCX file.')
        return
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.')
        return
      }
      
      setUploadedFile(file)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
  }

  const deleteDeck = async (deckId: string) => {
    if (!confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId)

      if (error) {
        console.error('Error deleting deck:', error)
      } else {
        setDecks(decks.filter(deck => deck.id !== deckId))
      }
    } catch (error) {
      console.error('Error:', error)
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

  const getDeckStats = async (deckId: string) => {
    try {
      // Fetch flashcards count for this deck
      const { data: cardsData } = await supabase
        .from('flashcards')
        .select('id')
        .eq('deck_id', deckId)

      const cardCount = cardsData?.length || 0

      // Fetch study sessions for this deck to calculate mastery
      const { data: sessionsData } = await supabase
        .from('study_sessions')
        .select('status')
        .eq('deck_id', deckId)

      let masteryPercentage = 0
      if (sessionsData && sessionsData.length > 0) {
        const knownCount = sessionsData.filter(session => session.status === 'known').length
        const totalCount = sessionsData.length
        masteryPercentage = totalCount > 0 ? Math.round((knownCount / totalCount) * 100) : 0
      }

      return { cardCount, masteryPercentage }
    } catch (error) {
      console.error('Error fetching deck stats:', error)
      return { cardCount: 0, masteryPercentage: 0 }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your decks...</p>
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
        {/* Gamification Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Study Dashboard</h1>
              <p className="text-muted-foreground text-lg">
                Keep your learning streak alive! 🔥
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Usage Display */}
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {usageLimits.subscriptionPlan === 'free' ? (
                    <>
                      <div>Decks: {5 - usageLimits.decksRemaining}/5</div>
                      <div>Tokens: {getTokenUsageText(0, usageLimits.tokensRemaining, 'free')}</div>
                    </>
                  ) : (
                    <div className="text-green-600 font-semibold">Pro Plan - Unlimited</div>
                  )}
                </div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-1 hover:bg-card/80 transition-all duration-200">
                <Button 
                  onClick={() => setShowCreateForm(true)} 
                  size="lg"
                  disabled={!usageLimits.canCreateDeck}
                  className="!bg-gradient-to-r !from-primary !to-primary/90 !hover:from-primary/90 !hover:to-primary !text-primary-foreground font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Deck
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Study Streak</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{userStats.studyStreak} days</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {userStats.studyStreak === 0 ? 'Start studying to build your streak!' : 
                       userStats.studyStreak === 1 ? 'Great start! Keep it going!' :
                       userStats.studyStreak < 7 ? 'You\'re on fire! Keep it up!' :
                       userStats.studyStreak < 30 ? 'Amazing streak! You\'re unstoppable!' :
                       'Legendary streak! You\'re a study master!'}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-500/10 dark:bg-orange-500/20">
                    <Flame className="h-6 w-6 text-orange-500 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-muted-foreground">Weekly Goal</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingGoal(!isEditingGoal)}
                        className="h-6 w-6 p-0 cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-3xl font-bold text-foreground mt-1">{userStats.weeklyProgress}/{userStats.weeklyGoal}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Math.round((userStats.weeklyProgress / userStats.weeklyGoal) * 100)}% complete this week
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500/10 dark:bg-blue-500/20">
                    <Trophy className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
                
                {isEditingGoal && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Set Weekly Goal</label>
                    <select
                      value={userStats.weeklyGoal}
                      onChange={(e) => setUserStats(prev => ({ ...prev, weeklyGoal: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-border rounded-lg bg-background text-foreground cursor-pointer"
                    >
                      <option value={10}>10 cards per week</option>
                      <option value={30}>30 cards per week</option>
                      <option value={50}>50 cards per week</option>
                      <option value={100}>100 cards per week</option>
                    </select>
                  </div>
                )}
                
                <div className="mt-4">
                  <Progress 
                    value={(userStats.weeklyProgress / userStats.weeklyGoal) * 100} 
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Deck Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => {
                setShowCreateForm(false)
                setNotes('')
                setUploadedFile(null)
              }}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
              <Card className="bg-background border-border shadow-2xl" style={{ backgroundColor: 'hsl(var(--background))', opacity: 1, borderRadius: '16px !important', border: '3px solid hsl(var(--border))', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <CardContent className="p-6" style={{ backgroundColor: 'hsl(var(--background))', opacity: 1 }}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Create New Deck with AI</h2>
                        <p className="text-sm text-muted-foreground">Transform your notes into flashcards instantly</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCreateForm(false)
                        setNotes('')
                        setUploadedFile(null)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <form onSubmit={createDeck} className="space-y-6">
                    {/* Title & Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Deck Title</Label>
                        <Input
                          id="title"
                          value={newDeckTitle}
                          onChange={(e) => setNewDeckTitle(e.target.value)}
                          placeholder="Biology Chapter 5: Cell Division"
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                          id="description"
                          value={newDeckDescription}
                          onChange={(e) => setNewDeckDescription(e.target.value)}
                          placeholder="Brief description of what this deck covers"
                          className="h-10"
                        />
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-3">
                      <Label>Upload File (PDF, DOCX)</Label>
                      <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileUpload}
                        accept=".pdf,.docx"
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 bg-background"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                          <p className="mt-2 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, DOCX files (max 10MB)
                          </p>
                        </div>
                      </label>
                      
                      {uploadedFile && (
                        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <File className="h-4 w-4 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{uploadedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeFile}
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/30"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-background text-muted-foreground">or</span>
                      </div>
                    </div>

                    {/* Notes Input */}
                    <div className="space-y-3">
                      <Label htmlFor="notes">Paste Your Notes</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Paste your study notes, lecture content, or any text you want to convert into flashcards..."
                        className="min-h-[120px] resize-none"
                      />
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{notes.length} characters</span>
                        <span>⚡ Your notes will transform into flashcards instantly!</span>
                      </div>
                    </div>

                    {/* AI Generation Progress */}
                    {isGenerating && (
                      <div className="space-y-3 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 animate-pulse text-primary" />
                          <span className="text-sm font-medium text-foreground">AI is generating flashcards...</span>
                        </div>
                        <Progress value={generationProgress} className="h-2 bg-primary/20" />
                        <p className="text-xs text-muted-foreground">
                          {generationProgress < 20 && "Creating deck..."}
                          {generationProgress >= 20 && generationProgress < 40 && "Processing content..."}
                          {generationProgress >= 40 && generationProgress < 70 && "Generating flashcards..."}
                          {generationProgress >= 70 && generationProgress < 100 && "Saving flashcards..."}
                          {generationProgress >= 100 && "Complete!"}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button 
                        type="submit" 
                        disabled={creating || isGenerating || (!notes.trim() && !uploadedFile)}
                        className="flex-1 h-10 font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary disabled:opacity-50 cursor-pointer border border-primary/20 shadow-md hover:shadow-lg"
                        style={{ 
                          backgroundColor: 'hsl(var(--primary))', 
                          color: 'hsl(var(--primary-foreground))',
                          border: '1px solid hsl(var(--primary))',
                          borderRadius: '6px'
                        }}
                      >
                        {isGenerating ? (
                          <>
                            <Brain className="h-4 w-4 mr-2 animate-pulse" />
                            Generating... {uploadedFile?.type === 'application/pdf' && '(This may take a few minutes for long PDFs)'}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Create Deck with AI
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowCreateForm(false)
                          setNotes('')
                          setUploadedFile(null)
                        }}
                        disabled={creating || isGenerating}
                        className="h-10 px-6 cursor-pointer"
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

        {/* Decks Grid */}
        {decks.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="text-8xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Ready to start learning?</h3>
              <p className="text-muted-foreground text-lg mb-6">
                Create your first flashcard deck and begin your study journey
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)} 
              size="lg"
              className="px-8 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Deck
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => {
              const stats = deckStats[deck.id] || { cardCount: 0, masteryPercentage: 0 }
              const deckEmoji = getDeckEmoji(deck.title)
              
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
                        onClick={() => deleteDeck(deck.id)}
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
                        <span className="text-muted-foreground">{stats.masteryPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700 dark:bg-gray-600 rounded-full h-3 border border-gray-600 dark:border-gray-500">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${Math.max(5, stats.masteryPercentage)}%` }}
                        ></div>
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
                          {stats.cardCount} cards
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          {stats.masteryPercentage}% mastered
                        </Badge>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button asChild className="flex-1 h-10 font-semibold hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer">
                        <Link href={`/study/${deck.id}`}>
                          <Play className="h-4 w-4 mr-2" />
                          Study Now
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="hover:scale-105 transition-transform cursor-pointer">
                        <Link href={`/deck/${deck.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="hover:scale-105 transition-transform cursor-pointer">
                        <Link href={`/deck/${deck.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
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
