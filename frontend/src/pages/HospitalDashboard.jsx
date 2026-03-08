import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import {
  FiDroplet, FiClock, FiCheckCircle, FiActivity, FiAlertCircle,
  FiPlus, FiChevronRight, FiRefreshCw, FiTrendingUp,
  FiZap, FiPackage, FiUsers, FiX, FiBarChart2
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const StatCard = ({ icon, label, value, sub, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
        <span className={`${iconColor} text-lg`}>{icon}</span>
      </div>
      <FiTrendingUp size={14} className="text-gray-200 group-hover:text-green-400 transition-colors" />
    </div>
    <p className="text-2xl font-black text-gray-900 mb-0.5">{value}</p>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
)

const getLevelColor = (units) => {
  if (units === 0)  return { bg: 'bg-red-50',    bar: 'bg-red-500',    text: 'text-red-600',    label: 'Critical' }
  if (units < 5)   return { bg: 'bg-orange-50',  bar: 'bg-orange-400', text: 'text-orange-600', label: 'Low'      }
  if (units < 15)  return { bg: 'bg-yellow-50',  bar: 'bg-yellow-400', text: 'text-yellow-600', label: 'Medium'   }
  return               { bg: 'bg-green-50',   bar: 'bg-green-500',  text: 'text-green-600',  label: 'Good'     }
}

export default function HospitalDashboard() {
  const { currentUser } = useAuth()
  const [inventory, setInventory]     = useState([])
  const [requests, setRequests]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [showInvForm, setShowInvForm] = useState(false)
  const [showReqForm, setShowReqForm] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [formError, setFormError]     = useState('')
  const [invForm, setInvForm] = useState({ bloodGroup: '', units: 1, action: 'add' })
  const [reqForm, setReqForm] = useState({ bloodGroup: '', unitsRequired: 1, urgency: 'NORMAL', patientName: '' })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData() }, [currentUser])

  const fetchData = async () => {
    if (!currentUser?.uid) { setLoading(false); return }
    setRefreshing(true)
    try {
      const [invRes, reqRes] = await Promise.allSettled([
        apiService.get(`/inventory/hospital/${currentUser.uid}`),
        apiService.get('/requests/pending'),
      ])
      if (invRes.status === 'fulfilled') setInventory(invRes.value.data || [])
      if (reqRes.status === 'fulfilled') setRequests(reqRes.value.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const handleInventoryUpdate = async () => {
    if (!invForm.bloodGroup) { setFormError('Select a blood group'); return }
    const units = invForm.action === 'remove' ? -Math.abs(invForm.units) : Math.abs(invForm.units)
    setFormError(''); setSubmitting(true)
    try {
      await apiService.post(`/inventory/hospital/${currentUser.uid}/update`, { bloodGroup: invForm.bloodGroup, units })
      setShowInvForm(false); setInvForm({ bloodGroup: '', units: 1, action: 'add' }); fetchData()
    } catch (err) { setFormError(err.displayMessage || 'Failed to update inventory') }
    finally { setSubmitting(false) }
  }

  const handleBloodRequest = async () => {
    if (!reqForm.bloodGroup) { setFormError('Select a blood group'); return }
    setFormError(''); setSubmitting(true)
    try {
      await apiService.post(`/requests/hospital/${currentUser.uid}`, reqForm)
      setShowReqForm(false); setReqForm({ bloodGroup: '', unitsRequired: 1, urgency: 'NORMAL', patientName: '' }); fetchData()
    } catch (err) { setFormError(err.displayMessage || 'Failed to submit request') }
    finally { setSubmitting(false) }
  }

  const handleAcceptDonation = async (donationId) => {
    try { await apiService.post(`/donations/hospital/${currentUser.uid}/accept/${donationId}`); fetchData() }
    catch (err) { alert(err.displayMessage || 'Failed to accept donation') }
  }

  const totalUnits  = inventory.reduce((sum, i) => sum + (i.unitsAvailable || 0), 0)
  const criticalCount = inventory.filter(i => (i.unitsAvailable || 0) < 5).length
  const pendingCount  = requests.filter(r => r.status === 'PENDING').length

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* ── Header ──────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <FiActivity className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">
                  {currentUser?.name || 'Hospital'} 🏥
                </h1>
                <p className="text-xs text-gray-400">Hospital Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchData} disabled={refreshing}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all disabled:opacity-50">
                <FiRefreshCw size={15} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => { setShowReqForm(true); setFormError('') }}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-red-200">
                <FiPlus size={16} /> Request Blood
              </button>
              <button onClick={() => { setShowInvForm(true); setFormError('') }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-200">
                <FiPackage size={16} /> Update Stock
              </button>
            </div>
          </div>

          {/* ── Stats ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<FiPackage />}     label="Total Stock"    value={totalUnits}    sub="Units available"   iconBg="bg-blue-50"   iconColor="text-blue-500"   />
            <StatCard icon={<FiAlertCircle />} label="Critical"       value={criticalCount} sub="Blood types low"   iconBg="bg-red-50"    iconColor="text-red-500"    />
            <StatCard icon={<FiClock />}       label="Pending"        value={pendingCount}  sub="Requests waiting"  iconBg="bg-yellow-50" iconColor="text-yellow-500" />
            <StatCard icon={<FiBarChart2 />}   label="Blood Types"    value={inventory.length} sub="In inventory"  iconBg="bg-green-50"  iconColor="text-green-500"  />
          </div>

          {/* ── Two Column ──────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Inventory */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Blood Inventory</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Current stock levels</p>
                </div>
                <button onClick={() => { setShowInvForm(true); setFormError('') }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl transition-colors">
                  <FiPlus size={13} /> Update
                </button>
              </div>
              <div className="p-6">
                {inventory.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FiPackage className="text-2xl text-blue-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400">No inventory yet</p>
                    <p className="text-xs text-gray-300 mt-1">Add your first blood stock</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {BLOOD_GROUPS.map(bg => {
                      const item = inventory.find(i => i.bloodGroup === bg)
                      const units = item?.unitsAvailable || 0
                      const level = getLevelColor(units)
                      return (
                        <div key={bg} className={`${level.bg} rounded-xl p-4 border border-transparent`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-black text-lg ${level.text}`}>{bg}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 bg-white rounded-full ${level.text}`}>{level.label}</span>
                          </div>
                          <p className="text-2xl font-black text-gray-900">{units}</p>
                          <p className="text-xs text-gray-400 mt-0.5">units</p>
                          <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                            <div className={`h-full ${level.bar} rounded-full transition-all`}
                              style={{ width: `${Math.min(100, (units / 30) * 100)}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Pending Requests</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Donor requests awaiting approval</p>
                </div>
                <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-black rounded-full">
                  {pendingCount} pending
                </span>
              </div>
              <div className="p-6">
                {requests.filter(r => r.status === 'PENDING').length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FiCheckCircle className="text-2xl text-green-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400">All clear!</p>
                    <p className="text-xs text-gray-300 mt-1">No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.filter(r => r.status === 'PENDING').slice(0, 5).map(req => (
                      <div key={req.id} className="border border-gray-100 hover:border-blue-200 rounded-xl p-4 transition-all duration-200 hover:shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-red-600 font-black text-xs">{req.bloodGroup}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{req.patientName || 'Anonymous'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">{req.unitsRequired} units</span>
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                req.urgency === 'EMERGENCY' ? 'bg-red-100 text-red-600' :
                                req.urgency === 'URGENT'    ? 'bg-orange-100 text-orange-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {req.urgency === 'EMERGENCY' && <FiZap size={9} className="inline mr-0.5" />}
                                {req.urgency}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-300 shrink-0">{new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button onClick={() => handleAcceptDonation(req.id)}
                          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors">
                          Accept & Fulfill
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Inventory Modal ──────────────────────────────── */}
      {showInvForm && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowInvForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
              <div className="bg-blue-500 px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-black text-lg">Update Inventory</h3>
                  <p className="text-blue-100 text-xs mt-0.5">Add or remove blood units</p>
                </div>
                <button onClick={() => setShowInvForm(false)} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
                  <FiX className="text-white text-sm" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    <FiAlertCircle size={14} className="shrink-0" /> {formError}
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Blood Group *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {BLOOD_GROUPS.map(bg => (
                      <button key={bg} onClick={() => setInvForm(f => ({ ...f, bloodGroup: bg }))}
                        className={`py-2 rounded-xl border-2 text-sm font-black transition-all ${
                          invForm.bloodGroup === bg ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-100 text-gray-600 hover:border-blue-300'
                        }`}>
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Units</label>
                    <input type="number" min="1" value={invForm.units}
                      onChange={e => setInvForm(f => ({ ...f, units: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 font-semibold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Action</label>
                    <select value={invForm.action} onChange={e => setInvForm(f => ({ ...f, action: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 font-semibold">
                      <option value="add">Add Stock</option>
                      <option value="remove">Remove Stock</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowInvForm(false)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:border-gray-300 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleInventoryUpdate} disabled={submitting}
                    className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                    {submitting ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Updating...</> : 'Update Stock'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Blood Request Modal ──────────────────────────── */}
      {showReqForm && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowReqForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
              <div className="bg-red-500 px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-black text-lg">Request Blood</h3>
                  <p className="text-red-100 text-xs mt-0.5">Post a blood requirement</p>
                </div>
                <button onClick={() => setShowReqForm(false)} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
                  <FiX className="text-white text-sm" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    <FiAlertCircle size={14} className="shrink-0" /> {formError}
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Blood Group *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {BLOOD_GROUPS.map(bg => (
                      <button key={bg} onClick={() => setReqForm(f => ({ ...f, bloodGroup: bg }))}
                        className={`py-2 rounded-xl border-2 text-sm font-black transition-all ${
                          reqForm.bloodGroup === bg ? 'border-red-500 bg-red-500 text-white' : 'border-gray-100 text-gray-600 hover:border-red-300'
                        }`}>
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Units *</label>
                    <input type="number" min="1" value={reqForm.unitsRequired}
                      onChange={e => setReqForm(f => ({ ...f, unitsRequired: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 font-semibold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Urgency *</label>
                    <select value={reqForm.urgency} onChange={e => setReqForm(f => ({ ...f, urgency: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 font-semibold">
                      <option value="NORMAL">Normal</option>
                      <option value="URGENT">Urgent</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Patient Name</label>
                  <input type="text" placeholder="Patient name (optional)" value={reqForm.patientName}
                    onChange={e => setReqForm(f => ({ ...f, patientName: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowReqForm(false)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:border-gray-300 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleBloodRequest} disabled={submitting}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                    {submitting ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Posting...</> : 'Post Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}