'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, Users, Activity, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Client {
  id: string
  name: string
  plan: string
  healthScore: number
  trend: string
  churnRisk: string
  lastActive: string | null
  leadsCount: number
  messagesCount: number
}

interface FeatureAdoption {
  name: string
  count: number
  percentage: number
}

interface AnalyticsData {
  totalOrgs: number
  activeThisWeek: number
  avgHealthScore: number
  highChurnRisk: number
  clients: Client[]
  featureAdoption: FeatureAdoption[]
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(data => {
        setAnalytics(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8">Loading analytics...</div>
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'growing') return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getChurnBadge = (risk: string) => {
    const styles: Record<string, string> = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700'
    }
    return <Badge className={styles[risk] || styles.low}>{risk}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Client Analytics</h1>
        <p className="text-gray-500">Usage and health metrics across all clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{analytics?.totalOrgs || 0}</p>
                <p className="text-sm text-gray-500">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{analytics?.activeThisWeek || 0}</p>
                <p className="text-sm text-gray-500">Active This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{analytics?.avgHealthScore || 0}</p>
                <p className="text-sm text-gray-500">Avg Health Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{analytics?.highChurnRisk || 0}</p>
                <p className="text-sm text-gray-500">High Churn Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Health Overview</CardTitle>
          <CardDescription>All clients sorted by health score</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Churn Risk</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Leads (30d)</TableHead>
                <TableHead>Messages (30d)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics?.clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <Badge variant={client.plan === 'pro' ? 'default' : 'secondary'}>
                      {client.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            client.healthScore >= 70 ? 'bg-green-500' :
                            client.healthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${client.healthScore}%` }}
                        />
                      </div>
                      <span className="text-sm">{client.healthScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTrendIcon(client.trend)}</TableCell>
                  <TableCell>{getChurnBadge(client.churnRisk)}</TableCell>
                  <TableCell className="text-gray-500">
                    {client.lastActive
                      ? formatDistanceToNow(new Date(client.lastActive), { addSuffix: true })
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>{client.leadsCount}</TableCell>
                  <TableCell>{client.messagesCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Adoption</CardTitle>
          <CardDescription>Which features clients are using</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {analytics?.featureAdoption?.map((feature) => (
              <div key={feature.name} className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{feature.percentage}%</p>
                <p className="text-sm text-gray-500">{feature.name}</p>
                <p className="text-xs text-gray-400">{feature.count} clients</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
