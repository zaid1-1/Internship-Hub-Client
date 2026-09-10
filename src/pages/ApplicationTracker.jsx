import { StudentLayout, SectionLabel } from '../components/shared'

export default function ApplicationTracker() {
  return (
    <StudentLayout>
      <div className="container-fluid py-4 px-4">
        <SectionLabel>Applications</SectionLabel>
        <h1>Application Tracker</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </StudentLayout>
  )
}
