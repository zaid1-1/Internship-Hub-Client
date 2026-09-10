import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StudentLayout, SectionLabel, Card, BtnPrimary, BtnOutline, Input, Divider } from '../components/shared'
import { useAuth } from '../context/AuthContext'
import axios, { BASE_URL, authHeaders } from '../api'
import '../css/ProfilePage.css'

// STUDENT SETTINGS (Figma-accurate rebuild) - mirrors CompanyScreens.jsx's
// CompanySettings: Account Details (email change), Change Password, plus
// the Figma-only "Candidate Profile Visibility" notice card, and a
// danger-zone Account Actions card (Log out + Delete Account, with a
// typed-DELETE confirm modal). Notification Preferences is in the Figma
// source but intentionally left out here per request. Backed by the same
// PUT /api/auth/email and PUT /api/auth/password routes CompanySettings
// uses, plus DELETE /api/auth/me for self-delete (cascades to
// student_profiles/student_skills/etc via ON DELETE CASCADE, same as
// admin.js's own DELETE /users/:id).
export default function SettingsPage() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState(user?.email || '')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailError, setEmailError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [showDelete, setShowDelete] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleEmailUpdate = async () => {
    setEmailError('')
    setEmailMsg('')
    try {
      const res = await axios.put(`${BASE_URL}/api/auth/email`, { email }, { headers: authHeaders() })
      login({ ...user, email: res.data.user.email })
      setEmailMsg('Email updated.')
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Could not update email.')
    }
  }

  const handlePasswordUpdate = async () => {
    setPasswordError('')
    setPasswordMsg('')
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    try {
      await axios.put(`${BASE_URL}/api/auth/password`, { currentPassword, newPassword }, { headers: authHeaders() })
      setPasswordMsg('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Could not update password.')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await axios.delete(`${BASE_URL}/api/auth/me`, { headers: authHeaders() })
      logout()
      navigate('/')
    } catch (err) {
      console.error(err)
      setDeleting(false)
    }
  }

  return (
    <StudentLayout>
      <div className="profile-wrap">
        <div className="profile-page-header">
          <SectionLabel>Account</SectionLabel>
          <h1>Settings</h1>
        </div>

        <Card className="p-4 mb-3">
          <SectionLabel>Account Details</SectionLabel>
          <div className="field-block mb-0">
            <label className="field-label">Email Address</label>
            <div className="settings-inline-update">
              <Input value={email} onChange={setEmail} type="email" />
              <button className="settings-update-btn" onClick={handleEmailUpdate}>Update</button>
            </div>
            {emailMsg && <p className="settings-msg">{emailMsg}</p>}
            {emailError && <p className="settings-error">{emailError}</p>}
          </div>
        </Card>

        <Card className="p-4 mb-3">
          <SectionLabel>Change Password</SectionLabel>
          <div className="field-block">
            <label className="field-label">Current Password</label>
            <Input type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="••••••••" />
          </div>
          <div className="field-block">
            <label className="field-label">New Password</label>
            <Input type="password" value={newPassword} onChange={setNewPassword} placeholder="Min. 8 characters" />
          </div>
          <div className="field-block mb-0">
            <label className="field-label">Confirm New Password</label>
            <Input type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat new password" />
          </div>
          {passwordMsg && <p className="settings-msg">{passwordMsg}</p>}
          {passwordError && <p className="settings-error">{passwordError}</p>}
          <div className="mt-3">
            <BtnPrimary onClick={handlePasswordUpdate}>Update Password</BtnPrimary>
          </div>
        </Card>

        <Card className="p-4 mb-3">
          <SectionLabel>Candidate Profile Visibility</SectionLabel>
          <div className="settings-notice-box">
            <span className="settings-notice-icon">◎</span>
            <div>
              <p className="settings-notice-title">
                <strong>Your profile becomes visible to a company when you click Apply on one of its internship opportunities.</strong>
              </p>
              <p className="settings-notice-sub">
                Companies can only see candidates who have clicked Apply on their specific internship listings.
                Your profile is not visible to companies whose opportunities you have not applied for.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 settings-danger-card">
          <SectionLabel>Account Actions</SectionLabel>
          <div className="settings-action-row">
            <div>
              <p className="settings-action-title">Log out</p>
              <p className="settings-action-sub">Sign out of your account on this device.</p>
            </div>
            <BtnOutline onClick={() => { logout(); navigate('/') }}>Log Out</BtnOutline>
          </div>
          <Divider />
          <div className="settings-action-row">
            <div>
              <p className="settings-action-title">Deactivate or delete account</p>
              <p className="settings-action-sub">Permanently remove your account and all associated data.</p>
            </div>
            <button className="settings-danger-btn" onClick={() => setShowDelete(true)}>Delete Account</button>
          </div>
        </Card>

        {showDelete && (
          <div className="confirm-modal-overlay">
            <div className="confirm-modal-box">
              <h3>Delete your account?</h3>
              <p>This will permanently delete your profile, saved internships, and application tracker. This action cannot be undone.</p>
              <div className="field-block">
                <label className="field-label">Type DELETE to confirm</label>
                <Input value={deleteText} onChange={setDeleteText} placeholder="DELETE" />
              </div>
              <div className="confirm-modal-actions">
                <BtnPrimary full onClick={handleDelete} disabled={deleteText !== 'DELETE' || deleting}>
                  {deleting ? 'Deleting...' : 'Permanently Delete Account'}
                </BtnPrimary>
                <BtnOutline full onClick={() => { setShowDelete(false); setDeleteText('') }}>Cancel</BtnOutline>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  )
}
