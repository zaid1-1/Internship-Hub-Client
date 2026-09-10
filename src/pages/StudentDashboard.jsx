import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner, Alert } from 'react-bootstrap'
import axios, { BASE_URL, authHeaders } from '../api'
import {
  StudentLayout, SectionLabel, Card, ProgressBar, BtnOutline, BtnGhost,
  InternshipCard, idNameMap,
} from '../components/shared'
import '../css/StudentDashboard.css'

// Small motivational quote card - GET /api/quotes/daily proxies ZenQuotes
// server-side (see routes/quotes.js), fetched here with the same plain
// on-mount axios call as everything else in this file. Loading/error
// states use react-bootstrap's Spinner and Alert directly - a second,
// equally simple react-bootstrap usage alongside shared.jsx's Modal, in
// a spot with no Figma design to match against (the prototype has no
// quote widget). Kept local to this file rather than added to
// shared.jsx, same "small page-local UI pieces get duplicated" rule
// CompanyScreens.jsx's own Section component already follows.
function DailyQuote() {
  const [quote, setQuote] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/quotes/daily`).then(res => {
      setQuote(res.data)
    }).catch(() => setError(true))
  }, [])

  return (
    <Card className="p-4 mb-4 quote-card">
      <SectionLabel>Daily Motivation</SectionLabel>
      {error ? (
        <Alert variant="secondary" className="mb-0">
          Couldn't load today's quote right now.
        </Alert>
      ) : quote ? (
        <blockquote className="quote-text">
          "{quote.q}"
          <footer className="quote-author">— {quote.a}</footer>
        </blockquote>
      ) : (
        <div className="quote-loading">
          <Spinner animation="border" size="sm" />
          <span>Loading today's quote...</span>
        </div>
      )}
    </Card>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const statConfig = [
  { key: 'total', label: 'Tracked', border: 'var(--navy)', bg: 'var(--navy-light)', text: 'var(--navy)' },
  { key: 'Applied', label: 'Applied', border: '#2563eb', bg: '#dbeafe', text: '#2563eb' },
  { key: 'Interview', label: 'Interviews', border: '#d97706', bg: '#fef3c7', text: '#d97706' },
  { key: 'Offer', label: 'Offers', border: '#059669', bg: '#dcfce7', text: '#059669' },
  { key: 'Rejected', label: 'Rejected', border: '#dc2626', bg: '#fee2e2', text: '#dc2626' },
  { key: 'Ghosted', label: 'Ghosted', border: 'var(--text-4)', bg: 'var(--bg)', text: 'var(--text-3)' },
]

// Fields the profile checklist below can currently do something about.
// Photo/CV/Projects/Experience aren't wired up until a later batch, so
// they're left out rather than showing a permanently-unfixable item.
function computeCompletion(profile, skills, interests) {
  const items = [
    { key: 'headline', label: 'Add a professional headline', done: !!profile.headline },
    { key: 'about', label: 'Add an About Me summary', done: !!profile.about },
    { key: 'university', label: 'Add your university', done: !!profile.university },
    { key: 'academic_year', label: 'Add your academic year', done: !!profile.academic_year },
    { key: 'skills', label: 'Add at least one skill', done: skills.length > 0 },
    { key: 'interests', label: 'Add a career interest', done: interests.length > 0 },
    { key: 'preferred_location_id', label: 'Add a preferred location', done: !!profile.preferred_location_id },
    { key: 'preferred_duration', label: 'Add a preferred duration', done: !!profile.preferred_duration },
    { key: 'github_url', label: 'Add a professional link', done: !!(profile.github_url || profile.linkedin_url || profile.portfolio_url) },
  ]
  const done = items.filter(i => i.done).length
  const percent = Math.round((done / items.length) * 100)
  const missing = items.filter(i => !i.done).map(i => i.label)
  return { percent, missing }
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [skills, setSkills] = useState([])
  const [interests, setInterests] = useState([])
  const [applications, setApplications] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [savedIds, setSavedIds] = useState([])
  const [lookups, setLookups] = useState({ locations: {}, workArrangements: {}, internshipTypes: {} })

  useEffect(() => {
    axios.get(`${BASE_URL}/api/students/me`, { headers: authHeaders() }).then(res => {
      setProfile(res.data.profile)
      setSkills(res.data.skills)
      setInterests(res.data.interests)
    }).catch(err => console.error(err))

    axios.get(`${BASE_URL}/api/applications/mine`, { headers: authHeaders() }).then(res => {
      setApplications(res.data)
    }).catch(err => console.error(err))

    axios.get(`${BASE_URL}/api/students/me/recommendations`, { headers: authHeaders() }).then(res => {
      setRecommendations(res.data)
    }).catch(err => console.error(err))

    // Without this, InternshipCard's Save button always starts unsaved
    // here (it defaults savedIds to []), even for internships already
    // saved from another page - clicking it then re-POSTs an already-
    // saved internship_id and the button silently fails to update.
    axios.get(`${BASE_URL}/api/saved`, { headers: authHeaders() }).then(res => {
      setSavedIds(res.data.map(i => i.id))
    }).catch(err => console.error(err))

    axios.get(`${BASE_URL}/api/locations`).then(res => {
      setLookups(prev => ({ ...prev, locations: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/work-arrangements`).then(res => {
      setLookups(prev => ({ ...prev, workArrangements: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/internship-types`).then(res => {
      setLookups(prev => ({ ...prev, internshipTypes: idNameMap(res.data) }))
    })
  }, [])

  if (!profile) {
    return (
      <StudentLayout>
        <div className="dash-wrap"><p className="dash-muted">Loading...</p></div>
      </StudentLayout>
    )
  }

  const { percent, missing } = computeCompletion(profile, skills, interests)

  const statCounts = { total: applications.length }
  for (let i = 0; i < applications.length; i++) {
    const status = applications[i].status
    statCounts[status] = (statCounts[status] || 0) + 1
  }

  const reminders = applications
    .filter(a => a.follow_up_date)
    .sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date))
    .slice(0, 3)

  const topRecommendations = recommendations.slice(0, 4)

  // Tally how often each missing skill shows up across recommended
  // internships - a real, derived stand-in for "skills employers are
  // asking for" since the backend has no dedicated aggregate route.
  const skillGapCounts = {}
  for (let i = 0; i < recommendations.length; i++) {
    const missingSkills = recommendations[i].missingSkills || []
    for (let j = 0; j < missingSkills.length; j++) {
      const name = missingSkills[j].name
      skillGapCounts[name] = (skillGapCounts[name] || 0) + 1
    }
  }
  const topSkillGaps = Object.keys(skillGapCounts)
    .map(name => ({ name, count: skillGapCounts[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  return (
    <StudentLayout>
      <div className="dash-wrap">
        <div className="dash-header">
          <p className="dash-header-label">Student Dashboard</p>
          <h1>{greeting()}, {profile.first_name}.</h1>
          <p>Here is an overview of your internship search.</p>
        </div>

        <DailyQuote />

        <div className="dash-top-row">
          <Card className="p-4">
            <SectionLabel>Profile Completion</SectionLabel>
            <div className="completion-pct-row">
              <span className="completion-pct">{percent}%</span>
              <span className="completion-pct-label">complete</span>
            </div>
            <ProgressBar value={percent} color="teal" />
            <div className="completion-items">
              {missing.slice(0, 3).map(label => (
                <div key={label} className="completion-item">
                  <span className="dash-teal-icon">○</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="dash-btn-spacer">
              <BtnOutline onClick={() => navigate('/profile')}>Complete Profile</BtnOutline>
            </div>
          </Card>

          <Card className="p-4">
            <SectionLabel>Application Activity</SectionLabel>
            <div className="stat-grid">
              {statConfig.map(s => (
                <div
                  key={s.key}
                  className="stat-tile"
                  style={{ background: s.bg, borderLeftColor: s.border }}
                  onClick={() => navigate('/applications')}
                >
                  <p className="stat-tile-value" style={{ color: s.text }}>{statCounts[s.key] || 0}</p>
                  <p className="stat-tile-label" style={{ color: s.text }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div className="dash-btn-spacer">
              <BtnGhost onClick={() => navigate('/applications')}>View All Applications →</BtnGhost>
            </div>
          </Card>
        </div>

        <Card className="p-4 mb-4">
          <SectionLabel>Reminders &amp; Upcoming</SectionLabel>
          {reminders.length > 0 ? (
            <div>
              {reminders.map(r => (
                <div key={r.id} className="reminder-row">
                  <div className="reminder-left">
                    <span className="reminder-dot" />
                    <div>
                      <p className="reminder-title">Follow up: {r.title}</p>
                      <p className="reminder-sub">{r.company_name}</p>
                    </div>
                  </div>
                  <span className="reminder-date">{new Date(r.follow_up_date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="dash-empty">
              No follow-up dates set yet. Add one from your Application Tracker to see reminders here.
            </p>
          )}
        </Card>

        <div className="mb-4">
          <div className="dash-section-head">
            <div>
              <SectionLabel>Recommended for You</SectionLabel>
              <h2>Top Matches</h2>
            </div>
            <BtnGhost onClick={() => navigate('/recommended')}>View all →</BtnGhost>
          </div>
          {topRecommendations.length > 0 ? (
            <div className="dash-recs-grid">
              {topRecommendations.map(i => (
                <InternshipCard key={i.id} internship={i} lookups={lookups} savedIds={savedIds} matchScore={i.match_score} />
              ))}
            </div>
          ) : (
            <p className="dash-empty">No recommendations yet — complete your profile to get matched.</p>
          )}
        </div>

        <Card className="p-4">
          <div className="dash-section-head">
            <div>
              <SectionLabel>Skill Gaps</SectionLabel>
              <h2 className="dash-section-head-sm">Skills employers are asking for</h2>
            </div>
            <BtnGhost onClick={() => navigate('/skill-gaps')}>View Skill Gaps →</BtnGhost>
          </div>
          {topSkillGaps.length > 0 ? (
            <div className="skill-gap-tile-row">
              {topSkillGaps.map(s => (
                <div key={s.name} className="skill-gap-tile">
                  <p className="skill-gap-tile-name">{s.name}</p>
                  <p className="skill-gap-tile-count">Required by {s.count} of your recommended internships</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="dash-empty">No skill gaps found in your recommendations right now.</p>
          )}
        </Card>
      </div>
    </StudentLayout>
  )
}
