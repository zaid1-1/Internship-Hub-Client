import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios, { BASE_URL, authHeaders } from '../api'
import { useAuth } from '../context/AuthContext'
import {
  AdminLayout, SectionLabel, Card, BtnPrimary, BtnOutline, BtnGhost,
  Input, Divider, StatusPill, ActionBtn, CompanyLogo, idNameMap,
} from '../components/shared'
import '../css/AdminScreens.css'

// ── small page-local helpers/components ──────────────────────────────
// Same "small page-local UI pieces get duplicated, only true cross-page
// pieces live in shared.jsx" rule CompanyScreens.jsx's own Section
// component already follows - nothing here is used outside this file.

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—'
}

// Plain millisecond-difference arithmetic for the Dashboard's "time ago"
// labels - same complexity level as utils/matching.js's weighted score,
// just turned into a rough human label instead of a percentage.
function timeAgo(value) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

// Same one-line initials technique shared.jsx's own InternshipCard already
// uses inline for company initials - no shared helper exists for it, so
// this repeats it locally rather than inventing a new shared export.
function initialsOf(name) {
  return name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
}

// Reusable confirm dialog for every destructive admin action (Delete
// user/company, Remove opportunity, Delete platform-data item). Reuses
// the exact .confirm-modal-overlay/.confirm-modal-box classes Company/
// Student Settings already added to shared.css for Deactivate/Delete,
// just with a horizontal button row (defined in AdminScreens.css) instead
// of their stacked one, matching the Figma source's own ConfirmModal.
function AdminConfirmModal({ title, body, confirmLabel, onConfirm, onCancel, busy }) {
  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-box admin-confirm-box">
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="admin-confirm-actions">
          <BtnPrimary onClick={onConfirm} disabled={busy}>{busy ? 'Working...' : confirmLabel}</BtnPrimary>
          <BtnOutline onClick={onCancel}>Cancel</BtnOutline>
        </div>
      </div>
    </div>
  )
}

function AdminTabs({ tabs, active, onChange }) {
  return (
    <div className="admin-tabs">
      {tabs.map(t => (
        <button key={t} className={`admin-tab ${active === t ? 'active' : ''}`} onClick={() => onChange(t)}>
          {t}
        </button>
      ))}
    </div>
  )
}

// Admin's own table head style (navy-light background, tighter padding) -
// deliberately separate from shared.jsx's TableHeader (used by
// MyOpportunities etc, plain #f8fafc background, equal-width columns
// only) because every admin table in the Figma source uses its own local
// TableHead with that navy-light background and per-table column ratios.
function AdminTableHead({ cols, rowClass }) {
  return (
    <div className={`admin-thead ${rowClass}`}>
      {cols.map(c => <span key={c} className="admin-thead-col">{c}</span>)}
    </div>
  )
}

// Dashboard's colored-accent counter card. `accent` is per-item dynamic
// (varies by stat, from a config array) so an inline style here is the
// same narrow exception StudentDashboard's own statConfig-driven stat
// tiles already use for their border colors.
function StatCard({ label, value, accent, onClick }) {
  return (
    <button onClick={onClick} className="admin-stat-card" style={{ borderLeftColor: accent }}>
      <p className="admin-stat-value">{value}</p>
      <p className="admin-stat-label">{label}</p>
    </button>
  )
}

