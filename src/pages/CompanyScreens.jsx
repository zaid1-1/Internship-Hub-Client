import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios, { BASE_URL, authHeaders } from '../api'
import {
  CompanyLayout, SectionLabel, Card, StatusPill, MatchChip, SkillTag,
  BtnPrimary, BtnOutline, BtnGhost, ActionBtn, TableHeader, idNameMap,
} from '../components/shared'
import '../css/CompanyDashboard.css'
import '../css/MyOpportunities.css'
import '../css/CompanyCandidates.css'
import '../css/CompanyCandidateProfile.css'

function Stub({ label, title }) {
  return (
    <CompanyLayout>
      <div className="container-fluid py-4 px-4">
        <SectionLabel>{label}</SectionLabel>
        <h1>{title}</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </CompanyLayout>
  )
}

// Same breakdown labels as InternshipDetails.jsx's student-facing match
// panel - the candidate profile shows the exact same calculateMatch
// output, just about the candidate instead of about the logged-in
// student, so the labels stay consistent across both audiences.
const breakdownLabels = {
  skills: 'Skills',
  field: 'Career Field',
  location: 'Location',
  type: 'Internship Type',
  education: 'Education',
}

// ============================================================
// COMPANY DASHBOARD (spec 41) - counters + a short recent list.
// No fake applicant metrics - every number here comes straight off
// GET /api/internships/mine (real rows this company actually owns).
// ============================================================
export function CompanyDashboard() {
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [internships, setInternships] = useState([])
  const [lookups, setLookups] = useState({ fields: {}, locations: {} })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/companies/me`, { headers: authHeaders() }).then(res => {
      setCompany(res.data)
    }).catch(err => console.error(err))

    axios.get(`${BASE_URL}/api/internships/mine`, { headers: authHeaders() }).then(res => {
      setInternships(res.data)
      setLoaded(true)
    }).catch(err => { console.error(err); setLoaded(true) })

    axios.get(`${BASE_URL}/api/fields`).then(res => {
      setLookups(prev => ({ ...prev, fields: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/locations`).then(res => {
      setLookups(prev => ({ ...prev, locations: idNameMap(res.data) }))
    })
  }, [])

  // Same "fetch once, tally with a plain for-loop" technique as
  // ApplicationTracker.jsx / StudentDashboard.jsx's own statCounts.
  const counts = { total: internships.length, Active: 0, Draft: 0, Expired: 0, Inactive: 0 }
  let totalViews = 0
  for (let i = 0; i < internships.length; i++) {
    const status = internships[i].status
    counts[status] = (counts[status] || 0) + 1
    totalViews += internships[i].views || 0
  }

  const tileConfig = [
    { key: 'total', label: 'Total Opportunities', border: 'var(--navy)', bg: 'var(--navy-light)', text: 'var(--navy)' },
    { key: 'Active', label: 'Active', border: '#059669', bg: '#dcfce7', text: '#059669' },
    { key: 'Draft', label: 'Draft', border: 'var(--text-4)', bg: 'var(--bg)', text: 'var(--text-3)' },
    { key: 'Expired', label: 'Expired', border: '#dc2626', bg: '#fee2e2', text: '#dc2626' },
    { key: 'views', label: 'Total Views', border: 'var(--teal)', bg: 'var(--teal-light)', text: 'var(--teal)' },
  ]

  // Already ordered newest-first by the backend (ORDER BY created_at DESC).
  const recent = internships.slice(0, 5)

  return (
    <CompanyLayout>
      <div className="cdash-wrap">
        <div className="cdash-header">
          <p className="cdash-header-label">Company Dashboard</p>
          <h1>Welcome back{company ? `, ${company.company_name}` : ''}.</h1>
          <p>Here is an overview of your internship opportunities.</p>
        </div>

        <div className="cdash-stat-grid">
          {tileConfig.map(t => (
            <div key={t.key} className="cdash-stat-tile" style={{ background: t.bg, borderLeftColor: t.border }}>
              <p className="cdash-stat-value" style={{ color: t.text }}>{t.key === 'views' ? totalViews : counts[t.key] || 0}</p>
              <p className="cdash-stat-label" style={{ color: t.text }}>{t.label}</p>
            </div>
          ))}
        </div>

        <Card className="p-4">
          <div className="cdash-section-head">
            <div>
              <SectionLabel>Recent Opportunities</SectionLabel>
              <h2 className="cdash-section-heading">Latest Posted</h2>
            </div>
            <BtnGhost onClick={() => navigate('/company/opportunities')}>View All →</BtnGhost>
          </div>

          {loaded && recent.length > 0 ? (
            <div className="cdash-recent-list">
              {recent.map(i => (
                <div key={i.id} className="cdash-recent-row">
                  <div className="cdash-recent-main">
                    <p className="cdash-recent-title">{i.title}</p>
                    <p className="cdash-recent-sub">
                      {[lookups.fields[i.field_id], lookups.locations[i.location_id]].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <StatusPill status={i.status} />
                  <span className="cdash-recent-deadline">
                    {i.application_deadline ? new Date(i.application_deadline).toLocaleDateString() : 'No deadline'}
                  </span>
                  <div className="cdash-recent-actions">
                    <ActionBtn label="View" onClick={() => navigate(`/company/opportunities/${i.id}/preview`)} />
                    <ActionBtn label="Candidates" onClick={() => navigate(`/company/opportunities/${i.id}/candidates`)} />
                  </div>
                </div>
              ))}
            </div>
          ) : loaded ? (
            <div className="cdash-empty">
              <p>You haven't posted any opportunities yet.</p>
              <BtnPrimary onClick={() => navigate('/company/opportunities/new')}>Create Opportunity</BtnPrimary>
            </div>
          ) : (
            <p className="cdash-muted">Loading...</p>
          )}
        </Card>
      </div>
    </CompanyLayout>
  )
}

