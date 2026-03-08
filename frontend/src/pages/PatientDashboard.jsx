/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import {
  FiDroplet, FiClock, FiCheckCircle, FiHeart, FiActivity,
  FiAlertCircle, FiPlus, FiChevronRight, FiRefreshCw,
  FiX, FiTrendingUp, FiZap, FiMapPin
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const URGENCY_LEVELS = ['NORMAL', 'URGENT', 'EMERGENCY']

const StatCard = ({ icon, label, value, sub, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300 group">
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

const StatusBadge = ({ status }) => {
  const map = {
    PENDING:   { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
    APPROVED:  { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
    FULFILLED: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-400'  },
    REJECTED:  { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-400'    },
  }
  const s = map[status] || map.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}

export default function PatientDashboard() {
  const { currentUser } = useAuth()
  const [requests, setRequests]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showForm, setShowForm]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    bloodGroup: '', unitsRequired: 1, urgency: 'NORMAL',
    hospitalName: '', notes: '', patientName: currentUser?.name || '',
  })
  const [formError, setFormError] = useState('')

  useEffect(() => { fetchRequests() }, [currentUser])

  const fetchRequests = async () => {
    if (!currentUser?.uid) { setLoading(false); return }
    setRefreshing(true)
    try {
      const res = await apiService.get(`/requests/my/${currentUser.uid}`)
      setRequests(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const handleSubmit = async () => {
    if (!form.bloodGroup) { setFormError('Please select a blood group'); return }
    if (!form.unitsRequired || form.unitsRequired < 1) { setFormError('Units must be at least 1'); return }
    setFormError(''); setSubmitting(true)
    try {
      await apiService.post(`/requests?uid=${currentUser.uid}`, form)
      setShowForm(false)
      setForm({ bloodGroup: '', unitsRequired: 1, urgency: 'NORMAL', hospitalName: '', notes: '', patientName: currentUser?.name || '' })
      fetchRequests()
    } catch (err) { setFormError(err.displayMessage || 'Failed to submit request') }
    finally { setSubmitting(false) }
  }

  const stats = {
    total:     requests.length,
    pending:   requests.filter(r => r.status === 'PENDING').length,
    fulfilled: requests.filter(r => r.status === 'FULFILLED').length,
    emergency: requests.filter(r => r.urgency === 'EMERGENCY').length,
  }

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
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
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <FiHeart className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">
                  Hey, {currentUser?.name?.split(' ')[0] || 'there'} 👋
                </h1>
                <p className="text-xs text-gray-400">Patient Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchRequests} disabled={refreshing}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50">
                <FiRefreshCw size={15} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-red-200">
                <FiPlus size={16} /> New Request
              </button>
            </div>
          </div>

          {/* ── Stats ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<FiActivity />}    label="Total Requests" value={stats.total}     sub="All time"          iconBg="bg-blue-50"   iconColor="text-blue-500"   />
            <StatCard icon={<FiClock />}       label="Pending"        value={stats.pending}    sub="Awaiting response" iconBg="bg-yellow-50" iconColor="text-yellow-500" />
            <StatCard icon={<FiCheckCircle />} label="Fulfilled"      value={stats.fulfilled}  sub="Successfully met"  iconBg="bg-green-50"  iconColor="text-green-500"  />
            <StatCard icon={<FiZap />}         label="Emergency"      value={stats.emergency}  sub="Critical requests" iconBg="bg-red-50"    iconColor="text-red-500"    />
          </div>

          {/* ── Requests Table ──────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">My Blood Requests</h2>
                <p className="text-xs text-gray-400 mt-0.5">Track all your requests in one place</p>
              </div>
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors">
                <FiPlus size={13} /> New
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiDroplet className="text-3xl text-red-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500 mb-1">No requests yet</p>
                <p className="text-xs text-gray-400 mb-5">Submit your first blood request to get started</p>
                <button onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors">
                  <FiPlus size={15} /> Submit Request
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {requests.map(req => (
                  <div key={req.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-red-600 font-black text-xs">{req.bloodGroup}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">{req.unitsRequired} unit{req.unitsRequired > 1 ? 's' : ''}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            req.urgency === 'EMERGENCY' ? 'bg-red-100 text-red-600' :
                            req.urgency === 'URGENT'    ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {req.urgency}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {req.hospitalName && (
                            <div className="flex items-center gap-1">
                              <FiMapPin size={10} className="text-gray-300" />
                              <span className="text-xs text-gray-400">{req.hospitalName}</span>
                            </div>
                          )}
                          <span className="text-xs text-gray-300">{new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── New Request Modal ────────────────────────────── */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
              <div className="bg-red-500 px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-black text-lg">New Blood Request</h3>
                  <p className="text-red-100 text-xs mt-0.5">Fill in the details below</p>
                </div>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
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
                      <button key={bg} onClick={() => setForm(f => ({ ...f, bloodGroup: bg }))}
                        className={`py-2 rounded-xl border-2 text-sm font-black transition-all ${
                          form.bloodGroup === bg ? 'border-red-500 bg-red-500 text-white' : 'border-gray-100 text-gray-600 hover:border-red-300'
                        }`}>
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Units Required *</label>
                    <input type="number" min="1" max="10" value={form.unitsRequired}
                      onChange={e => setForm(f => ({ ...f, unitsRequired: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 font-semibold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Urgency *</label>
                    <select value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 font-semibold">
                      {URGENCY_LEVELS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Hospital / Location</label>
                  <input type="text" placeholder="e.g. AIIMS Delhi" value={form.hospitalName}
                    onChange={e => setForm(f => ({ ...f, hospitalName: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Additional Notes</label>
                  <textarea rows={2} placeholder="Any additional information..." value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 resize-none" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:border-gray-300 transition-colors text-sm">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                    {submitting
                      ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting...</>
                      : 'Submit Request'}
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