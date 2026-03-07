import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiX, FiUser, FiPhone, FiMapPin, FiCalendar, FiDroplet } from 'react-icons/fi'
import { FaGoogle } from 'react-icons/fa'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode) // 'login' or 'register'
  const [step, setStep] = useState(1) // For register: step 1 or 2
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Register state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    bloodType: '',
    phone: '',
    dateOfBirth: '',
    disease: '',
    address: '',
    city: '',
    state: '',
    hospitalName: '',
    licenseNumber: ''
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' })

  const { login, signup } = useAuth()
  const navigate = useNavigate()

  // Sync mode with initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
    }
  }, [isOpen, initialMode])

  const handleClose = useCallback(() => {
    setEmail('')
    setPassword('')
    setError('')
    setEmailError('')
    setPasswordError('')
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      bloodType: '',
      phone: '',
      dateOfBirth: '',
      disease: '',
      address: '',
      city: '',
      state: '',
      hospitalName: '',
      licenseNumber: ''
    })
    setFieldErrors({})
    setStep(1)
    onClose()
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, handleClose])

  useEffect(() => {
    if (isOpen) {
      handleRedirectResult()
    }
  }, [isOpen])

  const handleRedirectResult = async () => {
    return
  }

  const navigateToDashboard = (role) => {
    switch (role) {
      case 'donor':
        navigate('/donor/dashboard')
        break
      case 'hospital':
        navigate('/hospital/dashboard')
        break
      case 'patient':
        navigate('/patient/dashboard')
        break
      case 'admin':
        navigate('/admin/dashboard')
        break
      default:
        navigate('/')
    }
  }

  // Login validation
  const validateEmail = (email) => {
    if (!email.trim()) {
      setEmailError('Email is required')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError('Password is required')
      return false
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return false
    }
    setPasswordError('')
    return true
  }

  // Login submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)

    if (!isEmailValid || !isPasswordValid) return

    setLoading(true)

    try {
      const userCredential = await login(email, password)

      // Fetch role from database
      const uid = userCredential.user.uid
      const response = await fetch(`${API_BASE}/users/${uid}/role`)

      if (response.ok) {
        const data = await response.json()
        const role = data.role

        handleClose()
        navigateToDashboard(role)
      } else {
        setError('Could not determine user role')
      }
    } catch (err) {
      console.error('Login error:', err)
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email')
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password')
      } else {
        setError('Login failed. Please try again')
      }
    } finally {
      setLoading(false)
    }
  }

  // Register password strength
  const calculatePasswordStrength = (password) => {
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[@$!%*?&#]/.test(password)) score++

    const labels = ['Weak', 'Fair', 'Good', 'Strong']
    const colors = ['text-rose-400', 'text-orange-400', 'text-yellow-400', 'text-emerald-400']

    setPasswordStrength({
      score,
      label: score > 0 ? labels[score - 1] : 'Very Weak',
      color: score > 0 ? colors[score - 1] : 'text-gray-400'
    })
  }

  useEffect(() => {
    if (formData.password) {
      calculatePasswordStrength(formData.password)
    }
  }, [formData.password])

  // Register validation
  const validateStep1 = () => {
    const errors = {}

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!emailRegex.test(formData.email)) errors.email = 'Invalid email address'

    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters'

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.name.trim()) errors.name = 'Name is required'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePhone = (phone) => {
    if (!phone.trim()) return 'Phone number is required'
    // Indian phone number: starts with 6-9, exactly 10 digits
    const phoneRegex = /^[6-9]\d{9}$/
    const cleanPhone = phone.replace(/[-() s]/g, '')
    if (!phoneRegex.test(cleanPhone)) return 'Enter valid Indian phone number (10 digits, starting with 6-9)'
    return ''
  }

  const validateStep2 = () => {
    const errors = {}

    if (!formData.role) errors.role = 'Please select a role'

    if (formData.role === 'donor' || formData.role === 'patient') {
      if (!formData.bloodType) errors.bloodType = 'Blood type is required'
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required'

      // Rh factor required for donors only
      if (formData.role === 'donor' && !formData.rhFactor) {
        errors.rhFactor = 'Rh factor is required'
      }

      const phoneErr = validatePhone(formData.phone)
      if (phoneErr) errors.phone = phoneErr

      // Disease required for patients only
      if (formData.role === 'patient' && !formData.disease) {
        errors.disease = 'Please select a disease'
      }
    }

    if (formData.role === 'hospital') {
      if (!formData.hospitalName?.trim()) errors.hospitalName = 'Hospital name is required'
      if (!formData.licenseNumber?.trim()) errors.licenseNumber = 'License number is required'
      if (!formData.address?.trim()) errors.address = 'Address is required'

      const phoneErr = validatePhone(formData.phone)
      if (phoneErr) errors.phone = phoneErr
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleRegisterNext = (e) => {
    e.preventDefault()
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleRegisterBack = () => {
    setStep(1)
    setError('')
    setFieldErrors({})
  }
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()

    if (!validateStep2()) return

    setLoading(true)
    setError('')

    try {
      // 1. Create Firebase Auth account and sync basic user data
      const userCredential = await signup(formData.email, formData.password, formData.name, formData.role)
      const uid = userCredential.user.uid

      // 2. Register role-specific profile data
      let endpoint = ''
      let profileData = {}

      if (formData.role === 'donor') {
        endpoint = `http://localhost:8080/api/donors/register?uid=${uid}`
        profileData = {
          name: formData.name,
          phone: formData.phone,
          bloodGroup: formData.bloodType,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          weight: '0', // Default
          height: '0' // Default
        }
      } else if (formData.role === 'patient') {
        endpoint = `http://localhost:8080/api/patients/register?uid=${uid}`
        profileData = {
          name: formData.name,
          phoneNumber: formData.phone,
          bloodGroup: formData.bloodType,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          medicalConditions: formData.disease
        }
      } else if (formData.role === 'hospital') {
        endpoint = `http://localhost:8080/api/hospitals/register?uid=${uid}`
        profileData = {
          hospitalName: formData.hospitalName,
          contactNumber: formData.phone,
          licenseNumber: formData.licenseNumber,
          address: formData.address,
          city: formData.city,
          state: formData.state
        }
      }

      // Send detailed profile to backend
      if (endpoint) {
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData)
        })
      }

      handleClose()
      navigateToDashboard(formData.role)
    } catch (err) {
      console.error('Registration error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak')
      } else if (err.code === 'auth/invalid-value-(display-name)') {
        setError('Invalid Name provided')
      } else {
        setError('Registration failed: ' + err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(false)
    setError('Google authentication is not configured')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (error) setError('')
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg border border-gray-200 shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 z-10"
        >
          <FiX className="text-xl" />
        </button>

        <div className="p-10">
          {/* Mode Toggle */}
          {step === 1 && (
            <div className="flex items-center justify-center gap-2 mb-8">
              <button
                onClick={() => setMode('login')}
                className={`px-8 py-2.5 rounded-lg font-semibold ${mode === 'login'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
              >
                Login
              </button>
              <button
                onClick={() => setMode('register')}
                className={`px-8 py-2.5 rounded-lg font-semibold ${mode === 'register'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                <FiDroplet className="text-white text-2xl" />
              </div>
              <span className="text-3xl font-bold text-gray-800">
                BloodConnect
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {mode === 'login' ? 'Welcome Back' : step === 1 ? 'Create Account' : 'Complete Profile'}
            </h2>
            <p className="text-gray-600 mt-2 text-sm">
              {mode === 'login' ? 'Sign in to continue saving lives' : step === 1 ? 'Join us in making a difference' : 'Tell us more about yourself'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-3">
                <FiAlertCircle className="text-red-600 flex-shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiMail />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => validateEmail(email)}
                      placeholder="you@example.com"
                      className={`w-full pl-11 pr-4 py-3 bg-white border ${emailError ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                    />
                    {emailError && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" />
                        {emailError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiLock />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => validatePassword(password)}
                      placeholder="Enter your password"
                      className={`w-full pl-11 pr-12 py-3 bg-white border ${passwordError ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                    {passwordError && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" />
                        {passwordError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-3.5 rounded-lg bg-white hover:bg-gray-50 text-gray-800 font-semibold border border-gray-300 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <FaGoogle className="text-lg" />
                Sign in with Google
              </button>
            </form>
          )}

          {/* REGISTER FORM - STEP 1 */}
          {mode === 'register' && step === 1 && (
            <form onSubmit={handleRegisterNext} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiUser />
                    </div>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={`w-full pl-11 pr-4 py-3 bg-white border ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                    />
                    {fieldErrors.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiMail />
                    </div>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`w-full pl-11 pr-4 py-3 bg-white border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiLock />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      className={`w-full pl-11 pr-12 py-3 bg-white border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                    {formData.password && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.score === 1 ? 'bg-red-500 w-1/4' :
                              passwordStrength.score === 2 ? 'bg-orange-500 w-2/4' :
                                passwordStrength.score === 3 ? 'bg-yellow-500 w-3/4' :
                                  passwordStrength.score === 4 ? 'bg-green-500 w-full' :
                                    'bg-gray-400 w-0'
                              }`}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium ${passwordStrength.score === 1 ? 'text-red-600' :
                          passwordStrength.score === 2 ? 'text-orange-600' :
                            passwordStrength.score === 3 ? 'text-yellow-600' :
                              passwordStrength.score === 4 ? 'text-green-600' :
                                'text-gray-600'
                          }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                    )}
                    {fieldErrors.password && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.password}
                      </p>
                    )}
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiLock />
                    </div>
                    <input
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={`w-full pl-11 pr-4 py-3 bg-white border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                    />
                    {fieldErrors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
              >
                Next Step →
              </button>

              {/* Google Sign Up */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-white hover:bg-gray-50 text-gray-800 font-medium border border-gray-300 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <FaGoogle className="text-lg" />
                Sign up with Google
              </button>
            </form>
          )}

          {/* REGISTER FORM - STEP 2 */}
          {mode === 'register' && step === 2 && (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Your Role *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['donor', 'hospital', 'patient'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleChange({ target: { name: 'role', value: role } })}
                      className={`p-4 rounded-lg border-2 ${formData.role === role
                        ? 'bg-red-50 border-red-500 text-red-600'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                    >
                      <span className="block text-sm font-semibold capitalize">{role}</span>
                    </button>
                  ))}
                </div>
                {fieldErrors.role && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle className="text-xs" /> {fieldErrors.role}
                  </p>
                )}
              </div>

              {/* Donor/Patient Fields */}
              {(formData.role === 'donor' || formData.role === 'patient') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type *</label>
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white border ${fieldErrors.bloodType ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg text-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                    >
                      <option value="">Select Blood Type</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {fieldErrors.bloodType && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.bloodType}
                      </p>
                    )}
                  </div>

                  {/* Rh Factor Selection - Only for Donors */}
                  {formData.role === 'donor' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rh Factor *</label>
                      <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="rhFactor"
                            value="positive"
                            checked={formData.rhFactor === 'positive'}
                            onChange={handleChange}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Positive (Rh+)</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="rhFactor"
                            value="negative"
                            checked={formData.rhFactor === 'negative'}
                            onChange={handleChange}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Negative (Rh-)</span>
                        </label>
                      </div>
                      {fieldErrors.rhFactor && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <FiAlertCircle className="text-xs" /> {fieldErrors.rhFactor}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                    <input
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white border ${fieldErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg text-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                    />
                    {fieldErrors.dateOfBirth && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      maxLength="10"
                      pattern="[0-9]{10}"
                      onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                      className={`w-full px-4 py-3 bg-white border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                    />
                    {fieldErrors.phone && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.phone}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Enter 10-digit Indian mobile number</p>
                  </div>

                  {/* Disease Field - Only for Patients */}
                  {formData.role === 'patient' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Disease/Condition *</label>
                      <select
                        name="disease"
                        value={formData.disease}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-white border ${fieldErrors.disease ? 'border-red-500' : 'border-gray-300'
                          } rounded-lg text-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                      >
                        <option value="">Select Disease/Condition</option>
                        <option value="Thalassemia">Thalassemia</option>
                        <option value="Sickle Cell Disease">Sickle Cell Disease</option>
                        <option value="Hemophilia">Hemophilia</option>
                        <option value="Anemia">Anemia</option>
                        <option value="Cancer">Cancer</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Accident/Trauma">Accident/Trauma</option>
                        <option value="Pregnancy Complications">Pregnancy Complications</option>
                        <option value="Liver Disease">Liver Disease</option>
                        <option value="Kidney Disease">Kidney Disease</option>
                        <option value="Other">Other</option>
                      </select>
                      {fieldErrors.disease && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <FiAlertCircle className="text-xs" /> {fieldErrors.disease}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 Main St"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Hospital Fields */}
              {formData.role === 'hospital' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name *</label>
                    <input
                      name="hospitalName"
                      value={formData.hospitalName}
                      onChange={handleChange}
                      placeholder="City General Hospital"
                      className={`w-full px-4 py-3 bg-white border ${fieldErrors.hospitalName ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                    />
                    {fieldErrors.hospitalName && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.hospitalName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
                    <input
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="LIC-123456"
                      className={`w-full px-4 py-3 bg-white border ${fieldErrors.licenseNumber ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                    />
                    {fieldErrors.licenseNumber && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.licenseNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      maxLength="10"
                      pattern="[0-9]{10}"
                      onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                      className={`w-full px-4 py-3 bg-white border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                    />
                    {fieldErrors.phone && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.phone}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Enter 10-digit Indian mobile number</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 Medical Plaza"
                      className={`w-full px-4 py-3 bg-white border ${fieldErrors.address ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg text-gray-800 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none`}
                    />
                    {fieldErrors.address && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.address}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRegisterBack}
                  className="flex-1 py-3.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-semibold"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
