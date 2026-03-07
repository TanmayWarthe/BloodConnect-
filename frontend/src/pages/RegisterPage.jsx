import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiPhone, FiMapPin, FiCalendar,
  FiAlertCircle, FiCheckCircle, FiDroplet, FiHeart, FiActivity, FiUsers,
  FiArrowRight, FiArrowLeft, FiCheck
} from 'react-icons/fi'

const RegisterPage = () => {
  const location = useLocation()
  const googleUser = location.state?.googleUser
  const continueRegistration = location.state?.continueRegistration

  const [step, setStep] = useState(continueRegistration ? 2 : 1)
  const [formData, setFormData] = useState({
    email: googleUser?.email || '',
    password: '',
    confirmPassword: '',
    name: googleUser?.displayName || '',
    role: 'donor',
    phone: '',
    bloodType: '',
    rhFactor: '',
    dateOfBirth: '',
    disease: '',
    address: '',
    city: '',
    state: '',
    hospitalName: '',
    licenseNumber: ''
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const { signup } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (formData.password) {
      calculatePasswordStrength(formData.password)
    }
  }, [formData.password])

  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    setPasswordStrength(strength)
  }

  const validateEmail = (email) => {
    if (!email.trim()) return 'Email is required'
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return ''
  }

  const validatePassword = (password) => {
    if (!password) return 'Password is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (passwordStrength < 50) return 'Password is too weak'
    return ''
  }

  const validatePhone = (phone) => {
    if (!phone.trim()) return 'Phone number is required'
    const phoneRegex = /^[6-9]\d{9}$/
    const cleanPhone = phone.replace(/[-() s]/g, '')
    if (!phoneRegex.test(cleanPhone)) return 'Enter valid 10-digit phone number'
    return ''
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (error) setError('')
  }

  const validateStep1 = () => {
    const errors = {}
    if (!googleUser) {
      const emailErr = validateEmail(formData.email)
      if (emailErr) errors.email = emailErr
      const passwordErr = validatePassword(formData.password)
      if (passwordErr) errors.password = passwordErr
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
    }
    if (!formData.name.trim()) errors.name = 'Name is required'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep2 = () => {
    const errors = {}
    const phoneErr = validatePhone(formData.phone)
    if (phoneErr) errors.phone = phoneErr

    if (formData.role === 'donor' || formData.role === 'patient') {
      if (!formData.bloodType) errors.bloodType = 'Blood type is required'
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required'
      if (formData.role === 'donor' && !formData.rhFactor) {
        errors.rhFactor = 'Rh factor is required'
      }
      if (formData.role === 'patient' && !formData.disease) {
        errors.disease = 'Please select a disease'
      }
    }

    if (formData.role === 'hospital') {
      if (!formData.hospitalName.trim()) errors.hospitalName = 'Hospital name is required'
      if (!formData.licenseNumber.trim()) errors.licenseNumber = 'License number is required'
      if (!formData.address.trim()) errors.address = 'Address is required'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
    setError('')
    setFieldErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep2()) return

    setLoading(true)
    setError('')

    try {
      const userCred = await signup(formData.email, formData.password, formData.name, formData.role)
      const uid = userCred.user.uid

      try {
        if (formData.role === 'donor') {
          const response = await fetch(`http://localhost:8080/api/donors/register?uid=${uid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              bloodGroup: formData.bloodType,
              rhFactor: formData.rhFactor,
              dob: formData.dateOfBirth,
              phone: formData.phone,
              address: formData.address,
            })
          })
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to save donor profile: ${errorText}`)
          }
        } else if (formData.role === 'patient') {
          const response = await fetch(`http://localhost:8080/api/patients/register?uid=${uid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              bloodGroup: formData.bloodType,
              dob: formData.dateOfBirth,
              phone: formData.phone,
              address: formData.address,
              disease: formData.disease,
            })
          })
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to save patient profile: ${errorText}`)
          }
        } else if (formData.role === 'hospital') {
          const response = await fetch(`http://localhost:8080/api/hospitals/register?uid=${uid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hospitalName: formData.hospitalName,
              licenseNumber: formData.licenseNumber,
              phone: formData.phone,
              address: formData.address,
            })
          })
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to save hospital profile: ${errorText}`)
          }
        }
      } catch (backendError) {
        console.error("Failed to save detailed profile", backendError)
        setError(`Registration successful but profile save failed: ${backendError.message}`)
        setLoading(false)
        return
      }

      navigate(`/${formData.role}/dashboard`)
    } catch (err) {
      console.error('Registration error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak')
      } else {
        setError(err.message || 'Registration failed. Please try again')
      }
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'donor': return <FiHeart className="text-xl" />
      case 'hospital': return <FiActivity className="text-xl" />
      case 'patient': return <FiUsers className="text-xl" />
      default: return <FiUser className="text-xl" />
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 75) return 'bg-green-500'
    if (passwordStrength >= 50) return 'bg-yellow-500'
    if (passwordStrength >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-100/50 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 p-8 md:p-10">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center gap-3 mb-6 group">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-br from-primary to-primary-dark rounded-xl transform rotate-45 group-hover:rotate-90 transition-transform duration-500"></div>
                <FiDroplet className="relative text-white text-3xl p-2" />
              </div>
              <span className="text-3xl font-display font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                BloodConnect
              </span>
            </Link>
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-500">Join the life-saving network</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                  {step > 1 ? <FiCheck /> : '1'}
                </div>
                <span className="font-medium hidden sm:inline">Account</span>
              </div>
              <div className={`h-0.5 w-16 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="font-medium hidden sm:inline">Details</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-linear-to-r from-red-50 to-red-100/50 border border-red-200 text-red-700 text-sm flex items-center gap-3 animate-shake">
              <FiAlertCircle className="flex-shrink-0 text-lg" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Account Info */}
          {step === 1 && (
            <div className="animate-fade-in">
              <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
                {/* Name */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white/50 ${fieldErrors.name ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="John Doe"
                    />
                  </div>
                  {fieldErrors.name && <p className="text-xs text-red-500 mt-2 ml-1">{fieldErrors.name}</p>}
                </div>

                {!googleUser && (
                  <>
                    {/* Email */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white/50 ${fieldErrors.email ? 'border-red-500' : 'border-gray-200'}`}
                          placeholder="you@example.com"
                        />
                      </div>
                      {fieldErrors.email && <p className="text-xs text-red-500 mt-2 ml-1">{fieldErrors.email}</p>}
                    </div>

                    {/* Password */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                      <div className="relative">
                        <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white/50 ${fieldErrors.password ? 'border-red-500' : 'border-gray-200'}`}
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {formData.password && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                style={{ width: `${passwordStrength}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {passwordStrength >= 75 ? 'Strong' : passwordStrength >= 50 ? 'Good' : passwordStrength >= 25 ? 'Weak' : 'Very Weak'}
                            </span>
                          </div>
                        </div>
                      )}
                      {fieldErrors.password && <p className="text-xs text-red-500 mt-2 ml-1">{fieldErrors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                      <div className="relative">
                        <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white/50 ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-200'}`}
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                        >
                          {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-2 ml-1">{fieldErrors.confirmPassword}</p>}
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="group w-full py-4 bg-linear-to-r from-primary to-primary-dark text-white font-bold rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 mt-6"
                >
                  <span className="flex items-center justify-center gap-2">
                    Continue
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-500">
                Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
              </div>
            </div>
          )}

          {/* Step 2: Role & Details */}
          {step === 2 && (
            <div className="animate-fade-in">
              <button
                onClick={handleBack}
                className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors font-medium"
              >
                <FiArrowLeft /> Back to Account
              </button>

              <h2 className="text-xl font-display font-bold text-gray-900 mb-6">Choose Your Role</h2>

              {/* Role Selection */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {['donor', 'hospital', 'patient'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleChange({ target: { name: 'role', value: role } })}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${formData.role === role
                        ? 'bg-linear-to-br from-primary/10 to-primary/5 border-primary shadow-lg'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${formData.role === role ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {getRoleIcon(role)}
                      </div>
                      <span className="text-sm font-semibold capitalize">{role}</span>
                    </div>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Phone */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <FiPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      maxLength="10"
                      onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white/50 ${fieldErrors.phone ? 'border-red-500' : 'border-gray-200'}`}
                    />
                  </div>
                  {fieldErrors.phone && <p className="text-xs text-red-500 mt-2 ml-1">{fieldErrors.phone}</p>}
                </div>

                {/* Donor/Patient Fields */}
                {(formData.role === 'donor' || formData.role === 'patient') && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Blood Type */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Type</label>
                        <select
                          name="bloodType"
                          value={formData.bloodType}
                          onChange={handleChange}
                          className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white/50 ${fieldErrors.bloodType ? 'border-red-500' : 'border-gray-200'}`}
                        >
                          <option value="">Select</option>
                          {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                        {fieldErrors.bloodType && <p className="text-xs text-red-500 mt-2 ml-1">{fieldErrors.bloodType}</p>}
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white/50 ${fieldErrors.dateOfBirth ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {fieldErrors.dateOfBirth && <p className="text-xs text-red-500 mt-2 ml-1">{fieldErrors.dateOfBirth}</p>}
                      </div>
                    </div>

                    {/* Rh Factor for Donors */}
                    {formData.role === 'donor' && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">Rh Factor</label>
                        <div className="flex gap-6">
                          <label className="flex items-center cursor-pointer group">
                            <input
                              type="radio"
                              name="rhFactor"
                              value="positive"
                              checked={formData.rhFactor === 'positive'}
                              onChange={handleChange}
                              className="w-4 h-4 text-primary border-gray-300 focus:ring-primary cursor-pointer"
                            />
                            <span className="ml-2 text-sm text-gray-700 group-hover:text-primary transition-colors">Positive (Rh+)</span>
                          </label>
                          <label className="flex items-center cursor-pointer group">
                            <input
                              type="radio"
                              name="rhFactor"
                              value="negative"
                              checked={formData.rhFactor === 'negative'}
                              onChange={handleChange}
                              className="w-4 h-4 text-primary border-gray-300 focus:ring-primary cursor-pointer"
                            />
                            <span className="ml-2 text-sm text-gray-700 group-hover:text-primary transition-colors">Negative (Rh-)</span>
                          </label>
                        </div>
                        {fieldErrors.rhFactor && <p className="text-xs text-red-500 mt-2">{fieldErrors.rhFactor}</p>}
                      </div>
                    )}

                    {/* Disease for Patients */}
                    {formData.role === 'patient' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
                        <select
                          name="disease"
                          value={formData.disease}
                          onChange={handleChange}
                          className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white/50 ${fieldErrors.disease ? 'border-red-500' : 'border-gray-200'}`}
                        >
                          <option value="">Select Condition</option>
                          <option value="Thalassemia">Thalassemia</option>
                          <option value="Sickle Cell Disease">Sickle Cell Disease</option>
                          <option value="Hemophilia">Hemophilia</option>
                          <option value="Anemia">Anemia</option>
                          <option value="Cancer">Cancer</option>
                          <option value="Surgery">Surgery</option>
                          <option value="Accident/Trauma">Accident/Trauma</option>
                          <option value="Other">Other</option>
                        </select>
                        {fieldErrors.disease && <p className="text-xs text-red-500 mt-2 ml-1">{fieldErrors.disease}</p>}
                      </div>
                    )}

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address (Optional)</label>
                      <div className="relative">
                        <FiMapPin className="absolute left-4 top-4 text-gray-400" />
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Enter your address"
                          rows="2"
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white/50"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Hospital Fields */}
                {formData.role === 'hospital' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital Name</label>
                      <input
                        type="text"
                        name="hospitalName"
                        value={formData.hospitalName}
                        onChange={handleChange}
                        placeholder="Hospital Name"
                        className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white/50 ${fieldErrors.hospitalName ? 'border-red-500' : 'border-gray-200'}`}
                      />
                      {fieldErrors.hospitalName && <p className="text-xs text-red-500 mt-2 ml-1">{fieldErrors.hospitalName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">License Number</label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        placeholder="License Number"
                        className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white/50 ${fieldErrors.licenseNumber ? 'border-red-500' : 'border-gray-200'}`}
                      />
                      {fieldErrors.licenseNumber && <p className="text-xs text-red-500 mt-2 ml-1">{fieldErrors.licenseNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital Address</label>
                      <div className="relative">
                        <FiMapPin className="absolute left-4 top-4 text-gray-400" />
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Enter hospital address"
                          rows="2"
                          className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 bg-white/50 ${fieldErrors.address ? 'border-red-500' : 'border-gray-200'}`}
                        />
                      </div>
                      {fieldErrors.address && <p className="text-xs text-red-500 mt-2 ml-1">{fieldErrors.address}</p>}
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full py-4 bg-linear-to-r from-primary to-primary-dark text-white font-bold rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none mt-6"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Complete Registration
                        <FiCheckCircle className="group-hover:scale-110 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By registering, you agree to our{' '}
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default RegisterPage
