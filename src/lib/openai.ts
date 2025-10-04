import OpenAI from 'openai'

export interface Flashcard {
  question: string
  answer: string
}

export async function generateFlashcards(notes: string): Promise<Flashcard[]> {
  try {
    // Initialize OpenAI client inside the function
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating high-quality study flashcards. Create flashcards from the provided content that are:

- Clear and concise (questions should be specific, answers should be comprehensive but brief)
- Focused on key concepts, definitions, important facts, and relationships
- Appropriate for active recall and spaced repetition
- Cover the most important and testable information
- Use proper academic language and terminology

Return ONLY a valid JSON array of objects with 'question' and 'answer' properties. Each flashcard should be well-structured and educational.

Example format:
[
  {
    "question": "What is the definition of [key term]?",
    "answer": "The definition is [clear, concise definition]"
  }
]

Create 8-15 flashcards depending on the content density.`
        },
        {
          role: "user",
          content: `Convert these notes into study flashcards:\n\n${notes}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated')
    }

    console.log('OpenAI response content:', content)

    // Extract JSON from markdown code blocks if present
    let jsonContent = content
    if (content.includes('```json')) {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        jsonContent = jsonMatch[1]
        console.log('Extracted JSON from markdown:', jsonContent)
      }
    }

    // Parse the JSON response
    let flashcards
    try {
      flashcards = JSON.parse(jsonContent)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError)
      console.error('Raw content:', content)
      console.error('Extracted JSON:', jsonContent)
      throw new Error(`Invalid JSON response from OpenAI: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`)
    }
    
    // Validate the response format
    if (!Array.isArray(flashcards)) {
      throw new Error('Invalid response format')
    }

    return flashcards.map((card: {question?: string, answer?: string}) => ({
      question: card.question || '',
      answer: card.answer || ''
    })).filter((card: Flashcard) => card.question && card.answer)
  } catch (error) {
    console.error('Error generating flashcards:', error)
    throw new Error('Failed to generate flashcards. Please try again.')
  }
}

