import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import LandingPage from './pages/LandingPage'
import BrowsePage from './pages/BrowsePage'
import InternshipDetails from './pages/InternshipDetails'
import CompanyProfile from './pages/CompanyProfile'
import { Login, Register } from './pages/AuthPages'
import StudentDashboard from './pages/StudentDashboard'
import { FindInternships, RecommendedPage, SavedPage } from './pages/StudentScreens'
import ApplicationTracker from './pages/ApplicationTracker'
import ApplicationDetails from './pages/ApplicationDetails'
import SkillGapsPage from './pages/SkillGapsPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import {
  CompanyDashboard,
  MyOpportunities,
  CreateInternship,
  EditInternship,
  InternshipPreview,
  CompanyProfileEdit,
  CompanySettings,
  CompanyCandidates,
  CompanyCandidateProfile,
} from './pages/CompanyScreens'
import {
  AdminDashboard,
  AdminUsers,
  AdminUserDetails,
  AdminCompanies,
  AdminOpportunities,
  AdminOpportunityDetails,
  AdminReports,
  AdminPlatformData,
  AdminSettings,
} from './pages/AdminScreens'

function NotFound() {
  return (
    <div className="container py-5 text-center">
      <h1>404</h1>
      <p className="text-secondary">Page not found.</p>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/internships/:id" element={<InternshipDetails />} />
          <Route path="/companies/:id" element={<CompanyProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/find-internships" element={<ProtectedRoute role="student"><FindInternships /></ProtectedRoute>} />
          <Route path="/recommended" element={<ProtectedRoute role="student"><RecommendedPage /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute role="student"><SavedPage /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute role="student"><ApplicationTracker /></ProtectedRoute>} />
          <Route path="/applications/:id" element={<ProtectedRoute role="student"><ApplicationDetails /></ProtectedRoute>} />
          <Route path="/skill-gaps" element={<ProtectedRoute role="student"><SkillGapsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute role="student"><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute role="student"><SettingsPage /></ProtectedRoute>} />

          <Route path="/company/dashboard" element={<ProtectedRoute role="company"><CompanyDashboard /></ProtectedRoute>} />
          <Route path="/company/opportunities" element={<ProtectedRoute role="company"><MyOpportunities /></ProtectedRoute>} />
          <Route path="/company/opportunities/new" element={<ProtectedRoute role="company"><CreateInternship /></ProtectedRoute>} />
          <Route path="/company/opportunities/:id/edit" element={<ProtectedRoute role="company"><EditInternship /></ProtectedRoute>} />
          <Route path="/company/opportunities/:id/preview" element={<ProtectedRoute role="company"><InternshipPreview /></ProtectedRoute>} />
          <Route path="/company/opportunities/:id/candidates" element={<ProtectedRoute role="company"><CompanyCandidates /></ProtectedRoute>} />
          <Route path="/company/candidates/:id" element={<ProtectedRoute role="company"><CompanyCandidateProfile /></ProtectedRoute>} />
          <Route path="/company/profile" element={<ProtectedRoute role="company"><CompanyProfileEdit /></ProtectedRoute>} />
          <Route path="/company/settings" element={<ProtectedRoute role="company"><CompanySettings /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/users/:id" element={<ProtectedRoute role="admin"><AdminUserDetails /></ProtectedRoute>} />
          <Route path="/admin/companies" element={<ProtectedRoute role="admin"><AdminCompanies /></ProtectedRoute>} />
          <Route path="/admin/opportunities" element={<ProtectedRoute role="admin"><AdminOpportunities /></ProtectedRoute>} />
          <Route path="/admin/opportunities/:id" element={<ProtectedRoute role="admin"><AdminOpportunityDetails /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/platform-data" element={<ProtectedRoute role="admin"><AdminPlatformData /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
