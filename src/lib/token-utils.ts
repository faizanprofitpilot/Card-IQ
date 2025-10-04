// Note: tiktoken has issues with Next.js builds, so we'll use a simpler estimation method

// Token limits for different plans
export const TOKEN_LIMITS = {
  free: 50000,      // 50k tokens per month (~$0.15)
  pro: 1000000      // 1M tokens per month (~$3.00)
} as const

// Estimated token costs for different operations
export const TOKEN_COSTS = {
  input: 0.00015,   // $0.15 per 1M input tokens
  output: 0.0006    // $0.60 per 1M output tokens
} as const

/**
 * Count tokens in text using a simple estimation method
 * This is more reliable than tiktoken in Next.js serverless environments
 */
export function countTokens(text: string, model: string = 'gpt-4o-mini'): number {
  // Simple but effective token estimation
  // For English text: ~4 characters = 1 token, ~0.75 words = 1 token
  const charCount = text.length
  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length
  
  // Use the more conservative estimate (character-based)
  const estimatedTokens = Math.ceil(charCount / 4)
  
  // For very short texts, use word-based estimation
  if (wordCount < 10) {
    return Math.ceil(wordCount / 0.75)
  }
  
  return estimatedTokens
}

/**
 * Estimate tokens for a PDF file (rough estimation)
 * PDFs are converted to base64 and sent as images, so we estimate based on content
 */
export function estimatePDFTokens(fileSizeBytes: number): number {
  // Rough estimation: 1KB of PDF ≈ 100 tokens when processed as image
  // This is a conservative estimate
  const estimatedTokens = Math.ceil(fileSizeBytes / 10) // 1KB = 100 tokens
  return Math.max(1000, Math.min(estimatedTokens, 50000)) // Between 1k and 50k tokens
}

/**
 * Estimate tokens for generated flashcards
 */
export function estimateFlashcardTokens(flashcardCount: number): number {
  // Average flashcard: ~20 tokens (question + answer)
  // Add some overhead for JSON structure
  return flashcardCount * 25
}

/**
 * Calculate total tokens for a flashcard generation request
 */
export function calculateTotalTokens(
  inputText: string | null,
  pdfFile: File | null,
  estimatedFlashcardCount: number = 10
): number {
  let inputTokens = 0
  
  if (inputText) {
    inputTokens = countTokens(inputText)
  } else if (pdfFile) {
    inputTokens = estimatePDFTokens(pdfFile.size)
  }
  
  const outputTokens = estimateFlashcardTokens(estimatedFlashcardCount)
  
  return inputTokens + outputTokens
}

/**
 * Get token usage display text
 */
export function getTokenUsageText(tokensUsed: number, tokensRemaining: number, plan: 'free' | 'pro'): string {
  const total = plan === 'free' ? TOKEN_LIMITS.free : TOKEN_LIMITS.pro
  const used = total - tokensRemaining
  
  return `${used.toLocaleString()}/${total.toLocaleString()} tokens`
}

/**
 * Get estimated cost for tokens
 */
export function getEstimatedCost(tokens: number): number {
  // Rough estimation based on average input/output ratio
  const inputTokens = Math.floor(tokens * 0.8)  // 80% input
  const outputTokens = Math.floor(tokens * 0.2) // 20% output
  
  const inputCost = (inputTokens / 1000000) * TOKEN_COSTS.input
  const outputCost = (outputTokens / 1000000) * TOKEN_COSTS.output
  
  return inputCost + outputCost
}
