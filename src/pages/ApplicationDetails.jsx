import { StudentLayout, SectionLabel } from '../components/shared'

export default function ApplicationDetails() {
  return (
    <StudentLayout>
      <div className="container-fluid py-4 px-4">
        <SectionLabel>Application Details</SectionLabel>
        <h1>Application Details</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </StudentLayout>
  )
}
