import { Navbar, SectionLabel } from '../components/shared'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <div className="container py-5">
        <SectionLabel>Landing Page</SectionLabel>
        <h1>Jordan Internship Hub</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </>
  )
}