// ============================================================
// MY OPPORTUNITIES (spec 42) - every one of the company's own
// internships, filterable by status, with the 5 spec-listed actions.
// ============================================================
const opportunityTabs = ['All', 'Active', 'Draft', 'Expired', 'Inactive']

export function MyOpportunities() {
  const navigate = useNavigate()
  const [internships, setInternships] = useState([])
  const [lookups, setLookups] = useState({ fields: {}, locations: {}, internshipTypes: {} })
  const [activeTab, setActiveTab] = useState('All')
  const [loaded, setLoaded] = useState(false)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)

  const loadInternships = () => {
    axios.get(`${BASE_URL}/api/internships/mine`, { headers: authHeaders() }).then(res => {
      setInternships(res.data)
      setLoaded(true)
    }).catch(err => { console.error(err); setLoaded(true) })
  }

  useEffect(() => {
    loadInternships()
    axios.get(`${BASE_URL}/api/fields`).then(res => {
      setLookups(prev => ({ ...prev, fields: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/locations`).then(res => {
      setLookups(prev => ({ ...prev, locations: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/internship-types`).then(res => {
      setLookups(prev => ({ ...prev, internshipTypes: idNameMap(res.data) }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = activeTab === 'All' ? internships : internships.filter(i => i.status === activeTab)

  // PATCH /:id/status toggles Draft/Inactive -> Active or Active -> Inactive,
  // same single "Activate/Deactivate" action spec 42 lists once (the
  // button label just flips based on current status).
  const handleToggleStatus = async (internship) => {
    const nextStatus = internship.status === 'Active' ? 'Inactive' : 'Active'
    try {
      await axios.patch(`${BASE_URL}/api/internships/${internship.id}/status`, { status: nextStatus }, { headers: authHeaders() })
      loadInternships()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/api/internships/${id}`, { headers: authHeaders() })
      setConfirmingDeleteId(null)
      loadInternships()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <CompanyLayout>
      <div className="myopps-wrap">
        <div className="myopps-header">
          <div>
            <SectionLabel>My Opportunities</SectionLabel>
            <h1>My Opportunities</h1>
            <p>Manage every internship opportunity you've posted.</p>
          </div>
          <BtnPrimary onClick={() => navigate('/company/opportunities/new')}>+ Create Opportunity</BtnPrimary>
        </div>

        <div className="myopps-tabs">
          {opportunityTabs.map(tab => (
            <button
              key={tab}
              className={`myopps-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loaded && filtered.length > 0 ? (
          <div className="myopps-table">
            <TableHeader cols={['Title', 'Field', 'Location', 'Type', 'Status', 'Deadline', 'Posted', 'Actions']} />
            {filtered.map(i => (
              <div key={i.id} className="myopps-row">
                <p className="myopps-cell myopps-title">{i.title}</p>
                <p className="myopps-cell">{lookups.fields[i.field_id] || '—'}</p>
                <p className="myopps-cell">{lookups.locations[i.location_id] || '—'}</p>
                <p className="myopps-cell">{lookups.internshipTypes[i.internship_type_id] || '—'}</p>
                <div className="myopps-cell"><StatusPill status={i.status} /></div>
                <p className="myopps-cell">{i.application_deadline ? new Date(i.application_deadline).toLocaleDateString() : '—'}</p>
                <p className="myopps-cell">{i.posted_date ? new Date(i.posted_date).toLocaleDateString() : 'Not posted'}</p>

                <div className="myopps-cell myopps-actions">
                  {confirmingDeleteId === i.id ? (
                    <div className="myopps-confirm-row">
                      <span>Delete this opportunity?</span>
                      <ActionBtn label="Yes, Delete" danger onClick={() => handleDelete(i.id)} />
                      <ActionBtn label="Cancel" onClick={() => setConfirmingDeleteId(null)} />
                    </div>
                  ) : (
                    <>
                      <ActionBtn label="View" onClick={() => navigate(`/company/opportunities/${i.id}/preview`)} />
                      <ActionBtn label="Candidates" onClick={() => navigate(`/company/opportunities/${i.id}/candidates`)} />
                      <ActionBtn label="Edit" onClick={() => navigate(`/company/opportunities/${i.id}/edit`)} />
                      <ActionBtn label={i.status === 'Active' ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(i)} />
                      <ActionBtn label="Delete" danger onClick={() => setConfirmingDeleteId(i.id)} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : loaded ? (
          <Card className="p-4">
            <p className="myopps-empty">
              {activeTab === 'All'
                ? "You haven't posted any opportunities yet."
                : `No ${activeTab.toLowerCase()} opportunities.`}
            </p>
            {activeTab === 'All' && (
              <BtnOutline onClick={() => navigate('/company/opportunities/new')}>Create Opportunity</BtnOutline>
            )}
          </Card>
        ) : (
          <p className="myopps-empty">Loading...</p>
        )}
      </div>
    </CompanyLayout>
  )
}

export function CreateInternship() {
  return <Stub label="Create Opportunity" title="Create Internship" />
}

export function EditInternship() {
  return <Stub label="Edit Opportunity" title="Edit Internship" />
}

export function InternshipPreview() {
  return <Stub label="Preview" title="Internship Preview" />
}

export function CompanyProfileEdit() {
  return <Stub label="Company Profile" title="Company Profile" />
}

export function CompanySettings() {
  return <Stub label="Settings" title="Company Settings" />
}

// ============================================================
// CANDIDATES FOR ONE OPPORTUNITY (spec 21-22) - reached only through
// My Opportunities -> a specific internship -> Candidates (spec 40:
// "Candidates should NOT be a global Company navigation item").
// GET /api/applications/candidates has no internship_id filter param,
// so this fetches the company's full candidate list once and filters
// client-side to this one internship - same "fetch once, filter" idea
// CompanyProfile.jsx already uses for internships and
// ApplicationDetails.jsx uses for a single application.
// ============================================================
export function CompanyCandidates() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [internship, setInternship] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [studyFields, setStudyFields] = useState({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/internships/${id}`).then(res => setInternship(res.data)).catch(err => console.error(err))

    axios.get(`${BASE_URL}/api/applications/candidates`, { headers: authHeaders() }).then(res => {
      setCandidates(res.data.filter(c => String(c.internship_id) === id))
      setLoaded(true)
    }).catch(err => { console.error(err); setLoaded(true) })

    axios.get(`${BASE_URL}/api/study-fields`).then(res => setStudyFields(idNameMap(res.data)))
  }, [id])

  return (
    <CompanyLayout>
      <div className="cand-wrap">
        <button className="cand-back" onClick={() => navigate('/company/opportunities')}>← Back to My Opportunities</button>

        <div className="cand-header">
          <SectionLabel>Candidates</SectionLabel>
          <h1>{internship ? `Candidates for ${internship.title}` : 'Candidates'}</h1>
          <p>
            {loaded
              ? `${candidates.length} candidate${candidates.length === 1 ? '' : 's'} have clicked Apply on this opportunity.`
              : 'Loading...'}
          </p>
        </div>

        {loaded && candidates.length > 0 ? (
          <div className="cand-list">
            {candidates.map(c => (
              <Card key={c.id} className="p-4 cand-card">
                <div className="cand-card-top">
                  <div>
                    <p className="cand-card-name">{c.first_name} {c.last_name}</p>
                    <p className="cand-card-sub">
                      {[c.university, studyFields[c.study_field_id]].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <MatchChip value={c.match_score} />
                </div>

                {c.matchingSkills?.length > 0 && (
                  <div className="cand-card-skills">
                    {c.matchingSkills.map(s => <SkillTag key={s.id} label={s.name} />)}
                  </div>
                )}

                <div className="cand-card-bottom">
                  <StatusPill status={c.status} />
                  <BtnOutline onClick={() => navigate(`/company/candidates/${c.id}`)}>View Profile</BtnOutline>
                </div>
              </Card>
            ))}
          </div>
        ) : loaded ? (
          <Card className="p-4">
            <p className="cand-empty">No candidates yet. Candidates appear here once a student clicks Apply on this opportunity.</p>
          </Card>
        ) : null}
      </div>
    </CompanyLayout>
  )
}

// ============================================================
// CANDIDATE PROFILE (spec 24-25) - full read-only professional profile
// for one candidate, backed by the new GET /api/applications/candidates/:id
// route (company-scoped, ownership-checked server-side). The company can
// see this candidate's tracking status but never edit it (spec 26) - no
// status control is rendered here at all.
// ============================================================
export function CompanyCandidateProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [lookups, setLookups] = useState({ locations: {}, educationLevels: {}, studyFields: {} })

  useEffect(() => {
    axios.get(`${BASE_URL}/api/applications/candidates/${id}`, { headers: authHeaders() }).then(res => {
      setCandidate(res.data)
    }).catch(err => {
      console.error(err)
      setNotFound(true)
    })

    axios.get(`${BASE_URL}/api/locations`).then(res => {
      setLookups(prev => ({ ...prev, locations: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/education-levels`).then(res => {
      setLookups(prev => ({ ...prev, educationLevels: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/study-fields`).then(res => {
      setLookups(prev => ({ ...prev, studyFields: idNameMap(res.data) }))
    })
  }, [id])

  if (notFound) {
    return (
      <CompanyLayout>
        <div className="candprofile-wrap">
          <p className="candprofile-muted">That candidate couldn't be found.</p>
          <BtnOutline onClick={() => navigate('/company/opportunities')}>Back to My Opportunities</BtnOutline>
        </div>
      </CompanyLayout>
    )
  }

  if (!candidate) {
    return (
      <CompanyLayout>
        <div className="candprofile-wrap"><p className="candprofile-muted">Loading...</p></div>
      </CompanyLayout>
    )
  }

  const studyFieldName = lookups.studyFields[candidate.study_field_id]
  const subtitle = [
    studyFieldName ? `${studyFieldName} Student` : 'Student',
    candidate.headline,
  ].filter(Boolean).join(' | ')

  const links = [
    { label: 'GitHub', url: candidate.github_url },
    { label: 'LinkedIn', url: candidate.linkedin_url },
    { label: 'Portfolio', url: candidate.portfolio_url },
    { label: 'Personal Website', url: candidate.personal_website_url },
  ].filter(l => l.url)

  return (
    <CompanyLayout>
      <div className="candprofile-wrap">
        <button className="cand-back" onClick={() => navigate(`/company/opportunities/${candidate.internship_id}/candidates`)}>
          ← Back to Candidates
        </button>

        <Card className="p-4 mb-4">
          <div className="candprofile-header">
            <div>
              <SectionLabel>Candidate Profile</SectionLabel>
              <h1>{candidate.first_name} {candidate.last_name}</h1>
              <p className="candprofile-subtitle">{subtitle}</p>
              <p className="candprofile-meta">
                {[candidate.university, lookups.locations[candidate.location_id]].filter(Boolean).join(' · ')}
                {candidate.expected_graduation_year && ` · Expected Graduation: ${candidate.expected_graduation_year}`}
              </p>
              <div className="candprofile-status-row">
                <StatusPill status={candidate.status} />
                <span className="candprofile-status-note">Tracking status is managed by the candidate.</span>
              </div>
            </div>
            <MatchChip value={candidate.match_score} />
          </div>
        </Card>

        <div className="candprofile-grid">
          <div className="candprofile-main">
            <Card className="p-4 mb-4">
              <SectionLabel>About</SectionLabel>
              <p className="candprofile-text">{candidate.about || 'No summary provided.'}</p>
            </Card>

            <Card className="p-4 mb-4">
              <SectionLabel>Education</SectionLabel>
              <div className="candprofile-edu-grid">
                <div>
                  <p className="candprofile-label">University</p>
                  <p className="candprofile-value">{candidate.university || '—'}</p>
                </div>
                <div>
                  <p className="candprofile-label">Degree</p>
                  <p className="candprofile-value">{lookups.educationLevels[candidate.degree_level_id] || '—'}</p>
                </div>
                <div>
                  <p className="candprofile-label">Field of Study</p>
                  <p className="candprofile-value">{studyFieldName || '—'}</p>
                </div>
                <div>
                  <p className="candprofile-label">GPA</p>
                  <p className="candprofile-value">{candidate.gpa || '—'}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 mb-4">
              <SectionLabel>Skills</SectionLabel>
              {candidate.skills?.length > 0 ? (
                <div className="candprofile-skill-wrap">
                  {candidate.skills.map(s => <SkillTag key={s.id} label={s.name} />)}
                </div>
              ) : (
                <p className="candprofile-text">No skills added.</p>
              )}
            </Card>

            <Card className="p-4 mb-4">
              <SectionLabel>Projects</SectionLabel>
              {candidate.projects?.length > 0 ? (
                <div className="candprofile-subitem-list">
                  {candidate.projects.map(p => (
                    <div key={p.id} className="candprofile-subitem">
                      <p className="candprofile-subitem-title">{p.name}</p>
                      {p.technologies && <p className="candprofile-subitem-subtitle">{p.technologies}</p>}
                      {p.description && <p className="candprofile-subitem-desc">{p.description}</p>}
                      {(p.github_url || p.demo_url) && (
                        <div className="candprofile-subitem-links">
                          {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer">GitHub</a>}
                          {p.demo_url && <a href={p.demo_url} target="_blank" rel="noopener noreferrer">Live Demo</a>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="candprofile-text">No projects added.</p>
              )}
            </Card>

            <Card className="p-4 mb-4">
              <SectionLabel>Experience</SectionLabel>
              {candidate.experience?.length > 0 ? (
                <div className="candprofile-subitem-list">
                  {candidate.experience.map(e => {
                    const range = [e.start_date, e.end_date].filter(Boolean).join(' – ')
                    return (
                      <div key={e.id} className="candprofile-subitem">
                        <p className="candprofile-subitem-title">{e.title}</p>
                        <p className="candprofile-subitem-subtitle">{e.organization}{range && ` · ${range}`}</p>
                        {e.description && <p className="candprofile-subitem-desc">{e.description}</p>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="candprofile-text">No experience added.</p>
              )}
            </Card>

            <Card className="p-4 mb-4">
              <SectionLabel>Certifications</SectionLabel>
              {candidate.certifications?.length > 0 ? (
                <div className="candprofile-subitem-list">
                  {candidate.certifications.map(c => (
                    <div key={c.id} className="candprofile-subitem">
                      <p className="candprofile-subitem-title">{c.name}</p>
                      <p className="candprofile-subitem-subtitle">{c.issuing_organization}{c.date && ` · ${c.date}`}</p>
                      {c.credential_url && (
                        <div className="candprofile-subitem-links">
                          <a href={c.credential_url} target="_blank" rel="noopener noreferrer">View Credential</a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="candprofile-text">No certifications added.</p>
              )}
            </Card>

            <Card className="p-4">
              <SectionLabel>CV</SectionLabel>
              {candidate.cv_url ? (
                <a className="candprofile-cv-link" href={`${BASE_URL}${candidate.cv_url}`} target="_blank" rel="noopener noreferrer">
                  View / Download CV
                </a>
              ) : (
                <p className="candprofile-text">No CV uploaded.</p>
              )}
            </Card>
          </div>

          <div className="candprofile-side">
            <Card className="p-4 mb-4">
              <SectionLabel>Match Breakdown</SectionLabel>
              {candidate.match_breakdown && Object.keys(candidate.match_breakdown).map(key => (
                <div key={key} className="candprofile-breakdown-row">
                  <div className="candprofile-breakdown-top">
                    <span>{breakdownLabels[key] || key}</span>
                    <span>{candidate.match_breakdown[key]}%</span>
                  </div>
                  <div className="candprofile-bar-track">
                    <div className="candprofile-bar-fill" style={{ width: `${candidate.match_breakdown[key]}%` }} />
                  </div>
                </div>
              ))}
            </Card>

            {candidate.matchingSkills?.length > 0 && (
              <Card className="p-4 mb-4">
                <SectionLabel>Matching Skills</SectionLabel>
                <div className="candprofile-skill-wrap">
                  {candidate.matchingSkills.map(s => <SkillTag key={s.id} label={s.name} />)}
                </div>
              </Card>
            )}

            {candidate.missingSkills?.length > 0 && (
              <Card className="p-4 mb-4">
                <SectionLabel>Missing Requirement</SectionLabel>
                <div className="candprofile-skill-wrap">
                  {candidate.missingSkills.map(s => <SkillTag key={s.id} label={s.name} missing />)}
                </div>
              </Card>
            )}

            <Card className="p-4">
              <SectionLabel>Professional Links</SectionLabel>
              {links.length > 0 ? (
                <div className="candprofile-links-list">
                  {links.map(l => (
                    <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="candprofile-ext-link">
                      {l.label} →
                    </a>
                  ))}
                </div>
              ) : (
                <p className="candprofile-text">No links added.</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </CompanyLayout>
  )
}
