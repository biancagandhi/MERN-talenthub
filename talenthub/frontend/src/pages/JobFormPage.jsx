import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material'
import api from '../api'

// INTENTIONAL ISSUE: Huge monolithic form component — no sub-components, no custom hooks
// INTENTIONAL ISSUE: No form library (react-hook-form, formik), manual state management
// INTENTIONAL ISSUE: Form state is a flat object manually mapped from nested API response

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Finance',
  'Operations',
  'HR',
  'Legal',
  'Customer Success',
  'Data',
  'Security',
  'DevOps',
]

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead', 'Principal', 'Director']
const LOCATIONS = ['Remote', 'Hybrid', 'On-site']

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++',
  'React', 'Vue', 'Angular', 'Node.js', 'Express', 'FastAPI', 'Django',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  'GraphQL', 'REST', 'gRPC', 'Kafka', 'RabbitMQ',
  'Machine Learning', 'Data Science', 'Spark', 'Airflow',
  'Figma', 'Product Management', 'Agile', 'Scrum',
]

export default function JobFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  // INTENTIONAL ISSUE: Flat manual form state — deeply nested data has to be manually mapped
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [location, setLocation] = useState('')
  const [employmentType, setEmploymentType] = useState('Full-time')
  const [experienceLevel, setExperienceLevel] = useState('Mid')
  const [minExp, setMinExp] = useState('')
  const [maxExp, setMaxExp] = useState('')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [salaryCurrency, setSalaryCurrency] = useState('USD')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [responsibilities, setResponsibilities] = useState('')
  const [benefits, setBenefits] = useState('')
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [openings, setOpenings] = useState(1)
  const [status, setStatus] = useState('Open')
  const [remoteAllowed, setRemoteAllowed] = useState(false)

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // INTENTIONAL ISSUE: API call inside component, not a custom hook
  // INTENTIONAL ISSUE: No cleanup / cancellation on unmount
  useEffect(() => {
    if (isEdit) {
      setFetchLoading(true)
      api.get(`/jobs/${id}`)
        .then(res => {
          const job = res.data
          // INTENTIONAL ISSUE: Manual mapping from API shape to flat state — fragile, error-prone
          setTitle(job.title || '')
          setDepartment(job.department || '')
          setLocation(job.location || '')
          setEmploymentType(job.employmentType || 'Full-time')
          setExperienceLevel(job.experienceLevel || 'Mid')
          setMinExp(job.experience?.min ?? '')
          setMaxExp(job.experience?.max ?? '')
          setSalaryMin(job.salary?.min ?? '')
          setSalaryMax(job.salary?.max ?? '')
          setSalaryCurrency(job.salary?.currency || 'USD')
          setDescription(job.description || '')
          setRequirements(job.requirements || '')
          setResponsibilities(job.responsibilities || '')
          setBenefits(job.benefits || '')
          setSkills(job.skills || [])
          setOpenings(job.openings || 1)
          setStatus(job.status || 'Open')
          setRemoteAllowed(job.remoteAllowed || false)
        })
        .catch(() => setError('Failed to load job data.'))
        .finally(() => setFetchLoading(false))
    }
  }, [id])

  const handleAddSkill = (skill) => {
    const trimmed = skill.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
    }
    setSkillInput('')
  }

  const handleRemoveSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill))
  }

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddSkill(skillInput)
    }
  }

  // INTENTIONAL ISSUE: No client-side validation — all errors come from backend
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // INTENTIONAL ISSUE: Manually assembling the payload — no schema or type safety
    const payload = {
      title,
      department,
      location,
      employmentType,
      experienceLevel,
      experience: {
        min: Number(minExp) || 0,
        max: Number(maxExp) || 0,
      },
      salary: {
        min: Number(salaryMin) || 0,
        max: Number(salaryMax) || 0,
        currency: salaryCurrency,
      },
      description,
      requirements,
      responsibilities,
      benefits,
      skills,
      openings: Number(openings) || 1,
      status,
      remoteAllowed,
    }

    try {
      if (isEdit) {
        await api.put(`/jobs/${id}`, payload)
        setSuccess('Job updated successfully.')
        setTimeout(() => navigate(`/jobs/${id}`), 1200)
      } else {
        const res = await api.post('/jobs', payload)
        setSuccess('Job created successfully.')
        setTimeout(() => navigate(`/jobs/${res.data._id}`), 1200)
      }
    } catch (err) {
      // INTENTIONAL ISSUE: Generic error message, no field-level errors
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        {isEdit ? 'Edit Job' : 'Post New Job'}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {isEdit ? 'Update the job listing details below.' : 'Fill in the details to post a new job opening.'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 4 }} component="form" onSubmit={handleSubmit}>

        {/* Basic Info */}
        <Typography variant="h6" fontWeight={600} mb={2}>Basic Information</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={8}>
            <TextField
              label="Job Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              fullWidth
              required
              placeholder="e.g. Senior Backend Engineer"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              fullWidth
            >
              {['Open', 'Closed', 'Paused', 'Draft'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Department"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              fullWidth
              required
            >
              {DEPARTMENTS.map(d => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              fullWidth
              placeholder="e.g. New York, NY or Remote"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Employment Type"
              value={employmentType}
              onChange={e => setEmploymentType(e.target.value)}
              fullWidth
            >
              {EMPLOYMENT_TYPES.map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Experience Level"
              value={experienceLevel}
              onChange={e => setExperienceLevel(e.target.value)}
              fullWidth
            >
              {EXPERIENCE_LEVELS.map(l => (
                <MenuItem key={l} value={l}>{l}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Work Arrangement"
              value={remoteAllowed ? 'Remote' : location.toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site'}
              onChange={e => setRemoteAllowed(e.target.value === 'Remote')}
              fullWidth
            >
              {LOCATIONS.map(l => (
                <MenuItem key={l} value={l}>{l}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="Min Experience (yrs)"
              type="number"
              value={minExp}
              onChange={e => setMinExp(e.target.value)}
              fullWidth
              inputProps={{ min: 0, max: 30 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="Max Experience (yrs)"
              type="number"
              value={maxExp}
              onChange={e => setMaxExp(e.target.value)}
              fullWidth
              inputProps={{ min: 0, max: 30 }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              label="Currency"
              value={salaryCurrency}
              onChange={e => setSalaryCurrency(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 3 }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              label="Min Salary"
              type="number"
              value={salaryMin}
              onChange={e => setSalaryMin(e.target.value)}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              label="Max Salary"
              type="number"
              value={salaryMax}
              onChange={e => setSalaryMax(e.target.value)}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              label="Openings"
              type="number"
              value={openings}
              onChange={e => setOpenings(e.target.value)}
              fullWidth
              inputProps={{ min: 1, max: 100 }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Skills */}
        <Typography variant="h6" fontWeight={600} mb={2}>Required Skills</Typography>
        <Box mb={3}>
          <TextField
            label="Add skill (press Enter or comma)"
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            fullWidth
            sx={{ mb: 2 }}
          />
          {/* Quick add buttons for common skills */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Quick add:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {COMMON_SKILLS.filter(s => !skills.includes(s)).slice(0, 20).map(s => (
                <Chip
                  key={s}
                  label={s}
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddSkill(s)}
                  sx={{ cursor: 'pointer', fontSize: 11 }}
                />
              ))}
            </Box>
          </Box>
          {skills.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {skills.map(s => (
                <Chip
                  key={s}
                  label={s}
                  onDelete={() => handleRemoveSkill(s)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Stack>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Content */}
        <Typography variant="h6" fontWeight={600} mb={2}>Job Content</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12}>
            <TextField
              label="Job Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={5}
              placeholder="Describe the role, team, and what the candidate will be working on..."
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Responsibilities"
              value={responsibilities}
              onChange={e => setResponsibilities(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Key responsibilities of this role..."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Requirements"
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Must-have qualifications and experience..."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Benefits"
              value={benefits}
              onChange={e => setBenefits(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Salary, equity, health insurance, remote work..."
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={() => navigate(isEdit ? `/jobs/${id}` : '/jobs')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Saving...' : isEdit ? 'Update Job' : 'Post Job'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
