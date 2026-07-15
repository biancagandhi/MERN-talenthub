import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Chip, Avatar, IconButton, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Tooltip, CircularProgress, Menu, Divider, Grid, Pagination, Stack
} from '@mui/material'
import {
  Search, PersonAdd, Edit, Delete, Visibility, MoreVert,
  FilterList, Clear,
} from '@mui/icons-material'
import { candidatesApi } from '../api'
import EmptyState from '../components/common/EmptyState'

// INTENTIONAL ISSUE: Entire page is one massive component (~400 lines)
// INTENTIONAL ISSUE: All data fetched and stored in component state — no global state
// INTENTIONAL ISSUE: API call inside component (not in a custom hook)
// INTENTIONAL ISSUE: Search fires on every keystroke — no debounce
// INTENTIONAL ISSUE: No pagination — all 2000 candidates loaded at once
// INTENTIONAL ISSUE: No memoization on filtered list
// INTENTIONAL ISSUE: No empty state when no results found
// INTENTIONAL ISSUE: No loading skeleton

const STATUS_OPTIONS = ['active', 'inactive', 'hired', 'rejected', 'blacklisted']
const SOURCE_OPTIONS = ['linkedin', 'referral', 'website', 'job_board', 'agency', 'other']
const AVAILABILITY_OPTIONS = ['immediate', '2_weeks', '1_month', '3_months', 'negotiable']

const statusColors = {
  active: 'success', inactive: 'default', hired: 'primary',
  rejected: 'error', blacklisted: 'warning',
}

const availabilityLabels = {
  immediate: 'Immediate', '2_weeks': '2 Weeks', '1_month': '1 Month',
  '3_months': '3 Months', negotiable: 'Negotiable',
}

