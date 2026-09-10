import { CompanyLayout, SectionLabel } from '../components/shared'

function Stub({ label, title }) {
  return (
    <CompanyLayout>
      <div className="container-fluid py-4 px-4">
        <SectionLabel>{label}</SectionLabel>
        <h1>{title}</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </CompanyLayout>
  )
}

export function CompanyDashboard() {
  return <Stub label="Company Dashboard" title="Dashboard" />
}

export function MyOpportunities() {
  return <Stub label="My Opportunities" title="My Opportunities" />
}

export function CreateInternship() {
  return <Stub label="Create Opportunity" title="Create Internship" />
}

export function EditInternship() {
  return <Stub label="Edit Opportunity" title="Edit Internship" />
}

export function InternshipPreview() {
  return <Stub label="Preview" title="Internship Preview" />
}

export function CompanyProfileEdit() {
  return <Stub label="Company Profile" title="Company Profile" />
}

export function CompanySettings() {
  return <Stub label="Settings" title="Company Settings" />
}

export function CompanyCandidates() {
  return <Stub label="Candidates" title="Candidates" />
}

export function CompanyCandidateProfile() {
  return <Stub label="Candidate Profile" title="Candidate Profile" />
}
