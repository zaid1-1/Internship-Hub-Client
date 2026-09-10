import { Navbar, SectionLabel } from '../components/shared'

export function Login() {
  return (
    <>
      <Navbar />
      <div className="container py-5">
        <SectionLabel>Log In</SectionLabel>
        <h1>Log In</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </>
  )
}

export function Register() {
  return (
    <>
      <Navbar />
      <div className="container py-5">
        <SectionLabel>Create Account</SectionLabel>
        <h1>Register</h1>
        <p className="text-secondary">Coming soon in a later batch.</p>
      </div>
    </>
  )
}
