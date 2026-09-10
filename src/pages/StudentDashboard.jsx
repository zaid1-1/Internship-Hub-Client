import { StudentLayout, SectionLabel } from '../components/shared'

export default function StudentDashboard() {
  return (
    <StudentLayout>
      <div className="container-fluid py-4 px-4">
        <SectionLabel>Student Dashboard</SectionLabel>
        <h1>Dashboard</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </StudentLayout>
  )
}
