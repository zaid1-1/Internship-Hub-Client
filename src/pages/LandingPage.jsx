import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios, { BASE_URL, authHeaders } from '../api'
import { useAuth } from '../context/AuthContext'
import {
  Navbar, InternshipCard, BtnPrimary, BtnOutline, SectionLabel, idNameMap,
} from '../components/shared'
import './LandingPage.css'

const stats = [
  { label: 'Opportunities', value: '340+', accent: 'var(--navy)' },
  { label: 'Companies', value: '90+', accent: 'var(--teal)' },
  { label: 'Fields', value: '18', accent: 'var(--navy)' },
  { label: 'Students', value: '4,200+', accent: 'var(--teal)' },
]

const valueProps = [
  {
    title: 'Discover',
    desc: 'Find internship opportunities across companies and fields in Jordan.',
    bg: 'var(--navy-light)', color: 'var(--navy)', n: '01',
  },
  {
    title: 'Match',
    desc: 'See how well your skills, interests, education, and preferences match an internship.',
    bg: 'var(--teal-light)', color: 'var(--teal)', n: '02',
  },
  {
    title: 'Track',
    desc: 'Keep your internship search organized and track applications through the external company process.',
    bg: 'var(--navy-light)', color: 'var(--navy)', n: '03',
  },
]

const howItWorks = [
  { n: '1', title: 'Create your profile', desc: 'Add your education, skills, career interests, and preferences.' },
  { n: '2', title: 'Discover matching internships', desc: 'Browse personalized recommendations ranked by how well they fit your profile.' },
  { n: '3', title: 'Apply on the company website', desc: 'Click the external apply link and submit your application directly to the company.' },
  { n: '4', title: 'Track your application', desc: 'Record the application in your tracker and update the status as you progress.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isStudent = user?.role === 'student'
  const [keyword, setKeyword] = useState('')
  const [fieldId, setFieldId] = useState('')
  const [locationId, setLocationId] = useState('')

  const [fields, setFields] = useState([])
  const [locations, setLocations] = useState([])
  const [featured, setFeatured] = useState([])
  const [savedIds, setSavedIds] = useState([])
  const [lookups, setLookups] = useState({ locations: {}, workArrangements: {}, internshipTypes: {} })

  useEffect(() => {
    axios.get(`${BASE_URL}/api/fields`).then(res => setFields(res.data))
    axios.get(`${BASE_URL}/api/locations`).then(res => {
      setLocations(res.data)
      setLookups(prev => ({ ...prev, locations: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/work-arrangements`).then(res => {
      setLookups(prev => ({ ...prev, workArrangements: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/internship-types`).then(res => {
      setLookups(prev => ({ ...prev, internshipTypes: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/internships`).then(res => setFeatured(res.data.slice(0, 3)))

    // Same reason as every other InternshipCard-rendering page: without
    // this, a logged-in student's Save button here always starts
    // unsaved, even for internships they already saved elsewhere.
    if (isStudent) {
      axios.get(`${BASE_URL}/api/saved`, { headers: authHeaders() }).then(res => {
        setSavedIds(res.data.map(i => i.id))
      }).catch(err => console.error(err))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => {
    navigate('/browse', { state: { keyword, fieldId, locationId } })
  }

  return (
    <div>
      <Navbar />

      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-content">
            <span className="hero-badge">
              <span className="hero-badge-dot" />
              Jordan Internship Hub
            </span>

            <h1 className="hero-title">
              Find internships<br />
              <span className="hero-title-accent">that fit you.</span>
            </h1>

            <p className="hero-desc">
              Discover relevant internship opportunities across Jordan, compare them to your skills and
              interests, and organize your entire internship search in one place.
            </p>

            <div className="hero-search">
              <div className="hero-search-row">
                <input
                  className="form-input"
                  placeholder="Search internships..."
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
                />
                <select className="form-select" value={fieldId} onChange={e => setFieldId(e.target.value)}>
                  <option value="">All fields</option>
                  {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <select className="form-select" value={locationId} onChange={e => setLocationId(e.target.value)}>
                  <option value="">All locations</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <BtnPrimary onClick={handleSearch}>Search Internships</BtnPrimary>
            </div>

            <div className="hero-cta-row">
              <BtnPrimary onClick={() => navigate('/register')}>Create Student Profile</BtnPrimary>
              <BtnOutline onClick={() => navigate('/browse')}>Browse Internships</BtnOutline>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-inner">
          {stats.map(s => (
            <div key={s.label} className="stat-box">
              <p className="stat-value" style={{ color: s.accent }}>{s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-wrap">
        <div className="section-head">
          <SectionLabel>What We Offer</SectionLabel>
          <h2>Everything you need for your internship search</h2>
        </div>
        <div className="value-grid">
          {valueProps.map(v => (
            <div key={v.title} className="value-card">
              <div className="value-icon" style={{ background: v.bg, color: v.color }}>●</div>
              <p className="value-num">{v.n}</p>
              <p className="value-title">{v.title}</p>
              <p className="value-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="featured-section">
        <div className="section-wrap" style={{ padding: '0 24px' }}>
          <div className="featured-head">
            <div>
              <SectionLabel>Featured Opportunities</SectionLabel>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-sans)' }}>
                Recently Added Internships
              </h2>
            </div>
            <button className="featured-view-all" onClick={() => navigate('/browse')}>View all →</button>
          </div>
          {featured.length > 0 ? (
            <div className="featured-grid">
              {featured.map(i => (
                <InternshipCard key={i.id} internship={i} lookups={lookups} savedIds={savedIds} />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No internships posted yet — check back soon.</p>
          )}
        </div>
      </section>

      <section className="section-wrap">
        <div className="section-head">
          <SectionLabel>How It Works</SectionLabel>
          <h2>From profile to placement in four steps</h2>
        </div>
        <div className="how-grid">
          {howItWorks.map(s => (
            <div key={s.n} className="how-card">
              <div className="how-num">{s.n}</div>
              <p className="how-title">{s.title}</p>
              <p className="how-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-box">
          <h2>Ready to find your internship?</h2>
          <p>Create a profile, get matched, and track your progress all in one place.</p>
          <div className="cta-buttons">
            <BtnPrimary onClick={() => navigate('/register')}>Create Student Profile</BtnPrimary>
            <BtnOutline onClick={() => navigate('/browse')}>Browse Internships</BtnOutline>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <p>Jordan Internship Hub</p>
              <p>Connecting students and fresh graduates in Jordan with quality internship opportunities.</p>
            </div>
            <div className="footer-cols">
              <div>
                <p className="footer-col-title">Platform</p>
                <div className="footer-links">
                  <button className="footer-link-btn" onClick={() => navigate('/browse')}>Find Internships</button>
                  <span className="footer-link-static">For Companies</span>
                  <span className="footer-link-static">About</span>
                </div>
              </div>
              <div>
                <p className="footer-col-title">Legal</p>
                <div className="footer-links">
                  <span className="footer-link-static">Terms</span>
                  <span className="footer-link-static">Privacy</span>
                  <span className="footer-link-static">Contact</span>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">© 2026 Jordan Internship Hub. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
