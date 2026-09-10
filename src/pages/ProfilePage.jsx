import { useState, useEffect } from 'react'
import axios, { BASE_URL, authHeaders } from '../api'
import { StudentLayout, SectionLabel, Input } from '../components/shared'
import './ProfilePage.css'

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
        <div className="profile-wrap"><p style={{ color: 'var(--text-3)' }}>Loading...</p></div>
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
          <div className="profile-avatar">{initials || '?'}</div>
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
          <p className="completion-footnote"><span style={{ color: 'var(--teal)' }}>◎</span> These fields are used for internship matching</p>
        </div>

        <Section id="basic" title="Basic Information" {...sectionProps}>
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
          <p className="field-note" style={{ marginBottom: 12 }}>
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
          <p className="field-note" style={{ marginBottom: 12 }}>
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
          <p className="placeholder-note">Projects are coming in a later batch.</p>
        </Section>

        <Section id="experience" title="Experience" {...sectionProps}>
          <p className="placeholder-note">Experience is coming in a later batch.</p>
        </Section>

        <Section id="certifications" title="Certifications" {...sectionProps}>
          <p className="placeholder-note">Certifications are coming in a later batch.</p>
        </Section>

        <Section id="cv" title="CV / Resume" {...sectionProps}>
          {profile.cv_url ? (
            <p className="field-note">
              <a href={`${BASE_URL}${profile.cv_url}`} target="_blank" rel="noopener noreferrer">View current CV</a>
            </p>
          ) : (
            <p className="placeholder-note">CV upload is coming in a later batch.</p>
          )}
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
