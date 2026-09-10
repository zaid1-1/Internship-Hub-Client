import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios, { BASE_URL, authHeaders } from '../api'
import { StudentLayout, SectionLabel, Card, SkillTag, BtnPrimary, BtnOutline } from '../components/shared'
import './SkillGapsPage.css'

// Spec section 34: compare the student's own skills against required
// skills across relevant opportunities and surface what's missing.
// GET /api/students/me/recommendations already runs calculateMatch per
// internship and returns matchingSkills/missingSkills - this page is
// just a fuller view of that same real data (the Dashboard's "Skill
// Gaps" tile only shows the top 3).
export default function SkillGapsPage() {
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/api/students/me`, { headers: authHeaders() }).then(res => {
      setSkills(res.data.skills)
    }).catch(err => console.error(err))

    axios.get(`${BASE_URL}/api/students/me/recommendations`, { headers: authHeaders() }).then(res => {
      setRecommendations(res.data)
      setLoaded(true)
    }).catch(err => { console.error(err); setLoaded(true) })
  }, [])

  // Tally how often each missing skill shows up across every recommended
  // (Active) internship - real counts from real data, not a made-up
  // percentage (spec section 8 explicitly warns against that).
  const gapCounts = {}
  for (let i = 0; i < recommendations.length; i++) {
    const missing = recommendations[i].missingSkills || []
    for (let j = 0; j < missing.length; j++) {
      const name = missing[j].name
      gapCounts[name] = (gapCounts[name] || 0) + 1
    }
  }
  const sortedGaps = Object.keys(gapCounts)
    .map(name => ({ name, count: gapCounts[name] }))
    .sort((a, b) => b.count - a.count)

  const opportunitiesWithGaps = recommendations.filter(r => (r.missingSkills || []).length > 0)

  return (
    <StudentLayout>
      <div className="gaps-wrap">
        <div className="gaps-header">
          <SectionLabel>Skill Development</SectionLabel>
          <h1>Skill Gaps</h1>
          <p>Skills worth improving, based on what your recommended internships actually require.</p>
        </div>

        <Card className="p-4 mb-4">
          <SectionLabel>Your Skills</SectionLabel>
          {skills.length > 0 ? (
            <div className="gaps-tag-row">
              {skills.map(s => <SkillTag key={s.id} label={s.name} />)}
            </div>
          ) : (
            <div className="gaps-empty-inline">
              <p>You haven't added any skills yet.</p>
              <BtnOutline onClick={() => navigate('/profile')}>Add Skills</BtnOutline>
            </div>
          )}
        </Card>

        <Card className="p-4 mb-4">
          <SectionLabel>Skills Worth Improving</SectionLabel>
          {loaded && sortedGaps.length > 0 ? (
            <div className="gaps-list">
              {sortedGaps.map(g => (
                <div key={g.name} className="gaps-row">
                  <SkillTag label={g.name} missing />
                  <span className="gaps-row-count">Required by {g.count} of your recommended internships</span>
                </div>
              ))}
            </div>
          ) : loaded ? (
            <p className="gaps-positive">
              You're not missing any required skills across your current recommendations. Nice work.
            </p>
          ) : (
            <p style={{ color: 'var(--text-3)' }}>Loading...</p>
          )}
        </Card>

        <div className="gaps-section-head">
          <SectionLabel>Relevant Opportunity Requirements</SectionLabel>
          <h2>Where the gaps show up</h2>
        </div>

        {loaded && opportunitiesWithGaps.length > 0 ? (
          <div className="gaps-opps">
            {opportunitiesWithGaps.map(o => (
              <Card key={o.id} className="gaps-opp-card clickable" onClick={() => navigate(`/internships/${o.id}`)}>
                <div className="gaps-opp-top">
                  <div>
                    <p className="gaps-opp-title">{o.title}</p>
                    <p className="gaps-opp-company">{o.company_name}</p>
                  </div>
                  <span className="gaps-opp-match">{o.match_score}% Match</span>
                </div>
                <div className="gaps-opp-skills">
                  {(o.matchingSkills || []).map(s => <SkillTag key={`m-${s.id}`} label={s.name} />)}
                  {(o.missingSkills || []).map(s => <SkillTag key={`x-${s.id}`} label={s.name} missing />)}
                </div>
              </Card>
            ))}
          </div>
        ) : loaded ? (
          <p className="gaps-positive">No recommended internships currently need a skill you don't already have.</p>
        ) : null}
      </div>
    </StudentLayout>
  )
}
