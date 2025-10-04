"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AppHeader } from '@/components/app-header'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  CreditCard,
  Crown,
  Loader2,
  CheckCircle,
  Target,
  FileText,
  Zap,
  Trophy,
  Award,
  BookOpen,
  Download
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types/database'

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [userStats, setUserStats] = useState({
    totalCards: 0,
    totalDecks: 0,
    studyStreak: 0,
    weeklyGoal: 50,
    weeklyProgress: 0,
    totalStudyTime: 0,
    accuracy: 0
  })
  const [achievements, setAchievements] = useState([
    { id: 'first_deck', name: 'First Steps', description: 'Created your first deck', earned: true, icon: '🎯' },
    { id: 'study_streak_7', name: 'Week Warrior', description: '7-day study streak', earned: true, icon: '🔥' },
    { id: 'card_master', name: 'Card Master', description: 'Created 100+ cards', earned: false, icon: '👑' },
    { id: 'accuracy_90', name: 'Perfectionist', description: '90%+ accuracy', earned: false, icon: '⭐' }
  ])
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const supabase = createClientComponentClient()

  // Calculate level based on day streak
  const getLevelFromStreak = (streak: number) => {
    if (streak >= 30) return 5
    if (streak >= 14) return 4
    if (streak >= 7) return 3
    if (streak >= 3) return 2
    return 1
  }

  const getLevelTitle = (level: number) => {
    switch (level) {
      case 5: return 'Study Legend'
      case 4: return 'Study Master'
      case 3: return 'Study Warrior'
      case 2: return 'Study Apprentice'
      default: return 'Study Beginner'
    }
  }

  const getNextLevelRequirement = (currentLevel: number) => {
    switch (currentLevel) {
      case 1: return 3
      case 2: return 7
      case 3: return 14
      case 4: return 30
      default: return null
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      // Mock stats for demo purposes
      const mockStats = {
        totalCards: 47,
        totalDecks: 3,
        studyStreak: 12,
        weeklyGoal: 50,
        weeklyProgress: 23,
        totalStudyTime: 180, // minutes
        accuracy: 87
      }
      setUserStats(mockStats)
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
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
        setMessage(`Failed to create checkout session: ${errorData.error || 'Unknown error'}`)
        return
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      } else {
        setMessage('No checkout URL received from server')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      setMessage(`Failed to start upgrade process: ${error.message}`)
    }
  }

  const handleManageSubscription = async () => {
    // This would integrate with Stripe Customer Portal in a real app
    setMessage('Subscription management coming soon!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading account...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <AppHeader />
      
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">My Account</h1>
            <p className="text-lg text-muted-foreground">
              Track your progress and manage your subscription
            </p>
          </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile?.full_name || ''}
                  disabled
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="created">Member Since</Label>
                <Input
                  id="created"
                  value={profile?.created_at ? formatDate(profile.created_at) : ''}
                  disabled
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className={profile?.subscription_status === 'pro' 
            ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-700' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-600 dark:to-indigo-600 border-blue-500 dark:border-blue-500 text-white'
          }>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">{profile?.subscription_status === 'pro' ? 'Pro Plan' : 'Free Plan'}</div>
                  <div className="text-sm text-muted-foreground">
                    {profile?.subscription_status === 'pro' ? 'Unlimited access to all features' : 'Limited features available'}
                  </div>
                </div>
                <Badge variant={profile?.subscription_status === 'pro' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                  {profile?.subscription_status === 'pro' ? (
                    <>
                      <Crown className="h-4 w-4 mr-1" />
                      Pro
                    </>
                  ) : (
                    'Free'
                  )}
                </Badge>
              </div>

              {profile?.subscription_status === 'free' ? (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-foreground mb-1">$9.99<span className="text-lg font-normal text-muted-foreground">/month</span></div>
                      <div className="text-sm text-muted-foreground">Cancel anytime</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">1,000,000 tokens/month (~4,000,000 words)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">Unlimited decks</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">Advanced study modes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">Progress tracking</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">Priority support</span>
                      </div>
                    </div>
                    
                    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-1 hover:bg-card/80 transition-all duration-200">
                      <Button onClick={handleUpgrade} className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                        <Crown className="h-5 w-5 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800 dark:text-green-200">Pro Active</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      You have unlimited access to all features
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    className="w-full h-12 hover:scale-105 transition-transform"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Manage Subscription
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t border-border/50">
                <div className="text-sm font-semibold text-foreground mb-3">Current Limits</div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Tokens per month:</span>
                    </div>
                    <span className={`text-sm font-medium ${
                      profile?.subscription_status === 'pro' ? 'text-secondary' : 'text-white'
                    }`}>
                      {profile?.subscription_status === 'pro' ? '1,000,000' : '50,000'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Decks per month:</span>
                    </div>
                    <span className={`text-sm font-medium ${
                      profile?.subscription_status === 'pro' ? 'text-secondary' : 'text-white'
                    }`}>
                      {profile?.subscription_status === 'pro' ? 'Unlimited' : '5'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Export Formats:</span>
                    </div>
                    <span className="text-sm font-medium text-secondary">CSV, TXT</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Plan Comparison</CardTitle>
            <CardDescription>
              Compare features between Free and Pro plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Free Plan - $0/month</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    50,000 tokens/month (~200,000 words)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    5 decks per month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Basic study mode
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    CSV/TXT export
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Pro Plan - $9.99/month</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    1,000,000 tokens/month (~4,000,000 words)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Unlimited decks
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Advanced study modes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Progress tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {message && (
          <div className="mt-4 p-4 bg-muted rounded-lg text-center">
            {message}
          </div>
        )}
        </div>
        </div>
      </div>
    </AuthGuard>
  )
}
