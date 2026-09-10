import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios, { BASE_URL } from '../api'
import { useAuth } from '../context/AuthContext'
import { Logo, BtnPrimary, Input, Divider } from '../components/shared'
import './AuthPages.css'

function redirectPathFor(role) {
  if (role === 'company') return '/company/dashboard'
  if (role === 'admin') return '/admin'
  return '/dashboard'
}

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, { email, password })
      login(res.data.user)
      navigate(redirectPathFor(res.data.user.role))
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <Logo size="lg" />
      </div>
      <p className="auth-tagline">Jordan's internship platform for students and companies</p>

      <div className="auth-card">
        <h2 className="auth-title">Log in to your account</h2>

        {error && <p className="auth-error">{error}</p>}

        <div className="auth-field">
          <label>Email address</label>
          <Input type="email" placeholder="you@university.edu.jo" value={email} onChange={setEmail} />
        </div>
        <div className="auth-field">
          <label>Password</label>
          <Input type="password" placeholder="••••••••" value={password} onChange={setPassword} />
        </div>

        <BtnPrimary full onClick={handleSubmit}>Log In</BtnPrimary>

        <Divider />
        <p className="auth-switch">
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')}>Create Account</button>
        </p>
      </div>
    </div>
  )
}

function StudentForm({ onBack, onDone }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/signup`, {
        email,
        password,
        role: 'student',
        first_name: firstName,
        last_name: lastName,
      })
      onDone(res.data.user)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div>
      <h3 className="auth-title" style={{ fontSize: 18 }}>Create your student account</h3>
      {error && <p className="auth-error">{error}</p>}
      <div className="auth-row">
        <div className="auth-field">
          <label>First Name</label>
          <Input placeholder="Layan" value={firstName} onChange={setFirstName} />
        </div>
        <div className="auth-field">
          <label>Last Name</label>
          <Input placeholder="Al-Hadid" value={lastName} onChange={setLastName} />
        </div>
      </div>
      <div className="auth-field">
        <label>Email address</label>
        <Input type="email" placeholder="layan@university.edu.jo" value={email} onChange={setEmail} />
      </div>
      <div className="auth-field">
        <label>Password</label>
        <Input type="password" placeholder="Min. 8 characters" value={password} onChange={setPassword} />
      </div>
      <BtnPrimary full onClick={handleSubmit}>Create Account</BtnPrimary>
      <button className="auth-back" onClick={onBack}>← Back</button>
    </div>
  )
}

function CompanyForm({ onBack, onDone }) {
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/signup`, {
        email,
        password,
        role: 'company',
        company_name: companyName,
      })
      onDone(res.data.user)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div>
      <h3 className="auth-title" style={{ fontSize: 18 }}>Create your company account</h3>
      {error && <p className="auth-error">{error}</p>}
      <div className="auth-field">
        <label>Company Name</label>
        <Input placeholder="Makeen Technology" value={companyName} onChange={setCompanyName} />
      </div>
      <div className="auth-field">
        <label>Email address</label>
        <Input type="email" placeholder="hr@company.com" value={email} onChange={setEmail} />
      </div>
      <div className="auth-field">
        <label>Password</label>
        <Input type="password" placeholder="Min. 8 characters" value={password} onChange={setPassword} />
      </div>
      <BtnPrimary full onClick={handleSubmit}>Create Company Account</BtnPrimary>
      <button className="auth-back" onClick={onBack}>← Back</button>
    </div>
  )
}

function RoleSelect({ onPick, onSwitchToLogin }) {
  return (
    <>
      <h2 className="auth-title" style={{ textAlign: 'center', marginBottom: 8 }}>
        What type of account are you creating?
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>
        Select the account type that fits your needs.
      </p>
      <div className="role-pick">
        <button className="role-card" onClick={() => onPick('student')}>
          <div className="role-card-head">
            <span className="role-card-icon student">●</span>
            Student / Fresh Graduate
          </div>
          <p className="role-card-desc">
            For students and recent graduates searching for internship opportunities in Jordan.
          </p>
        </button>
        <button className="role-card" onClick={() => onPick('company')}>
          <div className="role-card-head">
            <span className="role-card-icon company">◆</span>
            Company / Organization
          </div>
          <p className="role-card-desc">
            For companies and organizations publishing internship opportunities on the platform.
          </p>
        </button>
      </div>
      <Divider />
      <p className="auth-switch">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin}>Log in</button>
      </p>
    </>
  )
}

export function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [role, setRole] = useState(null)
  const [step, setStep] = useState('select')

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <Logo size="lg" />
      </div>

      <div className="auth-card wide">
        {step === 'select' && (
          <RoleSelect
            onPick={(r) => { setRole(r); setStep('form') }}
            onSwitchToLogin={() => navigate('/login')}
          />
        )}
        {step === 'form' && role === 'student' && (
          <StudentForm
            onBack={() => setStep('select')}
            onDone={(user) => { login(user); navigate('/dashboard') }}
          />
        )}
        {step === 'form' && role === 'company' && (
          <CompanyForm
            onBack={() => setStep('select')}
            onDone={(user) => { login(user); navigate('/company/dashboard') }}
          />
        )}
      </div>
    </div>
  )
}
