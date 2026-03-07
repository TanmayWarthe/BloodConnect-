import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { 
  FiDroplet, 
  FiClock, 
  FiCheckCircle, 
  FiPlus, 
  FiActivity, 
  FiX, 
  FiAlertCircle,
  FiRefreshCw,
  FiChevronRight,
  FiInfo,
  FiCalendar,
  FiHeart
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    emergencyCount: 0,
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchRequests();
    }
  }, [currentUser]);

  const fetchRequests = useCallback(async () => {
    if (!currentUser?.uid) return;

    setRefreshing(true);
    try {
      const response = await apiService.get(`/requests/my/${currentUser.uid}`);
      const apiData = response.data || [];
      setRequests(apiData);

      // Calculate stats from real data
      const total = apiData.length;
      const pending = apiData.filter(r => r.status === 'PENDING').length;
      const completed = apiData.filter(r => ['FULFILLED', 'MATCHED'].includes(r.status)).length;
      const emergency = apiData.filter(r => r.urgency === 'EMERGENCY').length;
      
      setStats({ 
        totalRequests: total, 
        pendingRequests: pending, 
        completedRequests: completed,
        emergencyCount: emergency 
      });

    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  const handleRefresh = () => {
    fetchRequests();
  };

  const filteredRequests = requests.filter(request => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PENDING') return request.status === 'PENDING';
    if (activeFilter === 'COMPLETED') return ['FULFILLED', 'MATCHED'].includes(request.status);
    if (activeFilter === 'EMERGENCY') return request.urgency === 'EMERGENCY';
    return true;
  });

  const RequestForm = ({ onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
      bloodGroup: '',
      quantity: 1,
      urgency: 'NORMAL',
      notes: '',
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!currentUser?.uid) {
        alert("You must be logged in");
        return;
      }

      setSubmitting(true);
      try {
        await apiService.post(`/requests?uid=${currentUser.uid}`, {
          bloodGroup: formData.bloodGroup,
          unitsRequired: Number(formData.quantity),
          urgency: formData.urgency,
          notes: formData.notes,
        });

        alert('Request submitted successfully!');
        onSuccess();
      } catch (error) {
        console.error('Failed to submit request', error);
        alert(error.displayMessage || error.response?.data?.message || 'Error submitting request. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FiDroplet className="text-primary" />
              Blood Group *
            </label>
            <div className="relative">
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="input-field w-full appearance-none pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                required
              >
                <option value="">Select Blood Type</option>
                <option value="A+">A+ (Most Common)</option>
                <option value="A-">A- (Universal Plasma Donor)</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+ (Universal Recipient)</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+ (Most Needed)</option>
                <option value="O-">O- (Universal Donor)</option>
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary">
                <FiDroplet />
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <FiChevronRight className="rotate-90" />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity (Units) *
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setFormData({...formData, quantity: Math.max(1, formData.quantity - 1)})}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <FiX />
              </button>
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)) })}
                  className="input-field w-full text-center text-lg font-bold"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  {formData.quantity === 1 ? 'Unit' : 'Units'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData({...formData, quantity: Math.min(10, formData.quantity + 1)})}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <FiPlus />
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FiAlertCircle />
              Urgency Level *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, urgency: 'NORMAL'})}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${formData.urgency === 'NORMAL' 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-gray-200 hover:border-primary/50'}`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold mb-1">Normal</div>
                  <div className="text-xs text-gray-500">1-3 Days</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, urgency: 'EMERGENCY'})}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${formData.urgency === 'EMERGENCY' 
                  ? 'border-red-500 bg-red-50 text-red-600' 
                  : 'border-gray-200 hover:border-red-300'}`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold mb-1 flex items-center justify-center gap-1">
                    <FiAlertCircle /> Emergency
                  </div>
                  <div className="text-xs text-red-500">Immediate</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field w-full h-full min-h-[120px] resize-none"
              placeholder="Any special requirements or hospital details..."
              maxLength={200}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {formData.notes.length}/200
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FiInfo />
            <span>All fields marked with * are required</span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary px-8 py-3 rounded-xl text-base font-semibold transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              {submitting ? (
                <>
                  <FiRefreshCw className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FiPlus />
                  Submit Request
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-linear-to-r from-primary to-primary-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center bg-linear-to-b from-bg-soft to-white">
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
      <div className="min-h-screen bg-linear-to-b from-bg-soft/50 to-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="relative mb-8">
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-red-400/10 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FiHeart className="text-2xl text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900">Patient Dashboard</h1>
                      <p className="text-gray-600 mt-1 flex items-center gap-2">
                        Welcome back, <span className="font-semibold text-primary">{currentUser?.name || currentUser?.email || 'Patient'}</span>!
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-3 rounded-xl border border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-300 disabled:opacity-50"
                    title="Refresh"
                  >
                    <FiRefreshCw className={`text-lg ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                  
                  <button
                    onClick={() => setShowRequestForm(!showRequestForm)}
                    className={`btn-primary flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      showRequestForm 
                        ? 'bg-linear-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900' 
                        : 'bg-linear-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary'
                    } hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    {showRequestForm ? <FiX /> : <FiPlus />}
                    <span>{showRequestForm ? 'Cancel' : 'New Request'}</span>
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={<FiActivity className="text-2xl" />}
                  label="Total Requests"
                  value={stats.totalRequests}
                  unit="requests"
                  trend="+2 this month"
                  color="blue"
                  gradient="from-blue-500 to-blue-600"
                />
                <StatCard
                  icon={<FiClock className="text-2xl" />}
                  label="Pending"
                  value={stats.pendingRequests}
                  unit="awaiting"
                  trend="Active"
                  color="yellow"
                  gradient="from-yellow-500 to-yellow-600"
                />
                <StatCard
                  icon={<FiCheckCircle className="text-2xl" />}
                  label="Fulfilled"
                  value={stats.completedRequests}
                  unit="successful"
                  trend="100% satisfaction"
                  color="green"
                  gradient="from-green-500 to-green-600"
                />
                <StatCard
                  icon={<FiAlertCircle className="text-2xl" />}
                  label="Emergency"
                  value={stats.emergencyCount}
                  unit="urgent"
                  trend="High priority"
                  color="red"
                  gradient="from-red-500 to-red-600"
                />
              </div>
            </div>
          </div>

          {/* Request Form */}
          {showRequestForm && (
            <div className="card-minimal p-8 mb-8 animate-fade-in-up relative overflow-hidden border-l-4 border-primary bg-linear-to-r from-white to-blue-50/50 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FiPlus className="text-primary" />
                </div>
                New Blood Request
              </h2>
              <p className="text-gray-500 mb-6">Fill in the details below to request blood</p>
              <RequestForm
                onSuccess={() => {
                  setShowRequestForm(false);
                  fetchRequests();
                }}
              />
            </div>
          )}

          {/* Request List */}
          <div className="card-minimal p-8 shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900">My Requests</h2>
                <p className="text-gray-500 mt-1">Track and manage your blood requests</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {['ALL', 'PENDING', 'COMPLETED', 'EMERGENCY'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeFilter === filter
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter === 'ALL' ? 'All Requests' : filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredRequests.length > 0 ? (
              <div className="space-y-4">
                {filteredRequests.map(request => (
                  <RequestItem key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-linear-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiActivity className="text-3xl text-primary/60" />
                </div>
                <p className="text-gray-600 font-semibold text-lg mb-2">No requests found</p>
                <p className="text-gray-400 mb-6">
                  {activeFilter === 'ALL' 
                    ? "You haven't made any requests yet" 
                    : `No ${activeFilter.toLowerCase()} requests found`}
                </p>
                {activeFilter !== 'ALL' && (
                  <button
                    onClick={() => setActiveFilter('ALL')}
                    className="text-primary hover:text-primary-dark font-medium flex items-center gap-2 mx-auto"
                  >
                    View all requests <FiChevronRight />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// --- Sub-components ---

const StatCard = ({ icon, label, value, unit, trend, color, gradient }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary/30 hover:shadow-xl transition-all duration-500 group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-linear-to-br ${gradient} bg-opacity-10`}>
          <div className={`text-${color}-500`}>{icon}</div>
        </div>
        <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
          {unit}
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-display font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-xs font-medium text-gray-400">{trend}</p>
        </div>
        <div className={`w-2 h-8 bg-linear-to-b from-${color}-500 to-${color}-600 rounded-full group-hover:h-12 transition-all duration-500`}></div>
      </div>
    </div>
  );
};

