'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { TrendingUp, Globe, Code, ExternalLink } from 'lucide-react'

interface AttributionData {
  trends: Array<{
    date: string
    attributed: number
    total: number
    attributionRate: number
  }>
  codes: Array<{
    code: string
    usage_count: number
    unique_transactions: number
    last_used: string
  }>
}

export function AttributionTab() {
  const [data, setData] = useState<AttributionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttributionData()
  }, [])

  const fetchAttributionData = async () => {
    try {
      const [trendsRes, codesRes] = await Promise.all([
        fetch('/api/analytics/attribution/trends?days=7'),
        fetch('/api/analytics/attribution/codes?limit=20')
      ])

      const trends = await trendsRes.json()
      const codes = await codesRes.json()

      setData({
        trends,
        codes
      })
    } catch (error) {
      console.error('Failed to fetch attribution data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCodeType = (code: string) => {
    if (code.startsWith('ref-')) return 'referral'
    if (code === 'base') return 'platform'
    if (code === 'bc_os08vbrw') return 'builder'
    return 'other'
  }

  const getCodeBadge = (code: string) => {
    const type = getCodeType(code)
    switch (type) {
      case 'referral':
        return <Badge className="bg-blue-100 text-blue-800">Referral</Badge>
      case 'platform':
        return <Badge className="bg-purple-100 text-purple-800">Platform</Badge>
      case 'builder':
        return <Badge className="bg-orange-100 text-orange-800">Builder</Badge>
      default:
        return <Badge variant="secondary">Other</Badge>
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading attribution analytics...</div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Attribution Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Attribution Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.trends.length > 0
                ? (data.trends.reduce((sum, day) => sum + day.attributionRate, 0) / data.trends.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">7-day average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Code className="h-4 w-4 text-green-600" />
              Total Attribution Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.codes.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Unique codes used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-600" />
              Base Builder Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600 font-mono">
              bc_os08vbrw
            </div>
            <p className="text-xs text-gray-500 mt-1">Official Base registration</p>
          </CardContent>
        </Card>
      </div>

      {/* Attribution Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Attribution Trends</CardTitle>
          <CardDescription>
            Daily attribution rates and transaction volumes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total Transactions</TableHead>
                <TableHead className="text-right">Attributed</TableHead>
                <TableHead className="text-right">Attribution Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.trends.map((day) => (
                <TableRow key={day.date}>
                  <TableCell className="font-medium">
                    {new Date(day.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">{day.total}</TableCell>
                  <TableCell className="text-right text-blue-600 font-semibold">
                    {day.attributed}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${
                      day.attributionRate >= 70 ? 'text-green-600' :
                      day.attributionRate >= 50 ? 'text-blue-600' :
                      day.attributionRate >= 30 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {day.attributionRate.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Popular Attribution Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Attribution Codes</CardTitle>
          <CardDescription>
            Most frequently used attribution codes in transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-right">Usage Count</TableHead>
                <TableHead className="text-right">Unique Transactions</TableHead>
                <TableHead className="text-right">Last Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.codes.map((codeData) => (
                <TableRow key={codeData.code}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {codeData.code}
                      </code>
                      {getCodeBadge(codeData.code)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getCodeType(codeData.code)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {codeData.usage_count}
                  </TableCell>
                  <TableCell className="text-right text-blue-600">
                    {codeData.unique_transactions}
                  </TableCell>
                  <TableCell className="text-right text-gray-500">
                    {new Date(codeData.last_used).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Attribution Standards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ERC-8021 Implementation</CardTitle>
            <CardDescription>Transaction Attribution Protocol compliance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Parser Library</span>
              <Badge className="bg-green-100 text-green-800">✅ Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Contract Integration</span>
              <Badge className="bg-green-100 text-green-800">✅ Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Frontend Utils</span>
              <Badge className="bg-green-100 text-green-800">✅ Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Event Emission</span>
              <Badge className="bg-green-100 text-green-800">✅ Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Base Ecosystem Integration</CardTitle>
            <CardDescription>Official Base builder participation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Builder Registration</span>
              <Badge className="bg-green-100 text-green-800">✅ Approved</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Traffic Attribution</span>
              <Badge className="bg-blue-100 text-blue-800">✅ Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Reward Eligibility</span>
              <Badge className="bg-orange-100 text-orange-800">✅ Eligible</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Analytics Access</span>
              <Badge className="bg-purple-100 text-purple-800">✅ Available</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attribution Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Attribution Code Examples</CardTitle>
          <CardDescription>
            How different attribution scenarios work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-900 mb-2">Referral Transaction</div>
              <code className="text-sm text-blue-800 bg-blue-100 px-2 py-1 rounded">
                ["ref-alice123", "base", "bc_os08vbrw"]
              </code>
              <div className="text-sm text-blue-700 mt-1">
                User referred by Alice, contributing to Base attribution
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-medium text-green-900 mb-2">Direct Base User</div>
              <code className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded">
                ["base", "bc_os08vbrw"]
              </code>
              <div className="text-sm text-green-700 mt-1">
                Direct traffic to OnchainRugs, full Base attribution
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-900 mb-2">Future Multi-Platform</div>
              <code className="text-sm text-purple-800 bg-purple-100 px-2 py-1 rounded">
                ["ref-bob456", "base", "bc_os08vbrw", "op", "optimism-code"]
              </code>
              <div className="text-sm text-purple-700 mt-1">
                Referred user across multiple ecosystems (future expansion)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
