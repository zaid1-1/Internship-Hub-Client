import { Navbar, SectionLabel } from '../components/shared'

export default function CompanyProfile() {
  return (
    <>
      <Navbar />
      <div className="container py-5">
        <SectionLabel>Company Profile</SectionLabel>
        <h1>Company Profile</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </>
  )
}
