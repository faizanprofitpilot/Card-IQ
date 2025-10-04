import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createCheckoutSession } from '@/lib/stripe'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('Creating checkout session...')
    
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: `Authentication failed: ${authError.message}` }, { status: 401 })
    }

    if (!user) {
      console.log('No user found')
      return NextResponse.json({ error: 'Unauthorized - no user found' }, { status: 401 })
    }

    console.log('User found:', user.id)

    const session = await createCheckoutSession(user.id)
    console.log('Checkout session created:', session.id)
    
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    )
  }
}
