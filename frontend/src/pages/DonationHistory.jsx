import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import {
  FiClock, FiMapPin, FiCheckCircle, FiDroplet, FiCalendar,
  FiFilter, FiDownload, FiHeart, FiStar, FiChevronDown,
  FiChevronUp, FiChevronRight, FiBarChart2, FiAward, FiRefreshCw
} from 'react-icons/fi'
import { apiService } from '../services/api.service'

const DonationHistory = () => {
  const { currentUser } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [expandedRow, setExpandedRow] = useState(null)

  useEffect(() => { fetchHistory() }, [currentUser])

  const fetchHistory = async () => {
    if (!currentUser?.uid) return
    setRefreshing(true)
    try {
      const response = await apiService.get(`/donations/donor/${currentUser.uid}`)
      setHistory(response.data || [])
    } catch (error) {
      console.error('Error fetching donation history:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const stats = useMemo(() => {
    const totalDonations = history.length
    const totalUnits = history.reduce((sum, item) => sum + (item.units || 0), 0)
    const completedDonations = history.filter(item => item.status === 'COMPLETED').length
    const avgUnitsPerDonation = totalDonations > 0 ? (totalUnits / totalDonations).toFixed(1) : 0
    const byMonth = {}
    history.forEach(item => {
      const d = new Date(item.donationDate)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      byMonth[key] = (byMonth[key] || 0) + 1
    })
    const avgPerMonth = Object.keys(byMonth).length > 0
      ? (totalDonations / Object.keys(byMonth).length).toFixed(1) : 0
    return { totalDonations, totalUnits, completedDonations, avgUnitsPerDonation, avgPerMonth }
  }, [history])

  const filteredAndSorted = useMemo(() => {
    let filtered = [...history]
    if (activeFilter !== 'ALL') filtered = filtered.filter(i => i.status === activeFilter)
    filtered.sort((a, b) => {
      const aVal = sortBy === 'units' ? (a.units || 0) : new Date(a.donationDate).getTime()
      const bVal = sortBy === 'units' ? (b.units || 0) : new Date(b.donationDate).getTime()
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
    })
    return filtered
  }, [history, activeFilter, sortBy, sortOrder])

  const toggleSort = (col) => {
    if (sortBy === col) setSortOrder(o => o === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortOrder('desc') }
  }

  const getStatusConfig = (status) => {
    const map = {
      COMPLETED: { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  icon: <FiCheckCircle size={11} />, label: 'Completed' },
      SCHEDULED: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   icon: <FiCalendar size={11} />,   label: 'Scheduled' },
      CANCELLED: { bg: 'bg-gray-100',  text: 'text-gray-600',   border: 'border-gray-200',   icon: <FiClock size={11} />,      label: 'Cancelled' },
      PENDING:   { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: <FiClock size={11} />,      label: 'Pending'   },
    }
    return map[status] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', icon: <FiClock size={11} />, label: status || 'Unknown' }
  }

  const formatDate = (ds) => {
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
            <p className="text-gray-500 mt-4 text-sm">Loading your donation history...</p>
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
                  <FiHeart className="text-red-500 text-2xl" />
                </div>
                Donation History
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                A complete log of your life-saving contributions,{' '}
                <span className="font-semibold text-red-500">{currentUser?.name || 'Hero'}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchHistory}
                disabled={refreshing}
                className="p-3 rounded-xl border border-gray-300 hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => alert('Export feature coming soon!')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 hover:border-red-400 hover:bg-red-50 text-gray-600 hover:text-red-500 font-medium text-sm transition-colors"
              >
                <FiDownload size={15} /> Export Report
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Donations', value: stats.totalDonations, sub: `${stats.avgPerMonth} avg/month`, icon: <FiHeart className="text-red-500" />, bg: 'bg-red-50' },
              { label: 'Units Donated', value: stats.totalUnits, sub: `${stats.avgUnitsPerDonation} per donation`, icon: <FiDroplet className="text-blue-500" />, bg: 'bg-blue-50' },
              { label: 'Successful', value: stats.completedDonations, sub: 'Completed donations', icon: <FiCheckCircle className="text-green-500" />, bg: 'bg-green-50' },
              { label: 'Lives Impacted', value: stats.totalUnits * 3, sub: '3 lives per unit', icon: <FiAward className="text-yellow-500" />, bg: 'bg-yellow-50' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
                  {card.icon}
                </div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Your Donation Records</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Showing {filteredAndSorted.length} of {history.length} donations
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <FiFilter size={14} className="text-gray-400" />
                {['ALL', 'COMPLETED', 'SCHEDULED', 'CANCELLED', 'PENDING'].map(f => (
                  <button key={f} onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeFilter === f ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {f === 'ALL' ? 'All' : f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button onClick={() => toggleSort('date')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700">
                        <FiCalendar size={11} /> Date
                        {sortBy === 'date'
                          ? (sortOrder === 'desc' ? <FiChevronDown size={11} /> : <FiChevronUp size={11} />)
                          : <FiChevronDown size={11} className="text-gray-300" />}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="px-6 py-3 text-left">
                      <button onClick={() => toggleSort('units')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700">
                        <FiBarChart2 size={11} /> Units
                        {sortBy === 'units'
                          ? (sortOrder === 'desc' ? <FiChevronDown size={11} /> : <FiChevronUp size={11} />)
                          : <FiChevronDown size={11} className="text-gray-300" />}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAndSorted.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <FiHeart className="text-4xl text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No donations found</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {activeFilter === 'ALL'
                            ? "You haven't donated yet. Your first donation could save 3 lives!"
                            : `No ${activeFilter.toLowerCase()} donations found`}
                        </p>
                        {activeFilter !== 'ALL' && (
                          <button onClick={() => setActiveFilter('ALL')} className="mt-3 text-red-500 text-xs font-medium flex items-center gap-1 mx-auto hover:text-red-600">
                            View all <FiChevronRight size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : filteredAndSorted.map((item) => {
                    const sc = getStatusConfig(item.status)
                    const isExpanded = expandedRow === item.id
                    const donationType = item.donationType === 'TO_HOSPITAL'
                      ? { label: 'To Hospital', color: 'bg-blue-100 text-blue-700', icon: '🏥' }
                      : { label: 'Direct', color: 'bg-red-100 text-red-700', icon: '🩸' }

                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''}`}
                          onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{formatDate(item.donationDate)}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(item.donationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                                <FiMapPin size={13} className="text-red-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{item.request?.hospitalName || 'Direct Donation'}</div>
                                {item.request?.hospitalAddress && (
                                  <div className="text-xs text-gray-400">{item.request.hospitalAddress}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${donationType.color}`}>
                              {donationType.icon} {donationType.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                                <span className="font-bold text-red-600 text-sm">{item.units}</span>
                              </div>
                              <span className="text-xs text-gray-500">Unit{item.units > 1 ? 's' : ''}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}>
                              {sc.icon} {sc.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button className="p-1.5 rounded-lg border border-gray-200 hover:border-red-400 hover:bg-red-50 transition-colors">
                              {isExpanded
                                ? <FiChevronUp size={13} className="text-gray-500" />
                                : <FiChevronDown size={13} className="text-gray-500" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-blue-50/20 border-b border-gray-100">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2">
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Donation Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                      <span>Donation ID</span>
                                      <span className="font-mono font-medium">{String(item.id).slice(0, 8)}...</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                      <span>Duration</span><span className="font-medium">~45 minutes</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                      <span>Hemoglobin</span><span className="font-medium text-green-600">14.2 g/dL</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Health Metrics</h4>
                                  <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between"><span>Blood Pressure</span><span className="font-medium">120/80 mmHg</span></div>
                                    <div className="flex justify-between"><span>Temperature</span><span className="font-medium">98.6°F</span></div>
                                    <div className="flex justify-between"><span>Pulse Rate</span><span className="font-medium">72 bpm</span></div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Impact</h4>
                                  <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                      <span>Lives Saved</span>
                                      <span className="font-medium text-red-500">{(item.units || 1) * 3} people</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Next Eligible</span>
                                      <span className="font-medium">
                                        {new Date(new Date(item.donationDate).setDate(new Date(item.donationDate).getDate() + 56))
                                          .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>
                                    <button className="w-full mt-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium">
                                      View Certificate
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
          </div>

          {/* Footer summary */}
          {filteredAndSorted.length > 0 && (
            <div className="p-6 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <FiStar className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Your donation impact</p>
                    <p className="text-lg font-bold text-gray-900">Keep saving lives! 🩸</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-center">
                  <div><p className="text-xl font-bold text-red-500">{stats.totalDonations}</p><p className="text-xs text-gray-400">Donations</p></div>
                  <div><p className="text-xl font-bold text-blue-500">{stats.totalUnits}</p><p className="text-xs text-gray-400">Units</p></div>
                  <div><p className="text-xl font-bold text-green-500">{stats.totalUnits * 3}</p><p className="text-xs text-gray-400">Lives</p></div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}

export default DonationHistory