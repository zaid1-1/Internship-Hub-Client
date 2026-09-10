import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios, { BASE_URL, authHeaders } from '../api'
import {
  StudentLayout, SectionLabel, FilterSidebar, InternshipCard, BtnPrimary, idNameMap,
} from '../components/shared'
import '../css/StudentScreens.css'

// ── Find Internships ────────────────────────────────────────────
// Same filtered listing as the public Browse page (same endpoint, same
// filters), just wrapped in the student app shell instead of the public
// navbar, and without the guest banner since this route is already
// student-only (ProtectedRoute in App.jsx).
export function FindInternships() {
  const [filters, setFilters] = useState({
    keyword: '', fieldId: '', locationId: '', workArrangementId: '', internshipTypeId: '',
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
    axios.get(`${BASE_URL}/api/saved`, { headers: authHeaders() }).then(res => {
      setSavedIds(res.data.map(i => i.id))
    }).catch(err => console.error(err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApply = () => fetchInternships(filters)

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
    <StudentLayout>
      <div className="discover-wrap">
        <div className="discover-header">
          <SectionLabel>Internship Listings</SectionLabel>
          <h1>Find Internships</h1>
          <p>Search and filter every active opportunity on the platform.</p>
        </div>

        <div className="discover-body">
          <FilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            onApply={handleApply}
            onClear={handleClear}
          />

          <div className="discover-results">
            <div className="discover-toolbar">
              <p className="discover-count"><strong>{sorted.length}</strong> opportunities found</p>
              <div className="discover-sort">
                <span>Sort by:</span>
                <select className="form-select" value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="Newest">Newest</option>
                  <option value="Deadline">Deadline</option>
                </select>
              </div>
            </div>

            {sorted.length > 0 ? (
              <div className="discover-cards">
                {sorted.map(i => (
                  <InternshipCard key={i.id} internship={i} lookups={lookups} savedIds={savedIds} />
                ))}
              </div>
            ) : (
              <div className="discover-empty">No internships match your filters right now.</div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}

// ── Recommended ──────────────────────────────────────────────────
// GET /api/students/me/recommendations already scores + sorts every
// Active internship for this student (utils/matching.js), so this page
// just renders what the backend hands back - no client-side ranking.
export function RecommendedPage() {
  const [recommendations, setRecommendations] = useState([])
  const [savedIds, setSavedIds] = useState([])
  const [lookups, setLookups] = useState({ locations: {}, workArrangements: {}, internshipTypes: {} })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/students/me/recommendations`, { headers: authHeaders() }).then(res => {
      setRecommendations(res.data)
      setLoaded(true)
    }).catch(err => { console.error(err); setLoaded(true) })

    axios.get(`${BASE_URL}/api/locations`).then(res => {
      setLookups(prev => ({ ...prev, locations: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/work-arrangements`).then(res => {
      setLookups(prev => ({ ...prev, workArrangements: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/internship-types`).then(res => {
      setLookups(prev => ({ ...prev, internshipTypes: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/saved`, { headers: authHeaders() }).then(res => {
      setSavedIds(res.data.map(i => i.id))
    }).catch(err => console.error(err))
  }, [])

  return (
    <StudentLayout>
      <div className="discover-wrap">
        <div className="discover-header">
          <SectionLabel>Personalized Matches</SectionLabel>
          <h1>Recommended for You</h1>
          <p>Ranked by how closely each opportunity matches your profile, skills, and preferences.</p>
        </div>

        {loaded && recommendations.length > 0 ? (
          <div className="discover-cards discover-cards-full">
            {recommendations.map(i => (
              <InternshipCard key={i.id} internship={i} lookups={lookups} savedIds={savedIds} matchScore={i.match_score} />
            ))}
          </div>
        ) : loaded ? (
          <div className="discover-empty">
            No recommendations yet. Complete your profile (skills, career interests, and preferences) so we can match you with opportunities.
          </div>
        ) : (
          <div className="discover-empty">Loading...</div>
        )}
      </div>
    </StudentLayout>
  )
}

// ── Saved ────────────────────────────────────────────────────────
// GET /api/saved is already scoped to the logged-in student and includes
// a match_score per row, so savedIds for the cards' Save buttons is just
// the ids of this same list - every card here starts "Saved" by
// definition. onSaveChange drops a card the moment it's unsaved instead
// of waiting for a refetch.
export function SavedPage() {
  const navigate = useNavigate()
  const [saved, setSaved] = useState([])
  const [lookups, setLookups] = useState({ locations: {}, workArrangements: {}, internshipTypes: {} })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/saved`, { headers: authHeaders() }).then(res => {
      setSaved(res.data)
      setLoaded(true)
    }).catch(err => { console.error(err); setLoaded(true) })

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

  const handleSaveChange = (internshipId, nowSaved) => {
    if (!nowSaved) {
      setSaved(prev => prev.filter(i => i.id !== internshipId))
    }
  }

  return (
    <StudentLayout>
      <div className="discover-wrap">
        <div className="discover-header">
          <SectionLabel>Your Shortlist</SectionLabel>
          <h1>Saved Internships</h1>
          <p>Opportunities you've bookmarked to come back to.</p>
        </div>

        {loaded && saved.length > 0 ? (
          <div className="discover-cards discover-cards-full">
            {saved.map(i => (
              <InternshipCard
                key={i.id}
                internship={i}
                lookups={lookups}
                savedIds={saved.map(s => s.id)}
                matchScore={i.match_score}
                onSaveChange={handleSaveChange}
              />
            ))}
          </div>
        ) : loaded ? (
          <div className="discover-empty">
            <p>You haven't saved any internships yet.</p>
            <BtnPrimary onClick={() => navigate('/find-internships')}>Browse Internships</BtnPrimary>
          </div>
        ) : (
          <div className="discover-empty">Loading...</div>
        )}
      </div>
    </StudentLayout>
  )
}
