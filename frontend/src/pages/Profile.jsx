import { useState, useEffect, useCallback, useRef } from 'react'
import Layout from '../components/Layout'
import { 
  FiUser, 
  FiEdit2, 
  FiSave, 
  FiX, 
  FiMail, 
  FiCalendar,
  FiMapPin,
  FiPhone,
  FiDroplet,
  FiActivity,
  FiShield,
  FiHeart,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiGlobe,
  FiLock
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'

const Profile = () => {
  const { currentUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [editData, setEditData] = useState({})
  const [activeTab, setActiveTab] = useState('personal')
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)
  const [profileImage, setProfileImage] = useState(null)

  const userRole = currentUser?.role || 'donor'

  const fetchProfile = useCallback(async () => {
    if (!currentUser?.uid) return

    setLoading(true)
    try {
      let endpoint = ''
      if (userRole === 'donor') {
        endpoint = `/donors/${currentUser.uid}`
      } else if (userRole === 'patient') {
        endpoint = `/patients/${currentUser.uid}`
      } else if (userRole === 'hospital') {
        endpoint = `/hospitals/profile/${currentUser.uid}`
      }

      const response = await apiService.get(endpoint)
      const profile = response.data

      // Transform data with mock details for demonstration
      const transformedProfile = {
        fullName: profile.name || profile.hospitalName || currentUser.displayName || currentUser.email?.split('@')[0] || '',
        email: currentUser.email || '',
        phone: profile.phone || '+1 (555) 123-4567',
        location: profile.location || profile.address || 'New York, NY',
        birthDate: profile.birthDate || '1990-01-15',
        bloodGroup: profile.bloodGroup || (userRole === 'donor' ? 'O+' : ''),
        lastDonation: profile.lastDonation || '2024-01-15',
        totalDonations: profile.totalDonations || (userRole === 'donor' ? 12 : 0),
        status: profile.status || 'Active',
        memberSince: profile.createdAt ? new Date(profile.createdAt).getFullYear() : 2023,
        exists: true
      }

      setProfileData(transformedProfile)
      setProfileImage(profile.image || null)
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Profile not found - enabling creation mode')
        const emptyProfile = {
          fullName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
          email: currentUser.email || '',
          phone: '',
          location: '',
          birthDate: '',
          bloodGroup: '',
          lastDonation: '',
          totalDonations: 0,
          status: 'Pending',
          memberSince: new Date().getFullYear(),
          exists: false
        };
        setProfileData(emptyProfile)
        setEditData(emptyProfile)
        setIsEditing(true)
      } else {
        console.error('Error fetching profile:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [currentUser, userRole])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleEdit = () => {
    setIsEditing(true)
    setEditData({ ...profileData })
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!currentUser?.uid) return;

    setSaving(true);
    try {
      const isNew = !profileData?.exists;
      let endpoint = '';
      let payload = {};

      if (userRole === 'donor') {
        // Backend Donor model fields: name, phone, address, bloodGroup, dob
        endpoint = isNew
          ? `/donors/register?uid=${currentUser.uid}`
          : `/donors/${currentUser.uid}`;
        payload = {
          name: editData.fullName,
          phone: editData.phone,
          address: editData.location,    // backend uses 'address', not 'location'
          bloodGroup: editData.bloodGroup,
          dob: editData.birthDate || null,
        };
      } else if (userRole === 'patient') {
        // Backend Patient model fields: name, phone, address, bloodGroup, dob
        endpoint = isNew
          ? `/patients/register?uid=${currentUser.uid}`
          : `/patients/${currentUser.uid}`;
        payload = {
          name: editData.fullName,
          phone: editData.phone,
          address: editData.location,
          bloodGroup: editData.bloodGroup,
          dob: editData.birthDate || null,
        };
      } else if (userRole === 'hospital') {
        // Backend Hospital model fields: hospitalName, phone, address, licenseNumber
        endpoint = isNew
          ? `/hospitals/register?uid=${currentUser.uid}`
          : `/hospitals/${currentUser.uid}`;
        payload = {
          hospitalName: editData.fullName,
          phone: editData.phone,
          address: editData.location,
        };
      }

      if (isNew) {
        await apiService.post(endpoint, payload);
      } else {
        await apiService.put(endpoint, payload);
      }

      await fetchProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      const message = error.displayMessage || error.response?.data?.message || 'Failed to update profile. Please try again.';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setProfileImage(URL.createObjectURL(file));
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getRoleIcon = () => {
    switch(userRole) {
      case 'donor': return <FiHeart className="text-red-500" />;
      case 'patient': return <FiActivity className="text-blue-500" />;
      case 'hospital': return <FiShield className="text-green-500" />;
      default: return <FiUser className="text-primary" />;
    }
  };

  const getRoleColor = () => {
    switch(userRole) {
      case 'donor': return 'from-red-500 to-red-600';
      case 'patient': return 'from-blue-500 to-blue-600';
      case 'hospital': return 'from-green-500 to-green-600';
      default: return 'from-primary to-primary-dark';
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  if (loading && !profileData) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-bg-soft to-white">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 font-medium mt-4 animate-pulse">Loading your profile...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-linear-to-b from-bg-soft/30 to-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="relative mb-8">
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/10 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900">My Profile</h1>
                  <p className="text-gray-600 mt-1">
                    Manage your personal information and preferences
                  </p>
                </div>
                
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    <FiEdit2 />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="save-btn btn-primary flex items-center gap-2 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                    >
                      <FiSave className={saving ? 'animate-spin' : ''} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 font-semibold flex items-center gap-2"
                    >
                      <FiX />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden sticky top-8">
                {/* Profile Header */}
                <div className="relative">
                  <div className="h-32 bg-linear-to-r from-primary/10 to-primary-dark/10"></div>
                  
                  {/* Profile Image */}
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden">
                        {profileImage ? (
                          <img 
                            src={profileImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary-dark/20 flex items-center justify-center">
                            <span className="text-3xl font-bold text-primary">
                              {profileData?.fullName?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {isEditing && (
                        <button
                          onClick={triggerFileInput}
                          className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <FiUpload className="text-white text-xl" />
                        </button>
                      )}
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-28">
                        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-linear-to-r from-primary to-primary-dark transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Profile Info */}
                <div className="pt-16 pb-8 px-6 text-center">
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                    {profileData?.fullName || 'Complete Your Profile'}
                  </h2>
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className={`px-3 py-1 rounded-full bg-linear-to-r ${getRoleColor()} bg-opacity-10 text-${userRole === 'donor' ? 'red' : userRole === 'patient' ? 'blue' : 'green'}-600 text-sm font-semibold capitalize flex items-center gap-2`}>
                      {getRoleIcon()}
                      {userRole}
                    </div>
                    <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium flex items-center gap-1">
                      <FiCheckCircle className="text-green-500" />
                      {profileData?.status}
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-8">
                    <div className="flex items-center justify-center gap-3 text-gray-600">
                      <FiMail />
                      <span className="text-sm">{profileData?.email}</span>
                    </div>
                    
                    {profileData?.phone && (
                      <div className="flex items-center justify-center gap-3 text-gray-600">
                        <FiPhone />
                        <span className="text-sm">{profileData.phone}</span>
                      </div>
                    )}
                    
                    {profileData?.location && (
                      <div className="flex items-center justify-center gap-3 text-gray-600">
                        <FiMapPin />
                        <span className="text-sm">{profileData.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="border-t border-gray-100 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {profileData?.totalDonations || 0}
                      </div>
                      <div className="text-xs text-gray-500">Donations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {profileData?.memberSince || '2024'}
                      </div>
                      <div className="text-xs text-gray-500">Member Since</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Tabs and Details */}
            <div className="lg:col-span-2">
              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`px-4 py-3 text-sm font-medium transition-all duration-300 relative ${
                    activeTab === 'personal'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FiUser />
                    Personal Info
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveTab('medical')}
                  className={`px-4 py-3 text-sm font-medium transition-all duration-300 relative ${
                    activeTab === 'medical'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FiDroplet />
                    Medical Info
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-4 py-3 text-sm font-medium transition-all duration-300 relative ${
                    activeTab === 'security'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FiLock />
                    Security
                  </span>
                </button>
              </div>

              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                  <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-linear-to-br from-primary/10 to-primary-dark/10 rounded-lg">
                      <FiUser className="text-primary" />
                    </div>
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <FiUser className="text-gray-400" />
                        {userRole === 'hospital' ? 'Hospital Name' : 'Full Name'}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.fullName || ''}
                          onChange={(e) => handleChange('fullName', e.target.value)}
                          className="input-field w-full py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                          placeholder={userRole === 'hospital' ? 'Enter hospital name' : 'Enter your full name'}
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <span className="text-gray-900">{profileData?.fullName || 'Not provided'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <FiMail className="text-gray-400" />
                        Email Address
                      </label>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="text-gray-700">{profileData?.email}</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <FiPhone className="text-gray-400" />
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editData.phone || ''}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          className="input-field w-full py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <span className="text-gray-700">{profileData?.phone || 'Not provided'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <FiMapPin className="text-gray-400" />
                        Location
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.location || ''}
                          onChange={(e) => handleChange('location', e.target.value)}
                          className="input-field w-full py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                          placeholder="Enter your location"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <span className="text-gray-700">{profileData?.location || 'Not provided'}</span>
                        </div>
                      )}
                    </div>

                    {userRole !== 'hospital' && (
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <FiCalendar className="text-gray-400" />
                          Date of Birth
                        </label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editData.birthDate || ''}
                            onChange={(e) => handleChange('birthDate', e.target.value)}
                            className="input-field w-full py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-gray-700">
                              {profileData?.birthDate ? new Date(profileData.birthDate).toLocaleDateString() : 'Not provided'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!isEditing && !profileData?.exists && (
                    <div className="mt-8 p-4 bg-linear-to-r from-yellow-50 to-yellow-100/50 border border-yellow-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <FiAlertCircle className="text-yellow-600 text-xl mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-800 mb-1">Complete Your Profile</h4>
                          <p className="text-yellow-700 text-sm">
                            Your profile is incomplete. Please add your information to get the most out of BloodConnect.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Medical Info Tab */}
              {activeTab === 'medical' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                  <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-linear-to-br from-red-500/10 to-red-600/10 rounded-lg">
                      <FiDroplet className="text-red-600" />
                    </div>
                    Medical Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Blood Group
                      </label>
                      {isEditing ? (
                        <div className="relative">
                          <select
                            value={editData.bloodGroup || ''}
                            onChange={(e) => handleChange('bloodGroup', e.target.value)}
                            className="input-field w-full py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 appearance-none"
                          >
                            <option value="">Select Blood Group</option>
                            {bloodGroups.map(bg => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                          </select>
                          <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      ) : (
                        <div className={`p-3 rounded-xl border ${
                          profileData?.bloodGroup 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <span className={`font-bold ${profileData?.bloodGroup ? 'text-red-700' : 'text-gray-700'}`}>
                            {profileData?.bloodGroup || 'Not specified'}
                          </span>
                        </div>
                      )}
                    </div>

                    {userRole === 'donor' && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Last Donation
                          </label>
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-gray-700">
                              {profileData?.lastDonation ? new Date(profileData.lastDonation).toLocaleDateString() : 'Never'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Total Donations
                          </label>
                          <div className="p-3 bg-linear-to-r from-primary/10 to-primary-dark/10 rounded-xl border border-primary/20">
                            <span className="text-2xl font-bold text-primary">
                              {profileData?.totalDonations || 0}
                            </span>
                            <span className="text-gray-600 ml-2">donations</span>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Health Status
                      </label>
                      <div className="p-4 bg-linear-to-r from-green-50 to-green-100/50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3">
                          <FiCheckCircle className="text-green-600 text-xl" />
                          <div>
                            <div className="font-semibold text-green-800">Eligible for Donation</div>
                            <div className="text-sm text-green-700 mt-1">
                              Based on your profile information, you meet all donation criteria.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                  <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-linear-to-br from-blue-500/10 to-blue-600/10 rounded-lg">
                      <FiLock className="text-blue-600" />
                    </div>
                    Account Security
                  </h3>

                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">Two-Factor Authentication</div>
                          <div className="text-sm text-gray-600">Add an extra layer of security to your account</div>
                        </div>
                        <button className="px-4 py-2 bg-linear-to-r from-primary to-primary-dark text-white rounded-lg hover:shadow-lg transition-all duration-300">
                          Enable
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">Login Activity</div>
                          <div className="text-sm text-gray-600">View your recent login history</div>
                        </div>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-300">
                          View Logs
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-red-800 mb-1">Delete Account</div>
                          <div className="text-sm text-red-700">Permanently delete your account and all data</div>
                        </div>
                        <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-all duration-300">
                          Delete
                        </button>
                      </div>
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

export default Profile