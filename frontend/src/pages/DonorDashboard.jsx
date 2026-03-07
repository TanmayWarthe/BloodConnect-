import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { 
  FiDroplet, 
  FiClock, 
  FiCheckCircle, 
  FiHeart, 
  FiCalendar, 
  FiUser, 
  FiMapPin, 
  FiActivity,
  FiAlertCircle,
  FiTrendingUp,
  FiBell,
  FiRefreshCw,
  FiChevronRight,
  FiAward,
  FiTarget,
  FiZap,
  FiDownload,
  FiStar,
  FiNavigation
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';

const DonorDashboard = () => {
  const { currentUser } = useAuth();
  const [donorProfile, setDonorProfile] = useState(null);
  const [availability, setAvailability] = useState('available');
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [stats, setStats] = useState({
    livesImpacted: 0,
    totalDonations: 0,
    eligibilityDays: 0,
    averageDonationGap: 0,
    streakCount: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      const [donorRes, donationsRes, requestsRes] = await Promise.allSettled([
        apiService.get(`/donors/${currentUser.uid}`),
        apiService.get(`/donations/donor/${currentUser.uid}`),
        apiService.get('/requests/pending'),
      ]);

      // Fetch donor profile for blood type and status
      if (donorRes.status === 'fulfilled') {
        const profile = donorRes.value.data;
        setDonorProfile(profile);
        setAvailability(profile.availabilityStatus?.toLowerCase() || 'available');
      }

      if (donationsRes.status === 'fulfilled') {
        const rawHistory = donationsRes.value.data || [];
        setHistory(rawHistory);

        // Calculate stats from real history
        const total = rawHistory.length;
        // Estimate lives impacted (1 donation can save 3 lives)
        const lives = total * 3;
        
        // Calculate eligibility
        let daysUntilEligible = 0;
        let avgGap = 0;
        let streak = 0;
        
        if (total > 0) {
          // Sort by date descending
          const sortedHistory = [...rawHistory].sort((a, b) => 
            new Date(b.donationDate) - new Date(a.donationDate)
          );
          
          const lastDate = new Date(sortedHistory[0].donationDate);
          const diffTime = Math.abs(new Date() - lastDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 90) {
            daysUntilEligible = 90 - diffDays;
          }

          // Calculate average gap between donations
          if (total > 1) {
            let totalGap = 0;
            for (let i = 1; i < total; i++) {
              const gap = (new Date(sortedHistory[i-1].donationDate) - new Date(sortedHistory[i].donationDate)) / (1000 * 60 * 60 * 24);
              totalGap += gap;
            }
            avgGap = Math.round(totalGap / (total - 1));
          }

          // Calculate donation streak (consecutive months)
          const donationsByMonth = {};
          sortedHistory.forEach(donation => {
            const date = new Date(donation.donationDate);
            const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
            donationsByMonth[monthYear] = true;
          });
          
          const sortedMonths = Object.keys(donationsByMonth).sort().reverse();
          streak = 1;
          for (let i = 1; i < sortedMonths.length; i++) {
            const current = sortedMonths[i-1].split('-');
            const prev = sortedMonths[i].split('-');
            const monthDiff = (parseInt(current[0]) - parseInt(prev[0])) * 12 + (parseInt(current[1]) - parseInt(prev[1]));
            if (monthDiff === 1) streak++;
            else break;
          }
        }

        setStats({
          livesImpacted: lives,
          totalDonations: total,
          eligibilityDays: daysUntilEligible,
          averageDonationGap: avgGap,
          streakCount: streak,
        });
      }

      if (requestsRes.status === 'fulfilled') {
        const rawRequests = requestsRes.value.data || [];
        const mappedRequests = rawRequests.map((req) => ({
          id: req.id,
          bloodGroup: req.bloodGroup,
          quantity: req.unitsRequired,
          urgency: req.urgency,
          hospitalName: req.hospitalName || 'Patient Request',
          patientName: req.patientName || 'Anonymous',
          createdAt: req.createdAt,
          status: req.status,
        }));
        setRequests(mappedRequests);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAvailabilityChange = async (newStatus) => {
    if (!currentUser?.uid) {
      alert('Please login to update availability');
      return;
    }

    const prev = availability;
    setAvailability(newStatus); // Optimistic update
    try {
      await apiService.put(`/donors/availability/${currentUser.uid}`, null, {
        params: { status: newStatus.toUpperCase() },
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      setAvailability(prev); // Revert on failure
      alert(error.displayMessage || 'Failed to update availability');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    if (!currentUser?.uid) {
      alert('Please login to accept requests');
      return;
    }

    if (stats.eligibilityDays > 0) {
      alert(`You are eligible to donate in ${stats.eligibilityDays} days. Please wait until then.`);
      return;
    }

    try {
      await apiService.post(`/donations/donor/${currentUser.uid}/accept/${requestId}`);
      alert('Request accepted! You will be contacted shortly.');
      fetchDashboardData();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert(error.displayMessage || error.response?.data?.message || 'Failed to accept request. It may have already been fulfilled.');
    }
  };

  const filteredRequests = useMemo(() => {
    if (activeView === 'all') return requests;
    if (activeView === 'emergency') return requests.filter(r => r.urgency === 'EMERGENCY');
    if (activeView === 'matching') return requests.filter(r => 
      donorProfile?.bloodGroup === r.bloodGroup || 
      (r.bloodGroup === 'O-' && donorProfile?.bloodGroup?.includes('O')) ||
      (r.bloodGroup === 'AB+' && donorProfile?.rhFactor === 'positive')
    );
    return requests;
  }, [requests, activeView, donorProfile]);

  const getBloodGroupCompatibility = (requestGroup, donorGroup) => {
    const universalDonors = ['O-'];
    const universalRecipients = ['AB+'];
    
    if (universalDonors.includes(donorGroup)) return 'universal';
    if (donorGroup === requestGroup) return 'exact';
    if (donorGroup === 'O+' && requestGroup.includes('+')) return 'compatible';
    return 'incompatible';
  };

  const getCompatibilityColor = (compatibility) => {
    switch(compatibility) {
      case 'universal': return 'bg-linear-to-r from-green-500 to-green-600';
      case 'exact': return 'bg-linear-to-r from-blue-500 to-blue-600';
      case 'compatible': return 'bg-linear-to-r from-yellow-500 to-yellow-600';
      default: return 'bg-linear-to-r from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-bg-soft to-white">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 font-medium mt-4 animate-pulse">Loading Your Dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-linear-to-b from-bg-soft/30 to-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="relative mb-8">
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-red-400/10 rounded-full blur-3xl"></div>
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-linear-to-br from-primary/10 to-primary-dark/10 rounded-xl">
                      <FiHeart className="text-2xl text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900">Donor Dashboard</h1>
                      <p className="text-gray-600 mt-1">
                        Welcome back, <span className="font-semibold text-primary">{currentUser?.name || currentUser?.email || 'Hero'}</span>!
                        {donorProfile?.bloodGroup && (
                          <span className="ml-2 px-2 py-1 bg-linear-to-r from-red-500/10 to-red-600/10 text-red-600 rounded-lg text-sm font-medium">
                            {donorProfile.bloodGroup}
                            {donorProfile?.rhFactor && (donorProfile.rhFactor === 'positive' ? '+' : '-')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchDashboardData}
                    disabled={refreshing}
                    className="p-3 rounded-xl border border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-300 disabled:opacity-50"
                    title="Refresh"
                  >
                    <FiRefreshCw className={`text-lg ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                  
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-primary/10 to-primary-dark/10 border border-primary/20">
                    <FiBell className="text-primary" />
                    <span className="text-sm font-medium text-primary">Live Updates</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-red-300 hover:shadow-xl transition-all duration-500 group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-linear-to-br from-red-500/10 to-red-600/10">
                      <FiHeart className="text-xl text-red-600" />
                    </div>
                    <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      Lives
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Lives Impacted</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                        {stats.livesImpacted}
                      </p>
                      <p className="text-xs font-medium text-gray-400">
                        {stats.totalDonations} donations
                      </p>
                    </div>
                    <div className="w-2 h-8 bg-linear-to-b from-red-500 to-red-600 rounded-full group-hover:h-12 transition-all duration-500"></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-500 group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-linear-to-br from-primary/10 to-primary-dark/10">
                      <FiDroplet className="text-xl text-primary" />
                    </div>
                    <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      Total
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Donations</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                        {stats.totalDonations}
                      </p>
                      <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                        <FiTrendingUp className="text-green-500" />
                        Avg: {stats.averageDonationGap || '--'} days
                      </p>
                    </div>
                    <div className="w-2 h-8 bg-linear-to-b from-primary to-primary-dark rounded-full group-hover:h-12 transition-all duration-500"></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-xl transition-all duration-500 group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-linear-to-br from-green-500/10 to-green-600/10">
                      <FiCheckCircle className="text-xl text-green-600" />
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stats.eligibilityDays > 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {stats.eligibilityDays > 0 ? 'Wait' : 'Ready'}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Eligibility</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                        {stats.eligibilityDays > 0 ? `${stats.eligibilityDays}d` : 'Now'}
                      </p>
                      <p className="text-xs font-medium text-gray-400">
                        {stats.eligibilityDays > 0 ? 'Until next donation' : 'Ready to donate!'}
                      </p>
                    </div>
                    <div className={`w-2 h-8 rounded-full group-hover:h-12 transition-all duration-500 ${
                      stats.eligibilityDays > 0 
                        ? 'bg-linear-to-b from-yellow-500 to-yellow-600'
                        : 'bg-linear-to-b from-green-500 to-green-600'
                    }`}></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-yellow-300 hover:shadow-xl transition-all duration-500 group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-linear-to-br from-yellow-500/10 to-yellow-600/10">
                      <FiAward className="text-xl text-yellow-600" />
                    </div>
                    <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      Streak
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Donation Streak</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                        {stats.streakCount}
                      </p>
                      <p className="text-xs font-medium text-gray-400">
                        Consecutive months
                      </p>
                    </div>
                    <div className="w-2 h-8 bg-linear-to-b from-yellow-500 to-yellow-600 rounded-full group-hover:h-12 transition-all duration-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Availability Picker */}
          <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900 mb-1">Current Status</h2>
                <p className="text-gray-500">Update your availability to help patients find you</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-lg font-medium ${
                  availability === 'available' ? 'bg-linear-to-r from-green-500/10 to-green-600/10 text-green-700 border border-green-200' :
                  availability === 'busy' ? 'bg-linear-to-r from-yellow-500/10 to-yellow-600/10 text-yellow-700 border border-yellow-200' :
                  'bg-linear-to-r from-gray-500/10 to-gray-600/10 text-gray-700 border border-gray-200'
                }`}>
                  Currently: <span className="font-bold capitalize">{availability}</span>
                </div>
                
                <button className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium">
                  <FiCalendar />
                  Schedule Donation
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleAvailabilityChange('available')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 group hover:scale-[1.02] ${
                  availability === 'available'
                    ? 'bg-linear-to-br from-green-50 to-green-100/50 border-green-500 shadow-lg shadow-green-500/20'
                    : 'bg-white border-gray-200 hover:border-green-300 hover:bg-green-50/30'
                }`}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={`p-4 rounded-xl ${
                    availability === 'available'
                      ? 'bg-linear-to-br from-green-500 to-green-600 text-white'
                      : 'bg-gray-100 text-gray-400 group-hover:text-green-500 group-hover:bg-green-100'
                  }`}>
                    <FiCheckCircle className="text-2xl" />
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-1">Available</p>
                    <p className="text-sm text-gray-500">Ready to donate immediately</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleAvailabilityChange('busy')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 group hover:scale-[1.02] ${
                  availability === 'busy'
                    ? 'bg-linear-to-br from-yellow-50 to-yellow-100/50 border-yellow-500 shadow-lg shadow-yellow-500/20'
                    : 'bg-white border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/30'
                }`}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={`p-4 rounded-xl ${
                    availability === 'busy'
                      ? 'bg-linear-to-br from-yellow-500 to-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-400 group-hover:text-yellow-500 group-hover:bg-yellow-100'
                  }`}>
                    <FiClock className="text-2xl" />
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-1">Busy</p>
                    <p className="text-sm text-gray-500">Available next few days</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleAvailabilityChange('unavailable')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 group hover:scale-[1.02] ${
                  availability === 'unavailable'
                    ? 'bg-linear-to-br from-gray-50 to-gray-100/50 border-gray-500 shadow-lg shadow-gray-500/20'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/30'
                }`}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={`p-4 rounded-xl ${
                    availability === 'unavailable'
                      ? 'bg-linear-to-br from-gray-500 to-gray-600 text-white'
                      : 'bg-gray-100 text-gray-400 group-hover:text-gray-500 group-hover:bg-gray-100'
                  }`}>
                    <FiActivity className="text-2xl" />
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-1">Unavailable</p>
                    <p className="text-sm text-gray-500">Not currently available</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Available Requests */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-display font-bold text-gray-900 mb-1">Urgent Requests</h2>
                    <p className="text-gray-500">Help save lives nearby</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Filter:</span>
                    <div className="flex gap-1">
                      {['all', 'emergency', 'matching'].map(view => (
                        <button
                          key={view}
                          onClick={() => setActiveView(view)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all duration-300 ${
                            activeView === view
                              ? 'bg-linear-to-r from-primary to-primary-dark text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {view}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-linear-to-br from-primary/10 to-primary-dark/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FiDroplet className="text-3xl text-primary/60" />
                    </div>
                    <p className="text-gray-600 font-semibold text-lg mb-2">No requests found</p>
                    <p className="text-gray-400 max-w-md mx-auto">
                      {activeView === 'matching' 
                        ? "No matching blood type requests at the moment"
                        : "No urgent requests nearby. Check back later!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.slice(0, 3).map((req) => {
                      const compatibility = getBloodGroupCompatibility(
                        req.bloodGroup,
                        donorProfile?.bloodGroup + (donorProfile?.rhFactor === 'positive' ? '+' : '-')
                      );
                      
                      return (
                        <div 
                          key={req.id} 
                          className="border border-gray-200 rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                          onClick={() => setSelectedRequest(selectedRequest === req.id ? null : req.id)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                              <div className="relative">
                                <span className="text-3xl font-display font-bold text-gray-900">{req.bloodGroup}</span>
                                <div className={`absolute -top-2 -right-2 w-5 h-5 ${getCompatibilityColor(compatibility)} rounded-full`}></div>
                              </div>
                              <div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                  req.urgency === 'EMERGENCY'
                                    ? 'bg-linear-to-r from-red-500/10 to-red-600/10 text-red-700 border border-red-200'
                                    : 'bg-linear-to-r from-blue-500/10 to-blue-600/10 text-blue-700 border border-blue-200'
                                }`}>
                                  <FiZap className="text-[10px]" />
                                  {req.urgency}
                                </span>
                                <div className="mt-2 text-sm text-gray-500">
                                  <div className="flex items-center gap-2">
                                    <FiMapPin className="text-primary" />
                                    {req.hospitalName || 'Local Hospital'}
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">~{req.distance} km</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="px-3 py-1 bg-linear-to-r from-primary/10 to-primary-dark/10 text-primary rounded-lg text-sm font-bold">
                                {req.quantity} units
                              </span>
                              <span className="text-xs text-gray-500">
                                {req.patientAge} yrs • {new Date(req.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {selectedRequest === req.id && (
                            <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="text-center p-3 rounded-lg bg-blue-50">
                                  <div className="text-sm text-gray-500 mb-1">Compatibility</div>
                                  <div className="text-lg font-bold capitalize">{compatibility}</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-gray-50">
                                  <div className="text-sm text-gray-500 mb-1">Patient Age</div>
                                  <div className="text-lg font-bold">{req.patientAge} years</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div className="flex items-center gap-2 mb-2">
                                  <FiTarget className="text-primary" />
                                  <span className="font-medium">Priority: {req.urgency === 'EMERGENCY' ? 'High' : 'Normal'}</span>
                                </div>
                                <p>Your blood type {compatibility === 'exact' ? 'perfectly matches' : 'is compatible with'} the patient's requirements.</p>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptRequest(req.id);
                              }}
                              disabled={stats.eligibilityDays > 0}
                              className="btn-primary flex-1 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                              {stats.eligibilityDays > 0 ? `Eligible in ${stats.eligibilityDays}d` : 'Accept Request'}
                            </button>
                            <button className="p-3 rounded-xl border border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-300">
                              <FiNavigation />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {requests.length > 3 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <button className="w-full text-center text-primary hover:text-primary-dark font-medium flex items-center justify-center gap-2">
                      View all requests ({requests.length})
                      <FiChevronRight />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Donation History */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-display font-bold text-gray-900 mb-1">Recent Donations</h2>
                    <p className="text-gray-500">Your life-saving contributions</p>
                  </div>
                  <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
                    <FiDownload />
                    Export
                  </button>
                </div>
              </div>

              <div className="p-6">
                {history.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-linear-to-br from-red-500/10 to-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FiHeart className="text-3xl text-red-600/60" />
                    </div>
                    <p className="text-gray-600 font-semibold text-lg mb-2">No donations yet</p>
                    <p className="text-gray-400 mb-6">Your first donation could save up to 3 lives!</p>
                    <button className="btn-primary px-6 py-3 rounded-xl">
                      Find a donation center
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.slice(0, 5).map((donation, index) => (
                      <div 
                        key={donation.id} 
                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all duration-300 group cursor-pointer"
                        onClick={() => window.location.href = `/donations/${donation.id}`}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 bg-linear-to-br from-red-500/10 to-red-600/10 rounded-xl flex items-center justify-center">
                            <FiHeart className="text-xl text-red-600" />
                          </div>
                          {index === 0 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <FiStar className="text-xs text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-gray-900">
                              {donation.hospitalName || 'Donation Center'}
                            </span>
                            <span className="text-sm font-medium text-gray-400">
                              {new Date(donation.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                              {donation.units} unit{donation.units > 1 ? 's' : ''}
                            </span>
                            <span className="font-semibold text-gray-700">{donation.bloodGroup}</span>
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                              {donation.status || 'Completed'}
                            </span>
                          </div>
                        </div>
                        
                        <FiChevronRight className="text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                    ))}
                    
                    {history.length > 5 && (
                      <div className="pt-4 border-t border-gray-100">
                        <button className="w-full text-center text-primary hover:text-primary-dark font-medium flex items-center justify-center gap-2">
                          View full history ({history.length} donations)
                          <FiChevronRight />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DonorDashboard;