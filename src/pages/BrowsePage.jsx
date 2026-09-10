import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios, { BASE_URL, authHeaders } from '../api'
import { useAuth } from '../context/AuthContext'
import {
  Navbar, FilterSidebar, InternshipCard, SectionLabel, idNameMap,
} from '../components/shared'
import '../css/BrowsePage.css'

export default function BrowsePage() {
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const { user, isLoggedIn } = useAuth()
  const isStudent = user?.role === 'student'

  const initialState = routerLocation.state || {}

  const [filters, setFilters] = useState({
    keyword: initialState.keyword || '',
    fieldId: initialState.fieldId || '',
    locationId: initialState.locationId || '',
    workArrangementId: '',
    internshipTypeId: '',
  })

  const [internships, setInternships] = useState([])
  const [sort, setSort] = useState('Newest')
  const [savedIds, setSavedIds] = useState([])
  const [lookups, setLookups] = useState({ locations: {}, workArrangements: {}, internshipTypes: {} })

  async function fetchInternships(f) {
    const params = {}
    if (f.keyword) params.keyword = f.keyword
    if (f.fieldId) params.field_id = f.fieldId
    if (f.locationId) params.location_id = f.locationId
    if (f.workArrangementId) params.work_arrangement_id = f.workArrangementId
    if (f.internshipTypeId) params.internship_type_id = f.internshipTypeId

    try {
      const res = await axios.get(`${BASE_URL}/api/internships`, { params })
      setInternships(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchInternships(filters)

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
  }, [])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApply = () => {
    fetchInternships(filters)
  }

  const handleClear = () => {
    const cleared = { keyword: '', fieldId: '', locationId: '', workArrangementId: '', internshipTypeId: '' }
    setFilters(cleared)
    fetchInternships(cleared)
  }

  const sorted = [...internships]
  if (sort === 'Deadline') {
    sorted.sort((a, b) => {
      if (!a.application_deadline) return 1
      if (!b.application_deadline) return -1
      return new Date(a.application_deadline) - new Date(b.application_deadline)
    })
  }

  return (
    <div className="page-shell">
      <Navbar />
      <div className="browse-wrap">
        <div className="browse-header">
          <SectionLabel>Internship Listings</SectionLabel>
          <h1>Find Internships</h1>
        </div>

        {!isLoggedIn && (
          <div className="guest-banner">
            <p>Create a profile to see personalized match percentages and recommendations.</p>
            <div className="guest-banner-actions">
              <button className="guest-login-link" onClick={() => navigate('/login')}>Login</button>
              <button className="btn-navy" onClick={() => navigate('/register')}>Create Account</button>
            </div>
          </div>
        )}

        <div className="browse-body">
          <FilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            onApply={handleApply}
            onClear={handleClear}
          />

          <div className="browse-results">
            <div className="browse-toolbar">
              <p className="browse-count"><strong>{sorted.length}</strong> opportunities found</p>
              <div className="browse-sort">
                <span>Sort by:</span>
                <select className="form-select" value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="Newest">Newest</option>
                  <option value="Deadline">Deadline</option>
                </select>
              </div>
            </div>

            {sorted.length > 0 ? (
              <div className="browse-cards">
                {sorted.map(i => (
                  <InternshipCard key={i.id} internship={i} lookups={lookups} savedIds={savedIds} />
                ))}
              </div>
            ) : (
              <div className="browse-empty">No internships match your filters right now.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
