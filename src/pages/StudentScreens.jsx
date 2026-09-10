import { StudentLayout, SectionLabel } from '../components/shared'

export function FindInternships() {
  return (
    <StudentLayout>
      <div className="container-fluid py-4 px-4">
        <SectionLabel>Find Internships</SectionLabel>
        <h1>Find Internships</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </StudentLayout>
  )
}

export function RecommendedPage() {
  return (
    <StudentLayout>
      <div className="container-fluid py-4 px-4">
        <SectionLabel>Recommended</SectionLabel>
        <h1>Recommended</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </StudentLayout>
  )
}

export function SavedPage() {
  return (
    <StudentLayout>
      <div className="container-fluid py-4 px-4">
        <SectionLabel>Saved</SectionLabel>
        <h1>Saved</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </StudentLayout>
  )
}