// ── 1. Admin Dashboard (spec 46-47) ───────────────────────────────────
export function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])

  useEffect(() => {
    axios.get(`${BASE_URL}/api/admin/stats`, { headers: authHeaders() }).then(res => {
      setStats(res.data)
    }).catch(err => console.error(err))

    // Recent Activity (spec 47) has no dedicated table/route behind it -
    // it's derived here from the newest rows the students/companies/
    // internships/reports lists already return (each already sorted
    // newest-first server-side), same "fetch once, derive in plain JS"
    // approach StudentDashboard uses for its reminders/skill-gap tallies.
    // Real data only, never invented - the same rule spec 41 states
    // explicitly for the Company Dashboard ("Do NOT display fake
    // applicant metrics") applied here too.
    axios.get(`${BASE_URL}/api/admin/students`, { headers: authHeaders() }).then(res => {
      const items = res.data.slice(0, 3).map(s => ({
        icon: '◉', text: `New student registered: ${s.first_name} ${s.last_name}`, date: s.created_at,
      }))
      setActivity(prev => [...prev, ...items].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6))
    }).catch(err => console.error(err))

    axios.get(`${BASE_URL}/api/admin/companies`, { headers: authHeaders() }).then(res => {
      const items = res.data.slice(0, 3).map(c => ({
        icon: '◈', text: `New company registered: ${c.company_name}`, date: c.created_at,
      }))
      setActivity(prev => [...prev, ...items].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6))
    }).catch(err => console.error(err))

    axios.get(`${BASE_URL}/api/admin/internships`, { headers: authHeaders() }).then(res => {
      const items = res.data.slice(0, 3).map(i => ({
        icon: '◎', text: `New internship posted: ${i.title} at ${i.company_name}`, date: i.created_at,
      }))
      setActivity(prev => [...prev, ...items].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6))
    }).catch(err => console.error(err))

    axios.get(`${BASE_URL}/api/admin/reports`, { headers: authHeaders() }).then(res => {
      const items = res.data.slice(0, 3).map(r => ({
        icon: '⚑', text: `${r.reported_type} reported by ${r.reporter_email}`, date: r.created_at,
      }))
      setActivity(prev => [...prev, ...items].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6))
    }).catch(err => console.error(err))
  }, [])

  if (!stats) {
    return (
      <AdminLayout>
        <div className="admin-wrap-lg"><p className="admin-loading">Loading...</p></div>
      </AdminLayout>
    )
  }

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, accent: 'var(--navy)', path: '/admin/users' },
    { label: 'Total Companies', value: stats.totalCompanies, accent: 'var(--teal)', path: '/admin/companies' },
    { label: 'Total Opportunities', value: stats.totalOpportunities, accent: '#0ea5e9', path: '/admin/opportunities' },
    { label: 'Active Opportunities', value: stats.activeOpportunities, accent: '#16a34a', path: '/admin/opportunities' },
    { label: 'Pending Reports', value: stats.pendingReports, accent: '#d97706', path: '/admin/reports' },
  ]

  const quickActions = [
    { label: 'Manage Users', path: '/admin/users' },
    { label: 'Manage Companies', path: '/admin/companies' },
    { label: 'Manage Opportunities', path: '/admin/opportunities' },
    { label: 'Review Reports', path: '/admin/reports' },
    { label: 'Manage Skills / Categories', path: '/admin/platform-data' },
  ]

  return (
    <AdminLayout>
      <div className="admin-wrap-lg">
        <div className="admin-page-header">
          <p className="admin-eyebrow">Administrator</p>
          <h1>Admin Dashboard</h1>
          <p className="admin-page-sub">Platform overview and moderation.</p>
        </div>

        <div className="admin-stat-grid">
          {statCards.map(s => (
            <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} onClick={() => navigate(s.path)} />
          ))}
        </div>

        <div className="admin-dash-cols">
          <Card className="admin-activity-card">
            <div className="admin-card-head"><SectionLabel>Recent Activity</SectionLabel></div>
            <div>
              {activity.length > 0 ? activity.map((item, i) => (
                <div key={i} className="admin-activity-row">
                  <span className="admin-activity-icon">{item.icon}</span>
                  <p className="admin-activity-text">{item.text}</p>
                  <span className="admin-activity-time">{timeAgo(item.date)}</span>
                </div>
              )) : <p className="admin-activity-empty">No recent activity yet.</p>}
            </div>
          </Card>

          <Card className="p-4">
            <SectionLabel>Quick Actions</SectionLabel>
            <div className="admin-quick-actions">
              {quickActions.map(a => (
                <button key={a.label} className="admin-quick-action-btn" onClick={() => navigate(a.path)}>
                  {a.label} →
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

// ── 2. User Management (spec 48) ──────────────────────────────────────
export function AdminUsers() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('Students')
  const [students, setStudents] = useState([])
  const [companies, setCompanies] = useState([])
  const [studyFields, setStudyFields] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/admin/students`, { headers: authHeaders() }).then(res => {
      setStudents(res.data)
      setLoaded(true)
    }).catch(err => console.error(err))
    axios.get(`${BASE_URL}/api/admin/companies`, { headers: authHeaders() }).then(res => {
      setCompanies(res.data)
    }).catch(err => console.error(err))
    axios.get(`${BASE_URL}/api/study-fields`).then(res => {
      setStudyFields(idNameMap(res.data))
    })
  }, [])

  const handleToggleStatus = async (id, currentStatus, isStudent) => {
    const nextStatus = currentStatus === 'Active' ? 'Disabled' : 'Active'
    try {
      await axios.put(`${BASE_URL}/api/admin/users/${id}/status`, { status: nextStatus }, { headers: authHeaders() })
      if (isStudent) {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, status: nextStatus } : s))
      } else {
        setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!confirmTarget) return
    setDeleting(true)
    try {
      await axios.delete(`${BASE_URL}/api/admin/users/${confirmTarget.id}`, { headers: authHeaders() })
      setStudents(prev => prev.filter(s => s.id !== confirmTarget.id))
      setCompanies(prev => prev.filter(c => c.id !== confirmTarget.id))
      setConfirmTarget(null)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const isStudents = tab === 'Students'

  return (
    <AdminLayout>
      <div className="admin-wrap-lg">
        <div className="admin-page-header">
          <SectionLabel>Administration</SectionLabel>
          <h1>User Management</h1>
          <p className="admin-page-sub">View and manage all registered accounts.</p>
        </div>

        <Card className="admin-table-card">
          <AdminTabs tabs={['Students', 'Companies']} active={tab} onChange={setTab} />

          {!loaded ? (
            <p className="admin-table-empty">Loading...</p>
          ) : isStudents ? (
            <>
              <AdminTableHead cols={['Name', 'Email', 'University', 'Field', 'Status', 'Registered', 'Actions']} rowClass="admusers-row-student" />
              {students.map(u => (
                <div key={u.id} className="admin-trow admusers-row-student">
                  <button className="admin-row-link" onClick={() => navigate(`/admin/users/${u.id}`)}>
                    {u.first_name} {u.last_name}
                  </button>
                  <span className="admin-cell-sub">{u.email}</span>
                  <span className="admin-cell-sub">{u.university || '—'}</span>
                  <span className="admin-cell-sub">{studyFields[u.study_field_id] || '—'}</span>
                  <StatusPill status={u.status} />
                  <span className="admin-cell-mono">{formatDate(u.created_at)}</span>
                  <div className="admin-row-actions">
                    <ActionBtn label="View" onClick={() => navigate(`/admin/users/${u.id}`)} />
                    <ActionBtn label={u.status === 'Active' ? 'Disable' : 'Enable'} onClick={() => handleToggleStatus(u.id, u.status, true)} />
                    <ActionBtn label="Delete" danger onClick={() => setConfirmTarget({ id: u.id, name: `${u.first_name} ${u.last_name}` })} />
                  </div>
                </div>
              ))}
              {students.length === 0 && <p className="admin-table-empty">No students registered yet.</p>}
            </>
          ) : (
            <>
              <AdminTableHead cols={['Company Name', 'Email', 'Industry', 'Status', 'Registered', 'Actions']} rowClass="admusers-row-company" />
              {companies.map(c => (
                <div key={c.id} className="admin-trow admusers-row-company">
                  <button className="admin-row-link" onClick={() => navigate(`/admin/users/${c.id}`)}>
                    {c.company_name}
                  </button>
                  <span className="admin-cell-sub">{c.email}</span>
                  <span className="admin-cell-sub">{c.industry || '—'}</span>
                  <StatusPill status={c.status} />
                  <span className="admin-cell-mono">{formatDate(c.created_at)}</span>
                  <div className="admin-row-actions">
                    <ActionBtn label="View" onClick={() => navigate(`/admin/users/${c.id}`)} />
                    <ActionBtn label={c.status === 'Active' ? 'Disable' : 'Enable'} onClick={() => handleToggleStatus(c.id, c.status, false)} />
                    <ActionBtn label="Delete" danger onClick={() => setConfirmTarget({ id: c.id, name: c.company_name })} />
                  </div>
                </div>
              ))}
              {companies.length === 0 && <p className="admin-table-empty">No companies registered yet.</p>}
            </>
          )}
        </Card>

        {confirmTarget && (
          <AdminConfirmModal
            title="Delete this account?"
            body="This will permanently remove the account and all associated data from the platform."
            confirmLabel="Delete Account"
            busy={deleting}
            onConfirm={handleDelete}
            onCancel={() => setConfirmTarget(null)}
          />
        )}
      </div>
    </AdminLayout>
  )
}

// ── 3. User Details (spec 49) ─────────────────────────────────────────
export function AdminUserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [studyFields, setStudyFields] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/admin/users/${id}`, { headers: authHeaders() }).then(res => {
      setData(res.data)
    }).catch(err => console.error(err))
    axios.get(`${BASE_URL}/api/study-fields`).then(res => {
      setStudyFields(idNameMap(res.data))
    })
  }, [id])

  const handleToggleStatus = async () => {
    if (!data) return
    const nextStatus = data.user.status === 'Active' ? 'Disabled' : 'Active'
    setBusy(true)
    try {
      const res = await axios.put(`${BASE_URL}/api/admin/users/${id}/status`, { status: nextStatus }, { headers: authHeaders() })
      setData(prev => ({ ...prev, user: { ...prev.user, status: res.data.status } }))
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    try {
      await axios.delete(`${BASE_URL}/api/admin/users/${id}`, { headers: authHeaders() })
      navigate('/admin/users')
    } catch (err) {
      console.error(err)
      setBusy(false)
    }
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="admin-wrap-sm"><p className="admin-loading">Loading...</p></div>
      </AdminLayout>
    )
  }

  const { user, profile } = data
  const isStudent = user.role === 'student'
  const name = isStudent
    ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
    : (profile?.company_name || user.email)

  const infoItems = isStudent ? [
    { label: 'Full Name', value: name },
    { label: 'Email', value: user.email },
    { label: 'University', value: profile?.university || '—' },
    { label: 'Field of Study', value: studyFields[profile?.study_field_id] || '—' },
    { label: 'Account Role', value: 'Student' },
    { label: 'Account Status', value: user.status },
    { label: 'Registration Date', value: formatDate(user.created_at) },
  ] : [
    { label: 'Company Name', value: name },
    { label: 'Email', value: user.email },
    { label: 'Industry', value: profile?.industry || '—' },
    { label: 'Account Role', value: 'Company' },
    { label: 'Account Status', value: user.status },
    { label: 'Registration Date', value: formatDate(user.created_at) },
  ]

  return (
    <AdminLayout>
      <div className="admin-wrap-sm">
        <div className="admin-breadcrumb">
          <button onClick={() => navigate('/admin/users')}>Users</button>
          <span>/</span>
          <span className="admin-breadcrumb-current">{name}</span>
        </div>

        <div className="admin-page-header">
          <SectionLabel>User Details</SectionLabel>
          <h1>{name}</h1>
        </div>

        <Card className="p-4 mb-3">
          <SectionLabel>Account Information</SectionLabel>
          <div className="admin-info-grid">
            {infoItems.map(item => (
              <div key={item.label}>
                <p className="admin-info-label">{item.label}</p>
                {item.label === 'Account Status' ? <StatusPill status={item.value} /> : <p className="admin-info-value">{item.value}</p>}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 mb-3 admin-notice-card">
          <SectionLabel>Platform Notice</SectionLabel>
          <p className="admin-notice-text">
            {isStudent
              ? 'Student application tracking records are private student data. Admins cannot modify personal application tracking history.'
              : 'Company accounts manage their own internship listings. Admins can disable or remove company accounts but cannot impersonate users.'}
          </p>
        </Card>

        <Card className="p-4">
          <SectionLabel>Actions</SectionLabel>
          <div className="admin-actions-row">
            {user.status === 'Active' ? (
              <BtnOutline onClick={handleToggleStatus} disabled={busy}>Disable Account</BtnOutline>
            ) : (
              <BtnPrimary onClick={handleToggleStatus} disabled={busy}>Enable Account</BtnPrimary>
            )}
            <button className="admin-delete-link" onClick={() => setConfirmDelete(true)}>Delete Account</button>
          </div>
        </Card>

        {confirmDelete && (
          <AdminConfirmModal
            title="Delete this account?"
            body="This will permanently remove the account and all associated data from the platform."
            confirmLabel="Delete Account"
            busy={busy}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </div>
    </AdminLayout>
  )
}

// ── 4. Company Management (spec 50) ───────────────────────────────────
export function AdminCompanies() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [locations, setLocations] = useState({})
  const [oppCounts, setOppCounts] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/admin/companies`, { headers: authHeaders() }).then(res => {
      setCompanies(res.data)
      setLoaded(true)
    }).catch(err => console.error(err))
    axios.get(`${BASE_URL}/api/locations`).then(res => {
      setLocations(idNameMap(res.data))
    })
    // Opportunity counts per company (Figma's "Opportunities" column) -
    // no aggregate route for this exists, so it's tallied client-side
    // from the already-built admin internships list, same plain
    // for-loop-counter technique StudentDashboard's skillGapCounts uses.
    axios.get(`${BASE_URL}/api/admin/internships`, { headers: authHeaders() }).then(res => {
      const counts = {}
      for (let i = 0; i < res.data.length; i++) {
        const companyId = res.data[i].company_id
        counts[companyId] = (counts[companyId] || 0) + 1
      }
      setOppCounts(counts)
    }).catch(err => console.error(err))
  }, [])

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Disabled' : 'Active'
    try {
      await axios.put(`${BASE_URL}/api/admin/users/${id}/status`, { status: nextStatus }, { headers: authHeaders() })
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!confirmTarget) return
    setDeleting(true)
    try {
      await axios.delete(`${BASE_URL}/api/admin/users/${confirmTarget.id}`, { headers: authHeaders() })
      setCompanies(prev => prev.filter(c => c.id !== confirmTarget.id))
      setConfirmTarget(null)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-wrap-lg">
        <div className="admin-page-header">
          <SectionLabel>Administration</SectionLabel>
          <h1>Company Management</h1>
          <p className="admin-page-sub">Review and manage all registered organizations.</p>
        </div>

        <Card className="admin-table-card">
          <AdminTableHead cols={['Company', 'Industry', 'Location', 'Status', 'Opportunities', 'Registered', 'Actions']} rowClass="admcomp-row" />
          {loaded && companies.map(c => (
            <div key={c.id} className="admin-trow admcomp-row">
              <div className="admin-company-cell">
                <CompanyLogo initials={initialsOf(c.company_name)} size="sm" />
                <button className="admin-row-link" onClick={() => navigate(`/admin/users/${c.id}`)}>{c.company_name}</button>
              </div>
              <span className="admin-cell-sub">{c.industry || '—'}</span>
              <span className="admin-cell-sub">{locations[c.location_id] || '—'}</span>
              <StatusPill status={c.status} />
              <span className="admin-cell-mono admin-cell-center">{oppCounts[c.id] || 0}</span>
              <span className="admin-cell-mono">{formatDate(c.created_at)}</span>
              <div className="admin-row-actions">
                <ActionBtn label="View" onClick={() => navigate(`/admin/users/${c.id}`)} />
                <ActionBtn label={c.status === 'Active' ? 'Disable' : 'Enable'} onClick={() => handleToggleStatus(c.id, c.status)} />
                <ActionBtn label="Delete" danger onClick={() => setConfirmTarget({ id: c.id, name: c.company_name })} />
              </div>
            </div>
          ))}
          {loaded && companies.length === 0 && <p className="admin-table-empty">No companies registered yet.</p>}
          {!loaded && <p className="admin-table-empty">Loading...</p>}
        </Card>

        {confirmTarget && (
          <AdminConfirmModal
            title="Delete this account?"
            body="This will permanently remove the account and all associated data from the platform."
            confirmLabel="Delete Account"
            busy={deleting}
            onConfirm={handleDelete}
            onCancel={() => setConfirmTarget(null)}
          />
        )}
      </div>
    </AdminLayout>
  )
}

// ── 5. Opportunity Management (spec 51) ───────────────────────────────
const opportunityTabs = ['All', 'Active', 'Draft', 'Expired', 'Reported']

export function AdminOpportunities() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [internships, setInternships] = useState([])
  const [fields, setFields] = useState({})
  const [locations, setLocations] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/fields`).then(res => setFields(idNameMap(res.data)))
    axios.get(`${BASE_URL}/api/locations`).then(res => setLocations(idNameMap(res.data)))
  }, [])

  useEffect(() => {
    setLoaded(false)
    const query = tab === 'All' ? '' : `?status=${tab}`
    axios.get(`${BASE_URL}/api/admin/internships${query}`, { headers: authHeaders() }).then(res => {
      setInternships(res.data)
      setLoaded(true)
    }).catch(err => console.error(err))
  }, [tab])

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active'
    try {
      const res = await axios.put(`${BASE_URL}/api/admin/internships/${item.id}/status`, { status: nextStatus }, { headers: authHeaders() })
      setInternships(prev => prev.map(i => i.id === item.id ? res.data : i))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!confirmTarget) return
    setDeleting(true)
    try {
      await axios.delete(`${BASE_URL}/api/admin/internships/${confirmTarget.id}`, { headers: authHeaders() })
      setInternships(prev => prev.filter(i => i.id !== confirmTarget.id))
      setConfirmTarget(null)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-wrap-xl">
        <div className="admin-page-header">
          <SectionLabel>Administration</SectionLabel>
          <h1>Opportunity Management</h1>
          <p className="admin-page-sub">Manage all internship listings across the platform.</p>
        </div>

        <Card className="admin-table-card">
          <AdminTabs tabs={opportunityTabs} active={tab} onChange={setTab} />
          <AdminTableHead cols={['Internship', 'Company', 'Field', 'Location', 'Status', 'Posted', 'Deadline', 'Actions']} rowClass="admopps-row" />

          {loaded && internships.map(i => (
            <div key={i.id} className="admin-trow admopps-row">
              <button className="admin-row-link" onClick={() => navigate(`/admin/opportunities/${i.id}`)}>{i.title}</button>
              <span className="admin-cell-sub">{i.company_name}</span>
              <span className="admin-cell-sub">{fields[i.field_id] || '—'}</span>
              <span className="admin-cell-sub">{locations[i.location_id] || '—'}</span>
              <StatusPill status={i.status} />
              <span className="admin-cell-mono">{i.posted_date ? formatDate(i.posted_date) : 'Not posted'}</span>
              <span className="admin-cell-mono">{formatDate(i.application_deadline)}</span>
              <div className="admin-row-actions">
                <ActionBtn label="View" onClick={() => navigate(`/admin/opportunities/${i.id}`)} />
                <ActionBtn label={i.status === 'Active' ? 'Deactivate' : 'Reactivate'} onClick={() => handleToggleStatus(i)} />
                <ActionBtn label="Remove" danger onClick={() => setConfirmTarget({ id: i.id, title: i.title })} />
              </div>
            </div>
          ))}
          {loaded && internships.length === 0 && <p className="admin-table-empty">No opportunities in this view.</p>}
          {!loaded && <p className="admin-table-empty">Loading...</p>}
        </Card>

        {confirmTarget && (
          <AdminConfirmModal
            title="Remove this opportunity?"
            body="This will permanently remove the listing and all applications tracking it."
            confirmLabel="Remove"
            busy={deleting}
            onConfirm={handleDelete}
            onCancel={() => setConfirmTarget(null)}
          />
        )}
      </div>
    </AdminLayout>
  )
}

