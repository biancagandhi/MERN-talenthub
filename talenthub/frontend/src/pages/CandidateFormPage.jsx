import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  FormControl, InputLabel, Select, MenuItem, Chip, IconButton,
  Divider, CircularProgress, Alert, InputAdornment,
} from '@mui/material'
import { ArrowBack, Add, Close } from '@mui/icons-material'
import { candidatesApi } from '../api'

// INTENTIONAL ISSUE: Create and Edit use the same component — good pattern actually —
// but form state is a flat object with no validation library (yup/react-hook-form missing)
// INTENTIONAL ISSUE: No field-level validation — only catches server errors
// INTENTIONAL ISSUE: Skills management done via manual string split — fragile

const INITIAL_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  locationCity: '', locationState: '', locationCountry: 'USA',
  currentTitle: '', currentCompany: '', experienceYears: 0,
  skills: [],
  educationDegree: '', educationField: '', educationInstitution: '', educationGradYear: '',
  linkedinUrl: '', githubUrl: '', portfolioUrl: '', resumeUrl: '',
  status: 'active', source: 'other', availability: 'negotiable',
  salaryExpected: '', salaryCurrent: '',
  notes: '', tags: [],
}

export default function CandidateFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(INITIAL_FORM)
  const [skillInput, setSkillInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!isEdit) return

    const fetchCandidate = async () => {
      try {
        const { data } = await candidatesApi.getById(id)
        // INTENTIONAL ISSUE: Manual mapping of nested object to flat form state — fragile
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          locationCity: data.location?.city || '',
          locationState: data.location?.state || '',
          locationCountry: data.location?.country || 'USA',
          currentTitle: data.currentTitle || '',
          currentCompany: data.currentCompany || '',
          experienceYears: data.experienceYears || 0,
          skills: data.skills || [],
          educationDegree: data.education?.degree || '',
          educationField: data.education?.field || '',
          educationInstitution: data.education?.institution || '',
          educationGradYear: data.education?.graduationYear || '',
          linkedinUrl: data.linkedinUrl || '',
          githubUrl: data.githubUrl || '',
          portfolioUrl: data.portfolioUrl || '',
          resumeUrl: data.resumeUrl || '',
          status: data.status || 'active',
          source: data.source || 'other',
          availability: data.availability || 'negotiable',
          salaryExpected: data.salary?.expected || '',
          salaryCurrent: data.salary?.current || '',
          notes: data.notes || '',
          tags: data.tags || [],
        })
      } catch (err) {
        console.error(err)
        setError('Failed to load candidate data.')
      } finally {
        setFetchLoading(false)
      }
    }

    fetchCandidate()
  }, [id, isEdit])

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const addSkill = () => {
    const skill = skillInput.trim()
    if (skill && !form.skills.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, skill] }))
      setSkillInput('')
    }
  }

  const removeSkill = (skill) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }

  const removeTag = (tag) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const buildPayload = () => ({
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    phone: form.phone,
    location: {
      city: form.locationCity,
      state: form.locationState,
      country: form.locationCountry,
    },
    currentTitle: form.currentTitle,
    currentCompany: form.currentCompany,
    experienceYears: Number(form.experienceYears),
    skills: form.skills,
    education: {
      degree: form.educationDegree,
      field: form.educationField,
      institution: form.educationInstitution,
      graduationYear: form.educationGradYear ? Number(form.educationGradYear) : undefined,
    },
    linkedinUrl: form.linkedinUrl,
    githubUrl: form.githubUrl,
    portfolioUrl: form.portfolioUrl,
    resumeUrl: form.resumeUrl,
    status: form.status,
    source: form.source,
    availability: form.availability,
    salary: {
      expected: form.salaryExpected ? Number(form.salaryExpected) : 0,
      current: form.salaryCurrent ? Number(form.salaryCurrent) : 0,
      currency: 'USD',
    },
    notes: form.notes,
    tags: form.tags,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // INTENTIONAL ISSUE: No client-side validation before submit
    if (!form.firstName || !form.lastName || !form.email) {
      setError('First name, last name, and email are required.')
      return
    }

    setLoading(true)
    try {
      const payload = buildPayload()

      if (isEdit) {
        await candidatesApi.update(id, payload)
        // INTENTIONAL ISSUE: After update, navigates away before confirming server returned new data
        // Due to the { new: true } bug in backend, stale data was returned — but we navigate anyway
        setSuccess('Candidate updated successfully.')
        setTimeout(() => navigate(`/candidates/${id}`), 800)
      } else {
        const { data } = await candidatesApi.create(payload)
        navigate(`/candidates/${data._id}`)
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton size="small" onClick={() => navigate(isEdit ? `/candidates/${id}` : '/candidates')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5">{isEdit ? 'Edit Candidate' : 'Add New Candidate'}</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Personal Info */}
        <Card sx={{ mb: 2.5 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Personal Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="First Name *" value={form.firstName} onChange={handleChange('firstName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Last Name *" value={form.lastName} onChange={handleChange('lastName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email *" type="email" value={form.email} onChange={handleChange('email')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone" value={form.phone} onChange={handleChange('phone')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="City" value={form.locationCity} onChange={handleChange('locationCity')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="State" value={form.locationState} onChange={handleChange('locationState')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Country" value={form.locationCountry} onChange={handleChange('locationCountry')} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card sx={{ mb: 2.5 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Professional Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Current Title" value={form.currentTitle} onChange={handleChange('currentTitle')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Current Company" value={form.currentCompany} onChange={handleChange('currentCompany')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Years of Experience" type="number"
                  value={form.experienceYears} onChange={handleChange('experienceYears')}
                  inputProps={{ min: 0, max: 50 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={form.status} onChange={handleChange('status')} label="Status">
                    {['active','inactive','hired','rejected','blacklisted'].map(s => (
                      <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Source</InputLabel>
                  <Select value={form.source} onChange={handleChange('source')} label="Source">
                    {['linkedin','referral','website','job_board','agency','other'].map(s => (
                      <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Expected Salary (USD)" type="number"
                  value={form.salaryExpected} onChange={handleChange('salaryExpected')}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Availability</InputLabel>
                  <Select value={form.availability} onChange={handleChange('availability')} label="Availability">
                    {[['immediate','Immediate'],['2_weeks','2 Weeks'],['1_month','1 Month'],['3_months','3 Months'],['negotiable','Negotiable']].map(([v, l]) => (
                      <MenuItem key={v} value={v}>{l}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Skills</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              {form.skills.map(skill => (
                <Chip
                  key={skill} label={skill} size="small" onDelete={() => removeSkill(skill)}
                  deleteIcon={<Close sx={{ fontSize: '14px !important' }} />}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small" placeholder="Add skill..." value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={addSkill}>Add</Button>
            </Box>
          </CardContent>
        </Card>

        {/* Education */}
        <Card sx={{ mb: 2.5 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Education</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Degree" value={form.educationDegree} onChange={handleChange('educationDegree')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Field of Study" value={form.educationField} onChange={handleChange('educationField')} />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth label="Institution" value={form.educationInstitution} onChange={handleChange('educationInstitution')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Graduation Year" type="number" value={form.educationGradYear} onChange={handleChange('educationGradYear')} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Links */}
        <Card sx={{ mb: 2.5 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Links & Profiles</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="LinkedIn URL" value={form.linkedinUrl} onChange={handleChange('linkedinUrl')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="GitHub URL" value={form.githubUrl} onChange={handleChange('githubUrl')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Portfolio URL" value={form.portfolioUrl} onChange={handleChange('portfolioUrl')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Resume URL" value={form.resumeUrl} onChange={handleChange('resumeUrl')} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Additional Notes</Typography>
            <TextField
              fullWidth multiline rows={3} label="Internal notes about this candidate"
              value={form.notes} onChange={handleChange('notes')}
            />
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate(isEdit ? `/candidates/${id}` : '/candidates')}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 120 }}>
            {loading ? <CircularProgress size={20} /> : isEdit ? 'Save Changes' : 'Create Candidate'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
