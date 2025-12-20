'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { Star, Bot, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface AgentData {
  overview: {
    totalAgents: number
    totalFeedback: number
    avgRating: number
    totalTasks: number
  }
  topAgents: Array<{
    agent_address: string
    agent_id: string
    name: string
    feedback_count: number
    avg_rating: number
    last_feedback: string
  }>
}

export function AgentsTab() {
  const [data, setData] = useState<AgentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgentData()
  }, [])

  const fetchAgentData = async () => {
    try {
      const [overviewRes, topRes] = await Promise.all([
        fetch('/api/analytics/agents/overview'),
        fetch('/api/analytics/agents/top?limit=10')
      ])

      const overview = await overviewRes.json()
      const topAgents = await topRes.json()

      setData({
        overview,
        topAgents
      })
    } catch (error) {
      console.error('Failed to fetch agent data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-blue-600'
    if (rating >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (rating >= 4.0) return <Badge className="bg-blue-100 text-blue-800">Very Good</Badge>
    if (rating >= 3.5) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading agent analytics...</div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Agent Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-600" />
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.overview.totalAgents}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data.overview.avgRating.toFixed(1)}/5
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Total Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.overview.totalFeedback}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.overview.totalTasks}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Rated AI Agents</CardTitle>
          <CardDescription>
            Highest rated agents based on user feedback (ERC-8004)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Average Rating</TableHead>
                <TableHead className="text-center">Feedback Count</TableHead>
                <TableHead className="text-right">Last Feedback</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topAgents.map((agent, index) => (
                <TableRow key={agent.agent_address}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                        {agent.name || agent.agent_id}
                      </div>
                      <div className="text-sm text-gray-500 font-mono">
                        {agent.agent_address.slice(0, 8)}...{agent.agent_address.slice(-6)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`font-semibold ${getRatingColor(agent.avg_rating)}`}>
                        {agent.avg_rating.toFixed(1)}/5
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(agent.avg_rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold">{agent.feedback_count}</span>
                    <span className="text-gray-500 text-sm ml-1">reviews</span>
                  </TableCell>
                  <TableCell className="text-right text-gray-500">
                    {new Date(agent.last_feedback).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    {getRatingBadge(agent.avg_rating)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Agent Ecosystem Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ERC-8004 Implementation</CardTitle>
            <CardDescription>AI Agent standard adoption metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Identity Registry</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Reputation System</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Validation Registry</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Feedback Collection</span>
              <Badge className="bg-blue-100 text-blue-800">Growing</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Capabilities</CardTitle>
            <CardDescription>Most common agent capabilities in the ecosystem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-blue-900">Rug Cleaning</div>
                  <div className="text-sm text-blue-700">NFT maintenance agents</div>
                </div>
                <Badge variant="secondary">Primary</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-green-900">Rug Restoration</div>
                  <div className="text-sm text-green-700">Quality improvement agents</div>
                </div>
                <Badge variant="secondary">Secondary</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-medium text-purple-900">Master Restoration</div>
                  <div className="text-sm text-purple-700">Advanced repair agents</div>
                </div>
                <Badge variant="secondary">Advanced</Badge>
              </div>

              <div className="text-center text-sm text-gray-500 mt-4">
                Agents register their capabilities on-chain for discoverability
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
          <CardDescription>How agent ratings are distributed across the ecosystem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">Poor</div>
              <div className="text-sm text-red-700">1-2 stars</div>
              <div className="text-lg font-semibold mt-1">
                {data.topAgents.filter(a => a.avg_rating < 3).length}
              </div>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">Fair</div>
              <div className="text-sm text-yellow-700">3 stars</div>
              <div className="text-lg font-semibold mt-1">
                {data.topAgents.filter(a => a.avg_rating >= 3 && a.avg_rating < 4).length}
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">Good</div>
              <div className="text-sm text-blue-700">4 stars</div>
              <div className="text-lg font-semibold mt-1">
                {data.topAgents.filter(a => a.avg_rating >= 4 && a.avg_rating < 4.5).length}
              </div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">Very Good</div>
              <div className="text-sm text-green-700">4.5-4.9 stars</div>
              <div className="text-lg font-semibold mt-1">
                {data.topAgents.filter(a => a.avg_rating >= 4.5 && a.avg_rating < 5).length}
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">Excellent</div>
              <div className="text-sm text-purple-700">5 stars</div>
              <div className="text-lg font-semibold mt-1">
                {data.topAgents.filter(a => a.avg_rating === 5).length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
