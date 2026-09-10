import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios, { BASE_URL, authHeaders } from '../api'
import {
  CompanyLayout, SectionLabel, Card, StatusPill, MatchChip, SkillTag,
  BtnPrimary, BtnOutline, BtnGhost, ActionBtn, TableHeader, idNameMap,
  Input, Badge,
} from '../components/shared'
import '../css/CompanyDashboard.css'
import '../css/MyOpportunities.css'
import '../css/CompanyCandidates.css'
import '../css/CompanyCandidateProfile.css'
import '../css/ProfilePage.css'
import '../css/InternshipForm.css'
import '../css/InternshipPreview.css'

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

// Same accordion pattern as ProfilePage.jsx's own local Section component
// (not exported from there, so duplicated here - same call already made
// for breakdownLabels below, matching this project's established
// "small page-local UI pieces get duplicated, only true cross-page
// pieces live in shared.jsx" convention). Styles come from ProfilePage.css
// (imported above) - .accordion-section/.accordion-header/.accordion-body.
function Section({ id, title, openSection, setOpenSection, children }) {
  const isOpen = openSection === id
  return (
    <div className={`accordion-section ${isOpen ? 'open' : ''}`}>
      <button className="accordion-header" onClick={() => setOpenSection(isOpen ? null : id)}>
        <span>{title}</span>
        <span className="accordion-chevron">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && <div className="accordion-body">{children}</div>}
    </div>
  )
}

// internship_duration / experience_level enum values - see
// backend-readme.md's Enum reference table. Sending anything else 500s,
// same as every other enum column in this project.
const DURATION_OPTIONS = ['1-2 months', '3 months', '4-6 months', '6+ months']
const EXPERIENCE_LEVEL_OPTIONS = [
  'No experience required',
  'Some experience preferred',
  'Relevant coursework required',
]

