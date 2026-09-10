import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios, { BASE_URL, authHeaders } from '../api'
import { StudentLayout, SectionLabel, Card, StatusPill, BtnPrimary } from '../components/shared'
import '../css/ApplicationTracker.css'

// Same stat groupings as the Dashboard's Application Activity tile
// (spec section 28's "summary statistics": Total tracked, Applied,
// Interviews, Offers, Rejected, Ghosted).
const statConfig = [
  { key: 'total', label: 'Tracked', border: 'var(--navy)', bg: 'var(--navy-light)', text: 'var(--navy)' },
  { key: 'Applied', label: 'Applied', border: '#2563eb', bg: '#dbeafe', text: '#2563eb' },
  { key: 'Interview', label: 'Interviews', border: '#d97706', bg: '#fef3c7', text: '#d97706' },
  { key: 'Offer', label: 'Offers', border: '#059669', bg: '#dcfce7', text: '#059669' },
  { key: 'Rejected', label: 'Rejected', border: '#dc2626', bg: '#fee2e2', text: '#dc2626' },
  { key: 'Ghosted', label: 'Ghosted', border: 'var(--text-4)', bg: 'var(--bg)', text: 'var(--text-3)' },
]

// Exact 7 values from the applications.status enum (backend-readme.md) -
// anything else 500s, so "All" plus these 7 are the only tabs offered.
const statusTabs = ['All', 'Clicked Apply', 'Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted', 'Withdrawn']

export default function ApplicationTracker() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [activeTab, setActiveTab] = useState('All')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/applications/mine`, { headers: authHeaders() }).then(res => {
      setApplications(res.data)
      setLoaded(true)
    }).catch(err => { console.error(err); setLoaded(true) })
  }, [])

  const statCounts = { total: applications.length }
  for (let i = 0; i < applications.length; i++) {
    const status = applications[i].status
    statCounts[status] = (statCounts[status] || 0) + 1
  }

  const filtered = activeTab === 'All'
    ? applications
    : applications.filter(a => a.status === activeTab)

  return (
    <StudentLayout>
      <div className="tracker-wrap">
        <div className="tracker-header">
          <SectionLabel>Applications</SectionLabel>
          <h1>Application Tracker</h1>
          <p>Keep your internship search organized. The actual application happens on the company's own site - this just tracks where things stand.</p>
        </div>

        <div className="tracker-stat-grid">
          {statConfig.map(s => (
            <div key={s.key} className="tracker-stat-tile" style={{ background: s.bg, borderLeftColor: s.border }}>
              <p className="tracker-stat-value" style={{ color: s.text }}>{statCounts[s.key] || 0}</p>
              <p className="tracker-stat-label" style={{ color: s.text }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="tracker-tabs">
          {statusTabs.map(tab => (
            <button
              key={tab}
              className={`tracker-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loaded && filtered.length > 0 ? (
          <div className="tracker-list">
            {filtered.map(a => (
              <Card key={a.id} className="tracker-row" onClick={() => navigate(`/applications/${a.id}`)}>
                <div className="tracker-row-main">
                  <p className="tracker-row-title">{a.title}</p>
                  <p className="tracker-row-company">{a.company_name}</p>
                </div>
                <div className="tracker-row-meta">
                  <span className="tracker-row-date">Applied {new Date(a.clicked_date).toLocaleDateString()}</span>
                  {a.follow_up_date && (
                    <span className="tracker-row-date">Follow-up {new Date(a.follow_up_date).toLocaleDateString()}</span>
                  )}
                </div>
                <StatusPill status={a.status} />
              </Card>
            ))}
          </div>
        ) : loaded ? (
          <div className="tracker-empty">
            <p>No tracked applications yet.</p>
            <BtnPrimary onClick={() => navigate('/find-internships')}>Find Internships</BtnPrimary>
          </div>
        ) : (
          <div className="tracker-empty">Loading...</div>
        )}
      </div>
    </StudentLayout>
  )
}
