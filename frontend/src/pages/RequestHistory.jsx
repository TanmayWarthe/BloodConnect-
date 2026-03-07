import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'
import Layout from '../components/Layout'
import {
    FiClock,
    FiActivity,
    FiFilter,
    FiSearch,
    FiChevronRight,
    FiChevronUp,
    FiAlertCircle,
    FiCheckCircle,
    FiXCircle,
    FiDownload,
    FiRefreshCw,
    FiEye,
    FiCalendar,
    FiMapPin,
    FiDroplet,
    FiTrendingUp,
    FiBarChart2
} from 'react-icons/fi'

const RequestHistory = () => {
    const { currentUser } = useAuth()
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('ALL')
    const [expandedRow, setExpandedRow] = useState(null)
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        fulfilled: 0,
        cancelled: 0,
        emergencyCount: 0
    })

    useEffect(() => {
        fetchRequests()
    }, [currentUser])

    const fetchRequests = async () => {
        if (!currentUser?.uid) return

        setRefreshing(true)
        try {
            const response = await apiService.get(`/requests/my/${currentUser.uid}`)
            const data = response.data || []

            // Calculate stats
            const total = data.length
            const pending = data.filter(r => r.status === 'PENDING').length
            const fulfilled = data.filter(r => r.status === 'FULFILLED').length
            const cancelled = data.filter(r => r.status === 'CANCELLED').length
            const emergencyCount = data.filter(r => r.urgency === 'EMERGENCY').length

            setStats({ total, pending, fulfilled, cancelled, emergencyCount })
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

        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(req =>
                req.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
                req.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
                req.urgency.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Apply filter
        if (activeFilter !== 'ALL') {
            if (activeFilter === 'URGENT') {
                filtered = filtered.filter(req => req.urgency === 'EMERGENCY')
            } else {
                filtered = filtered.filter(req => req.status === activeFilter)
            }
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        return filtered
    }, [requests, searchQuery, activeFilter])

    const getStatusConfig = (status) => {
        const configs = {
            'PENDING': {
                color: 'yellow',
                bg: 'bg-yellow-50',
                border: 'border-yellow-100',
                icon: <FiClock className="text-yellow-600" />,
                text: 'text-yellow-700'
            },
            'FULFILLED': {
                color: 'green',
                bg: 'bg-green-50',
                border: 'border-green-100',
                icon: <FiCheckCircle className="text-green-600" />,
                text: 'text-green-700'
            },
            'CANCELLED': {
                color: 'red',
                bg: 'bg-red-50',
                border: 'border-red-100',
                icon: <FiXCircle className="text-red-600" />,
                text: 'text-red-700'
            },
            'MATCHED': {
                color: 'blue',
                bg: 'bg-blue-50',
                border: 'border-blue-100',
                icon: <FiCheckCircle className="text-blue-600" />,
                text: 'text-blue-700'
            }
        }
        return configs[status] || configs.PENDING
    }

    const getUrgencyConfig = (urgency) => {
        const configs = {
            'EMERGENCY': {
                color: 'from-red-500 to-red-600',
                bg: 'bg-red-50',
                text: 'text-red-700',
                icon: <FiAlertCircle />
            },
            'URGENT': {
                color: 'from-orange-500 to-orange-600',
                bg: 'bg-orange-50',
                text: 'text-orange-700',
                icon: <FiClock />
            },
            'NORMAL': {
                color: 'from-blue-500 to-blue-600',
                bg: 'bg-blue-50',
                text: 'text-blue-700',
                icon: <FiClock />
            }
        }
        return configs[urgency] || configs.NORMAL
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
                        <p className="text-gray-600 font-medium mt-4 animate-pulse">Loading your request history...</p>
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
                        <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/10 rounded-full blur-3xl"></div>

                        <div className="relative">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-2">Request History</h1>
                                    <p className="text-gray-600">
                                        Track the status of your blood requirements, <span className="font-semibold text-primary">{currentUser?.name || 'User'}</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={fetchRequests}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-500 group cursor-pointer">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-linear-to-br from-primary/10 to-primary-dark/10">
                                            <FiActivity className="text-xl text-primary" />
                                        </div>
                                        <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                            Total
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Requests</p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                                                {stats.total}
                                            </p>
                                            <p className="text-xs font-medium text-gray-400">
                                                All time requests
                                            </p>
                                        </div>
                                        <div className="w-2 h-8 bg-linear-to-b from-primary to-primary-dark rounded-full group-hover:h-12 transition-all duration-500"></div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-yellow-300 hover:shadow-xl transition-all duration-500 group cursor-pointer">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-linear-to-br from-yellow-500/10 to-yellow-600/10">
                                            <FiClock className="text-xl text-yellow-600" />
                                        </div>
                                        <div className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-600">
                                            Pending
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Pending</p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                                                {stats.pending}
                                            </p>
                                            <p className="text-xs font-medium text-gray-400">
                                                Awaiting fulfillment
                                            </p>
                                        </div>
                                        <div className="w-2 h-8 bg-linear-to-b from-yellow-500 to-yellow-600 rounded-full group-hover:h-12 transition-all duration-500"></div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-xl transition-all duration-500 group cursor-pointer">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-linear-to-br from-green-500/10 to-green-600/10">
                                            <FiCheckCircle className="text-xl text-green-600" />
                                        </div>
                                        <div className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-600">
                                            Fulfilled
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Fulfilled</p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                                                {stats.fulfilled}
                                            </p>
                                            <p className="text-xs font-medium text-gray-400">
                                                Successfully matched
                                            </p>
                                        </div>
                                        <div className="w-2 h-8 bg-linear-to-b from-green-500 to-green-600 rounded-full group-hover:h-12 transition-all duration-500"></div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-red-300 hover:shadow-xl transition-all duration-500 group cursor-pointer">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-linear-to-br from-red-500/10 to-red-600/10">
                                            <FiAlertCircle className="text-xl text-red-600" />
                                        </div>
                                        <div className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-600">
                                            Emergency
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Emergency</p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                                                {stats.emergencyCount}
                                            </p>
                                            <p className="text-xs font-medium text-gray-400">
                                                Urgent requests
                                            </p>
                                        </div>
                                        <div className="w-2 h-8 bg-linear-to-b from-red-500 to-red-600 rounded-full group-hover:h-12 transition-all duration-500"></div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-500 group cursor-pointer">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-linear-to-br from-gray-500/10 to-gray-600/10">
                                            <FiBarChart2 className="text-xl text-gray-600" />
                                        </div>
                                        <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                            Rate
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Success Rate</p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                                                {stats.total > 0 ? Math.round((stats.fulfilled / stats.total) * 100) : 0}%
                                            </p>
                                            <p className="text-xs font-medium text-gray-400">
                                                Requests fulfilled
                                            </p>
                                        </div>
                                        <div className="w-2 h-8 bg-linear-to-b from-gray-500 to-gray-600 rounded-full group-hover:h-12 transition-all duration-500"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-display font-bold text-gray-900 mb-2">Your Blood Requests</h2>
                                <p className="text-sm text-gray-500">
                                    Showing {filteredRequests.length} of {requests.length} requests
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <div className="relative flex-1 min-w-[200px]">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search requests..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <FiFilter className="text-gray-400" />
                                    <div className="flex flex-wrap gap-2">
                                        {['ALL', 'PENDING', 'FULFILLED', 'CANCELLED', 'URGENT'].map(filter => (
                                            <button
                                                key={filter}
                                                onClick={() => setActiveFilter(filter)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${activeFilter === filter
                                                    ? 'bg-linear-to-r from-primary to-primary-dark text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {filter === 'URGENT' ? 'Emergency' : filter}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Requests Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-linear-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Request Details</th>
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
                                                <div className="w-24 h-24 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <FiActivity className="text-3xl text-gray-400" />
                                                </div>
                                                <p className="text-gray-600 font-semibold text-lg mb-2">No requests found</p>
                                                <p className="text-gray-400 max-w-md mx-auto mb-6">
                                                    {searchQuery || activeFilter !== 'ALL'
                                                        ? 'No matching requests found. Try adjusting your filters.'
                                                        : "You haven't made any blood requests yet. Create your first request to get started."}
                                                </p>
                                                {(searchQuery || activeFilter !== 'ALL') && (
                                                    <button
                                                        onClick={() => {
                                                            setSearchQuery('')
                                                            setActiveFilter('ALL')
                                                        }}
                                                        className="text-primary hover:text-primary-dark font-medium flex items-center gap-2 mx-auto"
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map((req) => {
                                            const statusConfig = getStatusConfig(req.status)
                                            const urgencyConfig = getUrgencyConfig(req.urgency)
                                            const isExpanded = expandedRow === req.id

                                            return (
                                                <React.Fragment key={req.id}>
                                                    <tr
                                                        className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50' : ''
                                                            }`}
                                                        onClick={() => setExpandedRow(isExpanded ? null : req.id)}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-linear-to-br from-primary/10 to-primary-dark/10 rounded-lg flex items-center justify-center">
                                                                    <FiCalendar className="text-primary" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-gray-900">
                                                                        {formatDate(req.createdAt)}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Request ID: {String(req.id).slice(0, 8)}...
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-10 h-10 bg-linear-to-br from-red-500/10 to-red-600/10 rounded-lg flex items-center justify-center">
                                                                    <span className="font-bold text-red-600 text-lg">{req.bloodGroup}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative">
                                                                    <div className="w-10 h-10 bg-linear-to-br from-primary/10 to-primary-dark/10 rounded-full flex items-center justify-center">
                                                                        <span className="font-bold text-primary">{req.unitsRequired}</span>
                                                                    </div>
                                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                                                        <FiDroplet className="text-[8px] text-white" />
                                                                    </div>
                                                                </div>
                                                                <span className="text-sm text-gray-600">
                                                                    Unit{req.unitsRequired > 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${urgencyConfig.bg} border ${urgencyConfig.bg.replace('bg-', 'border-')} w-fit`}>
                                                                {urgencyConfig.icon}
                                                                <span className={`text-xs font-bold ${urgencyConfig.text}`}>
                                                                    {req.urgency}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg} border ${statusConfig.border} w-fit`}>
                                                                {statusConfig.icon}
                                                                <span className={`text-xs font-bold ${statusConfig.text}`}>
                                                                    {req.status}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setExpandedRow(isExpanded ? null : req.id)
                                                                }}
                                                                className="p-2 rounded-lg border border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-300"
                                                            >
                                                                {isExpanded ? <FiChevronUp /> : <FiChevronRight />}
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Details */}
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan="6" className="px-6 py-4 bg-blue-50/30 animate-fade-in">
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
                                                                    <div>
                                                                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Request Details</h4>
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-500">Request ID:</span>
                                                                                <span className="font-mono text-sm font-medium">{String(req.id).slice(0, 8)}...</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-500">Created:</span>
                                                                                <span className="font-medium">{new Date(req.createdAt).toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-500">Last Updated:</span>
                                                                                <span className="font-medium">
                                                                                    {req.updatedAt ? new Date(req.updatedAt).toLocaleString() : 'Never'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Medical Information</h4>
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-500">Blood Group:</span>
                                                                                <span className="font-bold text-red-600">{req.bloodGroup}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-500">Units Required:</span>
                                                                                <span className="font-medium">{req.unitsRequired}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-500">Urgency Level:</span>
                                                                                <span className={`font-medium ${req.urgency === 'EMERGENCY' ? 'text-red-600' :
                                                                                    req.urgency === 'URGENT' ? 'text-orange-600' :
                                                                                        'text-blue-600'
                                                                                    }`}>
                                                                                    {req.urgency}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Actions</h4>
                                                                        <div className="space-y-2">
                                                                            {req.status === 'PENDING' && (
                                                                                <>
                                                                                    <button className="w-full px-4 py-2 bg-linear-to-r from-primary/10 to-primary-dark/10 text-primary rounded-lg hover:from-primary/20 hover:to-primary-dark/20 transition-all duration-300 text-sm font-medium">
                                                                                        Edit Request
                                                                                    </button>
                                                                                    <button className="w-full px-4 py-2 bg-linear-to-r from-red-500/10 to-red-600/10 text-red-600 rounded-lg hover:from-red-500/20 hover:to-red-600/20 transition-all duration-300 text-sm font-medium">
                                                                                        Cancel Request
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                            {req.status === 'FULFILLED' && (
                                                                                <button className="w-full px-4 py-2 bg-linear-to-r from-green-500/10 to-green-600/10 text-green-600 rounded-lg hover:from-green-500/20 hover:to-green-600/20 transition-all duration-300 text-sm font-medium">
                                                                                    View Donor Details
                                                                                </button>
                                                                            )}
                                                                            <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 text-sm font-medium">
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
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Footer */}
                        {filteredRequests.length > 0 && (
                            <div className="border-t border-gray-100 p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="text-sm text-gray-500">
                                        Showing <span className="font-semibold text-gray-900">{filteredRequests.length}</span> of{' '}
                                        <span className="font-semibold text-gray-900">{requests.length}</span> requests
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-primary">{stats.fulfilled}</div>
                                            <div className="text-xs text-gray-500">Fulfilled</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
                                            <div className="text-xs text-gray-500">Pending</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-red-600">{stats.emergencyCount}</div>
                                            <div className="text-xs text-gray-500">Emergency</div>
                                        </div>
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