import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios, { BASE_URL, authHeaders } from '../api'
import {
  StudentLayout, SectionLabel, Card, StatusPill, BtnPrimary, BtnOutline, Divider, idNameMap,
} from '../components/shared'
import '../css/ApplicationDetails.css'

const statusOptions = ['Clicked Apply', 'Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted', 'Withdrawn']

// There is no GET /api/applications/:id on the backend, only
// GET /api/applications/mine (list) and PUT/DELETE /:id - same "fetch
// the list, filter client-side" approach CompanyProfile.jsx already
// uses for its own missing single-item endpoint.
export default function ApplicationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [application, setApplication] = useState(null)
  const [internship, setInternship] = useState(null)
  const [lookups, setLookups] = useState({ locations: {}, workArrangements: {} })
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState({ status: '', follow_up_date: '', notes: '' })
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/applications/mine`, { headers: authHeaders() }).then(res => {
      const found = res.data.find(a => String(a.id) === id)
      if (!found) {
        setNotFound(true)
        return
      }
      setApplication(found)
      setForm({
        status: found.status || 'Clicked Apply',
        follow_up_date: found.follow_up_date ? found.follow_up_date.slice(0, 10) : '',
        notes: found.notes || '',
      })

      // Public endpoint, no auth needed - enriches the page with Location
      // and other fields /mine doesn't join in.
      axios.get(`${BASE_URL}/api/internships/${found.internship_id}`).then(r => setInternship(r.data)).catch(() => {})
    }).catch(err => console.error(err))

    axios.get(`${BASE_URL}/api/locations`).then(res => {
      setLookups(prev => ({ ...prev, locations: idNameMap(res.data) }))
    })
    axios.get(`${BASE_URL}/api/work-arrangements`).then(res => {
      setLookups(prev => ({ ...prev, workArrangements: idNameMap(res.data) }))
    })
  }, [id])

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  // PUT /api/applications/:id replaces status + follow_up_date + notes
  // together every time (same full-body pattern as students.js's PUT
  // /me) - sending only the changed field would null the other two out.
  const handleSave = async () => {
    setSaveError('')
    try {
      const res = await axios.put(`${BASE_URL}/api/applications/${id}`, {
        status: form.status,
        follow_up_date: form.follow_up_date || null,
        notes: form.notes || null,
      }, { headers: authHeaders() })
      setApplication(res.data)
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

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/applications/${id}`, { headers: authHeaders() })
      navigate('/applications')
    } catch (err) {
      console.error(err)
    }
  }

  if (notFound) {
    return (
      <StudentLayout>
        <div className="app-details-wrap">
          <p className="app-details-muted">That tracked application couldn't be found.</p>
          <BtnOutline onClick={() => navigate('/applications')}>Back to Applications</BtnOutline>
        </div>
      </StudentLayout>
    )
  }

  if (!application) {
    return (
      <StudentLayout>
        <div className="app-details-wrap"><p className="app-details-muted">Loading...</p></div>
      </StudentLayout>
    )
  }

  const locationName = internship && lookups.locations[internship.location_id]
  const workArrangementName = internship && lookups.workArrangements[internship.work_arrangement_id]

  return (
    <StudentLayout>
      <div className="app-details-wrap">
        <button className="app-details-back" onClick={() => navigate('/applications')}>← Back to Applications</button>

        <div className="app-details-header">
          <div>
            <SectionLabel>Tracked Application</SectionLabel>
            <h1>{application.title}</h1>
            <p className="app-details-company">{application.company_name}</p>
            {(locationName || workArrangementName) && (
              <p className="app-details-meta">{[locationName, workArrangementName].filter(Boolean).join(' · ')}</p>
            )}
          </div>
          <StatusPill status={application.status} />
        </div>

        <Card className="p-4 mb-4">
          <SectionLabel>Details</SectionLabel>
          <div className="app-details-grid">
            <div>
              <p className="app-details-label">Application Date</p>
              <p className="app-details-value">{new Date(application.clicked_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="app-details-label">Follow-up Date</p>
              <p className="app-details-value">{application.follow_up_date ? new Date(application.follow_up_date).toLocaleDateString() : 'Not set'}</p>
            </div>
          </div>
          {application.external_application_url && (
            <a
              className="app-details-external-link"
              href={application.external_application_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              View External Application →
            </a>
          )}
        </Card>

        <Card className="p-4">
          <SectionLabel>Update Tracking</SectionLabel>

          <div className="field-block">
            <label className="field-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="field-block">
            <label className="field-label">Follow-up Date</label>
            <input
              type="date"
              className="form-input"
              value={form.follow_up_date}
              onChange={e => setField('follow_up_date', e.target.value)}
            />
          </div>

          <div className="field-block">
            <label className="field-label">Notes</label>
            <textarea
              rows={4}
              className="field-textarea"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="e.g. Phone screen scheduled for next week."
            />
          </div>

          {saveError && <p className="app-details-error">{saveError}</p>}

          <div className="app-details-actions">
            <button className={`app-details-save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
              {saved ? 'Changes Saved ✓' : 'Save Changes'}
            </button>

            <Divider />

            {confirmingDelete ? (
              <div className="app-details-confirm-row">
                <span>Delete this tracked application?</span>
                <button className="action-btn danger" onClick={handleDelete}>Yes, Delete</button>
                <button className="action-btn" onClick={() => setConfirmingDelete(false)}>Cancel</button>
              </div>
            ) : (
              <button className="action-btn danger" onClick={() => setConfirmingDelete(true)}>Delete Tracking Entry</button>
            )}
          </div>
        </Card>
      </div>
    </StudentLayout>
  )
}
