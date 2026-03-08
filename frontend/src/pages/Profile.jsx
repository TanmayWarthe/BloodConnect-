import { useState, useEffect, useCallback, useRef } from 'react'
import Layout from '../components/Layout'
import {
  FiUser, FiEdit2, FiSave, FiX, FiMail, FiCalendar,
  FiMapPin, FiPhone, FiDroplet, FiActivity, FiShield,
  FiHeart, FiUpload, FiCheckCircle, FiAlertCircle,
  FiLock, FiChevronDown, FiCamera, FiTrendingUp
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

// ── Field wrapper ────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
    {children}
  </div>
)

const StaticValue = ({ value, highlight }) =>
  highlight
    ? <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm font-black text-red-600">{value}</div>
    : <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 font-medium">{value || <span className="text-gray-300 font-normal">Not provided</span>}</div>

const InputField = ({ type = 'text', value, onChange, placeholder }) => (
  <input
    type={type}
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-4 py-3 bg-white border-2 border-gray-100 focus:border-red-400 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none transition-colors"
  />
)

export default function Profile() {
  const { currentUser, updateCurrentUser } = useAuth()
  const [isEditing, setIsEditing]   = useState(false)
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [editData, setEditData]     = useState({})
  const [activeTab, setActiveTab]   = useState('personal')
  const [profileImage, setProfileImage] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError]   = useState('')
  const fileInputRef = useRef(null)

  const userRole = currentUser?.role?.toLowerCase() || 'donor'

  const fetchProfile = useCallback(async () => {
    if (!currentUser?.uid) return
    setLoading(true)
    try {
      const endpoint =
        userRole === 'donor'    ? `/donors/${currentUser.uid}`    :
        userRole === 'patient'  ? `/patients/${currentUser.uid}`  :
        userRole === 'hospital' ? `/hospitals/profile/${currentUser.uid}` : null
      if (!endpoint) return
      const { data: p } = await apiService.get(endpoint)
      const transformed = {
        fullName:       p.name || p.hospitalName || currentUser.name || '',
        email:          currentUser.email || '',
        phone:          p.phone || '',
        location:       p.address || p.location || '',
        birthDate:      p.dob || p.birthDate || '',
        bloodGroup:     p.bloodGroup || '',
        lastDonation:   p.lastDonationDate || p.lastDonation || '',
        totalDonations: p.totalDonations || 0,
        status:         p.availabilityStatus || p.status || 'Active',
        memberSince:    p.createdAt ? new Date(p.createdAt).getFullYear() : new Date().getFullYear(),
        exists:         true,
      }
      setProfileData(transformed)
      setProfileImage(p.image || null)
    } catch (err) {
      if (err.response?.status === 404) {
        const empty = {
          fullName: currentUser.name || currentUser.email?.split('@')[0] || '',
          email: currentUser.email || '', phone: '', location: '', birthDate: '',
          bloodGroup: '', lastDonation: '', totalDonations: 0,
          status: 'Pending', memberSince: new Date().getFullYear(), exists: false,
        }
        setProfileData(empty); setEditData(empty); setIsEditing(true)
      } else { console.error(err) }
    } finally { setLoading(false) }
  }, [currentUser, userRole])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleEdit   = () => { setIsEditing(true); setEditData({ ...profileData }); setSaveError('') }
  const handleCancel = () => { setIsEditing(false); setSaveError('') }
  const set          = (field, value) => setEditData(p => ({ ...p, [field]: value }))

  const handleSave = async () => {
    if (!currentUser?.uid) return
    setSaving(true); setSaveError('')
    try {
      const isNew = !profileData?.exists
      let endpoint = '', payload = {}
      if (userRole === 'donor') {
        endpoint = isNew ? `/donors/register?uid=${currentUser.uid}` : `/donors/${currentUser.uid}`
        payload  = { name: editData.fullName, phone: editData.phone, address: editData.location, bloodGroup: editData.bloodGroup, dob: editData.birthDate || null }
      } else if (userRole === 'patient') {
        endpoint = isNew ? `/patients/register?uid=${currentUser.uid}` : `/patients/${currentUser.uid}`
        payload  = { name: editData.fullName, phone: editData.phone, address: editData.location, bloodGroup: editData.bloodGroup, dob: editData.birthDate || null }
      } else if (userRole === 'hospital') {
        endpoint = isNew ? `/hospitals/register?uid=${currentUser.uid}` : `/hospitals/${currentUser.uid}`
        payload  = { hospitalName: editData.fullName, phone: editData.phone, address: editData.location }
      }
      isNew ? await apiService.post(endpoint, payload) : await apiService.put(endpoint, payload)
      if (editData.fullName !== currentUser.name) updateCurrentUser?.({ name: editData.fullName })
      await fetchProfile()
      setIsEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err.displayMessage || err.response?.data?.message || 'Failed to save. Please try again.')
    } finally { setSaving(false) }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploadProgress(0)
    const iv = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) { clearInterval(iv); setProfileImage(URL.createObjectURL(file)); return 100 }
        return p + 10
      })
    }, 80)
  }

  const roleConfig = {
    donor:    { icon: <FiHeart />,    color: 'text-red-500',   bg: 'bg-red-50',   border: 'border-red-100',   accent: 'bg-red-500'   },
    patient:  { icon: <FiActivity />, color: 'text-blue-500',  bg: 'bg-blue-50',  border: 'border-blue-100',  accent: 'bg-blue-500'  },
    hospital: { icon: <FiShield />,   color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100', accent: 'bg-green-500' },
  }
  const role = roleConfig[userRole] || roleConfig.donor

  const tabs = [
    { id: 'personal', icon: <FiUser size={14} />,    label: 'Personal'  },
    { id: 'medical',  icon: <FiDroplet size={14} />, label: 'Medical'   },
    { id: 'security', icon: <FiLock size={14} />,    label: 'Security'  },
  ]

  if (loading && !profileData) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400 font-medium">Loading profile...</p>
        </div>
      </div>
    </Layout>
  )

  const initials = profileData?.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Top Bar ─────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">My Profile</h1>
              <p className="text-xs text-gray-400 mt-0.5">Manage your personal information and preferences</p>
            </div>
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 font-semibold">
                  <FiCheckCircle size={14} /> Saved!
                </div>
              )}
              {!isEditing ? (
                <button onClick={handleEdit}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-red-200">
                  <FiEdit2 size={14} /> Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">
                    <FiX size={14} /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-red-200">
                    {saving
                      ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                      : <><FiSave size={14} /> Save Changes</>}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Save Error ───────────────────────────────────── */}
          {saveError && (
            <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
              <FiAlertCircle size={15} className="shrink-0" /> {saveError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left Card ───────────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-8">

                {/* Cover + Avatar */}
                <div className="relative">
                  <div className={`h-24 ${role.accent} opacity-10`} />
                  <div className={`h-24 absolute inset-0 ${role.accent}`} style={{ opacity: 0.08 }} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-5">
                    <div className="text-8xl">{role.icon}</div>
                  </div>

                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden">
                        {profileImage
                          ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                          : <div className={`w-full h-full ${role.bg} flex items-center justify-center`}>
                              <span className={`text-2xl font-black ${role.color}`}>{initials}</span>
                            </div>
                        }
                      </div>
                      {isEditing && (
                        <button onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <FiCamera className="text-white text-lg" />
                        </button>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="absolute -bottom-3 left-0 right-0 px-1">
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="pt-14 pb-5 px-5 text-center">
                  <h2 className="text-lg font-black text-gray-900 tracking-tight mb-1">
                    {profileData?.fullName || 'Complete Your Profile'}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mb-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${role.bg} ${role.color} ${role.border} border capitalize`}>
                      {role.icon} {userRole}
                    </span>
                    {profileData?.bloodGroup && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-red-50 text-red-600 border border-red-100">
                        <FiDroplet size={10} /> {profileData.bloodGroup}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {profileData?.email && (
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <FiMail size={11} /> <span className="truncate">{profileData.email}</span>
                      </div>
                    )}
                    {profileData?.phone && (
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <FiPhone size={11} /> {profileData.phone}
                      </div>
                    )}
                    {profileData?.location && (
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <FiMapPin size={11} /> {profileData.location}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="mx-5 mb-5 grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-xl font-black text-gray-900">{profileData?.totalDonations || 0}</p>
                    <p className="text-xs text-gray-400 font-medium">Donations</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-xl font-black text-gray-900">{profileData?.memberSince}</p>
                    <p className="text-xs text-gray-400 font-medium">Member Since</p>
                  </div>
                </div>

                {/* Status */}
                <div className="mx-5 mb-5">
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${
                    profileData?.status === 'AVAILABLE' || profileData?.status === 'Active'
                      ? 'bg-green-50 border border-green-100'
                      : 'bg-yellow-50 border border-yellow-100'
                  }`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${
                      profileData?.status === 'AVAILABLE' || profileData?.status === 'Active' ? 'bg-green-400' : 'bg-yellow-400'
                    }`} />
                    <span className={`text-xs font-bold capitalize ${
                      profileData?.status === 'AVAILABLE' || profileData?.status === 'Active' ? 'text-green-600' : 'text-yellow-600'
                    }`}>{profileData?.status || 'Active'}</span>
                  </div>
                </div>

                {/* New profile banner */}
                {!profileData?.exists && (
                  <div className="mx-5 mb-5 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-2">
                    <FiAlertCircle className="text-yellow-500 mt-0.5 shrink-0" size={14} />
                    <div>
                      <p className="text-xs font-bold text-yellow-700">Profile Incomplete</p>
                      <p className="text-xs text-yellow-600 mt-0.5">Add your details to get started.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Panel ─────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Tabs */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                    }`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Personal Tab ──────────────────────────────── */}
              {activeTab === 'personal' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                      <FiUser className="text-red-500 text-sm" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Personal Information</h3>
                      <p className="text-xs text-gray-400">Your basic profile details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label={userRole === 'hospital' ? 'Hospital Name' : 'Full Name'}>
                      {isEditing
                        ? <InputField value={editData.fullName} onChange={v => set('fullName', v)} placeholder="Enter name" />
                        : <StaticValue value={profileData?.fullName} />}
                    </Field>

                    <Field label="Email Address">
                      <StaticValue value={profileData?.email} />
                    </Field>

                    <Field label="Phone Number">
                      {isEditing
                        ? <InputField type="tel" value={editData.phone} onChange={v => set('phone', v)} placeholder="+91 00000 00000" />
                        : <StaticValue value={profileData?.phone} />}
                    </Field>

                    <Field label="Location / Address">
                      {isEditing
                        ? <InputField value={editData.location} onChange={v => set('location', v)} placeholder="City, State" />
                        : <StaticValue value={profileData?.location} />}
                    </Field>

                    {userRole !== 'hospital' && (
                      <Field label="Date of Birth">
                        {isEditing
                          ? <InputField type="date" value={editData.birthDate} onChange={v => set('birthDate', v)} />
                          : <StaticValue value={profileData?.birthDate ? new Date(profileData.birthDate).toLocaleDateString() : ''} />}
                      </Field>
                    )}
                  </div>
                </div>
              )}

              {/* ── Medical Tab ───────────────────────────────── */}
              {activeTab === 'medical' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                      <FiDroplet className="text-red-500 text-sm" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Medical Information</h3>
                      <p className="text-xs text-gray-400">Your health and donation details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Blood Group">
                      {isEditing ? (
                        <div className="grid grid-cols-4 gap-2">
                          {BLOOD_GROUPS.map(bg => (
                            <button key={bg} onClick={() => set('bloodGroup', bg)}
                              className={`py-2.5 rounded-xl border-2 text-sm font-black transition-all ${
                                editData.bloodGroup === bg
                                  ? 'border-red-500 bg-red-500 text-white'
                                  : 'border-gray-100 text-gray-600 hover:border-red-300'
                              }`}>
                              {bg}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <StaticValue value={profileData?.bloodGroup} highlight={!!profileData?.bloodGroup} />
                      )}
                    </Field>

                    {userRole === 'donor' && (
                      <>
                        <Field label="Last Donation">
                          <StaticValue value={profileData?.lastDonation
                            ? new Date(profileData.lastDonation).toLocaleDateString()
                            : 'Never'} />
                        </Field>

                        <Field label="Total Donations">
                          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                            <span className="text-2xl font-black text-red-500">{profileData?.totalDonations || 0}</span>
                            <div>
                              <p className="text-xs font-bold text-red-600">donations</p>
                              <p className="text-xs text-red-400">{(profileData?.totalDonations || 0) * 3} lives impacted</p>
                            </div>
                          </div>
                        </Field>
                      </>
                    )}
                  </div>

                  {/* Eligibility card */}
                  <div className="mt-5 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                      <FiCheckCircle className="text-green-500 text-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-700">Eligible for Donation</p>
                      <p className="text-xs text-green-500 mt-0.5">Based on your profile, you meet all donation criteria.</p>
                    </div>
                    <div className="ml-auto">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black rounded-full">Active</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Security Tab ──────────────────────────────── */}
              {activeTab === 'security' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                      <FiLock className="text-blue-500 text-sm" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Account Security</h3>
                      <p className="text-xs text-gray-400">Manage your account safety settings</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Account info */}
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-4">
                      <div className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
                        <FiMail size={15} className="text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">Email Address</p>
                        <p className="text-xs text-gray-400 mt-0.5">{profileData?.email}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-100">Verified</span>
                    </div>

                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-4">
                      <div className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
                        <FiShield size={15} className="text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">Two-Factor Authentication</p>
                        <p className="text-xs text-gray-400 mt-0.5">Add an extra layer of security</p>
                      </div>
                      <button className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors">
                        Enable
                      </button>
                    </div>

                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-4">
                      <div className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
                        <FiCalendar size={15} className="text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">Login Activity</p>
                        <p className="text-xs text-gray-400 mt-0.5">View your recent login history</p>
                      </div>
                      <button className="px-3 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors">
                        View Logs
                      </button>
                    </div>

                    {/* Danger zone */}
                    <div className="mt-2 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-4">
                      <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                        <FiX size={15} className="text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-red-700">Delete Account</p>
                        <p className="text-xs text-red-400 mt-0.5">Permanently delete your account and all data</p>
                      </div>
                      <button className="px-3 py-2 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}