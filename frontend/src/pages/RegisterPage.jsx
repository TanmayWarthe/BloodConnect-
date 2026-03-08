import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiUser, FiMail, FiLock, FiPhone, FiMapPin,
  FiAlertCircle, FiEye, FiEyeOff
} from 'react-icons/fi'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const DISEASES = [
  'Thalassemia', 'Sickle Cell Disease', 'Hemophilia',
  'Anemia', 'Cancer', 'Surgery', 'Accident/Trauma', 'Other'
]

const ROLE_CONFIG = {
  donor:    { label: 'Donor',    emoji: '💉', desc: 'I want to donate blood' },
  patient:  { label: 'Patient',  emoji: '🏥', desc: 'I need blood' },
  hospital: { label: 'Hospital', emoji: '🏨', desc: 'We manage blood supply' },
}

const RegisterPage = () => {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('donor')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', bloodType: '', rhFactor: '', dateOfBirth: '',
    disease: '', address: '', hospitalName: '', licenseNumber: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  /* ── Validation ── */
  const validateStep1 = () => {
    if (!form.name.trim())            return 'Full name is required'
    if (!form.email.trim())           return 'Email is required'
    if (form.password.length < 8)     return 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) return 'Passwords do not match'
    return null
  }

  const validateStep2 = () => {
    if (!form.phone.trim()) return 'Phone number is required'
    if (role === 'donor' || role === 'patient') {
      if (!form.bloodType)   return 'Blood group is required'
      if (!form.dateOfBirth) return 'Date of birth is required'
      if (role === 'donor' && !form.rhFactor) return 'Rh factor is required'
      if (role === 'patient' && !form.disease) return 'Condition is required'
    }
    if (role === 'hospital') {
      if (!form.hospitalName.trim())  return 'Hospital name is required'
      if (!form.licenseNumber.trim()) return 'License number is required'
      if (!form.address.trim())       return 'Hospital address is required'
    }
    return null
  }

  const handleNext = (e) => {
    e.preventDefault()
    const err = validateStep1()
    if (err) return setError(err)
    setError('')
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validateStep2()
    if (err) return setError(err)
    setError('')
    setLoading(true)

    try {
      // Step 1: create user account → get token + uid
      // skipProfileCreation=true so AuthContext doesn't POST a partial profile;
      // we handle it below with the full form data.
      const cred = await register({ name: form.name, email: form.email, password: form.password, role, skipProfileCreation: true })
      const { uid, token } = cred
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      // Step 2: create role-specific profile
      if (role === 'donor') {
        const res = await fetch(`${API_BASE}/donors/register?uid=${uid}`, {
          method: 'POST', headers,
          body: JSON.stringify({
            name: form.name,
            bloodGroup: form.bloodType,
            rhFactor: form.rhFactor,
            dob: form.dateOfBirth,
            phone: form.phone,
            address: form.address,
          }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.message || 'Failed to save donor profile')
        }
      } else if (role === 'patient') {
        const res = await fetch(`${API_BASE}/patients/register?uid=${uid}`, {
          method: 'POST', headers,
          body: JSON.stringify({
            name: form.name,
            bloodGroup: form.bloodType,
            dob: form.dateOfBirth,
            phone: form.phone,
            address: form.address,
            disease: form.disease,
          }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.message || 'Failed to save patient profile')
        }
      } else if (role === 'hospital') {
        const res = await fetch(`${API_BASE}/hospitals/register?uid=${uid}`, {
          method: 'POST', headers,
          body: JSON.stringify({
            hospitalName: form.hospitalName,
            licenseNumber: form.licenseNumber,
            phone: form.phone,
            address: form.address,
          }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.message || 'Failed to save hospital profile')
        }
      }

      navigate(`/${role}/dashboard`, { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 transition-colors'
  const iconInputCls =
    'w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 transition-colors'
  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 via-white to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center shadow-md">
                <span className="text-2xl">🩸</span>
              </div>
              <span className="text-xl font-bold text-gray-900">BloodConnect</span>
            </Link>
            <p className="text-sm text-gray-500 mt-1">Create your account</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center mb-6">
            {[1, 2].map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {s}
                </div>
                {i === 0 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${step >= 2 ? 'bg-red-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
            <div className="text-xs text-gray-400 ml-2">
              {step === 1 ? 'Account Info' : 'Profile Details'}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              <FiAlertCircle className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type="text" value={form.name} onChange={set('name')}
                    className={iconInputCls} placeholder="John Doe" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type="email" value={form.email} onChange={set('email')}
                    className={iconInputCls} placeholder="you@example.com" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={set('password')} className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 transition-colors"
                    placeholder="Min 8 characters" required />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                    onChange={set('confirmPassword')} className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 transition-colors"
                    placeholder="Repeat password" required />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit"
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors text-sm shadow-sm">
                Continue →
              </button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-red-500 font-semibold hover:underline">Sign in</Link>
              </p>
            </form>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(ROLE_CONFIG).map(([r, cfg]) => (
                    <button key={r} type="button" onClick={() => { setRole(r); setError('') }}
                      className={`flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all text-sm font-medium ${
                        role === r
                          ? 'border-red-500 bg-red-50 text-red-600'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}>
                      <span className="text-xl mb-1">{cfg.emoji}</span>
                      <span>{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type="tel" value={form.phone} onChange={set('phone')}
                    className={iconInputCls} placeholder="9876543210" maxLength={15} required />
                </div>
              </div>

              {/* Donor + Patient fields */}
              {(role === 'donor' || role === 'patient') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group</label>
                      <select value={form.bloodType} onChange={set('bloodType')} className={inputCls} required>
                        <option value="">Select</option>
                        {BLOOD_GROUPS.map((bg) => <option key={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                      <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')}
                        className={inputCls} required />
                    </div>
                  </div>

                  {role === 'donor' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Rh Factor</label>
                      <select value={form.rhFactor} onChange={set('rhFactor')} className={inputCls} required>
                        <option value="">Select</option>
                        <option value="positive">Positive (Rh+)</option>
                        <option value="negative">Negative (Rh−)</option>
                      </select>
                    </div>
                  )}

                  {role === 'patient' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition</label>
                      <select value={form.disease} onChange={set('disease')} className={inputCls} required>
                        <option value="">Select condition</option>
                        {DISEASES.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Address <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input type="text" value={form.address} onChange={set('address')}
                        className={iconInputCls} placeholder="Your address" />
                    </div>
                  </div>
                </>
              )}

              {/* Hospital fields */}
              {role === 'hospital' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital Name</label>
                    <input type="text" value={form.hospitalName} onChange={set('hospitalName')}
                      className={inputCls} placeholder="City General Hospital" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">License Number</label>
                    <input type="text" value={form.licenseNumber} onChange={set('licenseNumber')}
                      className={inputCls} placeholder="LIC-123456" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital Address</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input type="text" value={form.address} onChange={set('address')}
                        className={iconInputCls} placeholder="Full hospital address" required />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setStep(1); setError('') }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm shadow-sm">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-4 text-xs text-gray-400">
          <Link to="/" className="hover:text-gray-600 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage