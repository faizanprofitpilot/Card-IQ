'use client'

import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Zap, 
  Brain, 
  Download, 
  Upload, 
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/auth-helpers-nextjs'

// AnimatedText component for cycling through words
function AnimatedText({ words, className }: { words: string[], className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length)
        setIsVisible(true)
      }, 300) // Half of the transition duration
    }, 2000) // Change word every 2 seconds

    return () => clearInterval(interval)
  }, [words.length])

  return (
    <span className="inline-block w-[100px] text-center">
      <span 
        className={`inline-block transition-all duration-600 ease-in-out ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
        } ${className || ''}`}
      >
        {words[currentIndex]}
      </span>
    </span>
  )
}

export default function Home() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      
      // If user is already signed in, redirect to dashboard
      if (user) {
        router.push('/dashboard')
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        // If user signs in, redirect to dashboard
        if (session?.user) {
          router.push('/dashboard')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google sign-in process...')
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Current origin:', window.location.origin)
      
      // Test Supabase connection first
      const { data: testData, error: testError } = await supabase.auth.getSession()
      console.log('Supabase connection test:', { testData, testError })
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Error signing in with Google:', error)
        alert(`Sign-in failed: ${error.message}`)
      } else {
        console.log('Google sign-in initiated successfully:', data)
      }
    } catch (err) {
      console.error('Unexpected error during Google sign-in:', err)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  const handleUpgradeToPro = async () => {
    if (!user) {
      // Redirect to sign in first
      await handleGoogleSignIn()
      return
    }

    setPaymentLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Checkout session error:', errorData)
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert(`Failed to start checkout process: ${error instanceof Error ? error.message : 'Unknown error'}. Please check if Stripe is configured.`)
    } finally {
      setPaymentLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32">
        {/* Study Pattern Background */}
        <div className="absolute inset-0 opacity-20 dark:opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
              linear-gradient(45deg, transparent 40%, rgba(59, 130, 246, 0.05) 50%, transparent 60%),
              linear-gradient(-45deg, transparent 40%, rgba(147, 51, 234, 0.05) 50%, transparent 60%)
            `,
            backgroundSize: '400px 400px, 300px 300px, 500px 500px, 100px 100px, 100px 100px',
            backgroundPosition: '0 0, 100px 100px, 200px 200px, 0 0, 50px 50px'
          }}></div>
          
          {/* Floating Study Icons Pattern */}
          <div className="absolute inset-0">
            {/* Book icons */}
            <div className="absolute top-20 left-10 text-blue-500/30 dark:text-blue-400/40 text-6xl transform rotate-12">📚</div>
            <div className="absolute top-40 right-20 text-purple-500/30 dark:text-purple-400/40 text-4xl transform -rotate-12">📖</div>
            <div className="absolute bottom-32 left-20 text-green-500/30 dark:text-green-400/40 text-5xl transform rotate-45">📝</div>
            <div className="absolute bottom-20 right-10 text-orange-500/30 dark:text-orange-400/40 text-3xl transform -rotate-45">✏️</div>
            <div className="absolute top-60 left-1/4 text-indigo-500/30 dark:text-indigo-400/40 text-4xl transform rotate-90">📋</div>
            <div className="absolute bottom-40 right-1/3 text-pink-500/30 dark:text-pink-400/40 text-5xl transform -rotate-90">🎓</div>
            
            {/* Flashcard-like shapes */}
            <div className="absolute top-32 right-1/4 w-16 h-10 bg-blue-500/20 dark:bg-blue-400/30 rounded-lg transform rotate-12 border border-blue-500/30 dark:border-blue-400/40"></div>
            <div className="absolute bottom-48 left-1/3 w-12 h-8 bg-purple-500/20 dark:bg-purple-400/30 rounded-lg transform -rotate-12 border border-purple-500/30 dark:border-purple-400/40"></div>
            <div className="absolute top-48 left-1/2 w-14 h-9 bg-green-500/20 dark:bg-green-400/30 rounded-lg transform rotate-45 border border-green-500/30 dark:border-green-400/40"></div>
            
            {/* Mathematical symbols */}
            <div className="absolute top-24 right-1/2 text-2xl text-gray-500/30 dark:text-gray-400/40 font-mono">∫</div>
            <div className="absolute bottom-24 left-1/2 text-3xl text-gray-500/30 dark:text-gray-400/40 font-mono">∑</div>
            <div className="absolute top-1/2 left-10 text-xl text-gray-500/30 dark:text-gray-400/40 font-mono">α</div>
            <div className="absolute top-1/2 right-10 text-xl text-gray-500/30 dark:text-gray-400/40 font-mono">β</div>
          </div>
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-left">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
                <div className="flex items-center gap-2">
                  <span>Turn</span>
                  <AnimatedText 
                    words={['notes', 'PDFs', 'docs', 'books', 'texts']}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div className="mt-2">
                  into flashcards{' '}
                  <span className="text-blue-600 dark:text-blue-400">instantly</span>
                </div>
              </h1>
              <p className="mt-6 text-lg leading-7 text-muted-foreground max-w-2xl">
                Card IQ uses AI to convert your notes, PDFs, and study materials into 
                personalized flashcards. Study smarter, not harder.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <button 
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 hover:bg-card/80 transition-all duration-200 h-12 px-6 text-base font-semibold rounded-full shadow-lg hover:shadow-xl cursor-pointer flex items-center gap-2"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Get Started with Google
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button 
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 hover:bg-card/80 transition-all duration-200 h-12 px-6 text-base font-semibold rounded-full border-2 hover:bg-accent/50 cursor-pointer flex items-center gap-2"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Learn More
                </button>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row items-start gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  No credit card required
                </div>
              </div>
            </div>

            {/* Right side - Hero image */}
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/Hero content.png" 
                alt="Card IQ in action - AI-powered flashcard generation"
                className="max-w-full h-auto rounded-2xl shadow-2xl"
                style={{ maxHeight: '900px' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Everything you need to study effectively
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to accelerate your learning
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors duration-300">
                    <Upload className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Upload & Convert</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Upload PDFs or paste your notes. Our AI instantly converts them into 
                  well-structured flashcards.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors duration-300">
                    <Brain className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Smart Study Mode</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Interactive study sessions with spaced repetition. Track your progress 
                  and focus on what you need to learn.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors duration-300">
                    <Download className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Export & Share</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Export your flashcards as CSV or TXT files. Share with classmates 
                  or import into other study apps.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that&apos;s right for you
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-border/50 shadow-lg">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">Free Plan</CardTitle>
                <CardDescription className="text-base">Perfect for getting started</CardDescription>
                <div className="text-3xl font-bold mt-4">$0<span className="text-lg font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-base">50,000 tokens/month (~200,000 words)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-base">5 decks per month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-base">Basic study mode</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-base">CSV/TXT export</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-base">Basic support</span>
                  </li>
                </ul>
                <button className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center border-2 hover:bg-accent/50 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80">
                  Get Started Free
                </button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-blue-500 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                Popular
              </div>
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl font-bold">Pro Plan</CardTitle>
                <CardDescription className="text-base">For serious learners</CardDescription>
                <div className="text-3xl font-bold mt-4">$9.99<span className="text-lg font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-base">1,000,000 tokens/month (~4,000,000 words)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-base">Unlimited decks</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-base">Advanced study modes</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-base">Progress tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-base">Priority support</span>
                  </li>
                </ul>
                <button 
                  onClick={handleUpgradeToPro}
                  disabled={paymentLoading}
                  className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-card/80"
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Upgrade to Pro'
                  )}
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* About Section */}
      <section id="about" className="py-24 bg-muted/10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/5 to-transparent"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              About Card IQ
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              We believe that studying should be efficient, engaging, and accessible to everyone.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 items-center">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Our Mission</h3>
              <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                Card IQ was born from the frustration of spending hours creating flashcards manually. 
                We wanted to make studying more efficient by leveraging AI to automatically generate 
                high-quality flashcards from any study material.
              </p>
              <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                Our platform combines the power of artificial intelligence with proven spaced 
                repetition techniques to help students learn faster and retain information longer.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-base font-medium">AI-powered flashcard generation</span>
                </div>
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-base font-medium">Smart study algorithms</span>
                </div>
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-base font-medium">Cross-platform accessibility</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-blue-500/10 rounded-full p-16 inline-block group hover:bg-blue-500/20 transition-colors duration-300">
                <img 
                  src="/Card IQ logo.png" 
                  alt="Card IQ Logo" 
                  className="h-32 w-32 group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Ready to supercharge your studying?
            </h2>
            <div className="mt-10 flex justify-center">
              <button 
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 hover:bg-card/80 transition-all duration-200 h-12 px-6 text-base font-semibold rounded-full shadow-lg hover:shadow-xl cursor-pointer flex items-center gap-2"
                onClick={handleGoogleSignIn}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Get Started with Google
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-muted/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to know about Card IQ
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  How does Card IQ generate flashcards?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Card IQ uses advanced AI (GPT-4o-mini) to analyze your notes, PDFs, or text content 
                  and automatically generate high-quality flashcards. The AI understands context, 
                  identifies key concepts, and creates questions and answers that help you learn effectively.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  What file formats are supported?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Currently, Card IQ supports PDF files and plain text. You can upload PDFs directly 
                  or copy and paste text content. We&apos;re working on adding support for more formats 
                  like Word documents, PowerPoint presentations, and more.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  What&apos;s the difference between Free and Pro plans?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Free Plan:</strong> 50,000 tokens per month (~200,000 words), 5 decks per month, 
                  basic study modes, and community support.<br/><br/>
                  <strong>Pro Plan ($9.99/month):</strong> 1,000,000 tokens per month (~4,000,000 words), 
                  unlimited decks, advanced study modes, progress tracking, and priority support.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  How are tokens calculated?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tokens are calculated based on the text content you provide. Roughly, 1 token equals 
                  about 4 characters or 0.75 words. A typical flashcard generation uses approximately 
                  25 tokens per card. We provide real-time token usage tracking so you always know 
                  how much you&apos;ve used.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Can I edit flashcards after they&apos;re generated?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Yes! You can edit any flashcard by going to the deck view and clicking the edit button. 
                  You can modify questions, answers, or delete cards you don&apos;t need. This gives you 
                  full control over your study materials.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Is my data secure and private?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Absolutely. We use enterprise-grade security with Supabase for authentication and 
                  data storage. Your content is encrypted in transit and at rest. We never share your 
                  data with third parties, and you can delete your account and data at any time.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Can I study offline?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Currently, Card IQ requires an internet connection to access your flashcards and 
                  sync your progress. However, we&apos;re working on offline support and mobile apps 
                  to make studying available anywhere, anytime.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  How do I cancel my subscription?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  You can cancel your Pro subscription at any time from your account settings. 
                  Your Pro features will remain active until the end of your current billing period. 
                  After cancellation, you&apos;ll automatically return to the Free plan.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Card IQ</span>
            </div>
            <p className="text-muted-foreground">
              © 2024 Card IQ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
