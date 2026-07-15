import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Chip, IconButton, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, CircularProgress, Grid,Pagination, Stack
} from '@mui/material'
import { Search, Add, Edit, Delete, Visibility, Clear } from '@mui/icons-material'
import { jobsApi } from '../api'
import EmptyState from '../components/common/EmptyState'

// INTENTIONAL ISSUE: Duplicate structure of CandidatesPage — same pattern copy-pasted
// INTENTIONAL ISSUE: All client-side filtering and sorting — no server-side search or pagination
// INTENTIONAL ISSUE: Department filter not connected to backend /jobs/departments endpoint
// INTENTIONAL ISSUE: No memoization — filterJobs() runs on every render

const STATUS_OPTIONS = ['draft', 'open', 'paused', 'closed', 'filled']
const TYPE_OPTIONS = ['full-time', 'part-time', 'contract', 'internship', 'freelance']
const LEVEL_OPTIONS = ['intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'director', 'vp']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent']

const statusColors = {
  draft: 'default', open: 'success', paused: 'warning',
  closed: 'error', filled: 'primary',
}

const priorityColors = {
  low: 'default', medium: 'info', high: 'warning', urgent: 'error',
}

export default function JobsPage() {
  const navigate = useNavigate()

  const [jobs, setJobs] = useState([])
  const [departments,setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
   const [debouncedSearch, setDebouncedSearch] = useState("");
     const [pagination,setPagination] = useState({currentPage:1, totalPages:1, totalItems:0});
     const [page, setPage] = useState(1);
     const [limit, setLimit] = useState(10);

  // INTENTIONAL ISSUE: Does NOT call /jobs/departments to populate the department dropdown dynamically
  // Department filter is missing — just a text search that users have to know the exact value for

    useEffect(()=>{
      const timer = setTimeout(()=>{
        setDebouncedSearch(searchQuery);
      },1000)
      return ()=>clearTimeout(timer);
    },[searchQuery]);//waits 500ms after typing stops

  useEffect(() => {
    const pageData = async()=>{
      setLoading(true);
      try{
        const jobRes= await jobsApi.getAll({q:debouncedSearch,status:statusFilter,department:departmentFilter,type:typeFilter,page,limit});
        console.log(jobRes)
        setJobs(Array.isArray(jobRes.data.data) ? jobRes.data.data : [])
        setPagination(jobRes.data.pagination)

        const {data} = await jobsApi.getDepartments();
        console.log(data)
        setDepartments(data)
      }catch(err){
        console.error(err)
        toast.error('unable to load jobs')
      } finally{
        setLoading(false);
      }
    }
    pageData()
  }, [debouncedSearch,statusFilter,departmentFilter,typeFilter,page,limit])

  // INTENTIONAL ISSUE: Heavy client-side filtering on every render, no memoization
  // const getFilteredJobs = () => {
  //   let result = [...jobs]

  //   if (searchQuery) {
  //     const q = searchQuery.toLowerCase()
  //     result = result.filter(j =>
  //       j.title.toLowerCase().includes(q) ||
  //       j.department.toLowerCase().includes(q) ||
  //       (j.location || '').toLowerCase().includes(q) ||
  //       (j.skills || []).some(s => s.toLowerCase().includes(q))
  //     )
  //   }

  //   if (statusFilter) {
  //     result = result.filter(j => j.status === statusFilter)
  //   }

  //   if (departmentFilter) {
  //     result = result.filter(j => j.department.toLowerCase().includes(departmentFilter.toLowerCase()))
  //   }

  //   if (typeFilter) {
  //     result = result.filter(j => j.type === typeFilter)
  //   }

  //   result.sort((a, b) => {
  //     let aVal = a[sortBy], bVal = b[sortBy]
  //     if (sortBy === 'createdAt' || sortBy === 'applicationDeadline') {
  //       return sortOrder === 'asc' ? new Date(aVal) - new Date(bVal) : new Date(bVal) - new Date(aVal)
  //     }
  //     if (typeof aVal === 'string') {
  //       return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
  //     }
  //     return sortOrder === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0)
  //   })

  //   return result
  // }

  // const filtered = getFilteredJobs()

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job posting?')) return
    try {
      await jobsApi.delete(id)
      setJobs(prev => prev.filter(j => j._id !== id))
    } catch (err) {
      console.error(err)
      // alert('Failed to delete job')
      toast.error('failed to delete job')
    }
  }

  const hasFilters = searchQuery || statusFilter || departmentFilter || typeFilter

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5">Jobs</Typography>
          <Typography variant="body2" color="text.secondary">
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
                        {pagination?.totalItems} positions
            {/* {loading ? '...' : `${filtered.length} of ${jobs.length} positions`} */}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/jobs/new')}>
          Post Job
        </Button>
      </Box>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth size="small" placeholder="Search jobs..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
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
              {/* INTENTIONAL ISSUE: Department filter is just a freetext field — not populated from API */}
              {/* <TextField
                fullWidth size="small" label="Department" placeholder="e.g. Engineering"
                value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}
              /> */}
               <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select value={departmentFilter} onChange={(e)=>setDepartmentFilter(e.target.value)} label='Department'>
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept)=>(<MenuItem key={dept} value={dept}>{dept}</MenuItem>))}
              </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="Type">
                  <MenuItem value="">All</MenuItem>
                  {TYPE_OPTIONS.map(t => <MenuItem key={t} value={t}>{t.replace('-', ' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort by</InputLabel>
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Sort by">
                  <MenuItem value="createdAt">Date Posted</MenuItem>
                  <MenuItem value="title">Title</MenuItem>
                  <MenuItem value="applicationCount">Applications</MenuItem>
                  <MenuItem value="applicationDeadline">Deadline</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {['asc','desc'].map(o => (
                  <Button key={o} size="small" variant={sortOrder === o ? 'contained' : 'outlined'}
                    onClick={() => setSortOrder(o)} sx={{ minWidth: 36, px: 0.5 }}>
                    {o === 'asc' ? '↑' : '↓'}
                  </Button>
                ))}
                {hasFilters && (
                  <Tooltip title="Clear">
                    <IconButton size="small" onClick={() => { setSearchQuery(''); setStatusFilter(''); setDepartmentFilter(''); setTypeFilter('') }}>
                      <Clear />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
                  <TableCell>Job Title</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Type / Level</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Salary</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* INTENTIONAL ISSUE: No pagination — all jobs rendered */}
                {jobs.map((job) => (
                  <TableRow key={job._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${job._id}`)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{job.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{job.department}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{job.location || '—'}</Typography>
                      {job.remote && <Chip label="Remote" size="small" sx={{ ml: 0.5, fontSize: 9 }} />}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">{job.type}</Typography>
                      <Typography variant="caption" color="text.secondary">{job.level}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={job.status} size="small" color={statusColors[job.status] || 'default'} />
                    </TableCell>
                    <TableCell>
                      <Chip label={job.priority} size="small" color={priorityColors[job.priority] || 'default'} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{(job.applicationCount || 0).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      {job.salary?.isPublic ? (
                        <Typography variant="caption">
                          ${(job.salary.min / 1000).toFixed(0)}k–${(job.salary.max / 1000).toFixed(0)}k
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Confidential</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigate(`/jobs/${job._id}`)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => navigate(`/jobs/${job._id}/edit`)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(job._id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {jobs.length === 0 && !loading && (
              // <Box sx={{ py: 6, textAlign: 'center' }}>
              //   <Typography color="text.secondary">No jobs found.</Typography>
              // </Box>
              <EmptyState title='No Jobs Found' message='no jobs match your current filters'/>
            )}
          </TableContainer>
        )}
      </Card>
    </Box>
  )
}
