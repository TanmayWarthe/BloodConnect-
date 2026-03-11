import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import {
  FiClock, FiMapPin, FiCheckCircle, FiDroplet, FiCalendar,
  FiFilter, FiDownload, FiHeart, FiStar, FiChevronDown,
  FiChevronUp, FiBarChart2, FiAward, FiRefreshCw, FiTrendingUp
} from 'react-icons/fi'
import { apiService } from '../services/api.service'

const StatCard = ({ icon, label, value, sub, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
        <span className={`${iconColor} text-lg`}>{icon}</span>
      </div>
      <FiTrendingUp size={14} className="text-gray-200 group-hover:text-green-400 transition-colors" />
    </div>
    <p className="text-2xl font-black text-gray-900 mb-0.5">{value}</p>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
    {sub && <p className="text-xs text-gray-300 mt-1">{sub}</p>}
  </div>
)

const StatusBadge = ({ status }) => {
  const map = {
    COMPLETED: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-400'  },
    SCHEDULED: { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
    CANCELLED: { bg: 'bg-gray-100',  text: 'text-gray-500',   dot: 'bg-gray-300'   },
    PENDING:   { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  }
  const s = map[status] || map.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}

const formatDate = (ds) => {
  if (!ds) return '—'
  const d = new Date(ds)
  const diff = Math.ceil(Math.abs(new Date() - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DonationHistory() {
  const { currentUser } = useAuth()
  const [history, setHistory]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [sortBy, setSortBy]           = useState('date')
  const [sortOrder, setSortOrder]     = useState('desc')
  const [expandedRow, setExpandedRow] = useState(null)

  useEffect(() => { fetchHistory() }, [currentUser])

  const fetchHistory = async () => {
    if (!currentUser?.uid) return
    setRefreshing(true)
    try {
      const res = await apiService.get(`/donations/donor/${currentUser.uid}`)
      setHistory(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const stats = useMemo(() => {
    const total = history.length
    const units = history.reduce((s, i) => s + (i.units || 0), 0)
    const completed = history.filter(i => i.status === 'COMPLETED').length
    const byMonth = {}
    history.forEach(i => {
      const d = new Date(i.donationDate)
      byMonth[`${d.getFullYear()}-${d.getMonth()}`] = (byMonth[`${d.getFullYear()}-${d.getMonth()}`] || 0) + 1
    })
    return {
      total, units, completed,
      avgPerMonth: Object.keys(byMonth).length > 0 ? (total / Object.keys(byMonth).length).toFixed(1) : 0,
    }
  }, [history])

  const filtered = useMemo(() => {
    let f = [...history]
    if (activeFilter !== 'ALL') f = f.filter(i => i.status === activeFilter)
    f.sort((a, b) => {
      const av = sortBy === 'units' ? (a.units || 0) : new Date(a.donationDate).getTime()
      const bv = sortBy === 'units' ? (b.units || 0) : new Date(b.donationDate).getTime()
      return sortOrder === 'desc' ? bv - av : av - bv
    })
    return f
  }, [history, activeFilter, sortBy, sortOrder])

  const toggleSort = (col) => {
    if (sortBy === col) setSortOrder(o => o === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortOrder('desc') }
  }

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400 font-medium">Loading donation history...</p>
        </div>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                <FiHeart className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">Donation History</h1>
                <p className="text-xs text-gray-400">Your life-saving contributions, {currentUser?.name?.split(' ')[0]}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchHistory} disabled={refreshing}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50">
                <FiRefreshCw size={15} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white hover:border-red-300 text-gray-600 hover:text-red-500 text-sm font-bold rounded-xl transition-all">
                <FiDownload size={14} /> Export
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<FiHeart />}       label="Total Donations" value={stats.total}                  sub={`${stats.avgPerMonth} avg/month`} iconBg="bg-red-50"    iconColor="text-red-500"    />
            <StatCard icon={<FiDroplet />}     label="Units Donated"   value={stats.units}                  sub="Pints of blood"                   iconBg="bg-blue-50"   iconColor="text-blue-500"   />
            <StatCard icon={<FiCheckCircle />} label="Completed"       value={stats.completed}              sub="Successful donations"             iconBg="bg-green-50"  iconColor="text-green-500"  />
            <StatCard icon={<FiAward />}       label="Lives Impacted"  value={(stats.units || 0) * 3}       sub="3 lives per donation"             iconBg="bg-yellow-50" iconColor="text-yellow-500" />
          </div>

          {/* Filter bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-gray-900">Donation Records</p>
              <p className="text-xs text-gray-400">Showing {filtered.length} of {history.length}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <FiFilter size={12} className="text-gray-300" />
              {['ALL','COMPLETED','SCHEDULED','PENDING','CANCELLED'].map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeFilter === f ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}>
                  {f === 'ALL' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-6 py-4 text-left">
                      <button onClick={() => toggleSort('date')} className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-wide hover:text-gray-700">
                        <FiCalendar size={11} /> Date
                        {sortBy === 'date' ? (sortOrder === 'desc' ? <FiChevronDown size={11} /> : <FiChevronUp size={11} />) : <FiChevronDown size={11} className="text-gray-200" />}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Location</th>
                    <th className="px-6 py-4 text-left">
                      <button onClick={() => toggleSort('units')} className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-wide hover:text-gray-700">
                        <FiBarChart2 size={11} /> Units
                        {sortBy === 'units' ? (sortOrder === 'desc' ? <FiChevronDown size={11} /> : <FiChevronUp size={11} />) : <FiChevronDown size={11} className="text-gray-200" />}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <FiHeart className="text-2xl text-red-300" />
                        </div>
                        <p className="text-sm font-bold text-gray-400">No donations found</p>
                        <p className="text-xs text-gray-300 mt-1">
                          {activeFilter === 'ALL' ? 'Your first donation could save 3 lives!' : `No ${activeFilter.toLowerCase()} donations`}
                        </p>
                      </td>
                    </tr>
                  ) : filtered.map(item => {
                    const isExpanded = expandedRow === item.id
                    return (
                      <React.Fragment key={item.id}>
                        <tr onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                          className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${isExpanded ? 'bg-red-50/20' : ''}`}>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-gray-900">{formatDate(item.donationDate)}</p>
                            <p className="text-xs text-gray-300">{new Date(item.donationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                                <FiMapPin size={12} className="text-red-400" />
                              </div>
                              <p className="text-sm font-medium text-gray-700">{item.request?.hospitalName || 'Direct Donation'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                                <span className="font-black text-red-600 text-xs">{item.units}</span>
                              </div>
                              <span className="text-xs text-gray-400">unit{item.units > 1 ? 's' : ''}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                          <td className="px-6 py-4">
                            <button className="p-1.5 rounded-lg border border-gray-100 hover:border-red-300 hover:bg-red-50 transition-colors">
                              {isExpanded ? <FiChevronUp size={13} className="text-gray-400" /> : <FiChevronDown size={13} className="text-gray-400" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="px-6 py-5 bg-gray-50/50 border-b border-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="bg-white rounded-xl p-4 border border-gray-100">
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Donation Details</p>
                                  <div className="space-y-2 text-xs text-gray-600">
                                    <div className="flex justify-between"><span>ID</span><span className="font-mono font-bold">{String(item.id).slice(0,8)}...</span></div>
                                    <div className="flex justify-between"><span>Duration</span><span className="font-bold">~45 min</span></div>
                                    <div className="flex justify-between"><span>Type</span><span className="font-bold">{item.donationType || 'Whole Blood'}</span></div>
                                  </div>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-gray-100">
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Health Metrics</p>
                                  <div className="space-y-2 text-xs text-gray-600">
                                    <div className="flex justify-between"><span>Blood Pressure</span><span className="font-bold">120/80 mmHg</span></div>
                                    <div className="flex justify-between"><span>Hemoglobin</span><span className="font-bold text-green-600">14.2 g/dL</span></div>
                                    <div className="flex justify-between"><span>Pulse</span><span className="font-bold">72 bpm</span></div>
                                  </div>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-gray-100">
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Impact</p>
                                  <div className="space-y-2 text-xs text-gray-600 mb-3">
                                    <div className="flex justify-between"><span>Lives Saved</span><span className="font-black text-red-500">{(item.units || 1) * 3} people</span></div>
                                    <div className="flex justify-between">
                                      <span>Next Eligible</span>
                                      <span className="font-bold">{new Date(new Date(item.donationDate).setDate(new Date(item.donationDate).getDate() + 56)).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                  </div>
                                  <button className="w-full py-2 bg-red-50 text-red-500 hover:bg-red-100 text-xs font-bold rounded-lg transition-colors">
                                    View Certificate
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {filtered.length > 0 && (
              <div className="border-t border-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-red-50/50 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                    <FiStar size={14} className="text-red-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Keep saving lives! 🩸</p>
                </div>
                <div className="flex items-center gap-6 text-center">
                  <div><p className="text-lg font-black text-red-500">{stats.total}</p><p className="text-xs text-gray-400">Donations</p></div>
                  <div><p className="text-lg font-black text-blue-500">{stats.units}</p><p className="text-xs text-gray-400">Units</p></div>
                  <div><p className="text-lg font-black text-green-500">{(stats.units || 0) * 3}</p><p className="text-xs text-gray-400">Lives</p></div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  )
}