export default function CandidatesPage() {
  const navigate = useNavigate()

  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [skillsFilter, setSkillsFilter] = useState('')
  const [minExp, setMinExp] = useState(1)
  const [maxExp, setMiaxExp] = useState(50)
  const [sourceFilter, setSourceFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [pagination,setPagination] = useState({currentPage:1, totalPages:1, totalItems:0});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(()=>{
    const timer = setTimeout(()=>{
      setDebouncedSearch(searchQuery);
    },1000)
    return ()=>clearTimeout(timer);
  },[searchQuery]);//waits 500ms after typing stops

  // INTENTIONAL ISSUE: Fetch runs in useEffect inside the component
  useEffect(() => {
    fetchCandidates()
  }, [page, limit, debouncedSearch, statusFilter, sourceFilter, skillsFilter, minExp, maxExp]);

   const fetchCandidates = async () => {
      try {
        setLoading(true)
        let response;
        const hasFilters = debouncedSearch || statusFilter || sourceFilter || skillsFilter || minExp!==1 || maxExp!==50;
        if(hasFilters){
          response = await candidatesApi.search({
            q:debouncedSearch,
            status:statusFilter,
            source:sourceFilter,
            skills:skillsFilter, minExp, maxExp, page,limit
          })
        } else{
          response = await candidatesApi.getAll(page,limit);
          console.log("response",response.data)
        }
        // const { data } = await candidatesApi.getAll(page,limit)
        // console.log("data",data);
        setCandidates(response.data.data);
        setPagination(response.data.pagination);
      } catch (err) {
        console.error(err)
        // INTENTIONAL ISSUE: No error state set — user sees empty list
        toast.error('Unable to load candidates')
      } finally {
        setLoading(false)
      }
    }



  // INTENTIONAL ISSUE: All filtering done client-side — no server-side search or pagination
  // INTENTIONAL ISSUE: This runs on every render with no useMemo
  // const getFilteredCandidates = () => {
  //   let result = [...candidates]

  //   // INTENTIONAL ISSUE: Search fires on every character change — no debounce
  //   if (searchQuery) {
  //     const q = searchQuery.toLowerCase()
  //     result = result.filter(c =>
  //       `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
  //       c.email.toLowerCase().includes(q) ||
  //       (c.currentTitle || '').toLowerCase().includes(q) ||
  //       (c.currentCompany || '').toLowerCase().includes(q) ||
  //       (c.skills || []).some(s => s.toLowerCase().includes(q))
  //     )
  //   }

  //   if (statusFilter) {
  //     result = result.filter(c => c.status === statusFilter)
  //   }

  //   if (sourceFilter) {
  //     result = result.filter(c => c.source === sourceFilter)
  //   }

  //   // INTENTIONAL ISSUE: Sorting also done client-side
  //   result.sort((a, b) => {
  //     let aVal = a[sortBy]
  //     let bVal = b[sortBy]
  //     if (sortBy === 'name') {
  //       aVal = `${a.firstName} ${a.lastName}`
  //       bVal = `${b.firstName} ${b.lastName}`
  //     }
  //     if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
  //       return sortOrder === 'asc'
  //         ? new Date(aVal) - new Date(bVal)
  //         : new Date(bVal) - new Date(aVal)
  //     }
  //     if (typeof aVal === 'string') {
  //       return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
  //     }
  //     return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  //   })

  //   return result
  // }

  // const filtered = getFilteredCandidates()

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this candidate?')) return
    setDeleteLoading(true)
    try {
      await candidatesApi.delete(id)
      setCandidates(prev => prev.filter(c => c._id !== id))
    } catch (err) {
      console.error(err)
      // alert('Failed to delete candidate')
      toast.error('Could not delete candidate')
    } finally {
      setDeleteLoading(false)
      setAnchorEl(null)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setSourceFilter('')
  }

  const hasFilters = searchQuery || statusFilter || sourceFilter

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5">Candidates</Typography>
          <Typography variant="body2" color="text.secondary">
            {/* {loading ? '...' : `${filtered.length.toLocaleString()} of ${candidates?.pagination?.totalPages ?? 0} candidates`} */}
            <stack direction='row' justifyContent='center'>

              <Pagination
                page={page}
                count={pagination?.totalPages}
                color='primary'
                onChange={(e, v) => {
                  setPage(v);
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </stack>
            Showing {(page-1)* limit+1}-{Math.min(page*limit, pagination?.totalItems)} of { " "}
            {pagination?.totalItems} Candidates
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => navigate('/candidates/new')}>
          Add Candidate
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              {/* INTENTIONAL ISSUE: No debounce on search — fires API filtering on every keystroke */}
              <TextField
                fullWidth
                size="small"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                  <MenuItem value="">All</MenuItem>
                  {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} label="Source">
                  <MenuItem value="">All</MenuItem>
                  {SOURCE_OPTIONS.map(s => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort by</InputLabel>
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Sort by">
                  <MenuItem value="createdAt">Date Added</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="experienceYears">Experience</MenuItem>
                  <MenuItem value="updatedAt">Last Updated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant={sortOrder === 'asc' ? 'contained' : 'outlined'}
                  onClick={() => setSortOrder('asc')}
                >Asc</Button>
                <Button
                  size="small"
                  variant={sortOrder === 'desc' ? 'contained' : 'outlined'}
                  onClick={() => setSortOrder('desc')}
                >Desc</Button>
                {hasFilters && (
                  <Tooltip title="Clear filters">
                    <IconButton size="small" onClick={clearFilters}><Clear /></IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: '#f8fafc' } }}>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Title / Company</TableCell>
                  <TableCell>Skills</TableCell>
                  <TableCell>Experience</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Available</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* INTENTIONAL ISSUE: Renders ALL filtered records — no pagination */}
                {Array.isArray(candidates)&& candidates.length>0 && candidates.map((candidate) => (
                  <TableRow
                    key={candidate._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/candidates/${candidate._id}`)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, fontSize: 13, bgcolor: '#e0e7ff', color: '#6366f1' }}>
                          {candidate.firstName?.charAt(0)}{candidate.lastName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {candidate.firstName} {candidate.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {candidate.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{candidate.currentTitle || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{candidate.currentCompany || ''}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
                        {(candidate.skills || []).slice(0, 3).map(skill => (
                          <Chip key={skill} label={skill} size="small" sx={{ fontSize: 10 }} />
                        ))}
                        {(candidate.skills || []).length > 3 && (
                          <Chip label={`+${candidate.skills.length - 3}`} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{candidate.experienceYears}y</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={candidate.status}
                        size="small"
                        color={statusColors[candidate.status] || 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {(candidate.source || '').replace('_', ' ')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {availabilityLabels[candidate.availability] || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigate(`/candidates/${candidate._id}`)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => navigate(`/candidates/${candidate._id}/edit`)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(candidate._id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ) )}
              </TableBody>
            </Table>
            {/* INTENTIONAL ISSUE: No empty state component — just an empty table */}
            {Array.isArray(candidates) && candidates.length === 0 && !loading && (
              // <Box sx={{ py: 6, textAlign: 'center' }}>
              //   <Typography color="text.secondary">No candidates found.</Typography>
              // </Box>
              <EmptyState title="No Candidate Found" message="No Candidates match your current search."/>
            )}
          </TableContainer>
        )}
      </Card>
    </Box>
  )
}
