import { useNavigate, useLocation } from 'react-router-dom'
import { Modal } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import './shared.css'

export function Logo({ size = 'md' }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate('/')} className={`logo-btn ${size}`}>
      <span className="logo-mark">J</span>
      <span className="logo-jordan">Jordan</span>
      <span className="logo-hub">Internship Hub</span>
    </button>
  )
}

export function CompanyLogo({ initials, size = 'md' }) {
  return <div className={`company-logo ${size}`}>{initials}</div>
}

export function SkillTag({ label, missing }) {
  return <span className={`skill-tag ${missing ? 'missing' : ''}`}>{label}</span>
}

const badgeMap = {
  'Clicked Apply': { bg: 'var(--s-clicked-bg)',   text: 'var(--s-clicked-text)',   border: 'var(--border)' },
  'Applied':       { bg: 'var(--s-applied-bg)',   text: 'var(--s-applied-text)',   border: '#bfdbfe' },
  'Interview':     { bg: 'var(--s-interview-bg)', text: 'var(--s-interview-text)', border: '#99f6e4' },
  'Offer':         { bg: 'var(--s-offer-bg)',      text: 'var(--s-offer-text)',     border: '#bbf7d0' },
  'Offer / Accepted': { bg: 'var(--s-offer-bg)',  text: 'var(--s-offer-text)',     border: '#bbf7d0' },
  'Rejected':      { bg: 'var(--s-rejected-bg)',  text: 'var(--s-rejected-text)',  border: '#fecaca' },
  'Ghosted':       { bg: 'var(--s-ghosted-bg)',   text: 'var(--s-ghosted-text)',   border: '#fde68a' },
  'Withdrawn':     { bg: 'var(--s-withdrawn-bg)', text: 'var(--s-withdrawn-text)', border: 'var(--border)' },
  'Active':        { bg: 'var(--s-active-bg)',    text: 'var(--s-active-text)',    border: '#bbf7d0' },
  'Draft':         { bg: 'var(--s-draft-bg)',     text: 'var(--s-draft-text)',     border: 'var(--border)' },
  'Expired':       { bg: 'var(--s-expired-bg)',   text: 'var(--s-expired-text)',   border: 'var(--border)' },
  'Inactive':      { bg: 'var(--s-inactive-bg)',  text: 'var(--s-inactive-text)',  border: 'var(--border)' },
  'Paid':          { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  'Unpaid':        { bg: '#f8fafc', text: 'var(--text-3)', border: 'var(--border)' },
  'Academic Credit': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  'Hybrid':        { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  'Remote':        { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  'On-site':       { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
}

export function Badge({ label }) {
  const s = badgeMap[label] ?? { bg: '#f1f5f9', text: 'var(--text-2)', border: 'var(--border)' }
  return <span className="badge-pill" style={{ background: s.bg, color: s.text, borderColor: s.border }}>{label}</span>
}

export function StatusPill({ status }) {
  return <Badge label={status} />
}

export function ProgressBar({ value, showLabel = false, color = 'navy' }) {
  const barColor = { navy: 'var(--navy)', teal: 'var(--teal)', green: '#059669', amber: '#d97706' }[color]
  return (
    <div className="progress-row">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${value}%`, background: barColor }} />
      </div>
      {showLabel && <span className="progress-label">{value}%</span>}
    </div>
  )
}

export function MatchChip({ value }) {
  const color = value >= 85 ? '#059669' : value >= 70 ? 'var(--teal)' : '#d97706'
  const bg = value >= 85 ? '#dcfce7' : value >= 70 ? 'var(--teal-light)' : '#fef3c7'
  const border = value >= 85 ? '#bbf7d0' : value >= 70 ? '#99f6e4' : '#fde68a'
  return <span className="match-chip" style={{ background: bg, color, borderColor: border }}>{value}% Match</span>
}

export function Divider() {
  return <div className="divider" />
}

export function SectionLabel({ children }) {
  return <p className="section-label">{children}</p>
}

export function BtnPrimary({ children, onClick, full }) {
  return <button onClick={onClick} className={`btn-navy ${full ? 'btn-full' : ''}`}>{children}</button>
}

export function BtnOutline({ children, onClick, full }) {
  return <button onClick={onClick} className={`btn-navy-outline ${full ? 'btn-full' : ''}`}>{children}</button>
}

export function BtnGhost({ children, onClick }) {
  return <button onClick={onClick} className="btn-ghost">{children}</button>
}

export function Input({ placeholder, type = 'text', value, onChange }) {
  return <input type={type} placeholder={placeholder} value={value} onChange={e => onChange?.(e.target.value)} className="form-input" />
}

export function Select({ options, value, onChange, placeholder }) {
  return (
    <select value={value ?? ''} onChange={e => onChange?.(e.target.value)} className="form-select">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export function Card({ children, className = '', onClick }) {
  return <div className={`ui-card ${onClick ? 'clickable' : ''} ${className}`} onClick={onClick}>{children}</div>
}

export function Navbar() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  return (
    <nav className="public-navbar">
      <div className="public-navbar-inner">
        <Logo />
        <div className="public-navbar-links">
          <BtnGhost onClick={() => navigate('/browse')}>Find Internships</BtnGhost>
        </div>
        <div className="public-navbar-actions">
          {isLoggedIn ? (
            <BtnPrimary onClick={() => navigate('/dashboard')}>Dashboard</BtnPrimary>
          ) : (
            <>
              <BtnGhost onClick={() => navigate('/login')}>Log In</BtnGhost>
              <BtnPrimary onClick={() => navigate('/register')}>Create Account</BtnPrimary>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

const sidebarItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Find Internships', path: '/find-internships' },
  { label: 'Recommended', path: '/recommended' },
  { label: 'Saved', path: '/saved' },
  { label: 'Applications', path: '/applications' },
  { label: 'Skill Gaps', path: '/skill-gaps' },
  { label: 'Profile', path: '/profile' },
  { label: 'Settings', path: '/settings' },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  return (
    <aside className="sidebar">
      <div className="sidebar-header"><Logo size="sm" /></div>
      <nav className="sidebar-nav">
        {sidebarItems.map(item => {
          const active = location.pathname === item.path
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className={`sidebar-link ${active ? 'active' : ''}`}>
              {item.label}
              {active && <span className="sidebar-link-dot" />}
            </button>
          )
        })}
      </nav>
      <div className="sidebar-footer">
        <button onClick={() => { logout(); navigate('/') }} className="sidebar-logout">Log Out</button>
      </div>
    </aside>
  )
}

export function StudentLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-layout-main">{children}</main>
    </div>
  )
}

const companySidebarItems = [
  { label: 'Dashboard', path: '/company/dashboard' },
  { label: 'My Opportunities', path: '/company/opportunities' },
  { label: 'Create Opportunity', path: '/company/opportunities/new' },
  { label: 'Company Profile', path: '/company/profile' },
  { label: 'Settings', path: '/company/settings' },
]

export function CompanySidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  return (
    <aside className="sidebar">
      <div className="sidebar-header"><Logo size="sm" /></div>
      <div className="company-portal-tag">Company Portal</div>
      <nav className="sidebar-nav">
        {companySidebarItems.map(item => {
          const active = location.pathname === item.path
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className={`sidebar-link ${active ? 'active' : ''}`}>
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="sidebar-footer">
        <button onClick={() => { logout(); navigate('/') }} className="sidebar-logout">Log Out</button>
      </div>
    </aside>
  )
}

export function CompanyLayout({ children }) {
  return (
    <div className="app-layout">
      <CompanySidebar />
      <main className="app-layout-main">{children}</main>
    </div>
  )
}

const adminSidebarItems = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Companies', path: '/admin/companies' },
  { label: 'Opportunities', path: '/admin/opportunities' },
  { label: 'Reports', path: '/admin/reports' },
  { label: 'Platform Data', path: '/admin/platform-data' },
  { label: 'Settings', path: '/admin/settings' },
]

export function AdminSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  return (
    <aside className="sidebar admin-sidebar">
      <div className="sidebar-header">
        <button onClick={() => navigate('/admin')} className="admin-sidebar-brand">
          <span className="logo-mark" style={{ background: 'var(--teal)' }}>J</span>
          Admin Panel
        </button>
      </div>
      <nav className="sidebar-nav">
        {adminSidebarItems.map(item => {
          const active = location.pathname === item.path
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className={`sidebar-link ${active ? 'active' : ''}`}>
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="sidebar-footer">
        <button onClick={() => { logout(); navigate('/') }} className="sidebar-logout">Log Out</button>
      </div>
    </aside>
  )
}

export function AdminLayout({ children }) {
  return (
    <div className="app-layout">
      <AdminSidebar />
      <main className="app-layout-main">{children}</main>
    </div>
  )
}

export function TableHeader({ cols }) {
  return (
    <div className="table-header-row" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
      {cols.map(c => <span key={c} className="table-header-col">{c}</span>)}
    </div>
  )
}

export function ActionBtn({ label, onClick, danger }) {
  return <button onClick={onClick} className={`action-btn ${danger ? 'danger' : ''}`}>{label}</button>
}

export function AuthModal({ show, onClose, action }) {
  const navigate = useNavigate()
  return (
    <Modal show={show} onHide={onClose} centered className="auth-modal">
      <Modal.Body className="p-4">
        <h2 className="auth-modal-title">
          {action === 'apply' ? 'Create an account to track this application' : 'Create an account to save opportunities'}
        </h2>
        <p className="auth-modal-body-text">
          Creating an account lets you track applications, save opportunities, receive personalized matches, and identify skill gaps.
        </p>
        <div className="d-flex flex-column gap-2">
          <BtnPrimary full onClick={() => navigate('/register')}>Create Student Account</BtnPrimary>
          <BtnOutline full onClick={() => navigate('/login')}>Log In</BtnOutline>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </Modal.Body>
    </Modal>
  )
}