// ── 6. Opportunity Details / Moderation (spec 51-52) ──────────────────
export function AdminOpportunityDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [opp, setOpp] = useState(null)
  const [skills, setSkills] = useState([])
  const [fields, setFields] = useState({})
  const [locations, setLocations] = useState({})
  const [workArrangements, setWorkArrangements] = useState({})
  const [internshipTypes, setInternshipTypes] = useState({})
  const [report, setReport] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/fields`).then(res => setFields(idNameMap(res.data)))
    axios.get(`${BASE_URL}/api/locations`).then(res => setLocations(idNameMap(res.data)))
    axios.get(`${BASE_URL}/api/work-arrangements`).then(res => setWorkArrangements(idNameMap(res.data)))
    axios.get(`${BASE_URL}/api/internship-types`).then(res => setInternshipTypes(idNameMap(res.data)))
  }, [])

  useEffect(() => {
    axios.get(`${BASE_URL}/api/admin/internships/${id}`, { headers: authHeaders() }).then(res => {
      setOpp(res.data)
    }).catch(err => console.error(err))
    axios.get(`${BASE_URL}/api/internships/${id}/skills`).then(res => {
      setSkills(res.data)
    }).catch(err => console.error(err))
    // No route resolves "is this internship reported" directly - reuse
    // the already-built admin reports list and match it client-side,
    // same "fetch once, filter" pattern used throughout this app.
    axios.get(`${BASE_URL}/api/admin/reports`, { headers: authHeaders() }).then(res => {
      const match = res.data.find(r => r.reported_type === 'Internship Opportunity' && String(r.reported_internship_id) === String(id))
      setReport(match || null)
    }).catch(err => console.error(err))
  }, [id])

  const handleSetStatus = async (status) => {
    setBusy(true)
    try {
      const res = await axios.put(`${BASE_URL}/api/admin/internships/${id}/status`, { status }, { headers: authHeaders() })
      setOpp(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async () => {
    setBusy(true)
    try {
      await axios.delete(`${BASE_URL}/api/admin/internships/${id}`, { headers: authHeaders() })
      navigate('/admin/opportunities')
    } catch (err) {
      console.error(err)
      setBusy(false)
    }
  }

  const handleDismissReport = async () => {
    if (!report) return
    setBusy(true)
    try {
      const res = await axios.put(`${BASE_URL}/api/admin/reports/${report.id}/status`, { status: 'Dismissed' }, { headers: authHeaders() })
      setReport(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  if (!opp) {
    return (
      <AdminLayout>
        <div className="admin-wrap-md"><p className="admin-loading">Loading...</p></div>
      </AdminLayout>
    )
  }

  const detailItems = [
    { label: 'Field', value: fields[opp.field_id] || '—' },
    { label: 'Location', value: locations[opp.location_id] || '—' },
    { label: 'Arrangement', value: workArrangements[opp.work_arrangement_id] || '—' },
    { label: 'Type', value: internshipTypes[opp.internship_type_id] || '—' },
    { label: 'Duration', value: opp.duration || '—' },
    { label: 'Deadline', value: formatDate(opp.application_deadline) },
  ]

  return (
    <AdminLayout>
      <div className="admin-wrap-md">
        <div className="admin-breadcrumb">
          <button onClick={() => navigate('/admin/opportunities')}>Opportunities</button>
          <span>/</span>
          <span className="admin-breadcrumb-current">{opp.title}</span>
        </div>

        <div className="admin-detail-head">
          <div>
            <SectionLabel>Moderation</SectionLabel>
            <h1>{opp.title}</h1>
            <p className="admin-page-sub">{opp.company_name} · {locations[opp.location_id] || '—'}</p>
          </div>
          <StatusPill status={opp.status} />
        </div>

        {report && (
          <Card className="p-4 mb-3 admin-report-card">
            <SectionLabel>Report Information</SectionLabel>
            <div className="admin-info-grid">
              <div>
                <p className="admin-info-label">Reason</p>
                <p className="admin-info-value">{report.reason}</p>
              </div>
              <div>
                <p className="admin-info-label">Reported By</p>
                <p className="admin-info-value">{report.reporter_email}</p>
              </div>
              <div>
                <p className="admin-info-label">Date</p>
                <p className="admin-info-value admin-info-mono">{formatDate(report.created_at)}</p>
              </div>
              <div>
                <p className="admin-info-label">Report Status</p>
                <StatusPill status={report.status} />
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 mb-3">
          <SectionLabel>Internship Details</SectionLabel>
          <div className="admin-info-grid admin-info-grid-3">
            {detailItems.map(item => (
              <div key={item.label}>
                <p className="admin-info-label">{item.label}</p>
                <p className="admin-info-value">{item.value}</p>
              </div>
            ))}
          </div>
          <Divider />
          <div className="admin-description-block">
            <p className="admin-info-label">Description</p>
            <p className="admin-description-text">{opp.description || '—'}</p>
          </div>
        </Card>

        <Card className="p-4 mb-3">
          <SectionLabel>Required Skills</SectionLabel>
          <div className="admin-skill-tags">
            {skills.length > 0
              ? skills.map(s => <span key={s.id} className="admin-skill-tag">{s.name}</span>)
              : <p className="admin-table-empty">No specific skills required.</p>}
          </div>
        </Card>

        <Card className="p-4 mb-3">
          <SectionLabel>External Application URL</SectionLabel>
          <p className="admin-external-url">{opp.external_application_url}</p>
        </Card>

        <Card className="p-4">
          <SectionLabel>Admin Actions</SectionLabel>
          <div className="admin-actions-row">
            <BtnPrimary onClick={() => handleSetStatus('Active')} disabled={busy}>Approve / Keep Active</BtnPrimary>
            <BtnOutline onClick={() => handleSetStatus('Inactive')} disabled={busy}>Deactivate</BtnOutline>
            <button className="admin-delete-link" onClick={() => setConfirmRemove(true)}>Remove</button>
            {report && report.status === 'Pending' && (
              <BtnGhost onClick={handleDismissReport}>Dismiss Report</BtnGhost>
            )}
          </div>
        </Card>

        {confirmRemove && (
          <AdminConfirmModal
            title="Remove this opportunity?"
            body="This will permanently remove the listing and all applications tracking it."
            confirmLabel="Remove"
            busy={busy}
            onConfirm={handleRemove}
            onCancel={() => setConfirmRemove(false)}
          />
        )}
      </div>
    </AdminLayout>
  )
}

// ── 7. Reports (spec 52) ──────────────────────────────────────────────
const reportTabs = ['All', 'Pending', 'Reviewed', 'Dismissed', 'Action Taken']

export function AdminReports() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('All')
  const [reports, setReports] = useState([])
  const [internships, setInternships] = useState([])
  const [companies, setCompanies] = useState([])
  const [students, setStudents] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/admin/internships`, { headers: authHeaders() }).then(res => setInternships(res.data))
    axios.get(`${BASE_URL}/api/admin/companies`, { headers: authHeaders() }).then(res => setCompanies(res.data))
    axios.get(`${BASE_URL}/api/admin/students`, { headers: authHeaders() }).then(res => setStudents(res.data))
  }, [])

  useEffect(() => {
    setLoaded(false)
    const query = tab === 'All' ? '' : `?status=${encodeURIComponent(tab)}`
    axios.get(`${BASE_URL}/api/admin/reports${query}`, { headers: authHeaders() }).then(res => {
      setReports(res.data)
      setLoaded(true)
    }).catch(err => console.error(err))
  }, [tab])

  // "Reported Item" isn't returned as a resolved name by GET /admin/reports
  // (it only gives the raw type + whichever id is set - see
  // backend-readme.md) - resolved here against the three lists already
  // fetched once above, instead of one extra network call per row.
  function itemLabel(r) {
    if (r.reported_type === 'Internship Opportunity') {
      const found = internships.find(i => i.id === r.reported_internship_id)
      return found ? found.title : `Internship #${r.reported_internship_id}`
    }
    if (r.reported_type === 'Company Profile') {
      const found = companies.find(c => c.id === r.reported_company_id)
      return found ? found.company_name : `Company #${r.reported_company_id}`
    }
    const student = students.find(s => s.id === r.reported_user_id)
    if (student) return `${student.first_name} ${student.last_name}`
    const company = companies.find(c => c.id === r.reported_user_id)
    return company ? company.company_name : `User #${r.reported_user_id}`
  }

  // The Figma source always sends "Review" to the same single detail
  // screen regardless of what was reported (a prototype-only shortcut -
  // it has no separate company/user report views to link to). Since this
  // is a real app where reports can point at internships, companies, or
  // users, Review routes to whichever admin screen actually covers that
  // target instead - same "a working thing beats a fake link that
  // matches pixels but not intent" call already made for Company Profile
  // Edit's logo upload.
  function reviewPath(r) {
    if (r.reported_type === 'Internship Opportunity') return `/admin/opportunities/${r.reported_internship_id}`
    if (r.reported_type === 'Company Profile') return `/admin/users/${r.reported_company_id}`
    return `/admin/users/${r.reported_user_id}`
  }

  const handleDismiss = async (r) => {
    setBusyId(r.id)
    try {
      const res = await axios.put(`${BASE_URL}/api/admin/reports/${r.id}/status`, { status: 'Dismissed' }, { headers: authHeaders() })
      setReports(prev => prev.map(x => x.id === r.id ? res.data : x))
    } catch (err) {
      console.error(err)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-wrap-lg">
        <div className="admin-page-header">
          <SectionLabel>Moderation</SectionLabel>
          <h1>Reports</h1>
          <p className="admin-page-sub">Review content reported by platform users.</p>
        </div>

        <Card className="admin-table-card">
          <AdminTabs tabs={reportTabs} active={tab} onChange={setTab} />
          <AdminTableHead cols={['Reported Item', 'Type', 'Reason', 'Reported By', 'Date', 'Status', 'Actions']} rowClass="admreports-row" />

          {loaded && reports.map(r => (
            <div key={r.id} className="admin-trow admreports-row">
              <button className="admin-row-link" onClick={() => navigate(reviewPath(r))}>{itemLabel(r)}</button>
              <span className="admin-cell-sub">{r.reported_type.replace(' Profile', '').replace(' Opportunity', '')}</span>
              <span className="admin-cell-sub admin-cell-truncate">{r.reason}</span>
              <span className="admin-cell-sub">{r.reporter_email}</span>
              <span className="admin-cell-mono">{formatDate(r.created_at)}</span>
              <StatusPill status={r.status} />
              <div className="admin-row-actions">
                <ActionBtn label="Review" onClick={() => navigate(reviewPath(r))} />
                {r.status === 'Pending' && <ActionBtn label={busyId === r.id ? 'Working...' : 'Dismiss'} onClick={() => handleDismiss(r)} />}
              </div>
            </div>
          ))}
          {loaded && reports.length === 0 && <p className="admin-table-empty">No reports in this view.</p>}
          {!loaded && <p className="admin-table-empty">Loading...</p>}
        </Card>
      </div>
    </AdminLayout>
  )
}

