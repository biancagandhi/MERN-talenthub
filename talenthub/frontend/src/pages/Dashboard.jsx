import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Avatar, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, LinearProgress, CircularProgress, Divider,
} from '@mui/material'
import {
  People, Work, Assignment, TrendingUp,
  PersonAdd, Add, ArrowForward,
} from '@mui/icons-material'
import { dashboardApi } from '../api'
import { useAuth } from '../context/AuthContext'

// INTENTIONAL ISSUE: Massive page component — Dashboard, stat cards, funnel chart, tables, recent activity all in one file
// INTENTIONAL ISSUE: Multiple separate API calls not parallelized with Promise.all
// INTENTIONAL ISSUE: No loading skeleton — just shows CircularProgress over blank space
// INTENTIONAL ISSUE: No error UI if any API call fails

const statusColors = {
  applied: 'default', screening: 'info', phone_screen: 'info',
  technical: 'warning', onsite: 'warning', offer: 'secondary',
  hired: 'success', rejected: 'error', withdrawn: 'default',
}

const statusLabels = {
  applied: 'Applied', screening: 'Screening', phone_screen: 'Phone Screen',
  technical: 'Technical', onsite: 'Onsite', offer: 'Offer',
  hired: 'Hired', rejected: 'Rejected', withdrawn: 'Withdrawn',
}

// INTENTIONAL ISSUE: StatCard defined inline in same file — should be its own component
function StatCard({ title, value, subtitle, icon, color, onClick }) {
  return (
    <Card sx={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{title}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color }}>{value ?? '—'}</Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            )}
          </Box>
          <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: `${color}18` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// INTENTIONAL ISSUE: FunnelBar also defined inline
function FunnelBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight={600}>{value.toLocaleString()}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 8, borderRadius: 4,
          bgcolor: '#e2e8f0',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
        }}
      />
    </Box>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // INTENTIONAL ISSUE: Three separate state objects for three separate API calls
  const [stats, setStats] = useState(null)
  const [funnel, setFunnel] = useState(null)
  const [departments, setDepartments] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingFunnel, setLoadingFunnel] = useState(true)
  const [loadingDepts, setLoadingDepts] = useState(true)

  // INTENTIONAL ISSUE: Three separate useEffects — should be one with Promise.all
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await dashboardApi.getStats()
        setStats(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingStats(false)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    const fetchFunnel = async () => {
      try {
        const { data } = await dashboardApi.getFunnel()
        setFunnel(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingFunnel(false)
      }
    }
    fetchFunnel()
  }, [])

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const { data } = await dashboardApi.getDepartments()
        setDepartments(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingDepts(false)
      }
    }
    fetchDepts()
  }, [])

  const isLoading = loadingStats || loadingFunnel

  const funnelData = funnel ? [
    { label: 'Applied', value: funnel.applied, color: '#6366f1' },
    { label: 'Screening', value: funnel.screening, color: '#8b5cf6' },
    { label: 'Phone Screen', value: funnel.phone_screen, color: '#a78bfa' },
    { label: 'Technical', value: funnel.technical, color: '#f59e0b' },
    { label: 'Onsite', value: funnel.onsite, color: '#f97316' },
    { label: 'Offer', value: funnel.offer, color: '#10b981' },
    { label: 'Hired', value: funnel.hired, color: '#059669' },
  ] : []

  const funnelMax = funnelData.length > 0 ? Math.max(...funnelData.map(f => f.value)) : 1

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5">{greeting()}, {user?.name?.split(' ')[0]} 👋</Typography>
          <Typography variant="body2" color="text.secondary">
            Here's what's happening in your pipeline today.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<PersonAdd />} onClick={() => navigate('/candidates/new')}>
            Add Candidate
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/jobs/new')}>
            Post Job
          </Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stat cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Candidates"
                value={stats?.candidates?.total?.toLocaleString()}
                subtitle={`${stats?.candidates?.active?.toLocaleString()} active`}
                icon={<People sx={{ color: '#6366f1' }} />}
                color="#6366f1"
                onClick={() => navigate('/candidates')}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Open Jobs"
                value={stats?.jobs?.open?.toLocaleString()}
                subtitle={`${stats?.jobs?.total?.toLocaleString()} total positions`}
                icon={<Work sx={{ color: '#f59e0b' }} />}
                color="#f59e0b"
                onClick={() => navigate('/jobs')}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Applications"
                value={stats?.applications?.total?.toLocaleString()}
                subtitle={`${stats?.applications?.new?.toLocaleString()} new`}
                icon={<Assignment sx={{ color: '#10b981' }} />}
                color="#10b981"
                onClick={() => navigate('/applications')}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Hired This Period"
                value={stats?.candidates?.hired?.toLocaleString()}
                subtitle={`${stats?.applications?.offers?.toLocaleString() ?? 0} offers out`}
                icon={<TrendingUp sx={{ color: '#8b5cf6' }} />}
                color="#8b5cf6"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            {/* Funnel */}
            <Grid item xs={12} md={5}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Hiring Funnel</Typography>
                  {funnelData.map((item) => (
                    <FunnelBar key={item.label} {...item} max={funnelMax} />
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* Top Departments */}
            <Grid item xs={12} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Top Departments</Typography>
                  {loadingDepts ? (
                    <CircularProgress size={20} />
                  ) : (
                    departments.slice(0, 7).map((dept, idx) => (
                      <Box key={dept._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ width: 16 }}>{idx + 1}</Typography>
                          <Typography variant="body2">{dept._id}</Typography>
                        </Box>
                        <Chip label={dept.count.toLocaleString()} size="small" />
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Applications */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Recent Applications</Typography>
                    <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/applications')}>
                      View all
                    </Button>
                  </Box>
                  {stats?.recentApplications?.slice(0, 6).map((app) => (
                    <Box
                      key={app._id}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5,
                        cursor: 'pointer', p: 1, borderRadius: 1.5,
                        '&:hover': { bgcolor: '#f8fafc' }
                      }}
                      onClick={() => navigate(`/applications/${app._id}`)}
                    >
                      <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: '#e0e7ff', color: '#6366f1' }}>
                        {app.candidate?.firstName?.charAt(0)}{app.candidate?.lastName?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap fontWeight={500}>
                          {app.candidate?.firstName} {app.candidate?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {app.job?.title} • {app.job?.department}
                        </Typography>
                      </Box>
                      <Chip
                        label={statusLabels[app.status] || app.status}
                        size="small"
                        color={statusColors[app.status] || 'default'}
                        sx={{ fontSize: 10 }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}
