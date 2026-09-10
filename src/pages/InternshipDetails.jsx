import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios, { BASE_URL, authHeaders } from '../api'
import { useAuth } from '../context/AuthContext'
import {
  Navbar, StudentLayout, CompanyLogo, SkillTag, Badge, SectionLabel,
  Divider, Card, BtnGhost, AuthModal, idNameMap,
} from '../components/shared'
import '../css/InternshipDetails.css'

const breakdownLabels = {
  skills: 'Skills',
  field: 'Career Field',
  location: 'Location',
  type: 'Internship Type',
  education: 'Education',
}

const whyMatchCopy = {
  skills: 'Your skills line up well with what this internship requires.',
  field: 'This internship’s field matches one of your career interests.',
  location: 'The location matches your preferred location.',
  type: 'The internship type matches your preference.',
  education: 'Your field of study matches what this internship requires.',
}

export default function InternshipDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const isStudent = user?.role === 'student'

  const [internship, setInternship] = useState(null)
  const [company, setCompany] = useState(null)
  const [skills, setSkills] = useState([])
  const [match, setMatch] = useState(null)
  const [saved, setSaved] = useState(false)
  const [applied, setApplied] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalAction, setAuthModalAction] = useState('apply')

  const [locationsById, setLocationsById] = useState({})
  const [workArrangementsById, setWorkArrangementsById] = useState({})
  const [internshipTypesById, setInternshipTypesById] = useState({})
  const [fieldsById, setFieldsById] = useState({})
  const [studyFieldsById, setStudyFieldsById] = useState({})
  const [educationLevelsById, setEducationLevelsById] = useState({})

  useEffect(() => {
    axios.get(`${BASE_URL}/api/locations`).then(res => setLocationsById(idNameMap(res.data)))
    axios.get(`${BASE_URL}/api/work-arrangements`).then(res => setWorkArrangementsById(idNameMap(res.data)))
    axios.get(`${BASE_URL}/api/internship-types`).then(res => setInternshipTypesById(idNameMap(res.data)))
    axios.get(`${BASE_URL}/api/fields`).then(res => setFieldsById(idNameMap(res.data)))
    axios.get(`${BASE_URL}/api/study-fields`).then(res => setStudyFieldsById(idNameMap(res.data)))
    axios.get(`${BASE_URL}/api/education-levels`).then(res => setEducationLevelsById(idNameMap(res.data)))
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const internshipRes = await axios.get(`${BASE_URL}/api/internships/${id}`)
        setInternship(internshipRes.data)

        const companyRes = await axios.get(`${BASE_URL}/api/companies/${internshipRes.data.company_id}`)
        setCompany(companyRes.data)

        const skillsRes = await axios.get(`${BASE_URL}/api/internships/${id}/skills`)
        setSkills(skillsRes.data)

        if (isStudent) {
          try {
            const matchRes = await axios.get(`${BASE_URL}/api/internships/${id}/match`, { headers: authHeaders() })
            setMatch(matchRes.data)
          } catch (err) {
            console.error(err)
          }

          const savedRes = await axios.get(`${BASE_URL}/api/saved`, { headers: authHeaders() })
          setSaved(savedRes.data.some(i => String(i.id) === String(id)))

          const appsRes = await axios.get(`${BASE_URL}/api/applications/mine`, { headers: authHeaders() })
          setApplied(appsRes.data.some(a => String(a.internship_id) === String(id)))
        }
      } catch (err) {
        console.error(err)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSave = async () => {
    if (!isStudent) {
      setAuthModalAction('save')
      setShowAuthModal(true)
      return
    }
    try {
      if (saved) {
        await axios.delete(`${BASE_URL}/api/saved/${id}`, { headers: authHeaders() })
        setSaved(false)
      } else {
        await axios.post(`${BASE_URL}/api/saved`, { internship_id: id }, { headers: authHeaders() })
        setSaved(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleApply = async () => {
    if (!isStudent) {
      setAuthModalAction('apply')
      setShowAuthModal(true)
      return
    }
    if (!applied) {
      try {
        await axios.post(`${BASE_URL}/api/applications`, { internship_id: id }, { headers: authHeaders() })
        setApplied(true)
      } catch (err) {
        if (err.response?.status === 400) {
          setApplied(true)
        } else {
          console.error(err)
          return
        }
      }
    }
    if (internship?.external_application_url) {
      window.open(internship.external_application_url, '_blank')
    }
  }

  if (!internship) {
    return (
      <div className="page-shell">
        <Navbar />
        <div className="details-wrap"><p className="details-muted">Loading...</p></div>
      </div>
    )
  }

  const initials = (company?.company_name || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const content = (
    <div className="details-wrap">
      <div className="details-breadcrumb">
        <button onClick={() => navigate(isStudent ? '/find-internships' : '/browse')}>Find Internships</button>
        <span>/</span>
        <span className="details-breadcrumb-current">{internship.title}</span>
      </div>

      <div className="details-grid">
        <div className="details-main">
          <Card className="p-4">
            <div className="details-head-top">
              <CompanyLogo initials={initials} size="lg" />
              <div className="details-head-info">
                <h1 className="details-title">{internship.title}</h1>
                <button className="details-company-link" onClick={() => navigate(`/companies/${internship.company_id}`)}>
                  {company?.company_name}
                </button>
                <div className="details-badges">
                  {workArrangementsById[internship.work_arrangement_id] && (
                    <Badge label={workArrangementsById[internship.work_arrangement_id]} />
                  )}
                  {internshipTypesById[internship.internship_type_id] && (
                    <Badge label={internshipTypesById[internship.internship_type_id]} />
                  )}
                </div>
              </div>
            </div>

            <div className="details-info-grid">
              <div>
                <p className="details-info-label">Location</p>
                <p className="details-info-value">{locationsById[internship.location_id] || 'Not specified'}</p>
              </div>
              <div>
                <p className="details-info-label">Duration</p>
                <p className="details-info-value">{internship.duration || 'Not specified'}</p>
              </div>
              <div>
                <p className="details-info-label">Deadline</p>
                <p className="details-info-value">
                  {internship.application_deadline ? new Date(internship.application_deadline).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="details-info-label">Field</p>
                <p className="details-info-value">{fieldsById[internship.field_id] || 'Not specified'}</p>
              </div>
            </div>

            <div className="details-actions">
              <button className={`apply-btn ${applied ? 'applied' : ''}`} onClick={handleApply}>
                {applied ? 'Applied ✓ - Visit Site Again' : 'Apply'}
              </button>
              <button className={`save-btn-large ${saved ? 'saved' : ''}`} onClick={handleSave}>
                {saved ? 'Saved ✓' : 'Save'}
              </button>
            </div>
            <p className="details-apply-note">
              Applications are submitted on the company's external website. Clicking Apply creates a tracking record and redirects you there.
            </p>
          </Card>

          <Card className="p-4">
            <SectionLabel>About the Internship</SectionLabel>
            <p className="details-body-text">{internship.description || 'No description provided.'}</p>
          </Card>

          {internship.responsibilities && (
            <Card className="p-4">
              <SectionLabel>Responsibilities</SectionLabel>
              <p className="details-body-text">{internship.responsibilities}</p>
            </Card>
          )}

          <Card className="p-4">
            <SectionLabel>Requirements</SectionLabel>
            <div className="details-reqs">
              <div>
                <p className="details-req-label">Experience Level</p>
                <p className="details-req-value">{internship.experience_level || 'Not specified'}</p>
              </div>
              <Divider />
              <div>
                <p className="details-req-label">Education Level</p>
                <p className="details-req-value">{educationLevelsById[internship.required_degree_level_id] || 'Not specified'}</p>
              </div>
              <Divider />
              <div>
                <p className="details-req-label">Field of Study</p>
                <p className="details-req-value">{studyFieldsById[internship.required_study_field_id] || 'Not specified'}</p>
              </div>
              {internship.requirements && (
                <>
                  <Divider />
                  <div>
                    <p className="details-req-label">Additional Requirements</p>
                    <p className="details-req-value">{internship.requirements}</p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {skills.length > 0 && (
            <Card className="p-4">
              <SectionLabel>Required Skills</SectionLabel>
              <div className="details-skill-wrap">
                {skills.map(s => <SkillTag key={s.id} label={s.name} />)}
              </div>
            </Card>
          )}

          {internship.benefits && (
            <Card className="p-4">
              <SectionLabel>Benefits</SectionLabel>
              <p className="details-body-text">{internship.benefits}</p>
            </Card>
          )}

          {internship.additional_info && (
            <Card className="p-4">
              <SectionLabel>Additional Information</SectionLabel>
              <p className="details-body-text">{internship.additional_info}</p>
            </Card>
          )}
        </div>

        <div className="details-side">
          {isStudent && match && (
            <>
              <Card className="p-4">
                <div className="match-score-panel">
                  <p className="match-score-label">Your Match</p>
                  <p className="match-score-value">{match.score}%</p>
                </div>
                <SectionLabel>Match Breakdown</SectionLabel>
                {Object.keys(match.breakdown).map(key => (
                  <div key={key} className="match-breakdown-row">
                    <div className="match-breakdown-top">
                      <span>{breakdownLabels[key] || key}</span>
                      <span>{match.breakdown[key]}%</span>
                    </div>
                    <div className="match-bar-track">
                      <div className="match-bar-fill" style={{ width: `${match.breakdown[key]}%` }} />
                    </div>
                  </div>
                ))}
              </Card>

              <Card className="p-4">
                <SectionLabel>Why this matches you</SectionLabel>
                <ul className="why-match-list">
                  {Object.keys(match.breakdown)
                    .filter(key => match.breakdown[key] === 100)
                    .map(key => (
                      <li key={key} className="why-match-item">
                        <span className="why-match-check">✓</span>
                        <span>{whyMatchCopy[key] || `${breakdownLabels[key] || key} matches.`}</span>
                      </li>
                    ))}
                </ul>
              </Card>

              {match.missingSkills?.length > 0 && (
                <div className="skill-gap-box">
                  <p className="skill-gap-title">Skill Gap</p>
                  <p className="skill-gap-desc">You are missing these required skills:</p>
                  <div className="skill-gap-tags">
                    {match.missingSkills.map(s => <SkillTag key={s.id} label={s.name} missing />)}
                  </div>
                  <button className="skill-gap-link" onClick={() => navigate('/profile')}>
                    Improve Your Profile →
                  </button>
                </div>
              )}
            </>
          )}

          {!isStudent && !isLoggedIn && (
            <div className="guest-match-cta">
              <div className="guest-match-icon">?</div>
              <p className="guest-match-title">See your match score and identify skill gaps.</p>
              <p className="guest-match-desc">
                See how well this internship fits your skills, interests, and preferences.
              </p>
              <div className="guest-match-actions">
                <button className="btn-navy" onClick={() => navigate('/register')}>Create Student Account</button>
                <button className="btn-navy-outline" onClick={() => navigate('/login')}>Login</button>
              </div>
            </div>
          )}

          <Card className="p-4">
            <SectionLabel>Company</SectionLabel>
            <div className="company-info-row">
              <CompanyLogo initials={initials} />
              <div>
                <p className="company-info-name">{company?.company_name}</p>
                <p className="company-info-loc">{locationsById[company?.location_id] || ''}</p>
              </div>
            </div>
            <BtnGhost onClick={() => navigate(`/companies/${internship.company_id}`)}>
              View Company Profile →
            </BtnGhost>
          </Card>

          <Card className="p-4">
            <SectionLabel>Internship Information</SectionLabel>
            <div className="info-summary-row">
              <span>Duration</span>
              <span>{internship.duration || '—'}</span>
            </div>
            <div className="info-summary-row">
              <span>Location</span>
              <span>{locationsById[internship.location_id] || '—'}</span>
            </div>
            <div className="info-summary-row">
              <span>Arrangement</span>
              <span>{workArrangementsById[internship.work_arrangement_id] || '—'}</span>
            </div>
            <div className="info-summary-row">
              <span>Type</span>
              <span>{internshipTypesById[internship.internship_type_id] || '—'}</span>
            </div>
            <div className="info-summary-row">
              <span>Field</span>
              <span>{fieldsById[internship.field_id] || '—'}</span>
            </div>
            <div className="info-summary-row">
              <span>Deadline</span>
              <span>{internship.application_deadline ? new Date(internship.application_deadline).toLocaleDateString() : '—'}</span>
            </div>
          </Card>
        </div>
      </div>

      <AuthModal show={showAuthModal} onClose={() => setShowAuthModal(false)} action={authModalAction} />
    </div>
  )

  if (isStudent) {
    return <StudentLayout>{content}</StudentLayout>
  }

  return (
    <div className="page-shell">
      <Navbar />
      {content}
    </div>
  )
}
