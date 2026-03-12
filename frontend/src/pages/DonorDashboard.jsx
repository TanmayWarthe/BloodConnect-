/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import {
  FiDroplet, FiClock, FiCheckCircle, FiHeart, FiActivity,
  FiAlertCircle, FiTrendingUp, FiRefreshCw, FiChevronRight,
  FiAward, FiZap, FiDownload, FiStar, FiNavigation, FiMapPin
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'
import { useToast } from '../components/Toast'

// ── Reusable Stat Card ───────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
        <span className={`${iconColor} text-lg`}>{icon}</span>
      </div>
      <FiTrendingUp size={14} className="text-gray-300 group-hover:text-green-400 transition-colors" />
    </div>
    <p className="text-2xl font-black text-gray-900 mb-0.5">{value}</p>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
)

// ── Section Header ───────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-5">
    <div>
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
)

export default function DonorDashboard() {
  const { currentUser } = useAuth()
  const toast = useToast()
  const [donorProfile, setDonorProfile]   = useState(null)
  const [availability, setAvailability]   = useState('available')
  const [requests, setRequests]           = useState([])
  const [history, setHistory]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)
  const [activeView, setActiveView]       = useState('all')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [stats, setStats] = useState({
    livesImpacted: 0, totalDonations: 0, eligibilityDays: 0,
    averageDonationGap: 0, streakCount: 0,
  })

  useEffect(() => { fetchDashboardData() }, [currentUser])

  const fetchDashboardData = async () => {
    if (!currentUser?.uid) { setLoading(false); return }
    setRefreshing(true)
    try {
      const [donorRes, donationsRes, requestsRes] = await Promise.allSettled([
        apiService.get(`/donors/${currentUser.uid}`),
        apiService.get(`/donations/donor/${currentUser.uid}`),
        apiService.get('/requests/pending'),
      ])
      if (donorRes.status === 'fulfilled') {
        const p = donorRes.value.data
        setDonorProfile(p)
        setAvailability(p.availabilityStatus?.toLowerCase() || 'available')
      }
      if (donationsRes.status === 'fulfilled') {
        const raw = donationsRes.value.data || []
        setHistory(raw)
        const total = raw.length
        let daysUntilEligible = 0, avgGap = 0, streak = 0
        if (total > 0) {
          const sorted = [...raw].sort((a, b) => new Date(b.donationDate) - new Date(a.donationDate))
          const diff = Math.ceil(Math.abs(new Date() - new Date(sorted[0].donationDate)) / 864e5)
          if (diff < 90) daysUntilEligible = 90 - diff
          if (total > 1) {
            let gap = 0
            for (let i = 1; i < sorted.length; i++)
              gap += (new Date(sorted[i-1].donationDate) - new Date(sorted[i].donationDate)) / 864e5
            avgGap = Math.round(gap / (total - 1))
          }
          const byMonth = {}
          sorted.forEach(d => { const dt = new Date(d.donationDate); byMonth[`${dt.getFullYear()}-${dt.getMonth()}`] = true })
          const months = Object.keys(byMonth).sort().reverse()
          streak = 1
          for (let i = 1; i < months.length; i++) {
            const [cy, cm] = months[i-1].split('-').map(Number)
            const [py, pm] = months[i].split('-').map(Number)
            if ((cy - py) * 12 + (cm - pm) === 1) streak++; else break
          }
        }
        setStats({ livesImpacted: total * 3, totalDonations: total, eligibilityDays: daysUntilEligible, averageDonationGap: avgGap, streakCount: streak })
      }
      if (requestsRes.status === 'fulfilled') {
        setRequests((requestsRes.value.data || []).map(r => ({
          id: r.id, bloodGroup: r.bloodGroup, quantity: r.unitsRequired,
          urgency: r.urgency, hospitalName: r.hospitalName || 'Patient Request',
          patientName: r.patientName || 'Anonymous', createdAt: r.createdAt, status: r.status,
        })))
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const handleAvailabilityChange = async (s) => {
    const prev = availability; setAvailability(s)
    try { await apiService.put(`/donors/availability/${currentUser.uid}`, null, { params: { status: s.toUpperCase() } }) }
    catch { setAvailability(prev) }
  }

  const handleAcceptRequest = async (id) => {
    if (stats.eligibilityDays > 0) { toast.warning('Not Eligible Yet', `You can donate in ${stats.eligibilityDays} days.`); return }
    try { await apiService.post(`/donations/donor/${currentUser.uid}/accept/${id}`); fetchDashboardData() }
    catch (err) { toast.error('Action Failed', err.displayMessage || err.response?.data?.message || 'Failed to accept request.') }
  }

  const filteredRequests = useMemo(() => {
    if (activeView === 'emergency') return requests.filter(r => r.urgency === 'EMERGENCY')
    if (activeView === 'matching')  return requests.filter(r => donorProfile?.bloodGroup === r.bloodGroup)
    return requests
  }, [requests, activeView, donorProfile])

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    </Layout>
  )

  const availOpts = [
    { s: 'available',   label: 'Available',   desc: 'Ready to donate',       icon: <FiCheckCircle />, ring: 'ring-green-400',  bg: 'bg-green-50',  text: 'text-green-700'  },
    { s: 'busy',        label: 'Busy',        desc: 'Available soon',        icon: <FiClock />,       ring: 'ring-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    { s: 'unavailable', label: 'Unavailable', desc: 'Not available',         icon: <FiActivity />,    ring: 'ring-gray-400',   bg: 'bg-gray-50',   text: 'text-gray-600'   },
  ]

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* ── Top Bar ─────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                  <FiHeart className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-gray-900 tracking-tight">
                    Hey, {currentUser?.name?.split(' ')[0] || 'Hero'} 👋
                  </h1>
                  <p className="text-xs text-gray-400">Donor Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {donorProfile?.bloodGroup && (
                <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
                  <span className="text-red-600 font-black text-sm">{donorProfile.bloodGroup}</span>
                </div>
              )}
              <button onClick={fetchDashboardData} disabled={refreshing}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50">
                <FiRefreshCw size={15} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* ── Stats Grid ──────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<FiHeart />}        label="Lives Impacted" value={stats.livesImpacted}                                       sub={`${stats.totalDonations} donations`}    iconBg="bg-red-50"    iconColor="text-red-500"    />
            <StatCard icon={<FiDroplet />}      label="Total Donations" value={stats.totalDonations}                                     sub={`Avg ${stats.averageDonationGap || '--'} days gap`} iconBg="bg-blue-50"   iconColor="text-blue-500"   />
            <StatCard icon={<FiCheckCircle />}  label="Eligibility"     value={stats.eligibilityDays > 0 ? `${stats.eligibilityDays}d` : 'Ready'} sub={stats.eligibilityDays > 0 ? 'days until eligible' : 'You can donate now!'} iconBg="bg-green-50"  iconColor="text-green-500"  />
            <StatCard icon={<FiAward />}        label="Streak"          value={`${stats.streakCount}mo`}                                 sub="Consecutive months"                     iconBg="bg-yellow-50" iconColor="text-yellow-500" />
          </div>

          {/* ── Availability ────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <SectionHeader title="Your Availability" subtitle="Let patients know when you can donate" />
            <div className="grid grid-cols-3 gap-3">
              {availOpts.map(opt => (
                <button key={opt.s} onClick={() => handleAvailabilityChange(opt.s)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-center hover:-translate-y-0.5 ${
                    availability === opt.s
                      ? `${opt.bg} border-transparent ring-2 ${opt.ring}`
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}>
                  <div className={`text-xl mb-2 flex justify-center ${availability === opt.s ? opt.text : 'text-gray-400'}`}>
                    {opt.icon}
                  </div>
                  <p className={`text-sm font-bold ${availability === opt.s ? opt.text : 'text-gray-700'}`}>{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Two Column ──────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Requests */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <SectionHeader
                  title="Urgent Requests"
                  subtitle="Help save lives nearby"
                  action={
                    <div className="flex gap-1">
                      {['all','emergency','matching'].map(v => (
                        <button key={v} onClick={() => setActiveView(v)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                            activeView === v ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  }
                />
              </div>
              <div className="p-6">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FiDroplet className="text-2xl text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400">No requests found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.slice(0, 3).map(req => (
                      <div key={req.id}
                        onClick={() => setSelectedRequest(selectedRequest === req.id ? null : req.id)}
                        className="border border-gray-100 hover:border-red-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-200 group">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                              <span className="text-red-600 font-black text-sm">{req.bloodGroup}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  req.urgency === 'EMERGENCY' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {req.urgency === 'EMERGENCY' && <FiZap size={9} className="inline mr-0.5" />}
                                  {req.urgency}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <FiMapPin size={10} className="text-gray-300" />
                                <span className="text-xs text-gray-400">{req.hospitalName}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-sm font-black text-gray-900">{req.quantity}u</span>
                        </div>

                        {selectedRequest === req.id && (
                          <div className="pt-3 border-t border-gray-50 mb-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-gray-50 rounded-lg p-2 text-center">
                                <p className="text-xs text-gray-400">Patient</p>
                                <p className="text-xs font-bold text-gray-700">{req.patientName}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-2 text-center">
                                <p className="text-xs text-gray-400">Posted</p>
                                <p className="text-xs font-bold text-gray-700">{new Date(req.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button onClick={e => { e.stopPropagation(); handleAcceptRequest(req.id) }}
                            disabled={stats.eligibilityDays > 0}
                            className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-bold rounded-lg transition-colors">
                            {stats.eligibilityDays > 0 ? `Eligible in ${stats.eligibilityDays}d` : 'Accept Request'}
                          </button>
                          <button className="p-2 border border-gray-100 hover:border-red-200 rounded-lg transition-colors">
                            <FiNavigation size={13} className="text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {requests.length > 3 && (
                      <button className="w-full py-3 text-xs text-red-500 font-semibold flex items-center justify-center gap-1 hover:text-red-600 transition-colors border-t border-gray-50">
                        View all {requests.length} requests <FiChevronRight size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <SectionHeader
                  title="Recent Donations"
                  subtitle="Your life-saving contributions"
                  action={
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors font-medium">
                      <FiDownload size={12} /> Export
                    </button>
                  }
                />
              </div>
              <div className="p-6">
                {history.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FiHeart className="text-2xl text-red-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400">No donations yet</p>
                    <p className="text-xs text-gray-300 mt-1">Your first donation could save 3 lives!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.slice(0, 5).map((d, i) => (
                      <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <FiHeart className="text-red-400 text-sm" />
                          </div>
                          {i === 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                              <FiStar size={8} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{d.hospitalName || 'Donation Center'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{d.units} unit{d.units > 1 ? 's' : ''}</span>
                            <span className="text-xs font-bold text-red-500">{d.bloodGroup}</span>
                            <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full font-medium">{d.status || 'Completed'}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-300 shrink-0">{new Date(d.date || d.donationDate).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {history.length > 5 && (
                      <button className="w-full py-3 text-xs text-red-500 font-semibold flex items-center justify-center gap-1 hover:text-red-600 transition-colors border-t border-gray-50">
                        View all {history.length} donations <FiChevronRight size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  )
}