import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  FiDroplet, 
  FiTrendingUp, 
  FiUsers, 
  FiActivity, 
  FiAlertTriangle, 
  FiPlus, 
  FiEdit, 
  FiCheck, 
  FiX,
  FiAlertCircle,
  FiHeart,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiMapPin,
  FiDownload,
  FiBell,
  FiBarChart2,
  FiCalendar
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';

const HospitalDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const [stats, setStats] = useState({
    totalUnits: 0,
    criticalItems: 0,
    activeRequests: 0,
    availableTypes: 0,
    averageStockAge: 0,
  });

  // Modals
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Form states
  const [inventoryForm, setInventoryForm] = useState({ bloodGroup: 'A+', units: 0, operation: 'ADD' });
  const [requestForm, setRequestForm] = useState({
    bloodGroup: 'A+',
    unitsRequired: 1,
    urgency: 'NORMAL',
    patientName: '',
    patientAge: '',
    condition: '',
    hospitalWard: ''
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    if (!currentUser?.uid) {
      console.error('No user logged in');
      setLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      const uid = currentUser.uid;
      const [inventoryRes, requestsRes] = await Promise.allSettled([
        apiService.get(`/inventory/hospital/${uid}`),
        apiService.get(`/requests/pending`),
      ]);

      let totalUnits = 0;
      let criticalItems = 0;
      let availableTypes = 0;
      let totalStockAge = 0;

      if (inventoryRes.status === 'fulfilled') {
        const invData = inventoryRes.value.data.map((inv) => {
          const isCritical = inv.unitsAvailable <= 3;
          const isLow = inv.unitsAvailable <= 10 && inv.unitsAvailable > 3;
          if (isCritical) criticalItems++;
          if (inv.unitsAvailable > 0) availableTypes++;
          totalUnits += inv.unitsAvailable;
          totalStockAge += (inv.lastUpdated ? (new Date() - new Date(inv.lastUpdated)) / (1000 * 60 * 60 * 24) : 0);
          
          return { 
            ...inv, 
            isCritical, 
            isLow,
            lastUpdatedFormatted: inv.lastUpdated ? new Date(inv.lastUpdated).toLocaleDateString() : 'Never'
          };
        });
        setInventory(invData);
      } else {
        setInventory([]);
      }

      if (requestsRes.status === 'fulfilled') {
        const rawRequests = requestsRes.value.data || [];
        const enhancedRequests = rawRequests.map(req => ({
          ...req,
          daysAgo: req.createdAt ? Math.floor((new Date() - new Date(req.createdAt)) / (1000 * 60 * 60 * 24)) : 0
        }));
        setRequests(enhancedRequests);

        setStats(prev => ({
          ...prev,
          activeRequests: rawRequests.filter(r => r.status === 'PENDING').length,
        }));
      } else {
        setRequests([]);
      }

      setStats(prev => ({
        ...prev,
        totalUnits,
        criticalItems,
        availableTypes,
        averageStockAge: inventoryRes.status === 'fulfilled' && inventoryRes.value.data.length > 0
          ? Math.round(totalStockAge / inventoryRes.value.data.length)
          : 0,
      }));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setInventory([]);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.unitsAvailable.toString().includes(searchQuery)
    );
  }, [inventory, searchQuery]);

  const filteredRequests = useMemo(() => {
    let filtered = [...requests];
    
    if (selectedUrgency !== 'ALL') {
      filtered = filtered.filter(req => req.urgency === selectedUrgency);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(req => 
        req.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [requests, searchQuery, selectedUrgency]);

  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    try {
      // Backend expects: bloodGroup, units, operation as query params
      await apiService.post(`/inventory/hospital/${currentUser.uid}/update`, null, {
        params: {
          bloodGroup: inventoryForm.bloodGroup,
          units: parseInt(inventoryForm.units),
          operation: inventoryForm.operation,
        }
      });

      setShowInventoryModal(false);
      setInventoryForm({ bloodGroup: 'A+', units: 0, operation: 'ADD' });
      fetchDashboardData();
      alert('Inventory updated successfully!');
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert(error.displayMessage || error.response?.data?.message || 'Failed to update inventory');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      // Backend expects: bloodGroup, unitsRequired, urgency, patientName
      await apiService.post(`/requests/hospital/${currentUser.uid}`, {
        bloodGroup: requestForm.bloodGroup,
        unitsRequired: parseInt(requestForm.unitsRequired),
        urgency: requestForm.urgency,
        patientName: requestForm.patientName || 'Hospital Request',
      });

      setShowRequestModal(false);
      setRequestForm({
        bloodGroup: 'A+',
        unitsRequired: 1,
        urgency: 'NORMAL',
        patientName: '',
        patientAge: '',
        condition: '',
        hospitalWard: ''
      });
      fetchDashboardData();
      alert('Blood request created successfully!');
    } catch (error) {
      console.error('Error creating request:', error);
      alert(error.displayMessage || error.response?.data?.message || 'Failed to create request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await apiService.post(`/donations/hospital/${currentUser.uid}/accept/${requestId}`);
      alert('Request fulfilled successfully!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert(error.displayMessage || error.response?.data?.message || 'Failed to fulfill request');
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = ['NORMAL', 'URGENT', 'EMERGENCY'];
  const operations = ['ADD', 'REMOVE'];

  const getStatusColor = (units) => {
    if (units <= 3) return 'bg-red-100 text-red-700 border-red-200';
    if (units <= 10) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 'EMERGENCY': return 'bg-linear-to-r from-red-500 to-red-600';
      case 'URGENT': return 'bg-linear-to-r from-orange-500 to-orange-600';
      case 'NORMAL': return 'bg-linear-to-r from-blue-500 to-blue-600';
      default: return 'bg-linear-to-r from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center bg-linear-to-b from-bg-soft to-white">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 font-medium mt-4 animate-pulse">Loading Hospital Dashboard...</p>
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
                      <FiActivity className="text-2xl text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900">Hospital Dashboard</h1>
                      <p className="text-gray-600 mt-1">
                        Welcome, <span className="font-semibold text-primary">{currentUser?.name || 'Hospital Admin'}</span>
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
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowQuickActions(!showQuickActions)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-linear-to-r from-primary to-primary-dark text-white hover:shadow-lg transition-all duration-300"
                    >
                      <FiPlus /> Quick Actions
                    </button>
                    
                    {showQuickActions && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-fade-in">
                        <div className="p-2">
                          <button
                            onClick={() => {
                              setShowInventoryModal(true);
                              setShowQuickActions(false);
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-3"
                          >
                            <FiDroplet className="text-primary" />
                            <div>
                              <div className="font-medium">Update Inventory</div>
                              <div className="text-xs text-gray-500">Add or remove blood units</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setShowRequestModal(true);
                              setShowQuickActions(false);
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-3"
                          >
                            <FiHeart className="text-red-600" />
                            <div>
                              <div className="font-medium">Create Request</div>
                              <div className="text-xs text-gray-500">Request blood from donors</div>
                            </div>
                          </button>
                          <button
                            onClick={() => navigate('/analytics')}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-3"
                          >
                            <FiBarChart2 className="text-blue-600" />
                            <div>
                              <div className="font-medium">View Analytics</div>
                              <div className="text-xs text-gray-500">See hospital statistics</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-500 group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-linear-to-br from-primary/10 to-primary-dark/10">
                      <FiDroplet className="text-xl text-primary" />
                    </div>
                    <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      Units
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Blood Units</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-display font-bold text-gray-900 mb-1">{stats.totalUnits}</p>
                      <p className="text-xs font-medium text-gray-400">
                        {stats.availableTypes} types available
                      </p>
                    </div>
                    <div className="w-2 h-8 bg-linear-to-b from-primary to-primary-dark rounded-full group-hover:h-12 transition-all duration-500"></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-red-300 hover:shadow-xl transition-all duration-500 group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-linear-to-br from-red-500/10 to-red-600/10">
                      <FiAlertTriangle className="text-xl text-red-600" />
                    </div>
                    <div className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-600">
                      Alert
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Critical Items</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-display font-bold text-red-600 mb-1">{stats.criticalItems}</p>
                      <p className="text-xs font-medium text-gray-400">
                        Needs immediate attention
                      </p>
                    </div>
                    <div className="w-2 h-8 bg-linear-to-b from-red-500 to-red-600 rounded-full group-hover:h-12 transition-all duration-500"></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-xl transition-all duration-500 group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-linear-to-br from-green-500/10 to-green-600/10">
                      <FiActivity className="text-xl text-green-600" />
                    </div>
                    <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      Active
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Active Requests</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-display font-bold text-gray-900 mb-1">{stats.activeRequests}</p>
                      <p className="text-xs font-medium text-gray-400">
                        Pending fulfillment
                      </p>
                    </div>
                    <div className="w-2 h-8 bg-linear-to-b from-green-500 to-green-600 rounded-full group-hover:h-12 transition-all duration-500"></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-500 group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-linear-to-br from-blue-500/10 to-blue-600/10">
                      <FiClock className="text-xl text-blue-600" />
                    </div>
                    <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      Age
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Avg Stock Age</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-display font-bold text-gray-900 mb-1">{stats.averageStockAge}d</p>
                      <p className="text-xs font-medium text-gray-400">
                        Days since last update
                      </p>
                    </div>
                    <div className="w-2 h-8 bg-linear-to-b from-blue-500 to-blue-600 rounded-full group-hover:h-12 transition-all duration-500"></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-500 group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-linear-to-br from-purple-500/10 to-purple-600/10">
                      <FiUsers className="text-xl text-purple-600" />
                    </div>
                    <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      Donors
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Available Donors</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-display font-bold text-gray-900 mb-1">24</p>
                      <p className="text-xs font-medium text-gray-400">
                        Within 10km radius
                      </p>
                    </div>
                    <div className="w-2 h-8 bg-linear-to-b from-purple-500 to-purple-600 rounded-full group-hover:h-12 transition-all duration-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs and Search */}
          <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === 'inventory'
                      ? 'bg-linear-to-r from-primary to-primary-dark text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Blood Inventory
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === 'requests'
                      ? 'bg-linear-to-r from-red-500 to-red-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Requests ({stats.activeRequests})
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={activeTab === 'inventory' ? 'Search blood groups...' : 'Search requests...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-64"
                  />
                </div>
                
                {activeTab === 'requests' && (
                  <div className="flex items-center gap-2">
                    <FiFilter className="text-gray-400" />
                    <select
                      value={selectedUrgency}
                      onChange={(e) => setSelectedUrgency(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="ALL">All Urgency</option>
                      <option value="EMERGENCY">Emergency</option>
                      <option value="URGENT">Urgent</option>
                      <option value="NORMAL">Normal</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          {activeTab === 'inventory' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-display font-bold text-gray-900 mb-1">Blood Inventory</h2>
                    <p className="text-gray-500">Real-time stock levels by blood type</p>
                  </div>
                  <button
                    onClick={() => setShowInventoryModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-primary to-primary-dark text-white hover:shadow-lg transition-all duration-300"
                  >
                    <FiPlus /> Update Inventory
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-linear-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Blood Group</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Units Available</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Updated</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center">
                          <div className="w-24 h-24 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiDroplet className="text-3xl text-gray-400" />
                          </div>
                          <p className="text-gray-600 font-semibold text-lg mb-2">No inventory found</p>
                          <p className="text-gray-400 mb-6">Start by adding blood units to your inventory</p>
                          <button
                            onClick={() => setShowInventoryModal(true)}
                            className="btn-primary px-6 py-3 rounded-xl"
                          >
                            Add Blood Units
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-linear-to-br from-red-500/10 to-red-600/10 rounded-lg flex items-center justify-center">
                                <span className="text-lg font-bold text-red-600">{item.bloodGroup}</span>
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">{item.bloodGroup}</div>
                                <div className="text-xs text-gray-400">Universal {item.bloodGroup === 'O-' ? 'Donor' : item.bloodGroup === 'AB+' ? 'Recipient' : 'Compatible'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${
                                      item.unitsAvailable <= 3 ? 'bg-red-500' :
                                      item.unitsAvailable <= 10 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(100, (item.unitsAvailable / 50) * 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className={`text-lg font-bold ${
                                item.unitsAvailable <= 3 ? 'text-red-600' :
                                item.unitsAvailable <= 10 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {item.unitsAvailable}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(item.unitsAvailable)}`}>
                              {item.unitsAvailable <= 3 ? (
                                <>
                                  <FiAlertTriangle className="text-xs" /> Critical
                                </>
                              ) : item.unitsAvailable <= 10 ? (
                                <>
                                  <FiAlertCircle className="text-xs" /> Low
                                </>
                              ) : (
                                <>
                                  <FiCheck className="text-xs" /> Available
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            <div className="flex items-center gap-2">
                              <FiClock className="text-gray-400" />
                              {item.lastUpdatedFormatted}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingInventory(item);
                                  setInventoryForm({
                                    bloodGroup: item.bloodGroup,
                                    units: 0,
                                    operation: 'ADD'
                                  });
                                  setShowInventoryModal(true);
                                }}
                                className="p-2 rounded-lg border border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-300"
                                title="Update"
                              >
                                <FiEdit className="text-gray-600 hover:text-primary" />
                              </button>
                              <button
                                onClick={() => navigate(`/inventory/${item.id}`)}
                                className="p-2 rounded-lg border border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-300"
                                title="View Details"
                              >
                                <FiChevronRight className="text-gray-600 hover:text-primary" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Requests Table */}
          {activeTab === 'requests' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-display font-bold text-gray-900 mb-1">Blood Requests</h2>
                    <p className="text-gray-500">Manage patient blood requests</p>
                  </div>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-red-500 to-red-600 text-white hover:shadow-lg transition-all duration-300"
                  >
                    <FiPlus /> Create Request
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-linear-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient Details</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Blood Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Units</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Urgency</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center">
                          <div className="w-24 h-24 bg-linear-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiHeart className="text-3xl text-red-400" />
                          </div>
                          <p className="text-gray-600 font-semibold text-lg mb-2">No requests found</p>
                          <p className="text-gray-400 mb-6">
                            {selectedUrgency !== 'ALL' 
                              ? `No ${selectedUrgency.toLowerCase()} requests found`
                              : 'Create your first blood request'}
                          </p>
                          <button
                            onClick={() => setShowRequestModal(true)}
                            className="bg-linear-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300"
                          >
                            Create Request
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-bold text-gray-900">{req.patientName || 'Unnamed Patient'}</div>
                              {req.patientAge && (
                                <div className="text-sm text-gray-500">{req.patientAge} years old</div>
                              )}
                              {req.condition && (
                                <div className="text-xs text-gray-400">{req.condition}</div>
                              )}
                              {req.daysAgo > 0 && (
                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                  <FiClock className="text-[10px]" />
                                  {req.daysAgo} day{req.daysAgo > 1 ? 's' : ''} ago
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-linear-to-br from-red-500/10 to-red-600/10 rounded flex items-center justify-center">
                                <span className="font-bold text-red-600">{req.bloodGroup}</span>
                              </div>
                              <div className="text-sm text-gray-600">{req.bloodGroup}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-linear-to-r from-primary/10 to-primary-dark/10 text-primary rounded-lg text-sm font-bold">
                              {req.unitsRequired} units
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white ${getUrgencyColor(req.urgency)}`}>
                              <FiAlertCircle className="text-xs" />
                              {req.urgency}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                              req.status === 'FULFILLED' ? 'bg-green-100 text-green-700 border border-green-200' :
                              req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                              'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {req.status === 'PENDING' && inventory.some(inv => 
                                inv.bloodGroup === req.bloodGroup && inv.unitsAvailable >= req.unitsRequired
                              ) && (
                                <button
                                  onClick={() => handleAcceptRequest(req.id)}
                                  className="px-4 py-2 bg-linear-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium"
                                >
                                  Fulfill
                                </button>
                              )}
                              <button
                                onClick={() => navigate(`/requests/${req.id}`)}
                                className="p-2 rounded-lg border border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-300"
                                title="View Details"
                              >
                                <FiChevronRight className="text-gray-600 hover:text-primary" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Inventory Modal */}
        {showInventoryModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 animate-fade-in-up">
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
                {editingInventory ? 'Update Inventory' : 'Add Blood Units'}
              </h3>
              <p className="text-gray-500 mb-6">Manage your blood inventory levels</p>
              
              <form onSubmit={handleUpdateInventory}>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                    <div className="relative">
                      <select
                        value={inventoryForm.bloodGroup}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, bloodGroup: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                      >
                        {bloodGroups.map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                      <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
                    <div className="grid grid-cols-2 gap-2">
                      {operations.map(op => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setInventoryForm({ ...inventoryForm, operation: op })}
                          className={`px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                            inventoryForm.operation === op
                              ? op === 'ADD'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Units to {inventoryForm.operation === 'ADD' ? 'Add' : 'Remove'}
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setInventoryForm({...inventoryForm, units: Math.max(0, inventoryForm.units - 1)})}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <FiMinus />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={inventoryForm.units}
                      onChange={(e) => setInventoryForm({ ...inventoryForm, units: parseInt(e.target.value) || 0 })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-center text-lg font-bold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setInventoryForm({...inventoryForm, units: inventoryForm.units + 1})}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>
                
                {editingInventory && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-blue-700">Current Stock</div>
                        <div className="text-lg font-bold text-gray-900">{editingInventory.unitsAvailable} units</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-blue-700">After {inventoryForm.operation.toLowerCase()}</div>
                        <div className="text-lg font-bold text-gray-900">
                          {inventoryForm.operation === 'ADD'
                            ? editingInventory.unitsAvailable + inventoryForm.units
                            : Math.max(0, editingInventory.unitsAvailable - inventoryForm.units)
                          } units
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInventoryModal(false);
                      setEditingInventory(null);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary px-4 py-3 rounded-xl font-medium"
                  >
                    {editingInventory ? 'Update' : 'Add to Inventory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-8 animate-fade-in-up">
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Create Blood Request</h3>
              <p className="text-gray-500 mb-6">Request blood units for a patient in need</p>
              
              <form onSubmit={handleCreateRequest}>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group *</label>
                    <select
                      value={requestForm.bloodGroup}
                      onChange={(e) => setRequestForm({ ...requestForm, bloodGroup: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      {bloodGroups.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Units Required *</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={requestForm.unitsRequired}
                      onChange={(e) => setRequestForm({ ...requestForm, unitsRequired: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {urgencyLevels.map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setRequestForm({ ...requestForm, urgency: level })}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                          requestForm.urgency === level
                            ? level === 'EMERGENCY' ? 'border-red-500 bg-red-50 text-red-700' :
                              level === 'URGENT' ? 'border-orange-500 bg-orange-50 text-orange-700' :
                              'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-bold mb-1">{level}</div>
                          <div className="text-xs text-gray-500">
                            {level === 'EMERGENCY' ? 'Immediate' :
                             level === 'URGENT' ? 'Within 24h' :
                             'Within 72h'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name</label>
                    <input
                      type="text"
                      value={requestForm.patientName}
                      onChange={(e) => setRequestForm({ ...requestForm, patientName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Optional"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Patient Age</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={requestForm.patientAge}
                      onChange={(e) => setRequestForm({ ...requestForm, patientAge: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition / Ward</label>
                  <input
                    type="text"
                    value={requestForm.condition}
                    onChange={(e) => setRequestForm({ ...requestForm, condition: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Surgery, ICU, Maternity"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-linear-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                  >
                    Create Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HospitalDashboard;