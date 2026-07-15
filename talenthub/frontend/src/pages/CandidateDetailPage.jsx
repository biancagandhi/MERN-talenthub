import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Button, Chip, Avatar,
  Grid, Divider, Tabs, Tab, CircularProgress, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Rating, Tooltip,
  Alert,
} from '@mui/material'
import {
  Edit, Delete, ArrowBack, Email, Phone, LinkedIn,
  GitHub, Work, School, LocationOn, AttachMoney, Star,
  Add, CalendarToday,
} from '@mui/icons-material'
import { candidatesApi, applicationsApi, notesApi, jobsApi } from '../api'

// INTENTIONAL ISSUE: Giant page component — detail view, applications tab, notes tab,
// modals for new application and new note — all in one file
// INTENTIONAL ISSUE: Multiple separate API calls made sequentially, not in parallel
// INTENTIONAL ISSUE: Repeated table structures that could be shared components
// INTENTIONAL ISSUE: No error handling UI — errors go to console only

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

const candidateStatusColors = {
  active: 'success', inactive: 'default', hired: 'primary',
  rejected: 'error', blacklisted: 'warning',
}

function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
      <Box sx={{ color: 'text.secondary', mt: 0.2, flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
        <Typography variant="body2">{value}</Typography>
      </Box>
    </Box>
  )
}

