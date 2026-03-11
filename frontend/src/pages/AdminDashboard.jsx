import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'
import Layout from '../components/Layout'
import {
  FiClock, FiActivity, FiFilter, FiSearch, FiChevronRight,
  FiChevronUp, FiAlertCircle, FiCheckCircle, FiXCircle,
  FiDownload, FiRefreshCw, FiCalendar, FiDroplet,
  FiChevronDown, FiTrendingUp, FiZap
} from 'react-icons/fi'

const StatCard = ({ icon, label, value, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
        <span className={`${iconColor} text-lg`}>{icon}</span>
      </div>
      <FiTrendingUp size={14} className="text-gray-200 group-hover:text-green-400 transition-colors" />
    </div>
    <p className="text-2xl font-black text-gray-900 mb-0.5">{value}</p>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
  </div>
)

const StatusBadge = ({ status }) => {
  const map = {
    PENDING:   { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
    FULFILLED: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-400'  },
    CANCELLED: { bg: 'bg-gray-100',  text: 'text-gray-500',   dot: 'bg-gray-300'   },
    MATCHED:   { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
  }
  const s = map[status] || { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-300' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}

const UrgencyBadge = ({ urgency }) => {
  const map = {
    EMERGENCY: { bg: 'bg-red-50',    text: 'text-red-600'    },
    URGENT:    { bg: 'bg-orange-50', text: 'text-orange-600' },
    NORMAL:    { bg: 'bg-blue-50',   text: 'text-blue-600'   },
  }
  const u = map[urgency] || map.NORMAL
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${u.bg} ${u.text}`}>
      {urgency === 'EMERGENCY' && <FiZap size={9} />}
      {urgency}
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

export default function RequestHistory() {
  const { currentUser } = useAuth()
  const [requests, setRequests]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [expandedRow, setExpandedRow] = useState(null)

  useEffect(() => { fetchRequests() }, [currentUser])

  const fetchRequests = async () => {
    if (!currentUser?.uid) return
    setRefreshing(true)
    try {
      const res = await apiService.get(`/requests/my/${currentUser.uid}`)
      setRequests(res.data || [])
    } catch (err) { console.error(err); setRequests([]) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const stats = useMemo(() => ({
    total:     requests.length,
    pending:   requests.filter(r => r.status === 'PENDING').length,
    fulfilled: requests.filter(r => r.status === 'FULFILLED').length,
    cancelled: requests.filter(r => r.status === 'CANCELLED').length,
    emergency: requests.filter(r => r.urgency === 'EMERGENCY').length,
  }), [requests])

  const filtered = useMemo(() => {
    let f = [...requests]
    if (searchQuery) f = f.filter(r =>
      r.bloodGroup?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.urgency?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (activeFilter === 'EMERGENCY') f = f.filter(r => r.urgency === 'EMERGENCY')
    else if (activeFilter !== 'ALL') f = f.filter(r => r.status === activeFilter)
    return f.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [requests, searchQuery, activeFilter])

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400 font-medium">Loading request history...</p>
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
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <FiActivity className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">Request History</h1>
                <p className="text-xs text-gray-400">Track all your blood requests</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchRequests} disabled={refreshing}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50">
                <FiRefreshCw size={15} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-600 text-sm font-bold rounded-xl hover:border-red-300 transition-all">
                <FiDownload size={14} /> Export
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard icon={<FiActivity />}    label="Total"     value={stats.total}     iconBg="bg-blue-50"   iconColor="text-blue-500"   />
            <StatCard icon={<FiClock />}       label="Pending"   value={stats.pending}   iconBg="bg-yellow-50" iconColor="text-yellow-500" />
            <StatCard icon={<FiCheckCircle />} label="Fulfilled" value={stats.fulfilled} iconBg="bg-green-50"  iconColor="text-green-500"  />
            <StatCard icon={<FiXCircle />}     label="Cancelled" value={stats.cancelled} iconBg="bg-gray-100"  iconColor="text-gray-400"   />
            <StatCard icon={<FiAlertCircle />} label="Emergency" value={stats.emergency} iconBg="bg-red-50"    iconColor="text-red-500"    />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-gray-900">Blood Requests</p>
              <p className="text-xs text-gray-400">Showing {filtered.length} of {requests.length}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <FiSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="text" placeholder="Search..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-red-400 w-36 bg-gray-50" />
              </div>
              <FiFilter size={12} className="text-gray-300" />
              {['ALL','PENDING','FULFILLED','CANCELLED','EMERGENCY'].map(f => (
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
                    {['Date', 'Blood Type', 'Units', 'Urgency', 'Status', ''].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <FiActivity className="text-2xl text-orange-300" />
                        </div>
                        <p className="text-sm font-bold text-gray-400">No requests found</p>
                        <p className="text-xs text-gray-300 mt-1">
                          {searchQuery || activeFilter !== 'ALL' ? 'Try adjusting filters' : "You haven't made any blood requests yet"}
                        </p>
                        {(searchQuery || activeFilter !== 'ALL') && (
                          <button onClick={() => { setSearchQuery(''); setActiveFilter('ALL') }}
                            className="mt-3 text-red-500 text-xs font-bold hover:text-red-600">
                            Clear filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : filtered.map(req => {
                    const isExpanded = expandedRow === req.id
                    return (
                      <React.Fragment key={req.id}>
                        <tr onClick={() => setExpandedRow(isExpanded ? null : req.id)}
                          className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${isExpanded ? 'bg-orange-50/20' : ''}`}>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-gray-900">{formatDate(req.createdAt)}</p>
                            <p className="text-xs text-gray-300">#{String(req.id).slice(0,6)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                              <span className="font-black text-red-600 text-xs">{req.bloodGroup}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                                <span className="font-black text-blue-600 text-xs">{req.unitsRequired}</span>
                              </div>
                              <span className="text-xs text-gray-400">unit{req.unitsRequired > 1 ? 's' : ''}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4"><UrgencyBadge urgency={req.urgency} /></td>
                          <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                          <td className="px-6 py-4">
                            <button className="p-1.5 rounded-lg border border-gray-100 hover:border-red-300 hover:bg-red-50 transition-colors">
                              {isExpanded ? <FiChevronUp size={13} className="text-gray-400" /> : <FiChevronDown size={13} className="text-gray-400" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="px-6 py-5 bg-gray-50/50 border-b border-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white rounded-xl p-4 border border-gray-100">
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Request Details</p>
                                  <div className="space-y-2 text-xs text-gray-600">
                                    <div className="flex justify-between"><span>ID</span><span className="font-mono font-bold">{String(req.id).slice(0,8)}...</span></div>
                                    <div className="flex justify-between"><span>Created</span><span className="font-bold">{new Date(req.createdAt).toLocaleString('en-IN')}</span></div>
                                    <div className="flex justify-between"><span>Updated</span><span className="font-bold">{req.updatedAt ? new Date(req.updatedAt).toLocaleString('en-IN') : 'Never'}</span></div>
                                  </div>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-gray-100">
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Medical Info</p>
                                  <div className="space-y-2 text-xs text-gray-600">
                                    <div className="flex justify-between"><span>Blood Group</span><span className="font-black text-red-600">{req.bloodGroup}</span></div>
                                    <div className="flex justify-between"><span>Units Required</span><span className="font-bold">{req.unitsRequired}</span></div>
                                    <div className="flex justify-between"><span>Urgency</span><span className={`font-bold ${req.urgency === 'EMERGENCY' ? 'text-red-600' : req.urgency === 'URGENT' ? 'text-orange-600' : 'text-blue-600'}`}>{req.urgency}</span></div>
                                  </div>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-gray-100">
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Actions</p>
                                  <div className="space-y-2">
                                    {req.status === 'PENDING' && (
                                      <button onClick={e => e.stopPropagation()}
                                        className="w-full py-2 bg-red-50 text-red-500 hover:bg-red-100 text-xs font-bold rounded-lg transition-colors">
                                        Cancel Request
                                      </button>
                                    )}
                                    {req.status === 'FULFILLED' && (
                                      <button onClick={e => e.stopPropagation()}
                                        className="w-full py-2 bg-green-50 text-green-600 hover:bg-green-100 text-xs font-bold rounded-lg transition-colors">
                                        View Donor Details
                                      </button>
                                    )}
                                    <button onClick={e => e.stopPropagation()}
                                      className="w-full py-2 border border-gray-100 text-gray-500 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors">
                                      Download Receipt
                                    </button>
                                  </div>
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
              <div className="border-t border-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-gray-400 font-medium">
                  {filtered.length} of {requests.length} requests shown
                </p>
                <div className="flex items-center gap-5 text-center">
                  <div><p className="text-base font-black text-green-500">{stats.fulfilled}</p><p className="text-xs text-gray-400">Fulfilled</p></div>
                  <div><p className="text-base font-black text-yellow-500">{stats.pending}</p><p className="text-xs text-gray-400">Pending</p></div>
                  <div><p className="text-base font-black text-red-500">{stats.emergency}</p><p className="text-xs text-gray-400">Emergency</p></div>
                  <div>
                    <p className="text-base font-black text-blue-500">
                      {stats.total > 0 ? Math.round((stats.fulfilled / stats.total) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-400">Success</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  )
}