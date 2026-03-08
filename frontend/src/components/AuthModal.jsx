import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiX, FiDroplet, FiEye, FiEyeOff, FiMail, FiLock,
  FiUser, FiPhone, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi'

// ── Shared input ─────────────────────────────────────────────────
const Input = ({ icon, type = 'text', placeholder, value, onChange, error, rightElement }) => (
  <div>
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-gray-50 transition-all ${
      error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus-within:border-red-400 focus-within:bg-white'
    }`}>
      <span className="text-gray-400 shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
      />
      {rightElement}
    </div>
    {error && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <FiAlertCircle size={11} /> {error}
      </p>
    )}
  </div>
)

// ── Login Form ───────────────────────────────────────────────────
const LoginForm = ({ onSuccess, onSwitch }) => {
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      onSuccess()
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="text-sm text-gray-500 mt-1">Sign in to your BloodConnect account</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          <FiAlertCircle size={15} className="shrink-0" /> {error}
        </div>
      )}

      <Input icon={<FiMail size={16} />} type="email" placeholder="Email address"
        value={email} onChange={e => setEmail(e.target.value)} />

      <Input icon={<FiLock size={16} />} type={showPw ? 'text' : 'password'} placeholder="Password"
        value={password} onChange={e => setPassword(e.target.value)}
        rightElement={
          <button type="button" onClick={() => setShowPw(v => !v)} className="text-gray-400 hover:text-gray-600 shrink-0">
            {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
        }
      />

      <button onClick={handleSubmit} disabled={loading}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        className="w-full py-3 bg-linear-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {loading
          ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in...</>
          : 'Sign In'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <button onClick={onSwitch} className="text-red-500 font-semibold hover:text-red-600">Create one</button>
      </p>
    </div>
  )
}

// ── Register Form ────────────────────────────────────────────────
const ROLES = [
  { value: 'donor',    emoji: '🩸', label: 'Donor',    desc: 'I want to donate blood' },
  { value: 'patient',  emoji: '🏥', label: 'Patient',  desc: 'I need blood' },
  { value: 'hospital', emoji: '🏨', label: 'Hospital', desc: 'Manage blood requests' },
]

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const RegisterForm = ({ onSuccess, onSwitch }) => {
  const { register } = useAuth()
  const [step, setStep]         = useState(1)
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [role, setRole]         = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [phone, setPhone]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState({})
  const [globalError, setGlobalError] = useState('')

  const validateStep1 = () => {
    const e = {}
    if (!name.trim())          e.name     = 'Name is required'
    if (!email.includes('@'))  e.email    = 'Valid email required'
    if (password.length < 6)   e.password = 'At least 6 characters'
    if (password !== confirm)  e.confirm  = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => { if (validateStep1()) setStep(2) }

  const handleSubmit = async () => {
    if (!role) { setErrors({ role: 'Please select a role' }); return }
    if ((role === 'donor' || role === 'patient') && !bloodGroup) {
      setErrors({ bloodGroup: 'Please select your blood group' }); return
    }
    setErrors({})
    setGlobalError('')
    setLoading(true)
    try {
      await register({ name, email, password, role, bloodGroup, phone })
      onSuccess()
    } catch (err) {
      setGlobalError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
        <p className="text-sm text-gray-500 mt-1">Join the BloodConnect network</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4">
        {[1, 2].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= s ? 'bg-red-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {globalError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          <FiAlertCircle size={15} className="shrink-0" /> {globalError}
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-3">
          <Input icon={<FiUser size={16} />} placeholder="Full name"
            value={name} onChange={e => setName(e.target.value)} error={errors.name} />
          <Input icon={<FiMail size={16} />} type="email" placeholder="Email address"
            value={email} onChange={e => setEmail(e.target.value)} error={errors.email} />
          <Input icon={<FiLock size={16} />} type={showPw ? 'text' : 'password'} placeholder="Password (min 6 chars)"
            value={password} onChange={e => setPassword(e.target.value)} error={errors.password}
            rightElement={
              <button type="button" onClick={() => setShowPw(v => !v)} className="text-gray-400 hover:text-gray-600 shrink-0">
                {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            }
          />
          <Input icon={<FiLock size={16} />} type="password" placeholder="Confirm password"
            value={confirm} onChange={e => setConfirm(e.target.value)} error={errors.confirm} />

          <button onClick={handleNext}
            className="w-full py-3 bg-linear-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300">
            Continue
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">I am a...</p>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => (
                <button key={r.value} onClick={() => setRole(r.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                    role === r.value ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className="text-2xl mb-1">{r.emoji}</div>
                  <div className="text-xs font-semibold text-gray-900">{r.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-tight">{r.desc}</div>
                </button>
              ))}
            </div>
            {errors.role && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <FiAlertCircle size={11} /> {errors.role}
              </p>
            )}
          </div>

          {(role === 'donor' || role === 'patient') && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Blood Group</p>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map(bg => (
                  <button key={bg} onClick={() => setBloodGroup(bg)}
                    className={`py-2 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${
                      bloodGroup === bg ? 'border-red-500 bg-red-500 text-white' : 'border-gray-200 text-gray-700 hover:border-red-300'
                    }`}>
                    {bg}
                  </button>
                ))}
              </div>
              {errors.bloodGroup && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <FiAlertCircle size={11} /> {errors.bloodGroup}
                </p>
              )}
            </div>
          )}

          <Input icon={<FiPhone size={16} />} type="tel" placeholder="Phone number (optional)"
            value={phone} onChange={e => setPhone(e.target.value)} />

          <div className="flex gap-2">
            <button onClick={() => setStep(1)}
              className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:border-gray-300 transition-colors">
              Back
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 bg-linear-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating...</>
                : <><FiCheckCircle size={15} /> Create Account</>}
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <button onClick={onSwitch} className="text-red-500 font-semibold hover:text-red-600">Sign in</button>
      </p>
    </div>
  )
}

// ── AuthModal ────────────────────────────────────────────────────
const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const navigate = useNavigate()
  const [mode, setMode] = useState(initialMode)

  useEffect(() => { setMode(initialMode) }, [initialMode])

  // Close on ESC
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSuccessDelayed = () => {
    onClose()
    setTimeout(() => {
      const stored = JSON.parse(localStorage.getItem('user') || 'null')
      if (stored?.role) {
        const map = { donor: '/donor/dashboard', hospital: '/hospital/dashboard', patient: '/patient/dashboard', admin: '/admin/dashboard' }
        navigate(map[stored.role.toLowerCase()] || '/donor/dashboard')
      }
    }, 100)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className={`w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden transition-all duration-300 ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                <FiDroplet className="text-white text-sm" />
              </div>
              <span className="font-bold text-gray-900">BloodConnect</span>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <FiX size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="px-6 pb-6 pt-2">
            {mode === 'login'
              ? <LoginForm onSuccess={handleSuccessDelayed} onSwitch={() => setMode('register')} />
              : <RegisterForm onSuccess={handleSuccessDelayed} onSwitch={() => setMode('login')} />
            }
          </div>
        </div>
      </div>
    </>
  )
}

export default AuthModal