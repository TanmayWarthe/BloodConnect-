/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'
import {
  FiDroplet, FiFilter, FiRefreshCw, FiMapPin, FiUser,
  FiPhone, FiX, FiLoader, FiAlertCircle
} from 'react-icons/fi'

const BLOOD_GROUPS = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const BLOOD_COLORS = {
  'A+':  '#ef4444', 'A-':  '#f97316',
  'B+':  '#3b82f6', 'B-':  '#6366f1',
  'AB+': '#8b5cf6', 'AB-': '#ec4899',
  'O+':  '#10b981', 'O-':  '#14b8a6',
}

// ── Donor Info Panel ────────────────────────────────────────────
const DonorPanel = ({ donor, onClose }) => {
  if (!donor) return null

  return (
    <div className="absolute top-4 right-4 z-10 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      <div className="bg-linear-to-r from-red-500 to-red-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
            {donor.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-sm">{donor.name || 'Anonymous Donor'}</p>
            <p className="text-xs text-white/80 capitalize">{donor.availability ? 'Available' : 'Unavailable'}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <FiX size={16} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Blood Type</span>
          <span
            className="px-3 py-1 rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: BLOOD_COLORS[donor.bloodGroup] || '#ef4444' }}
          >
            {donor.bloodGroup}
          </span>
        </div>

        {donor.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiMapPin size={13} className="text-gray-400 shrink-0" />
            <span>{donor.city}{donor.state ? `, ${donor.state}` : ''}</span>
          </div>
        )}

        {donor.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiPhone size={13} className="text-gray-400 shrink-0" />
            <span>{donor.phone}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Total Donations</span>
          <span className="font-semibold text-gray-900">{donor.totalDonations || 0}</span>
        </div>

        <div className="pt-2">
          <div className={`w-full text-center py-2 rounded-xl text-xs font-semibold border ${
            donor.availability
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            {donor.availability ? '✓ Available to Donate' : '✗ Currently Unavailable'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main BloodMap ────────────────────────────────────────────────
const BloodMap = () => {
  const { currentUser } = useAuth()
  const mapRef       = useRef(null)
  const mapInstance  = useRef(null)
  const markersRef   = useRef([])
  const infoWindowRef = useRef(null)

  const [donors, setDonors]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)
  const [mapLoaded, setMapLoaded]       = useState(false)
  const [selectedDonor, setSelectedDonor] = useState(null)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [mapError, setMapError]         = useState(false)
  const [stats, setStats]               = useState({ total: 0, available: 0 })

  // ── Load Google Maps ─────────────────────────────────────────
  useEffect(() => {
    if (window.google?.maps) { setMapLoaded(true); return }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) { setMapError(true); setLoading(false); return }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload  = () => setMapLoaded(true)
    script.onerror = () => { setMapError(true); setLoading(false) }
    document.head.appendChild(script)

    return () => { if (document.head.contains(script)) document.head.removeChild(script) }
  }, [])

  // ── Init map ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstance.current) return

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 20.5937, lng: 78.9629 }, // India center
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    })

    infoWindowRef.current = new window.google.maps.InfoWindow()
  }, [mapLoaded])

  // ── Fetch donors ─────────────────────────────────────────────
  const fetchDonors = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await apiService.get('/donors')
      const data = res.data || []
      setDonors(data)
      setStats({
        total:     data.length,
        available: data.filter(d => d.availability).length,
      })
    } catch (err) {
      console.error('Failed to fetch donors:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchDonors() }, [fetchDonors])

  // ── Render markers ───────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !window.google?.maps) return

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    const filtered = activeFilter === 'ALL'
      ? donors
      : donors.filter(d => d.bloodGroup === activeFilter)

    filtered.forEach(donor => {
      if (!donor.latitude || !donor.longitude) return

      const color  = BLOOD_COLORS[donor.bloodGroup] || '#ef4444'
      const isAvail = donor.availability

      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(donor.latitude), lng: parseFloat(donor.longitude) },
        map: mapInstance.current,
        title: donor.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: isAvail ? 1 : 0.4,
          strokeColor: '#fff',
          strokeWeight: 2,
          scale: isAvail ? 10 : 7,
        },
        animation: isAvail ? window.google.maps.Animation.DROP : null,
      })

      marker.addListener('click', () => {
        setSelectedDonor(donor)
        mapInstance.current.panTo(marker.getPosition())
        mapInstance.current.setZoom(12)
      })

      markersRef.current.push(marker)
    })
  }, [donors, activeFilter, mapLoaded])

  // ── Map error fallback ───────────────────────────────────────
  if (mapError) {
    return (
      <div className="h-full rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm p-8">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-red-400 text-2xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Map Unavailable</h3>
          <p className="text-sm text-gray-500 mb-4">
            Google Maps API key is missing. Add <code className="bg-gray-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your <code className="bg-gray-100 px-1 rounded">.env.local</code> file.
          </p>
          <div className="mt-4 p-3 bg-gray-100 rounded-xl text-left text-xs text-gray-600 font-mono">
            VITE_GOOGLE_MAPS_API_KEY=your_key_here
          </div>

          {/* Fallback donor list */}
          {donors.length > 0 && (
            <div className="mt-6 text-left">
              <p className="text-sm font-semibold text-gray-700 mb-3">{donors.length} donors in system:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {donors.filter(d => activeFilter === 'ALL' || d.bloodGroup === activeFilter).slice(0, 10).map(d => (
                  <div key={d.uid} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-700">{d.name || 'Anonymous'}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: BLOOD_COLORS[d.bloodGroup] }}>
                      {d.bloodGroup}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">

      {/* ── Controls ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-sm">
            <FiUser size={13} className="text-gray-400" />
            <span className="font-semibold text-gray-900">{stats.total}</span>
            <span className="text-gray-500">donors</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-semibold text-green-700">{stats.available}</span>
            <span className="text-green-600">available</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={fetchDonors} disabled={refreshing}
            className="p-2 rounded-xl border border-gray-200 hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-50">
            <FiRefreshCw size={15} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              if (mapInstance.current) {
                mapInstance.current.setCenter({ lat: 20.5937, lng: 78.9629 })
                mapInstance.current.setZoom(5)
              }
              setSelectedDonor(null)
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:border-red-400 hover:bg-red-50 text-sm text-gray-600 hover:text-red-500 transition-colors"
          >
            <FiMapPin size={13} /> Reset View
          </button>
        </div>
      </div>

      {/* Blood type filter */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <FiFilter size={13} className="text-gray-400 shrink-0" />
        {BLOOD_GROUPS.map(group => (
          <button key={group} onClick={() => setActiveFilter(group)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === group
                ? 'text-white shadow-sm scale-105'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            style={activeFilter === group ? { backgroundColor: group === 'ALL' ? '#ef4444' : BLOOD_COLORS[group] } : {}}
          >
            {group === 'ALL' ? 'All Types' : group}
          </button>
        ))}
      </div>

      {/* ── Map container ─────────────────────────────────────── */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm min-h-100">
        {/* Loading overlay */}
        {(loading || !mapLoaded) && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">{!mapLoaded ? 'Loading map...' : 'Fetching donors...'}</p>
            </div>
          </div>
        )}

        {/* Google Map mount point */}
        <div ref={mapRef} className="w-full h-full" />

        {/* Donor detail panel */}
        <DonorPanel donor={selectedDonor} onClose={() => setSelectedDonor(null)} />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Legend</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              Available donor
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0" />
              Unavailable donor
            </div>
          </div>
        </div>

        {/* No donors message */}
        {!loading && mapLoaded && donors.filter(d => activeFilter === 'ALL' || d.bloodGroup === activeFilter).length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 shadow-xl border border-gray-200 text-center pointer-events-none">
            <FiDroplet className="text-gray-300 text-3xl mx-auto mb-2" />
            <p className="font-semibold text-gray-600 text-sm">No donors found</p>
            <p className="text-xs text-gray-400 mt-1">
              {activeFilter !== 'ALL' ? `No ${activeFilter} donors in this area` : 'No registered donors yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BloodMap