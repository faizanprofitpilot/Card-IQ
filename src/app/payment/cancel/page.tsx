'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, Loader2 } from 'lucide-react'
import type { User } from '@supabase/auth-helpers-nextjs'

export default function PaymentCancelPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Payment Cancelled
          </CardTitle>
          <CardDescription className="text-base">
            No worries! You can continue using Card IQ with our free plan or try upgrading again later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Free plan includes:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• 50,000 tokens per month</li>
              <li>• 5 decks per month</li>
              <li>• Basic study modes</li>
              <li>• Community support</li>
            </ul>
          </div>
          
          <div className="pt-4 space-y-2">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full h-12 text-base font-semibold"
            >
              Continue with Free Plan
              <ArrowLeft className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full h-10 text-sm"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