const BLANK_INTERNSHIP_FORM = {
  title: '', description: '', field_id: '',
  location_id: '', work_arrangement_id: '', internship_type_id: '',
  duration: '', experience_level: '', application_deadline: '',
  required_degree_level_id: '', required_study_field_id: '',
  responsibilities: '', requirements: '', benefits: '', additional_info: '',
  external_application_url: '',
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

// ============================================================
// CREATE / EDIT INTERNSHIP (spec 43-44) - "Same structure as Create
// Internship," per spec 44, so this is one shared form component driven
// by a `mode` prop, same idea as ProfilePage.jsx's SubResourceList being
// one component reused for projects/experience/certifications instead
// of three near-identical ones.
//
// Two scope calls made while building this form, both about spec
// wording that doesn't map onto a real schema column:
// - Spec 43's Education section lists "Academic level if required" as a
//   third field alongside Degree and Field of study, but internships
//   only has two education-related columns (required_degree_level_id,
//   required_study_field_id) - there's no separate "academic level"
//   anywhere in schema.sql. Folded into the Degree field's own label
//   ("Degree / Academic Level") rather than inventing a column that
//   doesn't exist in the database.
// - The "Preview" action (both here and from My Opportunities' "View")
//   needs a real, already-created internship to show - there's no
//   unsaved-draft-preview mechanism anywhere else in this project. So
//   clicking Preview on an unsaved Create form saves it first (as
//   Draft if it doesn't already have a status), then opens the same
//   Preview screen used everywhere else, instead of introducing a
//   separate "preview unsaved form data" code path.
// ============================================================
function InternshipForm({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState(BLANK_INTERNSHIP_FORM)
  const [selectedSkills, setSelectedSkills] = useState([])
  const [availableSkills, setAvailableSkills] = useState([])
  const [fields, setFields] = useState([])
  const [locations, setLocations] = useState([])
  const [workArrangements, setWorkArrangements] = useState([])
  const [internshipTypes, setInternshipTypes] = useState([])
  const [educationLevels, setEducationLevels] = useState([])
  const [studyFields, setStudyFields] = useState([])
  const [skillSearch, setSkillSearch] = useState('')
  const [openSection, setOpenSection] = useState('basic')
  const [loaded, setLoaded] = useState(mode === 'create')
  const [notFound, setNotFound] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/skills`).then(res => setAvailableSkills(res.data))
    axios.get(`${BASE_URL}/api/fields`).then(res => setFields(res.data))
    axios.get(`${BASE_URL}/api/locations`).then(res => setLocations(res.data))
    axios.get(`${BASE_URL}/api/work-arrangements`).then(res => setWorkArrangements(res.data))
    axios.get(`${BASE_URL}/api/internship-types`).then(res => setInternshipTypes(res.data))
    axios.get(`${BASE_URL}/api/education-levels`).then(res => setEducationLevels(res.data))
    axios.get(`${BASE_URL}/api/study-fields`).then(res => setStudyFields(res.data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Edit mode loads the existing internship via GET /api/internships/mine
  // filtered client-side to this id - same "fetch once, filter" pattern
  // as CompanyCandidates/CompanyProfile/ApplicationDetails - rather than
  // the public GET /api/internships/:id, which increments that
  // internship's views counter on every call (fine for a public visitor,
  // wrong for the owning company just opening its own edit form).
  useEffect(() => {
    if (mode !== 'edit') return
    axios.get(`${BASE_URL}/api/internships/mine`, { headers: authHeaders() }).then(res => {
      const found = res.data.find(i => String(i.id) === id)
      if (!found) {
        setNotFound(true)
        setLoaded(true)
        return
      }
      setForm({
        title: found.title || '',
        description: found.description || '',
        field_id: found.field_id || '',
        location_id: found.location_id || '',
        work_arrangement_id: found.work_arrangement_id || '',
        internship_type_id: found.internship_type_id || '',
        duration: found.duration || '',
        experience_level: found.experience_level || '',
        application_deadline: found.application_deadline ? String(found.application_deadline).slice(0, 10) : '',
        required_degree_level_id: found.required_degree_level_id || '',
        required_study_field_id: found.required_study_field_id || '',
        responsibilities: found.responsibilities || '',
        requirements: found.requirements || '',
        benefits: found.benefits || '',
        additional_info: found.additional_info || '',
        external_application_url: found.external_application_url || '',
      })
      setLoaded(true)
    }).catch(err => { console.error(err); setNotFound(true); setLoaded(true) })

    axios.get(`${BASE_URL}/api/internships/${id}/skills`).then(res => setSelectedSkills(res.data)).catch(err => console.error(err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, id])

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  // Create mode: the internship doesn't exist yet, so selected skills are
  // just held in local state and attached with one junction POST per
  // skill right after the main create POST returns an id. Edit mode: the
  // internship already exists, so this mirrors ProfilePage.jsx's own
  // toggleSkill - an immediate POST/DELETE per click, independent of the
  // form's own Save button.
  const toggleSkill = async (skill) => {
    const isSelected = selectedSkills.some(s => s.id === skill.id)
    if (mode === 'edit') {
      try {
        if (isSelected) {
          await axios.delete(`${BASE_URL}/api/internships/${id}/skills/${skill.id}`, { headers: authHeaders() })
        } else {
          await axios.post(`${BASE_URL}/api/internships/${id}/skills`, { skill_id: skill.id }, { headers: authHeaders() })
        }
      } catch (err) {
        console.error(err)
        return
      }
    }
    setSelectedSkills(prev => (isSelected ? prev.filter(s => s.id !== skill.id) : [...prev, skill]))
  }

  // Shared save routine for all three Create actions and Edit's Save/
  // Preview. Returns the internship id on success (needed by the
  // Preview button to know where to navigate), or null on failure.
  const handleSave = async (statusOverride) => {
    if (!form.title || !form.description || !form.external_application_url) {
      setFormError('Title, Description, and External Application URL are required.')
      return null
    }
    setFormError('')
    setSaving(true)
    try {
      if (mode === 'create') {
        const res = await axios.post(
          `${BASE_URL}/api/internships`,
          { ...form, status: statusOverride || 'Draft' },
          { headers: authHeaders() }
        )
        const newId = res.data.id
        for (let i = 0; i < selectedSkills.length; i++) {
          await axios.post(`${BASE_URL}/api/internships/${newId}/skills`, { skill_id: selectedSkills[i].id }, { headers: authHeaders() })
        }
        setSaving(false)
        return newId
      } else {
        await axios.put(`${BASE_URL}/api/internships/${id}`, form, { headers: authHeaders() })
        setSaving(false)
        return id
      }
    } catch (err) {
      console.error(err)
      setSaving(false)
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Something went wrong. Please try again.')
      return null
    }
  }

  const handleSaveDraft = async () => {
    const savedId = await handleSave('Draft')
    if (savedId) navigate('/company/opportunities')
  }

  const handlePublish = async () => {
    const savedId = await handleSave('Active')
    if (savedId) navigate('/company/opportunities')
  }

  const handleSaveChanges = async () => {
    const savedId = await handleSave()
    if (savedId) navigate('/company/opportunities')
  }

  const handlePreview = async () => {
    const savedId = await handleSave(mode === 'create' ? 'Draft' : undefined)
    if (savedId) navigate(`/company/opportunities/${savedId}/preview`)
  }

  if (mode === 'edit' && notFound) {
    return (
      <CompanyLayout>
        <div className="ifw-wrap">
          <p className="profile-muted">That opportunity couldn't be found.</p>
          <BtnOutline onClick={() => navigate('/company/opportunities')}>Back to My Opportunities</BtnOutline>
        </div>
      </CompanyLayout>
    )
  }

  if (!loaded) {
    return (
      <CompanyLayout>
        <div className="ifw-wrap"><p className="profile-muted">Loading...</p></div>
      </CompanyLayout>
    )
  }

  const filteredSkills = skillSearch
    ? availableSkills.filter(s => s.name.toLowerCase().includes(skillSearch.toLowerCase()))
    : availableSkills

  const sectionProps = { openSection, setOpenSection }

  return (
    <CompanyLayout>
      <div className="ifw-wrap">
        <div className="ifw-header">
          <SectionLabel>{mode === 'create' ? 'Create Opportunity' : 'Edit Opportunity'}</SectionLabel>
          <h1>{mode === 'create' ? 'Create Internship' : 'Edit Internship'}</h1>
          <p>Fill in the details below. You can save a draft and come back to finish it later.</p>
        </div>

        <Section id="basic" title="Basic Information" {...sectionProps}>
          <div className="field-block">
            <label className="field-label">Title *</label>
            <Input placeholder="e.g. Frontend Developer Intern" value={form.title} onChange={v => setField('title', v)} />
          </div>
          <div className="field-block">
            <label className="field-label">Description *</label>
            <textarea rows={4} className="field-textarea" value={form.description} onChange={e => setField('description', e.target.value)} />
          </div>
          <div className="field-block">
            <label className="field-label">Field</label>
            <select className="form-select" value={form.field_id} onChange={e => setField('field_id', e.target.value || '')}>
              <option value="">Not specified</option>
              {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </Section>

        <Section id="details" title="Internship Details" {...sectionProps}>
          <div className="field-grid">
            <div className="field-block">
              <label className="field-label">Location</label>
              <select className="form-select" value={form.location_id} onChange={e => setField('location_id', e.target.value || '')}>
                <option value="">Not specified</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Work Arrangement</label>
              <select className="form-select" value={form.work_arrangement_id} onChange={e => setField('work_arrangement_id', e.target.value || '')}>
                <option value="">Not specified</option>
                {workArrangements.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Internship Type</label>
              <select className="form-select" value={form.internship_type_id} onChange={e => setField('internship_type_id', e.target.value || '')}>
                <option value="">Not specified</option>
                {internshipTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Duration</label>
              <select className="form-select" value={form.duration} onChange={e => setField('duration', e.target.value || '')}>
                <option value="">Not specified</option>
                {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Experience Level</label>
              <select className="form-select" value={form.experience_level} onChange={e => setField('experience_level', e.target.value || '')}>
                <option value="">Not specified</option>
                {EXPERIENCE_LEVEL_OPTIONS.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Application Deadline</label>
              <input type="date" className="form-input" value={form.application_deadline} onChange={e => setField('application_deadline', e.target.value || '')} />
            </div>
          </div>
        </Section>

        <Section id="education" title="Education" {...sectionProps}>
          <div className="field-grid">
            <div className="field-block">
              <label className="field-label">Degree / Academic Level</label>
              <select className="form-select" value={form.required_degree_level_id} onChange={e => setField('required_degree_level_id', e.target.value || '')}>
                <option value="">Not required</option>
                {educationLevels.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Field of Study</label>
              <select className="form-select" value={form.required_study_field_id} onChange={e => setField('required_study_field_id', e.target.value || '')}>
                <option value="">Not required</option>
                {studyFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
        </Section>

        <Section id="skills" title="Required Skills" {...sectionProps}>
          <p className="field-note field-note-spaced">Select the skills a candidate needs from the platform's skill list.</p>
          {selectedSkills.length > 0 && (
            <div className="selected-tags-box">
              {selectedSkills.map(s => (
                <button key={s.id} className="selected-tag-chip" onClick={() => toggleSkill(s)}>{s.name} ×</button>
              ))}
            </div>
          )}
          <div className="field-block">
            <Input placeholder="Search skills..." value={skillSearch} onChange={setSkillSearch} />
          </div>
          <div className="tag-toggle-wrap">
            {filteredSkills.map(s => (
              <button
                key={s.id}
                className={`tag-toggle ${selectedSkills.some(sel => sel.id === s.id) ? 'active' : ''}`}
                onClick={() => toggleSkill(s)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </Section>

        <Section id="additional" title="Additional Information" {...sectionProps}>
          <div className="field-block">
            <label className="field-label">Responsibilities</label>
            <textarea rows={3} className="field-textarea" value={form.responsibilities} onChange={e => setField('responsibilities', e.target.value)} />
          </div>
          <div className="field-block">
            <label className="field-label">Requirements</label>
            <textarea rows={3} className="field-textarea" value={form.requirements} onChange={e => setField('requirements', e.target.value)} />
          </div>
          <div className="field-block">
            <label className="field-label">Benefits</label>
            <textarea rows={3} className="field-textarea" value={form.benefits} onChange={e => setField('benefits', e.target.value)} />
          </div>
          <div className="field-block">
            <label className="field-label">Additional Details</label>
            <textarea rows={3} className="field-textarea" value={form.additional_info} onChange={e => setField('additional_info', e.target.value)} />
          </div>
        </Section>

        <Section id="external" title="External Application" {...sectionProps}>
          <div className="field-block">
            <label className="field-label">External Application URL *</label>
            <Input placeholder="https://yourcompany.com/careers/apply" value={form.external_application_url} onChange={v => setField('external_application_url', v)} />
            <p className="field-note">Students click Apply and are sent here to actually apply - this platform only tracks that they clicked.</p>
          </div>
        </Section>

        {formError && <p className="profile-save-error">{formError}</p>}

        <div className="ifw-actions-row">
          {mode === 'create' ? (
            <>
              <BtnOutline onClick={handleSaveDraft}>{saving ? 'Saving...' : 'Save as Draft'}</BtnOutline>
              <BtnOutline onClick={handlePreview}>Preview</BtnOutline>
              <BtnPrimary onClick={handlePublish}>Publish</BtnPrimary>
            </>
          ) : (
            <>
              <BtnGhost onClick={() => navigate('/company/opportunities')}>Cancel</BtnGhost>
              <BtnOutline onClick={handlePreview}>Preview</BtnOutline>
              <BtnPrimary onClick={handleSaveChanges}>{saving ? 'Saving...' : 'Save Changes'}</BtnPrimary>
            </>
          )}
        </div>
      </div>
    </CompanyLayout>
  )
}

export function CreateInternship() {
  return <InternshipForm mode="create" />
}

export function EditInternship() {
  return <InternshipForm mode="edit" />
}

// ============================================================
// INTERNSHIP PREVIEW (spec 45) - what the public listing will look like.
// Reached from My Opportunities' "View" action (any status, including
// Draft) and from the Create/Edit form's own Preview button. Loads via
// GET /api/internships/mine filtered client-side to this id - same
// views-counter-avoidance reasoning as EditInternship above, not the
// public GET /api/internships/:id.
// ============================================================
export function InternshipPreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [internship, setInternship] = useState(null)
  const [company, setCompany] = useState(null)
  const [skills, setSkills] = useState([])
  const [notFound, setNotFound] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [lookups, setLookups] = useState({
    locations: {}, workArrangements: {}, internshipTypes: {}, fields: {}, studyFields: {}, educationLevels: {},
  })

  useEffect(() => {
    axios.get(`${BASE_URL}/api/internships/mine`, { headers: authHeaders() }).then(res => {
      const found = res.data.find(i => String(i.id) === id)
      if (!found) { setNotFound(true); setLoaded(true); return }
      setInternship(found)
      setLoaded(true)
    }).catch(err => { console.error(err); setNotFound(true); setLoaded(true) })

    axios.get(`${BASE_URL}/api/internships/${id}/skills`).then(res => setSkills(res.data)).catch(err => console.error(err))
    axios.get(`${BASE_URL}/api/companies/me`, { headers: authHeaders() }).then(res => setCompany(res.data)).catch(err => console.error(err))

    axios.get(`${BASE_URL}/api/locations`).then(res => setLookups(prev => ({ ...prev, locations: idNameMap(res.data) })))
    axios.get(`${BASE_URL}/api/work-arrangements`).then(res => setLookups(prev => ({ ...prev, workArrangements: idNameMap(res.data) })))
    axios.get(`${BASE_URL}/api/internship-types`).then(res => setLookups(prev => ({ ...prev, internshipTypes: idNameMap(res.data) })))
    axios.get(`${BASE_URL}/api/fields`).then(res => setLookups(prev => ({ ...prev, fields: idNameMap(res.data) })))
    axios.get(`${BASE_URL}/api/study-fields`).then(res => setLookups(prev => ({ ...prev, studyFields: idNameMap(res.data) })))
    axios.get(`${BASE_URL}/api/education-levels`).then(res => setLookups(prev => ({ ...prev, educationLevels: idNameMap(res.data) })))
  }, [id])

  if (notFound) {
    return (
      <CompanyLayout>
        <div className="ipreview-wrap">
          <p className="profile-muted">That opportunity couldn't be found.</p>
          <BtnOutline onClick={() => navigate('/company/opportunities')}>Back to My Opportunities</BtnOutline>
        </div>
      </CompanyLayout>
    )
  }

  if (!loaded || !internship) {
    return (
      <CompanyLayout>
        <div className="ipreview-wrap"><p className="profile-muted">Loading...</p></div>
      </CompanyLayout>
    )
  }

  return (
    <CompanyLayout>
      <div className="ipreview-wrap">
        <button className="cand-back" onClick={() => navigate('/company/opportunities')}>← Back to My Opportunities</button>

        <div className="ipreview-banner">
          <p className="ipreview-banner-title">Preview Mode</p>
          <p className="ipreview-banner-desc">This is what students will see once this opportunity is Active.</p>
        </div>

        <Card className="p-4 mb-4">
          <div className="ipreview-top">
            <div>
              <SectionLabel>Internship Preview</SectionLabel>
              <h1>{internship.title}</h1>
              <p className="ipreview-company">{company?.company_name}</p>
              <div className="ipreview-badges">
                <StatusPill status={internship.status} />
                {lookups.workArrangements[internship.work_arrangement_id] && <Badge label={lookups.workArrangements[internship.work_arrangement_id]} />}
                {lookups.internshipTypes[internship.internship_type_id] && <Badge label={lookups.internshipTypes[internship.internship_type_id]} />}
              </div>
            </div>
            <BtnOutline onClick={() => navigate(`/company/opportunities/${id}/edit`)}>Edit</BtnOutline>
          </div>

          <div className="ipreview-info-grid">
            <div>
              <p className="ipreview-info-label">Location</p>
              <p className="ipreview-info-value">{lookups.locations[internship.location_id] || 'Not specified'}</p>
            </div>
            <div>
              <p className="ipreview-info-label">Duration</p>
              <p className="ipreview-info-value">{internship.duration || 'Not specified'}</p>
            </div>
            <div>
              <p className="ipreview-info-label">Deadline</p>
              <p className="ipreview-info-value">
                {internship.application_deadline ? new Date(internship.application_deadline).toLocaleDateString() : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="ipreview-info-label">Field</p>
              <p className="ipreview-info-value">{lookups.fields[internship.field_id] || 'Not specified'}</p>
            </div>
          </div>

          {internship.external_application_url && (
            <a className="ipreview-apply-link" href={internship.external_application_url} target="_blank" rel="noopener noreferrer">
              External Apply Button →
            </a>
          )}
        </Card>

        <Card className="p-4 mb-4">
          <SectionLabel>About the Internship</SectionLabel>
          <p className="candprofile-text">{internship.description || 'No description provided.'}</p>
        </Card>

        {internship.responsibilities && (
          <Card className="p-4 mb-4">
            <SectionLabel>Responsibilities</SectionLabel>
            <p className="candprofile-text">{internship.responsibilities}</p>
          </Card>
        )}

        <Card className="p-4 mb-4">
          <SectionLabel>Requirements</SectionLabel>
          <div className="ipreview-info-grid">
            <div>
              <p className="ipreview-info-label">Experience Level</p>
              <p className="ipreview-info-value">{internship.experience_level || 'Not specified'}</p>
            </div>
            <div>
              <p className="ipreview-info-label">Education Level</p>
              <p className="ipreview-info-value">{lookups.educationLevels[internship.required_degree_level_id] || 'Not specified'}</p>
            </div>
            <div>
              <p className="ipreview-info-label">Field of Study</p>
              <p className="ipreview-info-value">{lookups.studyFields[internship.required_study_field_id] || 'Not specified'}</p>
            </div>
          </div>
          {internship.requirements && <p className="candprofile-text" style={{ marginTop: 10 }}>{internship.requirements}</p>}
        </Card>

        {skills.length > 0 && (
          <Card className="p-4 mb-4">
            <SectionLabel>Required Skills</SectionLabel>
            <div className="candprofile-skill-wrap">
              {skills.map(s => <SkillTag key={s.id} label={s.name} />)}
            </div>
          </Card>
        )}

        {internship.benefits && (
          <Card className="p-4 mb-4">
            <SectionLabel>Benefits</SectionLabel>
            <p className="candprofile-text">{internship.benefits}</p>
          </Card>
        )}

        {internship.additional_info && (
          <Card className="p-4">
            <SectionLabel>Additional Information</SectionLabel>
            <p className="candprofile-text">{internship.additional_info}</p>
          </Card>
        )}
      </div>
    </CompanyLayout>
  )
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
