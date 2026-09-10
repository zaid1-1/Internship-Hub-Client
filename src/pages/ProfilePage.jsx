import { StudentLayout, SectionLabel } from '../components/shared'

export default function ProfilePage() {
  return (
    <StudentLayout>
      <div className="container-fluid py-4 px-4">
        <SectionLabel>Profile</SectionLabel>
        <h1>Profile</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </StudentLayout>
  )
}
