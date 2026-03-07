import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import { 
  FiClock, 
  FiMapPin, 
  FiCheckCircle, 
  FiDroplet, 
  FiCalendar,
  FiFilter,
  FiDownload,
  FiTrendingUp,
  FiHeart,
  FiStar,
  FiChevronDown,
  FiChevronUp,
  FiBarChart2,
  FiAward,
  FiRefreshCw
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

    useEffect(() => {
        fetchHistory()
    }, [currentUser])

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

    const calculateStats = useMemo(() => {
        const totalDonations = history.length
        const totalUnits = history.reduce((sum, item) => sum + (item.units || 0), 0)
        const completedDonations = history.filter(item => item.status === 'COMPLETED').length
        const avgUnitsPerDonation = totalDonations > 0 ? (totalUnits / totalDonations).toFixed(1) : 0
        
        // Calculate donation frequency
        const donationsByMonth = {}
        history.forEach(item => {
            const date = new Date(item.donationDate)
            const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`
            donationsByMonth[monthYear] = (donationsByMonth[monthYear] || 0) + 1
        })
        const avgDonationsPerMonth = Object.values(donationsByMonth).length > 0 
            ? (totalDonations / Object.values(donationsByMonth).length).toFixed(1)
            : 0

        return {
            totalDonations,
            totalUnits,
            completedDonations,
            avgUnitsPerDonation,
            avgDonationsPerMonth
        }
    }, [history])

    const filteredAndSortedHistory = useMemo(() => {
        let filtered = [...history]
        
        // Apply filter
        if (activeFilter !== 'ALL') {
            filtered = filtered.filter(item => item.status === activeFilter)
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aVal, bVal
            switch (sortBy) {
                case 'date':
                    aVal = new Date(a.donationDate).getTime()
                    bVal = new Date(b.donationDate).getTime()
                    break
                case 'units':
                    aVal = a.units || 0
                    bVal = b.units || 0
                    break
                case 'location':
                    aVal = (a.request?.hospitalName || '').toLowerCase()
                    bVal = (b.request?.hospitalName || '').toLowerCase()
                    break
                default:
                    aVal = new Date(a.donationDate).getTime()
                    bVal = new Date(b.donationDate).getTime()
            }
            
            return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
        })
        
        return filtered
    }, [history, activeFilter, sortBy, sortOrder])

    const toggleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
        } else {
            setSortBy(column)
            setSortOrder('desc')
        }
    }

    const getStatusConfig = (status) => {
        const configs = {
            'COMPLETED': {
                bg: 'bg-linear-to-r from-green-500 to-green-600',
                text: 'text-green-700',
                icon: <FiCheckCircle />,
                label: 'Completed'
            },
            'SCHEDULED': {
                bg: 'bg-linear-to-r from-blue-500 to-blue-600',
                text: 'text-blue-700',
                icon: <FiCalendar />,
                label: 'Scheduled'
            },
            'CANCELLED': {
                bg: 'bg-linear-to-r from-gray-500 to-gray-600',
                text: 'text-gray-700',
                icon: <FiClock />,
                label: 'Cancelled'
            },
            'PENDING': {
                bg: 'bg-linear-to-r from-yellow-500 to-yellow-600',
                text: 'text-yellow-700',
                icon: <FiClock />,
                label: 'Pending'
            }
        }
        return configs[status] || configs.COMPLETED
    }

    const getDonationType = (type) => {
        const types = {
            'DIRECT_TO_PATIENT': { label: 'Direct to Patient', color: 'bg-red-100 text-red-700', icon: '🩸' },
            'TO_HOSPITAL': { label: 'To Hospital', color: 'bg-blue-100 text-blue-700', icon: '🏥' },
        }
        return types[type] || { label: type || 'Unknown', color: 'bg-gray-100 text-gray-700', icon: '🩸' }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now - date)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const handleExport = () => {
        // In a real app, this would generate a CSV or PDF
        alert('Export feature would generate a PDF/CSV report in a real application')
    }

    if (loading) {
        return (
            <Layout>
                <div className="min-h-[80vh] flex items-center justify-center bg-linear-to-b from-bg-soft to-white">
                    <div className="text-center">
                        <div className="w-20 h-20 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-600 font-medium mt-4 animate-pulse">Loading your donation history...</p>
                    </div>
                </div>
            </Layout>
        )
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
                                        <div className="p-2 bg-linear-to-br from-red-500/10 to-red-600/10 rounded-xl">
                                            <FiHeart className="text-2xl text-red-600" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900">Donation History</h1>
                                            <p className="text-gray-600 mt-1">
                                                A complete log of your life-saving contributions, <span className="font-semibold text-primary">{currentUser?.name || 'Hero'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={fetchHistory}
                                        disabled={refreshing}
                                        className="p-3 rounded-xl border border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-300 disabled:opacity-50"
                                        title="Refresh"
                                    >
                                        <FiRefreshCw className={`text-lg ${refreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={handleExport}
                                        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-300 hover:border-primary hover:bg-primary/5 text-gray-700 hover:text-primary transition-all duration-300 font-medium"
                                    >
                                        <FiDownload />
                                        Export Report
                                    </button>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-red-300 hover:shadow-xl transition-all duration-500 group cursor-pointer">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-linear-to-br from-red-500/10 to-red-600/10">
                                            <FiHeart className="text-xl text-red-600" />
                                        </div>
                                        <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                            Total
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Donations</p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                                                {calculateStats.totalDonations}
                                            </p>
                                            <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                                <FiTrendingUp className="text-green-500" />
                                                {calculateStats.avgDonationsPerMonth} avg/month
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
                                            Units
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Blood Units Donated</p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                                                {calculateStats.totalUnits}
                                            </p>
                                            <p className="text-xs font-medium text-gray-400">
                                                {calculateStats.avgUnitsPerDonation} units/donation
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
                                        <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                            Completed
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Successful Donations</p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                                                {calculateStats.completedDonations}
                                            </p>
                                            <p className="text-xs font-medium text-green-500">
                                                100% success rate
                                            </p>
                                        </div>
                                        <div className="w-2 h-8 bg-linear-to-b from-green-500 to-green-600 rounded-full group-hover:h-12 transition-all duration-500"></div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-yellow-300 hover:shadow-xl transition-all duration-500 group cursor-pointer">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-linear-to-br from-yellow-500/10 to-yellow-600/10">
                                            <FiAward className="text-xl text-yellow-600" />
                                        </div>
                                        <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                            Impact
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Estimated Lives Saved</p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                                                {Math.floor(calculateStats.totalUnits * 3)}
                                            </p>
                                            <p className="text-xs font-medium text-gray-400">
                                                3 lives saved per unit
                                            </p>
                                        </div>
                                        <div className="w-2 h-8 bg-linear-to-b from-yellow-500 to-yellow-600 rounded-full group-hover:h-12 transition-all duration-500"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Controls */}
                    <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-display font-bold text-gray-900 mb-2">Your Donation Records</h2>
                                <p className="text-sm text-gray-500">
                                    Showing {filteredAndSortedHistory.length} of {history.length} donations
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <FiFilter className="text-gray-400" />
                                    <span className="text-sm font-medium text-gray-600">Filter by:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['ALL', 'COMPLETED', 'SCHEDULED', 'CANCELLED', 'PENDING'].map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setActiveFilter(filter)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                                activeFilter === filter
                                                    ? 'bg-linear-to-r from-primary to-primary-dark text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {filter === 'ALL' ? 'All' : filter}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-linear-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                                        <th 
                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer group"
                                            onClick={() => toggleSort('date')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FiCalendar className="text-gray-400" />
                                                <span>Date</span>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {sortBy === 'date' ? (
                                                        sortOrder === 'desc' ? <FiChevronDown /> : <FiChevronUp />
                                                    ) : (
                                                        <FiChevronDown className="text-gray-300" />
                                                    )}
                                                </div>
                                            </div>
                                        </th>
                                        <th 
                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer group"
                                            onClick={() => toggleSort('location')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FiMapPin className="text-gray-400" />
                                                <span>Location</span>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {sortBy === 'location' ? (
                                                        sortOrder === 'desc' ? <FiChevronDown /> : <FiChevronUp />
                                                    ) : (
                                                        <FiChevronDown className="text-gray-300" />
                                                    )}
                                                </div>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <FiDroplet className="text-gray-400" />
                                                <span>Type</span>
                                            </div>
                                        </th>
                                        <th 
                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer group"
                                            onClick={() => toggleSort('units')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FiBarChart2 className="text-gray-400" />
                                                <span>Units</span>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {sortBy === 'units' ? (
                                                        sortOrder === 'desc' ? <FiChevronDown /> : <FiChevronUp />
                                                    ) : (
                                                        <FiChevronDown className="text-gray-300" />
                                                    )}
                                                </div>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Details
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredAndSortedHistory.map((item, index) => {
                                        const statusConfig = getStatusConfig(item.status)
                                        const typeConfig = getDonationType(item.donationType)
                                        const isExpanded = expandedRow === item.id
                                        
                                        return (
                                            <React.Fragment key={item.id}>
                                                <tr 
                                                    className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${
                                                        isExpanded ? 'bg-blue-50/50' : ''
                                                    }`}
                                                    onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-gray-900">
                                                                {formatDate(item.donationDate)}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(item.donationDate).toLocaleTimeString([], { 
                                                                    hour: '2-digit', 
                                                                    minute: '2-digit' 
                                                                })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-linear-to-br from-primary/10 to-primary-dark/10 rounded-lg flex items-center justify-center">
                                                                <FiMapPin className="text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">
                                                                    {item.request?.hospitalName || 'Direct Donation'}
                                                                </div>
                                                                {item.request?.hospitalAddress && (
                                                                    <div className="text-xs text-gray-500">
                                                                        {item.request.hospitalAddress}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{typeConfig.icon}</span>
                                                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${typeConfig.color}`}>
                                                                {typeConfig.label}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative">
                                                                <div className="w-10 h-10 bg-linear-to-br from-red-500/10 to-red-600/10 rounded-full flex items-center justify-center">
                                                                    <span className="font-bold text-red-600">{item.units}</span>
                                                                </div>
                                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                                                    <FiDroplet className="text-[8px] text-white" />
                                                                </div>
                                                            </div>
                                                            <span className="text-sm text-gray-600">
                                                                Unit{item.units > 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg} bg-opacity-10 w-fit`}>
                                                            {statusConfig.icon}
                                                            <span className={`text-xs font-bold ${statusConfig.text}`}>
                                                                {statusConfig.label}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button className="p-2 rounded-lg border border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-300">
                                                            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                                        </button>
                                                    </td>
                                                </tr>
                                                
                                                {/* Expanded Details */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="6" className="px-6 py-4 bg-blue-50/30 animate-fade-in">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
                                                                <div>
                                                                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Donation Details</h4>
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Donation ID:</span>
                                                                            <span className="font-mono text-sm font-medium">{item.id.slice(0, 8)}...</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Duration:</span>
                                                                            <span className="font-medium">45 minutes</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Hemoglobin Level:</span>
                                                                            <span className="font-medium text-green-600">14.2 g/dL</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div>
                                                                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Health Metrics</h4>
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Blood Pressure:</span>
                                                                            <span className="font-medium">120/80 mmHg</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Temperature:</span>
                                                                            <span className="font-medium">98.6°F</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Pulse Rate:</span>
                                                                            <span className="font-medium">72 bpm</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div>
                                                                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Impact</h4>
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Lives Potentially Saved:</span>
                                                                            <span className="font-medium text-red-600">{item.units * 3} people</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-500">Next Eligible Date:</span>
                                                                            <span className="font-medium">
                                                                                {new Date(new Date(item.donationDate).setDate(new Date(item.donationDate).getDate() + 56))
                                                                                    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                            </span>
                                                                        </div>
                                                                        <button className="w-full mt-2 px-4 py-2 bg-linear-to-r from-primary/10 to-primary-dark/10 text-primary rounded-lg hover:from-primary/20 hover:to-primary-dark/20 transition-all duration-300 text-sm font-medium">
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
                        
                        {filteredAndSortedHistory.length === 0 && (
                            <div className="p-16 text-center">
                                <div className="w-24 h-24 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FiHeart className="text-3xl text-gray-400" />
                                </div>
                                <p className="text-gray-600 font-semibold text-lg mb-2">No donations found</p>
                                <p className="text-gray-400 max-w-md mx-auto mb-6">
                                    {activeFilter === 'ALL' 
                                        ? "You haven't made any donations yet. Your first donation could save up to 3 lives!"
                                        : `No ${activeFilter.toLowerCase()} donations found`}
                                </p>
                                {activeFilter !== 'ALL' && (
                                    <button
                                        onClick={() => setActiveFilter('ALL')}
                                        className="text-primary hover:text-primary-dark font-medium flex items-center gap-2 mx-auto"
                                    >
                                        View all donations <FiChevronRight />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Footer Stats */}
                    {filteredAndSortedHistory.length > 0 && (
                        <div className="mt-8 p-6 bg-linear-to-r from-primary/5 to-primary-dark/5 rounded-2xl border border-primary/20">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-linear-to-br from-primary/20 to-primary-dark/20 rounded-lg">
                                        <FiStar className="text-xl text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Your donation streak</p>
                                        <p className="text-xl font-bold text-gray-900">3 consecutive months</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-primary">{calculateStats.totalDonations}</p>
                                        <p className="text-xs text-gray-500">Total Donations</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-600">{calculateStats.totalUnits}</p>
                                        <p className="text-xs text-gray-500">Units Donated</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">{calculateStats.totalUnits * 3}</p>
                                        <p className="text-xs text-gray-500">Lives Impacted</p>
                                    </div>
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