const RequestItem = ({ request }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      'PENDING': {
        color: 'yellow',
        bg: 'bg-yellow-50',
        border: 'border-yellow-100',
        icon: <FiClock className="text-yellow-600" />,
      },
      'FULFILLED': {
        color: 'green',
        bg: 'bg-green-50',
        border: 'border-green-100',
        icon: <FiCheckCircle className="text-green-600" />,
      },
      'MATCHED': {
        color: 'blue',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        icon: <FiCheckCircle className="text-blue-600" />,
      },
      'CANCELLED': {
        color: 'red',
        bg: 'bg-red-50',
        border: 'border-red-100',
        icon: <FiX className="text-red-600" />,
      },
    };
    return configs[status] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(request.status);
  const urgencyColor = request.urgency === 'EMERGENCY' 
    ? 'bg-linear-to-r from-red-500 to-red-600' 
    : 'bg-linear-to-r from-gray-500 to-gray-600';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  return (
    <div 
      className="bg-white rounded-2xl border border-gray-200 hover:border-primary/50 hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left side - Blood group and details */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className={`relative p-4 rounded-xl ${statusConfig.bg} ${statusConfig.border} border`}>
                <span className="text-2xl font-bold text-gray-900">{request.bloodGroup}</span>
                <div className={`absolute -top-2 -right-2 w-5 h-5 ${urgencyColor} rounded-full`}></div>
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold text-gray-900">
                    {request.unitsRequired} Unit{request.unitsRequired > 1 ? 's' : ''}
                  </span>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${urgencyColor} bg-opacity-10 text-white`}>
                    {request.urgency}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <FiCalendar />
                    {formatDate(request.requestedAt)}
                  </span>
                  {request.hospital && (
                    <span className="flex items-center gap-2">
                      <FiInfo />
                      {request.hospital}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Status and actions */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${statusConfig.bg} ${statusConfig.border} border`}>
              {statusConfig.icon}
              <span className={`text-sm font-semibold text-${statusConfig.color}-700`}>
                {request.status}
              </span>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className={`p-2 rounded-lg border border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-300 ${
                expanded ? 'rotate-180' : ''
              }`}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">Request Details</h4>
                <p className="text-gray-700">{request.notes || 'No additional notes provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">Timeline</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Requested: {formatDate(request.requestedAt)}</span>
                  </div>
                  {request.updatedAt && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Last updated: {formatDate(request.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">Actions</h4>
                <div className="flex gap-2">
                  {request.status === 'PENDING' && (
                    <>
                      <button className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5">
                        Edit Request
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                        Cancel
                      </button>
                    </>
                  )}
                  {['FULFILLED', 'MATCHED'].includes(request.status) && (
                    <button className="px-4 py-2 text-sm font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50">
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add custom animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out;
  }
  
  .btn-primary.success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }
  
  .card-minimal {
    background: white;
    border-radius: 1rem;
    border: 1px solid #e5e7eb;
    transition: all 0.3s ease;
  }
  
  .card-minimal:hover {
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  .input-field {
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.75rem;
    transition: all 0.3s ease;
  }
  
  .input-field:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;
document.head.appendChild(style);

export default PatientDashboard;