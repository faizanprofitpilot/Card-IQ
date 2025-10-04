import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface UsageLimits {
  canCreateDeck: boolean
  canProcessTokens: boolean
  decksRemaining: number
  tokensRemaining: number
  subscriptionPlan: 'free' | 'pro'
}

export interface UsageStats {
  decksCreatedThisMonth: number
  tokensProcessedThisMonth: number
  subscriptionPlan: 'free' | 'pro'
}

export async function checkUsageLimits(): Promise<UsageLimits> {
  const supabase = createClientComponentClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        canCreateDeck: false,
        canProcessTokens: false,
        decksRemaining: 0,
        tokensRemaining: 0,
        subscriptionPlan: 'free'
      }
    }

    // Get user's current usage
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan, decks_created_this_month, tokens_processed_this_month')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return {
        canCreateDeck: false,
        canProcessTokens: false,
        decksRemaining: 0,
        tokensRemaining: 0,
        subscriptionPlan: 'free'
      }
    }

    const isPro = profile.subscription_plan === 'pro'
    const decksCreated = profile.decks_created_this_month || 0
    const tokensProcessed = profile.tokens_processed_this_month || 0

    return {
      canCreateDeck: isPro || decksCreated < 5,
      canProcessTokens: isPro || tokensProcessed < 50000,
      decksRemaining: isPro ? Infinity : Math.max(0, 5 - decksCreated),
      tokensRemaining: isPro ? Infinity : Math.max(0, 50000 - tokensProcessed),
      subscriptionPlan: profile.subscription_plan as 'free' | 'pro'
    }
  } catch (error) {
    console.error('Error checking usage limits:', error)
    return {
      canCreateDeck: false,
      canProcessTokens: false,
      decksRemaining: 0,
      tokensRemaining: 0,
      subscriptionPlan: 'free'
    }
  }
}

export async function trackDeckCreation(): Promise<boolean> {
  const supabase = createClientComponentClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Get current count first, then update
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('decks_created_this_month')
      .eq('id', user.id)
      .single()

    if (!currentProfile) return false

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        decks_created_this_month: (currentProfile.decks_created_this_month || 0) + 1
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating deck count:', updateError)
      return false
    }

    // Log usage
    await supabase
      .from('usage_tracking')
      .insert({
        user_id: user.id,
        action_type: 'deck_created',
        metadata: { timestamp: new Date().toISOString() }
      })

    return true
  } catch (error) {
    console.error('Error tracking deck creation:', error)
    return false
  }
}

export async function trackTokensProcessed(tokenCount: number): Promise<boolean> {
  const supabase = createClientComponentClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Get current count first, then update
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('tokens_processed_this_month')
      .eq('id', user.id)
      .single()

    if (!currentProfile) return false

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        tokens_processed_this_month: (currentProfile.tokens_processed_this_month || 0) + tokenCount
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating token count:', updateError)
      return false
    }

    // Log usage
    await supabase
      .from('usage_tracking')
      .insert({
        user_id: user.id,
        action_type: 'tokens_processed',
        metadata: { 
          token_count: tokenCount,
          timestamp: new Date().toISOString() 
        }
      })

    return true
  } catch (error) {
    console.error('Error tracking tokens processed:', error)
    return false
  }
}

export async function getUsageStats(): Promise<UsageStats | null> {
  const supabase = createClientComponentClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan, decks_created_this_month, tokens_processed_this_month')
      .eq('id', user.id)
      .single()

    if (!profile) return null

    return {
      decksCreatedThisMonth: profile.decks_created_this_month || 0,
      tokensProcessedThisMonth: profile.tokens_processed_this_month || 0,
      subscriptionPlan: profile.subscription_plan as 'free' | 'pro'
    }
  } catch (error) {
    console.error('Error getting usage stats:', error)
    return null
  }
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

// Re-export token utilities for convenience
export { 
  countTokens, 
  estimatePDFTokens, 
  estimateFlashcardTokens, 
  calculateTotalTokens,
  getTokenUsageText,
  getEstimatedCost,
  TOKEN_LIMITS 
} from './token-utils'