// ── 8. Platform Data Management (spec 53) ─────────────────────────────
// Figma's own Platform Data screen manages 6 of the 7 admin-owned lookup
// tables (skills, fields, locations, internship_types, work_arrangements,
// education_levels) - it has no tab for study_fields (academic majors,
// distinct from the career "fields" tab used here). study_fields is
// built to the exact same GET/POST/PUT/PATCH/DELETE API as the other 6
// (see routes/studyfields.js -> makeLookupRouter("study_fields")) and is
// already used elsewhere (Profile, Create/Edit Internship) - it's just
// not exposed on this screen because the Figma source doesn't show a tab
// for it. Documented as a known gap in scope-and-decisions.md rather
// than silently added, matching how this project has always handled a
// Figma/spec mismatch.
const platformTabs = [
  { label: 'Skills', base: '/api/skills', addLabel: 'Skill', hasCategory: true },
  { label: 'Fields / Categories', base: '/api/fields', addLabel: 'Field' },
  { label: 'Locations', base: '/api/locations', addLabel: 'Location' },
  { label: 'Internship Types', base: '/api/internship-types', addLabel: 'Internship Type' },
  { label: 'Work Arrangements', base: '/api/work-arrangements', addLabel: 'Work Arrangement' },
  { label: 'Education Options', base: '/api/education-levels', addLabel: 'Education Option' },
]

