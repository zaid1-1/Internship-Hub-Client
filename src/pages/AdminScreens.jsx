import { AdminLayout, SectionLabel } from '../components/shared'

function Stub({ label, title }) {
  return (
    <AdminLayout>
      <div className="container-fluid py-4 px-4">
        <SectionLabel>{label}</SectionLabel>
        <h1>{title}</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </AdminLayout>
  )
}

export function AdminDashboard() {
  return <Stub label="Admin Dashboard" title="Dashboard" />
}

export function AdminUsers() {
  return <Stub label="Users" title="Users" />
}

export function AdminUserDetails() {
  return <Stub label="User Details" title="User Details" />
}

export function AdminCompanies() {
  return <Stub label="Companies" title="Companies" />
}

export function AdminOpportunities() {
  return <Stub label="Opportunities" title="Opportunities" />
}

export function AdminOpportunityDetails() {
  return <Stub label="Opportunity Details" title="Opportunity Details" />
}

export function AdminReports() {
  return <Stub label="Reports" title="Reports" />
}

export function AdminPlatformData() {
  return <Stub label="Platform Data" title="Platform Data" />
}

export function AdminSettings() {
  return <Stub label="Settings" title="Admin Settings" />
}
