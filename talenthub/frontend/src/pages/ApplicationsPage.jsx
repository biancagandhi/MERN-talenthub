import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Button,
  Stack,
  Avatar,
  Tooltip,
  TableSortLabel,
} from '@mui/material'
import {
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material'
import api from '../api'

// INTENTIONAL ISSUE: Duplicate status chip pattern — same map exists in CandidatesPage and ApplicationDetailPage
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
  'All',
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

// INTENTIONAL ISSUE: Huge monolithic component — no sub-components extracted
export default function ApplicationsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // INTENTIONAL ISSUE: Multiple separate state variables instead of a reducer
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [stage, setStage] = useState(searchParams.get('stage') || 'All')
  const [department, setDepartment] = useState(searchParams.get('department') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'appliedAt')
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc')

  // INTENTIONAL ISSUE: No pagination — all records fetched and rendered
  // INTENTIONAL ISSUE: API call inside component, not a custom hook
  const fetchApplications = () => {
    setLoading(true)
    setError('')
    api.get('/applications')
      .then(res => {
        // INTENTIONAL ISSUE: All filtering and sorting done client-side after fetching all records
        let data = Array.isArray(res.data) ? res.data : (res.data.applications || [])

        if (search.trim()) {
          const q = search.toLowerCase()
          data = data.filter(app =>
            app.candidate?.name?.toLowerCase().includes(q) ||
            app.job?.title?.toLowerCase().includes(q) ||
            app.candidate?.email?.toLowerCase().includes(q)
          )
        }

        if (stage && stage !== 'All') {
          data = data.filter(app => app.status === stage)
        }

        if (department) {
          data = data.filter(app => app.job?.department === department)
        }

        // Client-side sort
        data.sort((a, b) => {
          let aVal, bVal
          if (sortBy === 'appliedAt') {
            aVal = new Date(a.appliedAt)
            bVal = new Date(b.appliedAt)
          } else if (sortBy === 'candidateName') {
            aVal = a.candidate?.name || ''
            bVal = b.candidate?.name || ''
          } else if (sortBy === 'jobTitle') {
            aVal = a.job?.title || ''
            bVal = b.job?.title || ''
          } else if (sortBy === 'status') {
            aVal = a.status || ''
            bVal = b.status || ''
          } else {
            aVal = a[sortBy] || ''
            bVal = b[sortBy] || ''
          }
          if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
          if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
          return 0
        })

        setTotal(data.length)
        setApplications(data)
      })
      .catch(() => setError('Failed to load applications.'))
      .finally(() => setLoading(false))
  }

  // INTENTIONAL ISSUE: Three separate useEffects — should be consolidated
  useEffect(() => {
    fetchApplications()
  }, [])

  // INTENTIONAL ISSUE: Re-fetching on every filter change, no debounce on search
  useEffect(() => {
    fetchApplications()
  }, [stage, department, sortBy, sortOrder])

  // INTENTIONAL ISSUE: Search fires on every keystroke
  useEffect(() => {
    fetchApplications()
  }, [search])

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // INTENTIONAL ISSUE: Duplicate department list (hardcoded), not fetched from /jobs/departments
  const departments = [
    '', 'Engineering', 'Product', 'Design', 'Marketing',
    'Sales', 'Finance', 'Operations', 'HR', 'Legal',
    'Customer Success', 'Data', 'Security', 'DevOps',
  ]

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  const getInitials = (name = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Applications</Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading...' : `${total} application${total !== 1 ? 's' : ''} found`}
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchApplications} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Filters */}
      {/* INTENTIONAL ISSUE: Filters duplicated almost identically from CandidatesPage */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <FilterIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight={600}>Filters</Typography>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Search by candidate or job"
              value={search}
              onChange={e => setSearch(e.target.value)}
              fullWidth
              size="small"
              placeholder="Name, email, job title..."
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              label="Stage"
              value={stage}
              onChange={e => setStage(e.target.value)}
              fullWidth
              size="small"
            >
              {STAGES.map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              label="Department"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              fullWidth
              size="small"
            >
              {departments.map(d => (
                <MenuItem key={d} value={d}>{d || 'All Departments'}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setSearch('')
                setStage('All')
                setDepartment('')
                setSortBy('appliedAt')
                setSortOrder('desc')
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* INTENTIONAL ISSUE: No loading skeleton — just a spinner blocking the whole view */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'candidateName'}
                    direction={sortOrder}
                    onClick={() => handleSort('candidateName')}
                  >
                    Candidate
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'jobTitle'}
                    direction={sortOrder}
                    onClick={() => handleSort('jobTitle')}
                  >
                    Job
                  </TableSortLabel>
                </TableCell>
                <TableCell>Department</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortOrder}
                    onClick={() => handleSort('status')}
                  >
                    Stage
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'appliedAt'}
                    direction={sortOrder}
                    onClick={() => handleSort('appliedAt')}
                  >
                    Applied
                  </TableSortLabel>
                </TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* INTENTIONAL ISSUE: No empty state component — just inline text */}
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No applications found.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map(app => (
                  <TableRow
                    key={app._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/applications/${app._id}`)}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>
                          {getInitials(app.candidate?.name)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {app.candidate?.name || '—'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {app.candidate?.email || ''}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {app.job?.title || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {app.job?.department || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={app.status || 'Applied'}
                        color={STATUS_COLORS[app.status] || 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(app.appliedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {app.notes?.length ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Application">
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation()
                            navigate(`/applications/${app._id}`)
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