export default function CandidateDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [candidate, setCandidate] = useState(null)
  const [applications, setApplications] = useState([])
  const [notes, setNotes] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)

  // New application modal state
  const [appModalOpen, setAppModalOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [submittingApp, setSubmittingApp] = useState(false)

  // New note modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [noteForm, setNoteForm] = useState({
    type: 'general', summary: '', technicalScore: 0, communicationScore: 0,
    culturalFitScore: 0, overallScore: 0, recommendation: 'neutral',
    strengths: '', weaknesses: '',
  })
  const [submittingNote, setSubmittingNote] = useState(false)

  // INTENTIONAL ISSUE: Four separate sequential API calls — should be parallelized
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true)
        const { data: c } = await candidatesApi.getById(id)
        setCandidate(c)

        const { data: apps } = await candidatesApi.getApplications(id)
        setApplications(apps)

        const { data: n } = await candidatesApi.getNotes(id)
        setNotes(n)

        const { data: j } = await jobsApi.getAll({ status: 'open' })
        setJobs(Array.isArray(j) ? j : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('Delete this candidate? This cannot be undone.')) return
    try {
      await candidatesApi.delete(id)
      navigate('/candidates')
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddApplication = async () => {
    if (!selectedJobId) return
    setSubmittingApp(true)
    try {
      const { data } = await applicationsApi.create({
        candidateId: id,
        jobId: selectedJobId,
        coverLetter,
      })
      setApplications(prev => [data, ...prev])
      setAppModalOpen(false)
      setSelectedJobId('')
      setCoverLetter('')
    } catch (err) {
      console.error(err)
      alert('Failed to create application')
    } finally {
      setSubmittingApp(false)
    }
  }

  const handleAddNote = async () => {
    if (!applications.length) return
    setSubmittingNote(true)
    try {
      const appId = applications[0]._id
      const jobId = applications[0].job?._id || applications[0].job
      const { data } = await notesApi.create({
        applicationId: appId,
        candidateId: id,
        jobId,
        ...noteForm,
        strengths: noteForm.strengths.split('\n').filter(Boolean),
        weaknesses: noteForm.weaknesses.split('\n').filter(Boolean),
      })
      setNotes(prev => [data, ...prev])
      setNoteModalOpen(false)
      setNoteForm({
        type: 'general', summary: '', technicalScore: 0, communicationScore: 0,
        culturalFitScore: 0, overallScore: 0, recommendation: 'neutral',
        strengths: '', weaknesses: '',
      })
    } catch (err) {
      console.error(err)
      alert('Failed to add note')
    } finally {
      setSubmittingNote(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!candidate) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Candidate not found.</Alert>
      </Box>
    )
  }

  const salaryFormatted = (n) =>
    n ? `$${(n / 1000).toFixed(0)}k` : '—'

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/candidates')} size="small">
          <ArrowBack />
        </IconButton>
        <Typography variant="body2" color="text.secondary">Candidates /</Typography>
        <Typography variant="body2">
          {candidate.firstName} {candidate.lastName}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left panel — profile */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', pt: 3, pb: 2 }}>
              <Avatar sx={{ width: 72, height: 72, mx: 'auto', mb: 1.5, fontSize: 28, bgcolor: '#6366f1' }}>
                {candidate.firstName?.charAt(0)}{candidate.lastName?.charAt(0)}
              </Avatar>
              <Typography variant="h6">{candidate.firstName} {candidate.lastName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {candidate.currentTitle || 'No title'}
              </Typography>
              <Chip
                label={candidate.status}
                size="small"
                color={candidateStatusColors[candidate.status] || 'default'}
                sx={{ mb: 1.5 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => navigate(`/candidates/${id}/edit`)}
                >
                  Edit
                </Button>
                <Button size="small" variant="outlined" color="error" startIcon={<Delete />} onClick={handleDelete}>
                  Delete
                </Button>
              </Box>
            </CardContent>

            <Divider />

            <CardContent>
              <InfoRow icon={<Email fontSize="small" />} label="Email" value={candidate.email} />
              <InfoRow icon={<Phone fontSize="small" />} label="Phone" value={candidate.phone} />
              <InfoRow
                icon={<LocationOn fontSize="small" />}
                label="Location"
                value={[candidate.location?.city, candidate.location?.state, candidate.location?.country].filter(Boolean).join(', ')}
              />
              <InfoRow icon={<Work fontSize="small" />} label="Company" value={candidate.currentCompany} />
              <InfoRow icon={<School fontSize="small" />} label="Education"
                value={candidate.education?.degree ? `${candidate.education.degree} in ${candidate.education.field}` : null}
              />
              <InfoRow
                icon={<AttachMoney fontSize="small" />}
                label="Expected Salary"
                value={salaryFormatted(candidate.salary?.expected)}
              />
              <InfoRow icon={<CalendarToday fontSize="small" />} label="Experience"
                value={`${candidate.experienceYears} years`}
              />

              {candidate.linkedinUrl && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LinkedIn fontSize="small" color="action" />
                  <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
                    LinkedIn Profile
                  </a>
                </Box>
              )}
              {candidate.githubUrl && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <GitHub fontSize="small" color="action" />
                  <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
                    GitHub Profile
                  </a>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Skills</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(candidate.skills || []).map(skill => (
                  <Chip key={skill} label={skill} size="small" variant="outlined" />
                ))}
              </Box>

              {candidate.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Notes</Typography>
                  <Typography variant="body2" color="text.secondary">{candidate.notes}</Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right panel — tabs */}
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
                <Tab label={`Applications (${applications.length})`} />
                <Tab label={`Interview Notes (${notes.length})`} />
              </Tabs>
            </Box>

            <CardContent>
              {tab === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>Applications</Typography>
                    <Button size="small" startIcon={<Add />} variant="outlined" onClick={() => setAppModalOpen(true)}>
                      Add Application
                    </Button>
                  </Box>

                  {/* INTENTIONAL ISSUE: Duplicate table structure — same as in JobDetailPage */}
                  {applications.length === 0 ? (
                    <Typography color="text.secondary">No applications yet.</Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': { fontWeight: 600 } }}>
                            <TableCell>Job</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Applied</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {applications.map(app => (
                            <TableRow key={app._id} hover>
                              <TableCell>
                                <Typography variant="body2">{app.job?.title || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">{app.job?.department || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={statusLabels[app.status] || app.status}
                                  size="small"
                                  color={statusColors[app.status] || 'default'}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  {new Date(app.appliedAt).toLocaleDateString()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Button size="small" onClick={() => navigate(`/applications/${app._id}`)}>
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {tab === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>Interview Notes</Typography>
                    {applications.length > 0 && (
                      <Button size="small" startIcon={<Add />} variant="outlined" onClick={() => setNoteModalOpen(true)}>
                        Add Note
                      </Button>
                    )}
                  </Box>

                  {notes.length === 0 ? (
                    <Typography color="text.secondary">No interview notes yet.</Typography>
                  ) : (
                    notes.map(note => (
                      <Card key={note._id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle2">{note.type?.replace('_', ' ')}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                by {note.interviewer?.name} • {new Date(note.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Chip
                                label={note.recommendation?.replace('_', ' ')}
                                size="small"
                                color={['strong_yes', 'yes'].includes(note.recommendation) ? 'success' : ['no', 'strong_no'].includes(note.recommendation) ? 'error' : 'default'}
                              />
                            </Box>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1.5 }}>{note.summary}</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">Technical</Typography>
                              <Rating value={note.technicalScore / 2} precision={0.5} size="small" readOnly />
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">Communication</Typography>
                              <Rating value={note.communicationScore / 2} precision={0.5} size="small" readOnly />
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">Culture Fit</Typography>
                              <Rating value={note.culturalFitScore / 2} precision={0.5} size="small" readOnly />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Application Modal */}
      <Dialog open={appModalOpen} onClose={() => setAppModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Application</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel>Select Job</InputLabel>
            <Select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} label="Select Job">
              {jobs.map(job => (
                <MenuItem key={job._id} value={job._id}>
                  {job.title} — {job.department}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Cover Letter (optional)"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddApplication} disabled={!selectedJobId || submittingApp}>
            {submittingApp ? <CircularProgress size={18} /> : 'Add Application'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Note Modal */}
      <Dialog open={noteModalOpen} onClose={() => setNoteModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Interview Note</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Interview Type</InputLabel>
                <Select value={noteForm.type} onChange={(e) => setNoteForm(p => ({ ...p, type: e.target.value }))} label="Interview Type">
                  {['phone_screen','technical','cultural_fit','final','general'].map(t => (
                    <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Recommendation</InputLabel>
                <Select value={noteForm.recommendation} onChange={(e) => setNoteForm(p => ({ ...p, recommendation: e.target.value }))} label="Recommendation">
                  {['strong_yes','yes','neutral','no','strong_no'].map(r => (
                    <MenuItem key={r} value={r}>{r.replace('_', ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={3} size="small" label="Summary"
                value={noteForm.summary}
                onChange={(e) => setNoteForm(p => ({ ...p, summary: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption">Technical Score: {noteForm.technicalScore}/10</Typography>
              <Rating max={10} value={noteForm.technicalScore} onChange={(_, v) => setNoteForm(p => ({ ...p, technicalScore: v }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption">Communication: {noteForm.communicationScore}/10</Typography>
              <Rating max={10} value={noteForm.communicationScore} onChange={(_, v) => setNoteForm(p => ({ ...p, communicationScore: v }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption">Culture Fit: {noteForm.culturalFitScore}/10</Typography>
              <Rating max={10} value={noteForm.culturalFitScore} onChange={(_, v) => setNoteForm(p => ({ ...p, culturalFitScore: v }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth multiline rows={2} size="small" label="Strengths (one per line)"
                value={noteForm.strengths}
                onChange={(e) => setNoteForm(p => ({ ...p, strengths: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth multiline rows={2} size="small" label="Weaknesses (one per line)"
                value={noteForm.weaknesses}
                onChange={(e) => setNoteForm(p => ({ ...p, weaknesses: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddNote} disabled={!noteForm.summary || submittingNote}>
            {submittingNote ? <CircularProgress size={18} /> : 'Add Note'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