export function AdminPlatformData() {
  const [tab, setTab] = useState('Skills')
  const [rows, setRows] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('Frontend')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [confirmTarget, setConfirmTarget] = useState(null)

  const config = platformTabs.find(t => t.label === tab)

  useEffect(() => {
    setLoaded(false)
    axios.get(`${BASE_URL}${config.base}`).then(res => {
      setRows(res.data)
      setLoaded(true)
    }).catch(err => console.error(err))
  }, [tab])

  // The Category dropdown only exists for Skills, matching the Figma
  // source - but the live skills table's POST route never actually
  // inserts a category (see lookuprouter.js: only `name` is saved), so
  // it isn't sent here either. Kept visible for the same reason the
  // original Figma design has it (a real skill really does have a
  // category, even though this build doesn't persist it yet); nothing
  // depends on its value.
  const handleAdd = async () => {
    try {
      const res = await axios.post(`${BASE_URL}${config.base}`, { name: newName }, { headers: authHeaders() })
      setRows(prev => [...prev, res.data])
      setNewName('')
      setAddOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveEdit = async (id) => {
    try {
      const res = await axios.put(`${BASE_URL}${config.base}/${id}`, { name: editName }, { headers: authHeaders() })
      setRows(prev => prev.map(r => r.id === id ? res.data : r))
      setEditingId(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleStatus = async (row) => {
    const nextStatus = row.status === 'Active' ? 'Disabled' : 'Active'
    try {
      const res = await axios.patch(`${BASE_URL}${config.base}/${row.id}/status`, { status: nextStatus }, { headers: authHeaders() })
      setRows(prev => prev.map(r => r.id === row.id ? res.data : r))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!confirmTarget) return
    try {
      await axios.delete(`${BASE_URL}${config.base}/${confirmTarget.id}`, { headers: authHeaders() })
      setRows(prev => prev.filter(r => r.id !== confirmTarget.id))
      setConfirmTarget(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-wrap-md">
        <div className="admin-page-header">
          <SectionLabel>Administration</SectionLabel>
          <h1>Platform Data</h1>
          <p className="admin-page-sub">
            Manage standardized data used for internship matching. All students and companies share these records.
          </p>
        </div>

        <Card className="admin-table-card">
          <AdminTabs tabs={platformTabs.map(t => t.label)} active={tab} onChange={setTab} />

          <div className="admin-platform-toolbar">
            <p>Managing: <span className="admin-platform-toolbar-name">{tab}</span></p>
            <BtnPrimary onClick={() => setAddOpen(true)}>+ Add {config.addLabel}</BtnPrimary>
          </div>

          <AdminTableHead
            cols={config.hasCategory ? ['Name', 'Category', 'Status', 'Actions'] : ['Name', 'Status', 'Actions']}
            rowClass={config.hasCategory ? 'admplat-row-skill' : 'admplat-row'}
          />

          {loaded && rows.map(row => (
            <div key={row.id} className={`admin-trow ${config.hasCategory ? 'admplat-row-skill' : 'admplat-row'}`}>
              {editingId === row.id ? (
                <div className="admin-inline-edit">
                  <Input value={editName} onChange={setEditName} />
                  <ActionBtn label="Save" onClick={() => handleSaveEdit(row.id)} />
                  <ActionBtn label="Cancel" onClick={() => setEditingId(null)} />
                </div>
              ) : (
                <span className="admin-cell-mono admin-cell-strong">{row.name}</span>
              )}
              {config.hasCategory && <span className="admin-cell-sub">{row.category || '—'}</span>}
              <StatusPill status={row.status} />
              {editingId !== row.id && (
                <div className="admin-row-actions">
                  <ActionBtn label="Edit" onClick={() => { setEditingId(row.id); setEditName(row.name) }} />
                  <ActionBtn label={row.status === 'Active' ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(row)} />
                  <ActionBtn label="Delete" danger onClick={() => setConfirmTarget(row)} />
                </div>
              )}
            </div>
          ))}
          {loaded && rows.length === 0 && <p className="admin-table-empty">No {tab.toLowerCase()} yet.</p>}
          {!loaded && <p className="admin-table-empty">Loading...</p>}
        </Card>

        {addOpen && (
          <div className="confirm-modal-overlay">
            <div className="confirm-modal-box admin-confirm-box">
              <h3>Add New {config.addLabel}</h3>
              <div className="admin-add-form">
                <div>
                  <label className="admin-add-label">Name *</label>
                  <Input placeholder={tab === 'Skills' ? 'e.g. Kotlin' : 'Enter name...'} value={newName} onChange={setNewName} />
                </div>
                {config.hasCategory && (
                  <div>
                    <label className="admin-add-label">Category</label>
                    <select className="form-select" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                      {['Frontend', 'Backend', 'Database', 'DevOps', 'Cloud', 'Design', 'Tools', 'General'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="admin-confirm-actions">
                <BtnPrimary onClick={handleAdd} disabled={!newName.trim()}>Add</BtnPrimary>
                <BtnOutline onClick={() => { setAddOpen(false); setNewName('') }}>Cancel</BtnOutline>
              </div>
            </div>
          </div>
        )}

        {confirmTarget && (
          <AdminConfirmModal
            title={`Delete "${confirmTarget.name}"?`}
            body="This will permanently remove it from the platform's standardized data."
            confirmLabel="Delete"
            onConfirm={handleDelete}
            onCancel={() => setConfirmTarget(null)}
          />
        )}
      </div>
    </AdminLayout>
  )
}

// ── 9. Admin Settings (spec 54) ───────────────────────────────────────
// Same Account Details + Change Password structure (and the same
// PUT /api/auth/email + PUT /api/auth/password routes) as Company/
// Student Settings - just without a danger zone, matching the Figma
// source (Admin Settings has no Deactivate/Delete action, only Session
// → Log out).
export function AdminSettings() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState(user?.email || '')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailError, setEmailError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleEmailUpdate = async () => {
    setEmailError('')
    setEmailMsg('')
    try {
      const res = await axios.put(`${BASE_URL}/api/auth/email`, { email }, { headers: authHeaders() })
      login({ ...user, email: res.data.user.email })
      setEmailMsg('Email updated.')
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Could not update email.')
    }
  }

  const handlePasswordUpdate = async () => {
    setPasswordError('')
    setPasswordMsg('')
    try {
      await axios.put(`${BASE_URL}/api/auth/password`, { currentPassword, newPassword }, { headers: authHeaders() })
      setPasswordMsg('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Could not update password.')
    }
  }

  return (
    <AdminLayout>
      <div className="admin-wrap-sm">
        <div className="admin-page-header">
          <SectionLabel>Administration</SectionLabel>
          <h1>Admin Settings</h1>
        </div>

        <Card className="p-4 mb-3">
          <SectionLabel>Admin Account</SectionLabel>
          <div className="admin-field-block mb-0">
            <label className="admin-field-label">Email Address</label>
            <div className="settings-inline-update">
              <Input value={email} onChange={setEmail} type="email" />
              <button className="settings-update-btn" onClick={handleEmailUpdate}>Update</button>
            </div>
            {emailMsg && <p className="settings-msg">{emailMsg}</p>}
            {emailError && <p className="settings-error">{emailError}</p>}
          </div>
        </Card>

        <Card className="p-4 mb-3">
          <SectionLabel>Change Password</SectionLabel>
          <div className="admin-field-block">
            <label className="admin-field-label">Current Password</label>
            <Input type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="••••••••" />
          </div>
          <div className="admin-field-block mb-0">
            <label className="admin-field-label">New Password</label>
            <Input type="password" value={newPassword} onChange={setNewPassword} placeholder="Min. 8 characters" />
          </div>
          {passwordMsg && <p className="settings-msg">{passwordMsg}</p>}
          {passwordError && <p className="settings-error">{passwordError}</p>}
          <div className="mt-3">
            <BtnPrimary onClick={handlePasswordUpdate}>Update Password</BtnPrimary>
          </div>
        </Card>

        <Card className="p-4">
          <SectionLabel>Session</SectionLabel>
          <div className="settings-action-row">
            <div>
              <p className="settings-action-title">Log out</p>
              <p className="settings-action-sub">End your admin session.</p>
            </div>
            <BtnOutline onClick={() => { logout(); navigate('/') }}>Log Out</BtnOutline>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
