import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { generateFlashcards } from '@/lib/openai'
import { 
  countTokens, 
  estimateFlashcardTokens, 
  TOKEN_LIMITS 
} from '@/lib/token-utils'

export async function POST(request: NextRequest) {
  try {
    console.log('Generate flashcards API called')
    
    // Handle text content only (PDFs are processed client-side)
    const body = await request.json()
    const { content, deckId } = body
    
    if (!content || !deckId) {
      return NextResponse.json(
        { error: 'Content and deckId are required' },
        { status: 400 }
      )
    }
    
    // Verify the deck exists and get user info
    const supabase = createRouteClient()
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('id, user_id')
      .eq('id', deckId)
      .single()

    if (deckError || !deck) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      )
    }

    // Get user profile for usage checking
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan, tokens_processed_this_month')
      .eq('id', deck.user_id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Calculate tokens for text content
    const inputTokens = countTokens(content)
    const estimatedFlashcardTokens = estimateFlashcardTokens(10) // Estimate 10 flashcards
    const totalEstimatedTokens = inputTokens + estimatedFlashcardTokens

    // Check token limit
    const isPro = profile.subscription_plan === 'pro'
    const maxTokens = isPro ? TOKEN_LIMITS.pro : TOKEN_LIMITS.free
    if (profile.tokens_processed_this_month + totalEstimatedTokens > maxTokens) {
      return NextResponse.json(
        { error: 'Token usage limit reached for this month' },
        { status: 429 }
      )
    }
    
    // Generate flashcards using AI
    const flashcards = await generateFlashcards(content)
    const cappedFlashcards = flashcards.slice(0, 1000)
    
    // Calculate actual tokens used
    const actualFlashcardTokens = estimateFlashcardTokens(cappedFlashcards.length)
    const actualTokensUsed = inputTokens + actualFlashcardTokens
    
    // Save flashcards to database
    if (cappedFlashcards.length > 0) {
      const flashcardData = cappedFlashcards.map(flashcard => ({
        deck_id: deckId,
        question: flashcard.question,
        answer: flashcard.answer
      }))

      const { error: cardsError } = await supabase
        .from('flashcards')
        .insert(flashcardData)

      if (cardsError) {
        console.error('Error saving flashcards:', cardsError)
        return NextResponse.json(
          { error: 'Failed to save flashcards' },
          { status: 500 }
        )
      }
    }

    // Track token usage
    await supabase
      .from('profiles')
      .update({
        tokens_processed_this_month: (profile.tokens_processed_this_month || 0) + actualTokensUsed
      })
      .eq('id', deck.user_id)

    // Log usage tracking
    await supabase
      .from('usage_tracking')
      .insert({
        user_id: deck.user_id,
        action_type: 'tokens_processed',
        metadata: { 
          token_count: actualTokensUsed,
          source: 'text_content',
          deck_id: deckId,
          timestamp: new Date().toISOString() 
        }
      })
    
    return NextResponse.json({
      success: true,
      flashcards: cappedFlashcards,
      count: cappedFlashcards.length,
      tokensUsed: actualTokensUsed
    })

  } catch (error) {
    console.error('Error generating flashcards:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}