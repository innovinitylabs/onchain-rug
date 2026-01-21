"use client"

import { AttributionCodeDisplay } from './AttributionCodeDisplay'
import { AttributionStats } from './AttributionStats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gift, TrendingUp, Users } from 'lucide-react'

export function AttributionDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            ERC-8021 Attribution System
          </CardTitle>
          <CardDescription>
            Earn 5% commission on every purchase made through your ERC-8021 attribution link
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium">ERC-8021 Attribution Rewards</div>
                <div className="text-sm text-muted-foreground">5% on mints & purchases</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium">Deterministic Attribution Codes</div>
                <div className="text-sm text-muted-foreground">Same wallet, same ERC-8021 code</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium">Automatic Rewards</div>
                <div className="text-sm text-muted-foreground">No manual claiming needed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Display and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttributionCodeDisplay />
        <AttributionStats />
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
          <CardDescription>
            Simple steps to start earning ERC-8021 attribution rewards
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-amber-600 text-amber-100 rounded mt-0.5">1</span>
              <div>
                <div className="font-medium">Register for ERC-8021 Attribution</div>
                <div className="text-sm text-muted-foreground">
                  Connect your wallet and register once to generate your unique ERC-8021 attribution code
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-amber-600 text-amber-100 rounded mt-0.5">2</span>
              <div>
                <div className="font-medium">Share Your ERC-8021 Link</div>
                <div className="text-sm text-muted-foreground">
                  Share your ERC-8021 attribution link with friends, on social media, or in communities
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-amber-600 text-amber-100 rounded mt-0.5">3</span>
              <div>
                <div className="font-medium">Earn ERC-8021 Attribution Rewards</div>
                <div className="text-sm text-muted-foreground">
                  When someone uses your ERC-8021 link to mint rugs or make purchases, you earn 5% automatically
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-amber-600 text-amber-100 rounded mt-0.5">4</span>
              <div>
                <div className="font-medium">Track ERC-8021 Attribution Performance</div>
                <div className="text-sm text-muted-foreground">
                  Monitor your ERC-8021 attribution performance and earnings in real-time through your dashboard
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <div className="font-medium mb-1">How do I get my ERC-8021 attribution code?</div>
            <div className="text-sm text-muted-foreground">
              Connect your wallet and click "Register for ERC-8021 Attribution". Your deterministic code is generated automatically.
            </div>
          </div>

          <div>
            <div className="font-medium mb-1">When do I get paid?</div>
            <div className="text-sm text-muted-foreground">
              Attribution rewards are paid automatically when someone uses your ERC-8021 attribution link to complete a transaction.
            </div>
          </div>

          <div>
            <div className="font-medium mb-1">Can I change my ERC-8021 attribution code?</div>
            <div className="text-sm text-muted-foreground">
              No, ERC-8021 attribution codes are deterministic - the same wallet always generates the same code for consistency.
            </div>
          </div>

          <div>
            <div className="font-medium mb-1">Is there a limit to ERC-8021 attribution?</div>
            <div className="text-sm text-muted-foreground">
              No limits! Share your ERC-8021 attribution link with as many people as you want and earn on every transaction they make.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}