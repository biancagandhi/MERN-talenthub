import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Button, Chip, Grid,
  Divider, Tabs, Tab, CircularProgress, IconButton, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  List, ListItem, ListItemIcon, ListItemText, LinearProgress,
} from '@mui/material'
import {
  Edit, Delete, ArrowBack, LocationOn, Work, AttachMoney,
  People, CheckCircle, Schedule, TrendingUp, Visibility,
} from '@mui/icons-material'
import { jobsApi } from '../api'

// INTENTIONAL ISSUE: Large component — job details, applications tab, stats, all inline
// INTENTIONAL ISSUE: Duplicate table structure from CandidateDetailPage

const appStatusColors = {
  applied: 'default', screening: 'info', phone_screen: 'info',
  technical: 'warning', onsite: 'warning', offer: 'secondary',
  hired: 'success', rejected: 'error', withdrawn: 'default',
}

const appStatusLabels = {
  applied: 'Applied', screening: 'Screening', phone_screen: 'Phone Screen',
  technical: 'Technical', onsite: 'Onsite', offer: 'Offer',
  hired: 'Hired', rejected: 'Rejected', withdrawn: 'Withdrawn',
}

const jobStatusColors = {
  draft: 'default', open: 'success', paused: 'warning', closed: 'error', filled: 'primary',
}

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)

  // INTENTIONAL ISSUE: Three sequential API calls — not parallelized
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true)
        const { data: j } = await jobsApi.getById(id)
        setJob(j)

        const { data: apps } = await jobsApi.getApplications(id)
        setApplications(apps)

        const { data: s } = await jobsApi.getStats(id)
        setStats(s)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('Delete this job posting?')) return
    try {
      await jobsApi.delete(id)
      navigate('/jobs')
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!job) {
    return <Box sx={{ p: 3 }}><Alert severity="error">Job not found.</Alert></Box>
  }

  const salaryText = job.salary?.isPublic
    ? `$${(job.salary.min / 1000).toFixed(0)}k – $${(job.salary.max / 1000).toFixed(0)}k`
    : 'Confidential'

  const funnelItems = stats ? [
    { label: 'Applied', value: stats.applied },
    { label: 'Screening', value: stats.screening },
    { label: 'Technical', value: stats.technical },
    { label: 'Offer', value: stats.offer },
    { label: 'Hired', value: stats.hired },
    { label: 'Rejected', value: stats.rejected },
  ] : []

  const maxFunnel = Math.max(...funnelItems.map(f => f.value || 0), 1)

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/jobs')} size="small"><ArrowBack /></IconButton>
        <Typography variant="body2" color="text.secondary">Jobs /</Typography>
        <Typography variant="body2">{job.title}</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left: job summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">{job.title}</Typography>
                <Typography variant="body2" color="text.secondary">{job.department}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                <Chip label={job.status} size="small" color={jobStatusColors[job.status] || 'default'} />
                <Chip label={job.priority} size="small" />
                <Chip label={job.type} size="small" variant="outlined" />
                <Chip label={job.level} size="small" variant="outlined" />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2">{job.location || 'Remote'}</Typography>
                  {job.remote && <Chip label="Remote OK" size="small" />}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney fontSize="small" color="action" />
                  <Typography variant="body2">{salaryText}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <People fontSize="small" color="action" />
                  <Typography variant="body2">{job.applicationCount || 0} applications</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Work fontSize="small" color="action" />
                  <Typography variant="body2">Headcount: {job.headcount}</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined" startIcon={<Edit />}
                  onClick={() => navigate(`/jobs/${id}/edit`)}>Edit</Button>
                <Button size="small" variant="outlined" color="error" startIcon={<Delete />}
                  onClick={handleDelete}>Delete</Button>
              </Box>
            </CardContent>
          </Card>

          {stats && (
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Application Funnel</Typography>
                {funnelItems.map(item => (
                  <Box key={item.label} sx={{ mb: 1.2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                      <Typography variant="caption">{item.label}</Typography>
                      <Typography variant="caption" fontWeight={600}>{item.value}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(item.value / maxFunnel) * 100}
                      sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0' }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right: tabs */}
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
                <Tab label="Description" />
                <Tab label={`Applications (${applications.length})`} />
              </Tabs>
            </Box>
            <CardContent>
              {tab === 0 && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                    {job.description}
                  </Typography>

                  {job.responsibilities?.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Responsibilities</Typography>
                      <List dense>
                        {job.responsibilities.map((r, i) => (
                          <ListItem key={i} sx={{ py: 0.2 }}>
                            <ListItemIcon sx={{ minWidth: 24 }}><CheckCircle sx={{ fontSize: 14 }} color="success" /></ListItemIcon>
                            <ListItemText primary={r} primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}

                  {job.requirements?.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>Requirements</Typography>
                      <List dense>
                        {job.requirements.map((r, i) => (
                          <ListItem key={i} sx={{ py: 0.2 }}>
                            <ListItemIcon sx={{ minWidth: 24 }}><CheckCircle sx={{ fontSize: 14 }} color="primary" /></ListItemIcon>
                            <ListItemText primary={r} primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}

                  {job.skills?.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>Skills</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {job.skills.map(s => <Chip key={s} label={s} size="small" variant="outlined" />)}
                      </Box>
                    </>
                  )}

                  {job.benefits?.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>Benefits</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {job.benefits.map(b => <Chip key={b} label={b} size="small" color="success" variant="outlined" />)}
                      </Box>
                    </>
                  )}
                </Box>
              )}

              {tab === 1 && (
                <Box>
                  {applications.length === 0 ? (
                    <Typography color="text.secondary">No applications for this job yet.</Typography>
                  ) : (
                    // INTENTIONAL ISSUE: Duplicated table from CandidateDetailPage — same structure
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': { fontWeight: 600 } }}>
                            <TableCell>Candidate</TableCell>
                            <TableCell>Title</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Applied</TableCell>
                            <TableCell>Rating</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {applications.map(app => (
                            <TableRow key={app._id} hover>
                              <TableCell>
                                <Typography variant="body2">
                                  {app.candidate?.firstName} {app.candidate?.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {app.candidate?.email}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">{app.candidate?.currentTitle || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={appStatusLabels[app.status] || app.status} size="small"
                                  color={appStatusColors[app.status] || 'default'} />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  {new Date(app.appliedAt).toLocaleDateString()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">{app.rating ? `${app.rating}/5` : '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Button size="small" onClick={() => navigate(`/applications/${app._id}`)}>View</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
