import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, Divider, CircularProgress,
} from '@mui/material'
import { Visibility, VisibilityOff, Business } from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

// INTENTIONAL ISSUE: Login logic inline in component — not extracted to a service/hook
// INTENTIONAL ISSUE: No redirect if already logged in
export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      // INTENTIONAL ISSUE: Generic error message — doesn't surface actual API error
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#0f172a',
      backgroundImage: 'radial-gradient(ellipse at 50% 50%, #1e293b 0%, #0f172a 100%)',
      p: 2,
    }}>
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 2, bgcolor: '#6366f1', mb: 2,
          }}>
            <Business sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
            TalentHub
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Recruiting CRM Platform
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 3.5 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>Sign in to your account</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your credentials to continue
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ bgcolor: '#f8fafc', borderRadius: 1.5, p: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Demo credentials
              </Typography>
              <Typography variant="body2"><strong>Email:</strong> admin@example.com</Typography>
              <Typography variant="body2"><strong>Password:</strong> password123</Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
