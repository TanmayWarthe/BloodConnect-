import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'
import Layout from '../components/Layout'
import {
  FiClock, FiActivity, FiFilter, FiSearch, FiChevronRight,
  FiChevronUp, FiAlertCircle, FiCheckCircle, FiXCircle,
  FiDownload, FiRefreshCw, FiCalendar, FiDroplet, FiBarChart2
} from 'react-icons/fi'

const RequestHistory = () => {
  const { currentUser } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [expandedRow, setExpandedRow] = useState(null)
  const [stats, setStats] = useState({ total: 0, pending: 0, fulfilled: 0, cancelled: 0, emergencyCount: 0 })

  useEffect(() => { fetchRequests() }, [currentUser])

  const fetchRequests = async () => {
    if (!currentUser?.uid) return
    setRefreshing(true)
    try {
      const response = await apiService.get(`/requests/my/${currentUser.uid}`)
      const data = response.data || []
      setStats({
        total: data.length,
        pending: data.filter(r => r.status === 'PENDING').length,
        fulfilled: data.filter(r => r.status === 'FULFILLED').length,
        cancelled: data.filter(r => r.status === 'CANCELLED').length,
        emergencyCount: data.filter(r => r.urgency === 'EMERGENCY').length,
      })
      setRequests(data)
    } catch (error) {
      console.error('Error fetching request history:', error)
      setRequests([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredRequests = useMemo(() => {
    let filtered = [...requests]
    if (searchQuery) {
      filtered = filtered.filter(req =>
        req.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.urgency.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (activeFilter !== 'ALL') {
      if (activeFilter === 'URGENT') filtered = filtered.filter(r => r.urgency === 'EMERGENCY')
      else filtered = filtered.filter(r => r.status === activeFilter)
    }
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return filtered
  }, [requests, searchQuery, activeFilter])

  const getStatusConfig = (status) => ({
    PENDING:   { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: <FiClock className="text-yellow-600" size={12} />,      text: 'text-yellow-700' },
    FULFILLED: { bg: 'bg-green-50',  border: 'border-green-200',  icon: <FiCheckCircle className="text-green-600" size={12} />, text: 'text-green-700'  },
    CANCELLED: { bg: 'bg-red-50',    border: 'border-red-200',    icon: <FiXCircle className="text-red-600" size={12} />,       text: 'text-red-700'    },
    MATCHED:   { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: <FiCheckCircle className="text-blue-600" size={12} />,  text: 'text-blue-700'   },
  }[status] || { bg: 'bg-gray-100', border: 'border-gray-200', icon: <FiClock size={12} className="text-gray-500" />, text: 'text-gray-600' })

  const getUrgencyConfig = (urgency) => ({
    EMERGENCY: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    icon: <FiAlertCircle size={11} /> },
    URGENT:    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: <FiClock size={11} /> },
    NORMAL:    { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   icon: <FiClock size={11} /> },
  }[urgency] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: <FiClock size={11} /> })

  const formatDate = (ds) => {
    if (!ds) return '—'
    const d = new Date(ds)
    const diff = Math.ceil(Math.abs(new Date() - d) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 mt-4 text-sm">Loading your request history...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-xl">
                  <FiActivity className="text-red-500 text-2xl" />
                </div>
                Request History
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Track the status of your blood requirements,{' '}
                <span className="font-semibold text-red-500">{currentUser?.name || 'User'}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchRequests}
                disabled={refreshing}
                className="p-3 rounded-xl border border-gray-300 hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => alert('Export feature coming soon!')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 hover:border-red-400 hover:bg-red-50 text-gray-600 hover:text-red-500 font-medium text-sm transition-colors"
              >
                <FiDownload size={15} /> Export
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total',     value: stats.total,          icon: <FiActivity size={18} className="text-blue-500" />,   bg: 'bg-blue-50'   },
              { label: 'Pending',   value: stats.pending,        icon: <FiClock size={18} className="text-yellow-500" />,    bg: 'bg-yellow-50' },
              { label: 'Fulfilled', value: stats.fulfilled,      icon: <FiCheckCircle size={18} className="text-green-500" />, bg: 'bg-green-50' },
              { label: 'Cancelled', value: stats.cancelled,      icon: <FiXCircle size={18} className="text-gray-500" />,    bg: 'bg-gray-100'  },
              { label: 'Emergency', value: stats.emergencyCount, icon: <FiAlertCircle size={18} className="text-red-500" />, bg: 'bg-red-50'    },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                  {card.icon}
                </div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Your Blood Requests</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Showing {filteredRequests.length} of {requests.length} requests
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-400/40 focus:border-red-400 w-48"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FiFilter size={13} className="text-gray-400" />
                  <div className="flex flex-wrap gap-1.5">
                    {['ALL', 'PENDING', 'FULFILLED', 'CANCELLED', 'URGENT'].map(f => (
                      <button key={f} onClick={() => setActiveFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          activeFilter === f ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {f === 'URGENT' ? 'Emergency' : f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Request Details', 'Blood Type', 'Units', 'Urgency', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <FiActivity className="text-4xl text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No requests found</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {searchQuery || activeFilter !== 'ALL'
                            ? 'Try adjusting your filters.'
                            : "You haven't made any blood requests yet."}
                        </p>
                        {(searchQuery || activeFilter !== 'ALL') && (
                          <button onClick={() => { setSearchQuery(''); setActiveFilter('ALL') }}
                            className="mt-3 text-red-500 text-xs font-medium hover:text-red-600">
                            Clear filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : filteredRequests.map(req => {
                    const sc = getStatusConfig(req.status)
                    const uc = getUrgencyConfig(req.urgency)
                    const isExpanded = expandedRow === req.id

                    return (
                      <React.Fragment key={req.id}>
                        <tr
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''}`}
                          onClick={() => setExpandedRow(isExpanded ? null : req.id)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                                <FiCalendar size={14} className="text-red-400" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{formatDate(req.createdAt)}</div>
                                <div className="text-xs text-gray-400">ID: {String(req.id).slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                              <span className="font-bold text-red-600">{req.bloodGroup}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                                <span className="font-bold text-blue-600 text-sm">{req.unitsRequired}</span>
                              </div>
                              <span className="text-xs text-gray-500">Unit{req.unitsRequired > 1 ? 's' : ''}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${uc.bg} ${uc.text} ${uc.border}`}>
                              {uc.icon} {req.urgency}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}>
                              {sc.icon} {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={e => { e.stopPropagation(); setExpandedRow(isExpanded ? null : req.id) }}
                              className="p-1.5 rounded-lg border border-gray-200 hover:border-red-400 hover:bg-red-50 transition-colors"
                            >
                              {isExpanded
                                ? <FiChevronUp size={13} className="text-gray-500" />
                                : <FiChevronRight size={13} className="text-gray-500" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-blue-50/20 border-b border-gray-100">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2">
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Request Details</h4>
                                  <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between"><span>Request ID</span><span className="font-mono font-medium">{String(req.id).slice(0, 8)}...</span></div>
                                    <div className="flex justify-between"><span>Created</span><span className="font-medium">{new Date(req.createdAt).toLocaleString()}</span></div>
                                    <div className="flex justify-between">
                                      <span>Last Updated</span>
                                      <span className="font-medium">{req.updatedAt ? new Date(req.updatedAt).toLocaleString() : 'Never'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Medical Info</h4>
                                  <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between"><span>Blood Group</span><span className="font-bold text-red-600">{req.bloodGroup}</span></div>
                                    <div className="flex justify-between"><span>Units Required</span><span className="font-medium">{req.unitsRequired}</span></div>
                                    <div className="flex justify-between">
                                      <span>Urgency</span>
                                      <span className={`font-medium ${req.urgency === 'EMERGENCY' ? 'text-red-600' : req.urgency === 'URGENT' ? 'text-orange-600' : 'text-blue-600'}`}>
                                        {req.urgency}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Actions</h4>
                                  <div className="space-y-2">
                                    {req.status === 'PENDING' && (
                                      <>
                                        <button onClick={e => e.stopPropagation()}
                                          className="w-full px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium">
                                          Edit Request
                                        </button>
                                        <button onClick={e => e.stopPropagation()}
                                          className="w-full px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium">
                                          Cancel Request
                                        </button>
                                      </>
                                    )}
                                    {req.status === 'FULFILLED' && (
                                      <button onClick={e => e.stopPropagation()}
                                        className="w-full px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium">
                                        View Donor Details
                                      </button>
                                    )}
                                    <button onClick={e => e.stopPropagation()}
                                      className="w-full px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium">
                                      Download Certificate
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

            {/* Table footer */}
            {filteredRequests.length > 0 && (
              <div className="border-t border-gray-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-gray-900">{filteredRequests.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{requests.length}</span> requests
                </p>
                <div className="flex items-center gap-6 text-center">
                  <div><p className="text-lg font-bold text-green-500">{stats.fulfilled}</p><p className="text-xs text-gray-400">Fulfilled</p></div>
                  <div><p className="text-lg font-bold text-yellow-500">{stats.pending}</p><p className="text-xs text-gray-400">Pending</p></div>
                  <div><p className="text-lg font-bold text-red-500">{stats.emergencyCount}</p><p className="text-xs text-gray-400">Emergency</p></div>
                  <div>
                    <p className="text-lg font-bold text-blue-500">
                      {stats.total > 0 ? Math.round((stats.fulfilled / stats.total) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-400">Success Rate</p>
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

export default RequestHistory