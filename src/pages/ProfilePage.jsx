import { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import axios, { BASE_URL, authHeaders } from '../api'
import { StudentLayout, SectionLabel, Input, BtnPrimary, BtnOutline, ActionBtn } from '../components/shared'
import '../css/ProfilePage.css'

const CHECK_ITEMS = [
  { key: 'headline', label: 'Professional headline', matchField: false },
  { key: 'about', label: 'About me', matchField: false },
  { key: 'university', label: 'University', matchField: true },
  { key: 'academic_year', label: 'Academic year', matchField: true },
  { key: 'skills', label: 'Skills', matchField: true },
  { key: 'interests', label: 'Career interests', matchField: true },
  { key: 'preferred_location_id', label: 'Preferred location', matchField: true },
  { key: 'preferred_duration', label: 'Preferred duration', matchField: true },
  { key: 'github_url', label: 'Professional link', matchField: false },
]

// Fields for each of the three professional sub-resources - the labels/
// placeholders/input types shown in the add/edit form. Keys match exactly
// what the backend's subResourceRouter.js factory expects for that table
// (see routes/projects.js, experience.js, certifications.js), so the form
// state can be POSTed/PUT straight through with no reshaping.
const PROJECT_FIELDS = [
  { key: 'name', label: 'Project Name' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'technologies', label: 'Technologies', placeholder: 'React, Node.js, PostgreSQL' },
  { key: 'github_url', label: 'GitHub URL', placeholder: 'github.com/you/project' },
  { key: 'demo_url', label: 'Live Demo URL (optional)', placeholder: 'yourproject.com' },
]

const EXPERIENCE_FIELDS = [
  { key: 'title', label: 'Position / Title' },
  { key: 'organization', label: 'Organization' },
  { key: 'start_date', label: 'Start Date', type: 'date' },
  { key: 'end_date', label: 'End Date (leave blank if current)', type: 'date' },
  { key: 'description', label: 'Description', type: 'textarea' },
]

const CERTIFICATION_FIELDS = [
  { key: 'name', label: 'Certification Name' },
  { key: 'issuing_organization', label: 'Issuing Organization' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'credential_id', label: 'Credential ID (optional)' },
  { key: 'credential_url', label: 'Credential URL (optional)' },
]

function renderProjectItem(p) {
  return (
    <>
      <p className="subresource-item-title">{p.name}</p>
      {p.technologies && <p className="subresource-item-subtitle">{p.technologies}</p>}
      {p.description && <p className="subresource-item-desc">{p.description}</p>}
      {(p.github_url || p.demo_url) && (
        <div className="subresource-item-links">
          {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer">GitHub</a>}
          {p.demo_url && <a href={p.demo_url} target="_blank" rel="noopener noreferrer">Live Demo</a>}
        </div>
      )}
    </>
  )
}

function renderExperienceItem(e) {
  const range = [e.start_date, e.end_date].filter(Boolean).join(' – ')
  return (
    <>
      <p className="subresource-item-title">{e.title}</p>
      <p className="subresource-item-subtitle">{e.organization}{range && ` · ${range}`}</p>
      {e.description && <p className="subresource-item-desc">{e.description}</p>}
    </>
  )
}

function renderCertificationItem(c) {
  return (
    <>
      <p className="subresource-item-title">{c.name}</p>
      <p className="subresource-item-subtitle">{c.issuing_organization}{c.date && ` · ${c.date}`}</p>
      {c.credential_id && <p className="subresource-item-desc">Credential ID: {c.credential_id}</p>}
      {c.credential_url && (
        <div className="subresource-item-links">
          <a href={c.credential_url} target="_blank" rel="noopener noreferrer">View Credential</a>
        </div>
      )}
    </>
  )
}

function isItemDone(item, profile, skills, interests) {
  if (item.key === 'skills') return skills.length > 0
  if (item.key === 'interests') return interests.length > 0
  if (item.key === 'github_url') return !!(profile.github_url || profile.linkedin_url || profile.portfolio_url)
  return !!profile[item.key]
}

function computeCompletion(profile, skills, interests) {
  const done = CHECK_ITEMS.filter(i => isItemDone(i, profile, skills, interests)).length
  return Math.round((done / CHECK_ITEMS.length) * 100)
}

function Section({ id, title, matchField, openSection, setOpenSection, children }) {
  const isOpen = openSection === id
  return (
    <div className={`accordion-section ${isOpen ? 'open' : ''}`}>
      <button className="accordion-header" onClick={() => setOpenSection(isOpen ? null : id)}>
        <span>{title}{matchField && <span className="completion-match-marker">  ◎</span>}</span>
        <span className="accordion-chevron">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && <div className="accordion-body">{children}</div>}
    </div>
  )
}

// Generic add/edit/delete panel for the student's professional
// sub-resources (projects, experience, certifications). All three share
// the exact same CRUD shape on the backend (subResourceRouter.js's
// factory), so this is the frontend's equivalent - one component, driven
// by `apiPath` + `fields`, instead of three near-identical ones. Fetches
// its own list on mount (same self-contained pattern already used by
// FilterSidebar in shared.jsx), and sends full-body POST/PUT with
// exactly the keys `fields` declares, matching the backend's
// `fields.map(f => req.body[f])` expectations.
function SubResourceList({ apiPath, fields, renderItem, addLabel, emptyLabel }) {
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({})
  const [formError, setFormError] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)

  useEffect(() => {
    axios.get(`${BASE_URL}${apiPath}`, { headers: authHeaders() }).then(res => {
      setItems(res.data)
      setLoaded(true)
    }).catch(err => { console.error(err); setLoaded(true) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setFormField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const openAdd = () => {
    const blank = {}
    fields.forEach(f => { blank[f.key] = '' })
    setForm(blank)
    setEditingId(null)
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (item) => {
    const values = {}
    fields.forEach(f => { values[f.key] = item[f.key] || '' })
    setForm(values)
    setEditingId(item.id)
    setFormError('')
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setFormError('')
    try {
      if (editingId) {
        const res = await axios.put(`${BASE_URL}${apiPath}/${editingId}`, form, { headers: authHeaders() })
        setItems(prev => prev.map(i => (i.id === editingId ? res.data : i)))
      } else {
        const res = await axios.post(`${BASE_URL}${apiPath}`, form, { headers: authHeaders() })
        setItems(prev => [...prev, res.data])
      }
      setShowModal(false)
    } catch (err) {
      console.error(err)
      if (err.response) {
        setFormError(err.response.data?.message || err.response.data?.error || 'Something went wrong. Please try again.')
      } else {
        setFormError(`Could not reach the server at ${BASE_URL}. Make sure the backend is running.`)
      }
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}${apiPath}/${id}`, { headers: authHeaders() })
      setItems(prev => prev.filter(i => i.id !== id))
      setConfirmingId(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      {loaded && items.length === 0 && <p className="placeholder-note">{emptyLabel}</p>}

      {items.length > 0 && (
        <div className="subresource-list">
          {items.map(item => (
            <div key={item.id} className="subresource-item">
              <div className="subresource-item-body">{renderItem(item)}</div>
              {confirmingId === item.id ? (
                <div className="subresource-confirm-row">
                  <span>Delete this entry?</span>
                  <ActionBtn label="Yes, Delete" danger onClick={() => handleDelete(item.id)} />
                  <ActionBtn label="Cancel" onClick={() => setConfirmingId(null)} />
                </div>
              ) : (
                <div className="subresource-item-actions">
                  <ActionBtn label="Edit" onClick={() => openEdit(item)} />
                  <ActionBtn label="Delete" danger onClick={() => setConfirmingId(item.id)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="subresource-add-row">
        <BtnOutline onClick={openAdd}>{addLabel}</BtnOutline>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Body className="p-4">
          <h2 className="auth-modal-title">{editingId ? 'Edit Entry' : addLabel}</h2>
          {fields.map(f => (
            <div key={f.key} className="field-block">
              <label className="field-label">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  className="field-textarea"
                  value={form[f.key] || ''}
                  onChange={e => setFormField(f.key, e.target.value)}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  className="form-input"
                  placeholder={f.placeholder || ''}
                  value={form[f.key] || ''}
                  onChange={e => setFormField(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
          {formError && <p className="profile-save-error">{formError}</p>}
          <div className="d-flex flex-column gap-2">
            <BtnPrimary full onClick={handleSubmit}>Save</BtnPrimary>
            <button onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [skills, setSkills] = useState([])
  const [interests, setInterests] = useState([])
  const [availableSkills, setAvailableSkills] = useState([])
  const [availableFields, setAvailableFields] = useState([])
  const [locations, setLocations] = useState([])
  const [workArrangements, setWorkArrangements] = useState([])
  const [internshipTypes, setInternshipTypes] = useState([])
  const [educationLevels, setEducationLevels] = useState([])
  const [studyFields, setStudyFields] = useState([])
  const [skillSearch, setSkillSearch] = useState('')
  const [openSection, setOpenSection] = useState('education')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [cvUploading, setCvUploading] = useState(false)
  const [cvError, setCvError] = useState('')

  function loadProfile() {
    axios.get(`${BASE_URL}/api/students/me`, { headers: authHeaders() }).then(res => {
      setProfile(res.data.profile)
      setSkills(res.data.skills)
      setInterests(res.data.interests)
    }).catch(err => console.error(err))
  }

  useEffect(() => {
    loadProfile()
    axios.get(`${BASE_URL}/api/skills`).then(res => setAvailableSkills(res.data))
    axios.get(`${BASE_URL}/api/fields`).then(res => setAvailableFields(res.data))
    axios.get(`${BASE_URL}/api/locations`).then(res => setLocations(res.data))
    axios.get(`${BASE_URL}/api/work-arrangements`).then(res => setWorkArrangements(res.data))
    axios.get(`${BASE_URL}/api/internship-types`).then(res => setInternshipTypes(res.data))
    axios.get(`${BASE_URL}/api/education-levels`).then(res => setEducationLevels(res.data))
    axios.get(`${BASE_URL}/api/study-fields`).then(res => setStudyFields(res.data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setField = (key, value) => setProfile(prev => ({ ...prev, [key]: value }))

  const toggleSkill = async (skill) => {
    const isSelected = skills.some(s => s.id === skill.id)
    try {
      if (isSelected) {
        await axios.delete(`${BASE_URL}/api/students/me/skills/${skill.id}`, { headers: authHeaders() })
        setSkills(prev => prev.filter(s => s.id !== skill.id))
      } else {
        await axios.post(`${BASE_URL}/api/students/me/skills`, { skill_id: skill.id }, { headers: authHeaders() })
        setSkills(prev => [...prev, skill])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const toggleInterest = async (field) => {
    const isSelected = interests.some(i => i.id === field.id)
    try {
      if (isSelected) {
        await axios.delete(`${BASE_URL}/api/students/me/interests/${field.id}`, { headers: authHeaders() })
        setInterests(prev => prev.filter(i => i.id !== field.id))
      } else {
        await axios.post(`${BASE_URL}/api/students/me/interests`, { field_id: field.id }, { headers: authHeaders() })
        setInterests(prev => [...prev, field])
      }
    } catch (err) {
      console.error(err)
    }
  }

  // POST /api/students/me/photo and /me/cv both take a multipart file
  // upload and immediately return the updated student_profiles row -
  // setProfile(res.data) below keeps local state in sync the same way
  // handleSave already does for the full-body PUT, so no separate "Save"
  // click is needed for either upload.
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoError('')
    setPhotoUploading(true)
    const formData = new FormData()
    formData.append('photo', file)
    try {
      const res = await axios.post(`${BASE_URL}/api/students/me/photo`, formData, { headers: authHeaders() })
      setProfile(res.data)
    } catch (err) {
      console.error(err)
      setPhotoError('Could not upload photo. Please try again.')
    } finally {
      setPhotoUploading(false)
      e.target.value = ''
    }
  }

  const handleCvUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCvError('')
    setCvUploading(true)
    const formData = new FormData()
    formData.append('cv', file)
    try {
      const res = await axios.post(`${BASE_URL}/api/students/me/cv`, formData, { headers: authHeaders() })
      setProfile(res.data)
    } catch (err) {
      console.error(err)
      setCvError('Could not upload CV. Please try again.')
    } finally {
      setCvUploading(false)
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    setSaveError('')
    try {
      const res = await axios.put(`${BASE_URL}/api/students/me`, profile, { headers: authHeaders() })
      setProfile(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
      if (err.response) {
        setSaveError(err.response.data?.message || err.response.data?.error || 'Something went wrong. Please try again.')
      } else {
        setSaveError(`Could not reach the server at ${BASE_URL}. Make sure the backend is running.`)
      }
    }
  }

  const handleDiscard = () => {
    setSaveError('')
    loadProfile()
  }

  if (!profile) {
    return (
      <StudentLayout>
        <div className="profile-wrap"><p className="profile-muted">Loading...</p></div>
      </StudentLayout>
    )
  }

  const completion = computeCompletion(profile, skills, interests)
  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()

  const filteredSkills = skillSearch
    ? availableSkills.filter(s => s.name.toLowerCase().includes(skillSearch.toLowerCase()))
    : availableSkills

  const sectionProps = { openSection, setOpenSection }

  return (
    <StudentLayout>
      <div className="profile-wrap">
        <div className="profile-page-header">
          <SectionLabel>Account</SectionLabel>
          <h1>My Profile</h1>
          <p>Your profile is used for internship matching and is visible to companies when you apply.</p>
        </div>

        <div className="profile-header-card">
          <div className="profile-avatar">
            {profile.photo_url ? (
              <img src={`${BASE_URL}${profile.photo_url}`} alt="" className="profile-avatar-img" />
            ) : (
              initials || '?'
            )}
          </div>
          <div className="profile-header-info">
            <div>
              <h2 className="profile-name">{profile.first_name} {profile.last_name}</h2>
              {profile.headline && <p className="profile-headline-sub">{profile.headline}</p>}
              <p className="profile-meta-sub">
                {profile.university || 'University not set'}
                {locations.find(l => l.id === profile.location_id) && ` · ${locations.find(l => l.id === profile.location_id).name}`}
              </p>
            </div>
            <div className="profile-completion-side">
              <p className="profile-completion-label">Profile completion</p>
              <p className="profile-completion-pct">{completion}%</p>
              <div className="profile-completion-track">
                <div className="profile-completion-fill" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="completion-checklist-card">
          <SectionLabel>Profile Completion</SectionLabel>
          <div className="completion-grid">
            {CHECK_ITEMS.map(item => {
              const done = isItemDone(item, profile, skills, interests)
              return (
                <div key={item.key} className="completion-check-item">
                  <span style={{ color: done ? 'var(--teal)' : 'var(--border-dark)', fontWeight: 700 }}>{done ? '✓' : '○'}</span>
                  <span style={{ color: done ? 'var(--text-1)' : 'var(--text-4)' }}>{item.label}</span>
                  {item.matchField && <span className="completion-match-marker">◎</span>}
                </div>
              )
            })}
          </div>
          <p className="completion-footnote"><span className="profile-teal-icon">◎</span> These fields are used for internship matching</p>
        </div>

        <Section id="basic" title="Basic Information" {...sectionProps}>
          <div className="field-block">
            <label className="field-label">Profile Photo</label>
            <div className="upload-row">
              {profile.photo_url ? (
                <img src={`${BASE_URL}${profile.photo_url}`} alt="" className="upload-avatar-preview" />
              ) : (
                <div className="upload-avatar-placeholder">{initials || '?'}</div>
              )}
              <div>
                <input type="file" accept="image/*" id="photo-upload-input" className="upload-file-input" onChange={handlePhotoUpload} />
                <label htmlFor="photo-upload-input" className="btn-navy-outline upload-file-label">
                  {photoUploading ? 'Uploading...' : 'Upload Photo'}
                </label>
                <p className="field-note">JPG or PNG. Not mandatory.</p>
              </div>
            </div>
            {photoError && <p className="profile-save-error">{photoError}</p>}
          </div>
          <div className="field-grid">
            <div className="field-block">
              <label className="field-label">Phone</label>
              <Input placeholder="07xxxxxxxx" value={profile.phone || ''} onChange={v => setField('phone', v)} />
            </div>
            <div className="field-block">
              <label className="field-label">Location</label>
              <select className="form-select" value={profile.location_id || ''} onChange={e => setField('location_id', e.target.value || null)}>
                <option value="">Not specified</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
        </Section>

        <Section id="about" title="About Me" {...sectionProps}>
          <div className="field-block">
            <label className="field-label">Professional Headline</label>
            <Input placeholder="e.g. Computer Science Student | Software Engineering" value={profile.headline || ''} onChange={v => setField('headline', v)} />
          </div>
          <div className="field-block">
            <label className="field-label">About Me</label>
            <textarea
              rows={4}
              className="field-textarea"
              value={profile.about || ''}
              onChange={e => setField('about', e.target.value)}
            />
            <p className="field-note">Displayed to companies on your candidate profile. Not used in matching.</p>
          </div>
        </Section>

        <Section id="education" title="Education" matchField {...sectionProps}>
          <div className="field-grid">
            <div className="field-block field-full">
              <label className="field-label">University</label>
              <Input placeholder="University of Jordan" value={profile.university || ''} onChange={v => setField('university', v)} />
            </div>
            <div className="field-block">
              <label className="field-label">Degree Level</label>
              <select className="form-select" value={profile.degree_level_id || ''} onChange={e => setField('degree_level_id', e.target.value || null)}>
                <option value="">Not specified</option>
                {educationLevels.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Field of Study</label>
              <select className="form-select" value={profile.study_field_id || ''} onChange={e => setField('study_field_id', e.target.value || null)}>
                <option value="">Not specified</option>
                {studyFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Academic Year</label>
              <select className="form-select" value={profile.academic_year || ''} onChange={e => setField('academic_year', e.target.value || null)}>
                <option value="">Not specified</option>
                <option>Year 1</option>
                <option>Year 2</option>
                <option>Year 3</option>
                <option>Year 4</option>
                <option>Graduated</option>
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Expected Graduation Year</label>
              <input
                type="number"
                className="form-input"
                placeholder="2027"
                value={profile.expected_graduation_year || ''}
                onChange={e => setField('expected_graduation_year', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div className="field-block">
              <label className="field-label">GPA (optional)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="e.g. 3.6"
                value={profile.gpa ?? ''}
                onChange={e => setField('gpa', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>
        </Section>

        <Section id="skills" title="Skills" matchField {...sectionProps}>
          <p className="field-note field-note-spaced">
            Select your skills from the predefined list. Skills are used for internship matching and shown to companies.
          </p>
          {skills.length > 0 && (
            <div className="selected-tags-box">
              {skills.map(s => (
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
                className={`tag-toggle ${skills.some(sel => sel.id === s.id) ? 'active' : ''}`}
                onClick={() => toggleSkill(s)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </Section>

        <Section id="interests" title="Career Interests" matchField {...sectionProps}>
          <p className="field-note field-note-spaced">
            Select the fields you are interested in. Used for recommendations and matching.
          </p>
          <div className="tag-toggle-wrap">
            {availableFields.map(f => (
              <button
                key={f.id}
                className={`tag-toggle interest ${interests.some(sel => sel.id === f.id) ? 'active' : ''}`}
                onClick={() => toggleInterest(f)}
              >
                {f.name}
              </button>
            ))}
          </div>
        </Section>

        <Section id="preferences" title="Internship Preferences" matchField {...sectionProps}>
          <div className="field-grid">
            <div className="field-block">
              <label className="field-label">Preferred Location</label>
              <select className="form-select" value={profile.preferred_location_id || ''} onChange={e => setField('preferred_location_id', e.target.value || null)}>
                <option value="">Any</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Work Arrangement</label>
              <select className="form-select" value={profile.preferred_work_arrangement_id || ''} onChange={e => setField('preferred_work_arrangement_id', e.target.value || null)}>
                <option value="">Any</option>
                {workArrangements.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Internship Type</label>
              <select className="form-select" value={profile.preferred_internship_type_id || ''} onChange={e => setField('preferred_internship_type_id', e.target.value || null)}>
                <option value="">Any</option>
                {internshipTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label className="field-label">Preferred Duration</label>
              <select className="form-select" value={profile.preferred_duration || ''} onChange={e => setField('preferred_duration', e.target.value || null)}>
                <option value="">Any</option>
                <option value="1-2 months">1-2 months</option>
                <option value="3 months">3 months</option>
                <option value="4-6 months">4-6 months</option>
                <option value="6+ months">6+ months</option>
              </select>
            </div>
          </div>
        </Section>

        <Section id="projects" title="Projects" {...sectionProps}>
          <p className="field-note field-note-spaced">Showcase projects you've built. Visible to companies on your candidate profile.</p>
          <SubResourceList
            apiPath="/api/projects"
            fields={PROJECT_FIELDS}
            renderItem={renderProjectItem}
            addLabel="Add Project"
            emptyLabel="No projects added yet."
          />
        </Section>

        <Section id="experience" title="Experience" {...sectionProps}>
          <p className="field-note field-note-spaced">Internships, part-time jobs, volunteer work, or freelance work. Optional.</p>
          <SubResourceList
            apiPath="/api/experience"
            fields={EXPERIENCE_FIELDS}
            renderItem={renderExperienceItem}
            addLabel="Add Experience"
            emptyLabel="No experience added yet."
          />
        </Section>

        <Section id="certifications" title="Certifications" {...sectionProps}>
          <p className="field-note field-note-spaced">Certifications you've earned. Optional.</p>
          <SubResourceList
            apiPath="/api/certifications"
            fields={CERTIFICATION_FIELDS}
            renderItem={renderCertificationItem}
            addLabel="Add Certification"
            emptyLabel="No certifications added yet."
          />
        </Section>

        <Section id="cv" title="CV / Resume" {...sectionProps}>
          <div className="field-block">
            {profile.cv_url && (
              <p className="field-note field-note-spaced">
                <a href={`${BASE_URL}${profile.cv_url}`} target="_blank" rel="noopener noreferrer">View current CV</a>
              </p>
            )}
            <input type="file" accept=".pdf,.doc,.docx" id="cv-upload-input" className="upload-file-input" onChange={handleCvUpload} />
            <label htmlFor="cv-upload-input" className="btn-navy-outline upload-file-label">
              {cvUploading ? 'Uploading...' : profile.cv_url ? 'Replace CV' : 'Upload CV'}
            </label>
            <p className="field-note">PDF or Word document. Companies can view/download this from your candidate profile.</p>
            {cvError && <p className="profile-save-error">{cvError}</p>}
          </div>
        </Section>

        <Section id="links" title="Professional Links" {...sectionProps}>
          <div className="field-block">
            <label className="field-label">GitHub</label>
            <Input placeholder="github.com/yourname" value={profile.github_url || ''} onChange={v => setField('github_url', v)} />
          </div>
          <div className="field-block">
            <label className="field-label">LinkedIn</label>
            <Input placeholder="linkedin.com/in/yourname" value={profile.linkedin_url || ''} onChange={v => setField('linkedin_url', v)} />
          </div>
          <div className="field-block">
            <label className="field-label">Portfolio</label>
            <Input placeholder="yourportfolio.com" value={profile.portfolio_url || ''} onChange={v => setField('portfolio_url', v)} />
          </div>
          <div className="field-block">
            <label className="field-label">Personal Website</label>
            <Input placeholder="yourwebsite.com" value={profile.personal_website_url || ''} onChange={v => setField('personal_website_url', v)} />
          </div>
        </Section>

        {saveError && <p className="profile-save-error">{saveError}</p>}
        <div className="profile-save-row">
          <button className={`profile-save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
            {saved ? 'Changes Saved ✓' : 'Save Changes'}
          </button>
          <button className="btn-navy-outline" onClick={handleDiscard}>Discard Changes</button>
        </div>
      </div>
    </StudentLayout>
  )
}
