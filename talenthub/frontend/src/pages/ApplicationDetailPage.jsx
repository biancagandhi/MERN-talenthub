import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Stack,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import api from '../api'
import { useAuth } from '../context/AuthContext'

// INTENTIONAL ISSUE: Duplicate STATUS_COLORS map — identical to ApplicationsPage and CandidatesPage
const STATUS_COLORS = {
  Applied: 'default',
  Screening: 'info',
  Interview: 'primary',
  'Technical Test': 'secondary',
  'Final Round': 'warning',
  Offered: 'success',
  Hired: 'success',
  Rejected: 'error',
  Withdrawn: 'default',
}

const STAGES = [
  'Applied',
  'Screening',
  'Interview',
  'Technical Test',
  'Final Round',
  'Offered',
  'Hired',
  'Rejected',
  'Withdrawn',
]

const NOTE_TYPES = ['General', 'Technical', 'Behavioural', 'Culture Fit', 'Reference', 'Offer']
const RATINGS = [1, 2, 3, 4, 5]

// INTENTIONAL ISSUE: Massive single-file component — should be split into ApplicationHeader,
// StatusPanel, NoteList, NoteForm sub-components + custom hooks
export default function ApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // INTENTIONAL ISSUE: Multiple parallel state blobs — no useReducer, no data-fetching library
  const [application, setApplication] = useState(null)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [notesLoading, setNotesLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusUpdating, setStatusUpdating] = useState(false)

  // Note form state — not abstracted into a hook or sub-component
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState('General')
  const [noteRating, setNoteRating] = useState('')
  const [notePrivate, setNotePrivate] = useState(false)
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [noteError, setNoteError] = useState('')
  const [noteSuccess, setNoteSuccess] = useState('')

  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editNoteText, setEditNoteText] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // INTENTIONAL ISSUE: API call inside component — should be a custom hook
  // INTENTIONAL ISSUE: No cleanup / AbortController
  const fetchApplication = () => {
    setLoading(true)
    api.get(`/applications/${id}`)
      .then(res => {
        setApplication(res.data)
        setError('')
      })
      .catch(() => setError('Failed to load application.'))
      .finally(() => setLoading(false))
  }

  // INTENTIONAL ISSUE: Separate fetch for notes instead of including in application response
  const fetchNotes = () => {
    setNotesLoading(true)
    api.get(`/notes?application=${id}`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.notes || [])
        setNotes(data)
      })
      .catch(() => {})
      .finally(() => setNotesLoading(false))
  }

  // INTENTIONAL ISSUE: Two separate useEffects that could be combined
  useEffect(() => {
    fetchApplication()
  }, [id])

  useEffect(() => {
    fetchNotes()
  }, [id])

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true)
    try {
      const res = await api.patch(`/applications/${id}/status`, { status: newStatus })
      setApplication(prev => ({ ...prev, status: res.data.status }))
    } catch {
      // INTENTIONAL ISSUE: Error silently swallowed — no user feedback on status update failure
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      setNoteError('Note content is required.')
      return
    }
    setNoteError('')
    setNoteSuccess('')
    setNoteSubmitting(true)
    try {
      const payload = {
        application: id,
        candidate: application?.candidate?._id,
        content: noteText,
        type: noteType,
        rating: noteRating ? Number(noteRating) : undefined,
        isPrivate: notePrivate,
      }
      const res = await api.post('/notes', payload)
      setNotes(prev => [res.data, ...prev])
      setNoteText('')
      setNoteType('General')
      setNoteRating('')
      setNotePrivate(false)
      setNoteSuccess('Note added.')
      setTimeout(() => setNoteSuccess(''), 2000)
    } catch {
      setNoteError('Failed to add note.')
    } finally {
      setNoteSubmitting(false)
    }
  }

  const handleSaveEditNote = async (noteId) => {
    if (!editNoteText.trim()) return
    try {
      await api.put(`/notes/${noteId}`, { content: editNoteText })
      setNotes(prev => prev.map(n => n._id === noteId ? { ...n, content: editNoteText } : n))
      setEditingNoteId(null)
      setEditNoteText('')
    } catch {
      // INTENTIONAL ISSUE: Error silently swallowed
    }
  }

  const handleDeleteNote = async (noteId) => {
    try {
      await api.delete(`/notes/${noteId}`)
      setNotes(prev => prev.filter(n => n._id !== noteId))
      setDeleteConfirm(null)
    } catch {
      // INTENTIONAL ISSUE: Error silently swallowed
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getRatingLabel = (r) => {
    const labels = { 1: 'Poor', 2: 'Below Average', 3: 'Average', 4: 'Good', 5: 'Excellent' }
    return labels[r] || ''
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/applications')} sx={{ mb: 2 }}>
          Back to Applications
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!application) return null

  const candidate = application.candidate || {}
  const job = application.job || {}

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => navigate('/applications')}>
          <BackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h5" fontWeight={700}>
            {candidate.name || 'Unknown Candidate'} → {job.title || 'Unknown Job'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Applied {formatDate(application.appliedAt)}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 180 }} disabled={statusUpdating}>
          <InputLabel>Stage</InputLabel>
          <Select
            label="Stage"
            value={application.status || 'Applied'}
            onChange={e => handleStatusChange(e.target.value)}
          >
            {STAGES.map(s => (
              <MenuItem key={s} value={s}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={s}
                    color={STATUS_COLORS[s] || 'default'}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={4}>

          {/* Candidate Card */}
          <Paper sx={{ p: 3, mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                {getInitials(candidate.name)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>{candidate.name}</Typography>
                <Typography variant="body2" color="text.secondary">{candidate.email}</Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            {/* INTENTIONAL ISSUE: Duplicate field-row pattern — same layout as CandidateDetailPage */}
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Current Title</Typography>
                <Typography variant="body2">{candidate.currentTitle || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Company</Typography>
                <Typography variant="body2">{candidate.currentCompany || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Experience</Typography>
                <Typography variant="body2">{candidate.experienceYears != null ? `${candidate.experienceYears} yrs` : '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Location</Typography>
                <Typography variant="body2">{candidate.location || '—'}</Typography>
              </Box>
            </Stack>
            <Button
              component={RouterLink}
              to={`/candidates/${candidate._id}`}
              startIcon={<PersonIcon />}
              size="small"
              sx={{ mt: 2 }}
              fullWidth
              variant="outlined"
            >
              View Full Profile
            </Button>
          </Paper>

          {/* Job Card */}
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <WorkIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" fontWeight={600}>Job Details</Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Title</Typography>
                <Typography variant="body2">{job.title || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Department</Typography>
                <Typography variant="body2">{job.department || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Location</Typography>
                <Typography variant="body2">{job.location || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Type</Typography>
                <Typography variant="body2">{job.employmentType || '—'}</Typography>
              </Box>
              {job.salary?.min > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Salary Range</Typography>
                  <Typography variant="body2">
                    {job.salary.currency} {job.salary.min?.toLocaleString()} – {job.salary.max?.toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Stack>
            <Button
              component={RouterLink}
              to={`/jobs/${job._id}`}
              startIcon={<WorkIcon />}
              size="small"
              sx={{ mt: 2 }}
              fullWidth
              variant="outlined"
            >
              View Job Posting
            </Button>
          </Paper>
        </Grid>

        {/* Right Column — Notes */}
        <Grid item xs={12} md={8}>

          {/* Add Note */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Add Interview Note
            </Typography>

            {noteError && <Alert severity="error" sx={{ mb: 1.5 }}>{noteError}</Alert>}
            {noteSuccess && <Alert severity="success" sx={{ mb: 1.5 }}>{noteSuccess}</Alert>}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Note"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Add feedback, observations, or interview notes..."
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Type"
                  value={noteType}
                  onChange={e => setNoteType(e.target.value)}
                  fullWidth
                  size="small"
                >
                  {NOTE_TYPES.map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Rating"
                  value={noteRating}
                  onChange={e => setNoteRating(e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">No rating</MenuItem>
                  {RATINGS.map(r => (
                    <MenuItem key={r} value={r}>{r} — {getRatingLabel(r)}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Visibility"
                  value={notePrivate ? 'Private' : 'Team'}
                  onChange={e => setNotePrivate(e.target.value === 'Private')}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="Team">Visible to Team</MenuItem>
                  <MenuItem value="Private">Private (only me)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={noteSubmitting ? <CircularProgress size={16} /> : <AddIcon />}
                  onClick={handleAddNote}
                  disabled={noteSubmitting || !noteText.trim()}
                >
                  {noteSubmitting ? 'Saving...' : 'Add Note'}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Notes List */}
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Interview Notes ({notes.length})
          </Typography>

          {notesLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : notes.length === 0 ? (
            // INTENTIONAL ISSUE: No empty state UI component — just inline text
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No interview notes yet.</Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {notes.map(note => (
                <Card key={note._id} variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'secondary.main' }}>
                          {getInitials(note.author?.name || note.createdBy?.name || 'U')}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {note.author?.name || note.createdBy?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(note.createdAt)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Chip label={note.type || 'General'} size="small" variant="outlined" />
                        {note.rating && (
                          <Chip
                            label={`★ ${note.rating}`}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                        {note.isPrivate && (
                          <Chip label="Private" size="small" color="error" variant="outlined" />
                        )}
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingNoteId(note._id)
                              setEditNoteText(note.content)
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirm(note._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>

                    {editingNoteId === note._id ? (
                      <Box>
                        <TextField
                          value={editNoteText}
                          onChange={e => setEditNoteText(e.target.value)}
                          multiline
                          rows={3}
                          fullWidth
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleSaveEditNote(note._id)}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            onClick={() => setEditingNoteId(null)}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {note.content}
                      </Typography>
                    )}

                    {/* Delete Confirm */}
                    {deleteConfirm === note._id && (
                      <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'error.50', borderRadius: 1 }}>
                        <Typography variant="body2" mb={1}>
                          Delete this note? This cannot be undone.
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={() => handleDeleteNote(note._id)}
                          >
                            Delete
                          </Button>
                          <Button size="small" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                          </Button>
                        </Stack>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
