import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios, { BASE_URL, authHeaders } from '../api'
import { useAuth } from '../context/AuthContext'
import {
  Navbar, StudentLayout, InternshipCard, SectionLabel, Card, Badge, idNameMap,
} from '../components/shared'
import './CompanyProfile.css'

export default function CompanyProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isStudent = user?.role === 'student'

  const [company, setCompany] = useState(null)
  const [companyInternships, setCompanyInternships] = useState([])
  const [savedIds, setSavedIds] = useState([])
  const [lookups, setLookups] = useState({ locations: {}, workArrangements: {}, internshipTypes: {} })

  useEffect(() => {
    axios.get(`${BASE_URL}/api/companies/${id}`).then(res => setCompany(res.data)).catch(err => console.error(err))

    axios.get(`${BASE_URL}/api/internships`).then(res => {
      setCompanyInternships(res.data.filter(i => String(i.company_id) === String(id)))
    })

    axios.get(`${BASE_URL}/api/locations`).then(res => {
      setLookups(prev => ({ ...prev, locations: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/work-arrangements`).then(res => {
      setLookups(prev => ({ ...prev, workArrangements: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/internship-types`).then(res => {
      setLookups(prev => ({ ...prev, internshipTypes: idNameMap(res.data) }))
    })

    if (isStudent) {
      axios.get(`${BASE_URL}/api/saved`, { headers: authHeaders() }).then(res => {
        setSavedIds(res.data.map(i => i.id))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!company) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <Navbar />
        <div className="company-wrap"><p style={{ color: 'var(--text-3)' }}>Loading...</p></div>
      </div>
    )
  }

  const initials = company.company_name
    ? company.company_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const content = (
    <div className="company-wrap">
      <div className="company-breadcrumb">
        <button onClick={() => navigate(isStudent ? '/find-internships' : '/browse')}>Companies</button>
        <span>/</span>
        <span style={{ color: 'var(--text-1)' }}>{company.company_name}</span>
      </div>

      <Card className="p-4 mb-4">
        <div className="company-header-row">
          <div className="company-logo-lg">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="company-name-title">{company.company_name}</h1>
            <div className="company-meta-row">
              {company.industry && <Badge label={company.industry} />}
              {lookups.locations[company.location_id] && <span>{lookups.locations[company.location_id]}</span>}
              {company.website && (
                <>
                  <span>•</span>
                  <a href={`https://${company.website}`} className="company-meta-link" target="_blank" rel="noopener noreferrer">
                    {company.website}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {company.about && (
          <div className="company-about">
            <SectionLabel>About</SectionLabel>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>{company.about}</p>
          </div>
        )}
      </Card>

      <div>
        <div className="company-opps-head">
          <div>
            <SectionLabel>Opportunities</SectionLabel>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-sans)' }}>
              Active Internship Listings
            </h2>
          </div>
          <span className="company-opps-count">{companyInternships.length} active</span>
        </div>

        {companyInternships.length > 0 ? (
          <div className="company-opps-list">
            {companyInternships.map(i => (
              <InternshipCard key={i.id} internship={i} lookups={lookups} savedIds={savedIds} />
            ))}
          </div>
        ) : (
          <Card className="p-4">
            <p className="company-opps-empty">No active internships from this company at the moment.</p>
          </Card>
        )}
      </div>
    </div>
  )

  if (isStudent) {
    return <StudentLayout>{content}</StudentLayout>
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />
      {content}
    </div>
  )
}
