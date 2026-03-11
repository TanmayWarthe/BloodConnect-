import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'
import {
  FiDroplet, FiFilter, FiRefreshCw, FiMapPin, FiUser,
  FiPhone, FiX, FiAlertCircle, FiNavigation, FiHeart,
  FiClock, FiTrendingUp, FiSearch
} from 'react-icons/fi'

const BLOOD_GROUPS = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const BLOOD_COLORS = {
  'A+': '#ef4444', 'A-': '#f97316',
  'B+': '#3b82f6', 'B-': '#6366f1',
  'AB+': '#8b5cf6', 'AB-': '#ec4899',
  'O+': '#10b981', 'O-': '#14b8a6',
}

// Haversine formula — distance in km between two lat/lng points
const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Donor Card ───────────────────────────────────────────────────
const DonorCard = ({ donor, userLocation, onLocate }) => {
  const dist = userLocation && donor.latitude && donor.longitude
    ? getDistance(userLocation.lat, userLocation.lng, parseFloat(donor.latitude), parseFloat(donor.longitude)).toFixed(1)
    : null

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-sm"
            style={{ backgroundColor: BLOOD_COLORS[donor.bloodGroup] || '#ef4444' }}>
            {donor.bloodGroup}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-gray-900 truncate">{donor.name || 'Anonymous'}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                donor.availabilityStatus === 'AVAILABLE'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {donor.availabilityStatus === 'AVAILABLE' ? 'Available' : 'Busy'}
              </span>
            </div>
            {dist && (
              <div className="flex items-center gap-1 mt-1">
                <FiMapPin size={10} className="text-red-400" />
                <span className="text-xs text-gray-400 font-medium">{dist} km away</span>
              </div>
            )}
            {donor.phone && (
              <div className="flex items-center gap-1 mt-0.5">
                <FiPhone size={10} className="text-gray-300" />
                <span className="text-xs text-gray-400">{donor.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {donor.latitude && donor.longitude && (
        <button onClick={() => onLocate(donor)}
          className="w-full py-2 border-t border-gray-50 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
          <FiNavigation size={11} /> Show on Map
        </button>
      )}
    </div>
  )
}

// ── Main BloodMap ────────────────────────────────────────────────
const BloodMap = () => {
  const { currentUser } = useAuth()
  const mapRef      = useRef(null)
  const leafletRef  = useRef(null)
  const markersRef  = useRef([])
  const userMarkerRef = useRef(null)
  const circleRef   = useRef(null)

  const [donors, setDonors]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)
  const [mapReady, setMapReady]           = useState(false)
  const [selectedDonor, setSelectedDonor] = useState(null)
  const [activeFilter, setActiveFilter]   = useState('ALL')
  const [userLocation, setUserLocation]   = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError]  = useState('')
  const [searchRadius, setSearchRadius]   = useState(50) // km
  const [sidebarOpen, setSidebarOpen]     = useState(true)

  // ── Load Leaflet CSS + JS ────────────────────────────────────
  useEffect(() => {
    // Add Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id   = 'leaflet-css'
      link.rel  = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load Leaflet JS
    if (window.L) { initMap(); return }
    const script = document.createElement('script')
    script.src   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => initMap()
    document.head.appendChild(script)
  }, [])

  const initMap = () => {
    if (!mapRef.current || leafletRef.current) return
    const L = window.L

    const map = L.map(mapRef.current, {
      center: [20.5937, 78.9629], // India center
      zoom: 5,
      zoomControl: true,
    })

    // OpenStreetMap tiles — completely free
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    leafletRef.current = map
    setMapReady(true)
  }

  // ── Fetch donors ─────────────────────────────────────────────
  const fetchDonors = useCallback(async () => {
    setRefreshing(true)
    try {
      const res  = await apiService.get('/donors')
      setDonors(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchDonors() }, [fetchDonors])

  // ── Get user's real location ─────────────────────────────────
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser')
      return
    }
    setLocationLoading(true); setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setLocationLoading(false)

        if (!leafletRef.current) return
        const L = window.L

        // Remove old user marker + circle
        if (userMarkerRef.current) leafletRef.current.removeLayer(userMarkerRef.current)
        if (circleRef.current)     leafletRef.current.removeLayer(circleRef.current)

        // Add user location marker
        const userIcon = L.divIcon({
          html: `<div style="
            width:16px;height:16px;border-radius:50%;
            background:#3b82f6;border:3px solid white;
            box-shadow:0 0 0 4px rgba(59,130,246,0.3);
          "></div>`,
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })
        userMarkerRef.current = L.marker([loc.lat, loc.lng], { icon: userIcon })
          .addTo(leafletRef.current)
          .bindPopup('<b>Your Location</b>')

        // Draw search radius circle
        circleRef.current = L.circle([loc.lat, loc.lng], {
          color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05,
          weight: 1.5, dashArray: '6', radius: searchRadius * 1000,
        }).addTo(leafletRef.current)

        leafletRef.current.setView([loc.lat, loc.lng], 10)
      },
      (err) => {
        setLocationLoading(false)
        setLocationError('Could not get your location. Please allow location access.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ── Render donor markers ─────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return
    const L = window.L

    // Clear old markers
    markersRef.current.forEach(m => leafletRef.current.removeLayer(m))
    markersRef.current = []

    const filtered = donors.filter(d => {
      if (activeFilter !== 'ALL' && d.bloodGroup !== activeFilter) return false
      if (!d.latitude || !d.longitude) return false
      if (userLocation) {
        const dist = getDistance(userLocation.lat, userLocation.lng, parseFloat(d.latitude), parseFloat(d.longitude))
        if (dist > searchRadius) return false
      }
      return true
    })

    filtered.forEach(donor => {
      const color    = BLOOD_COLORS[donor.bloodGroup] || '#ef4444'
      const isAvail  = donor.availabilityStatus === 'AVAILABLE'
      const opacity  = isAvail ? 1 : 0.4
      const size     = isAvail ? 36 : 28

      const icon = L.divIcon({
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
          background:${color};opacity:${opacity};
          border:2.5px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
          transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="transform:rotate(45deg);color:white;font-weight:900;font-size:${isAvail ? 9 : 8}px;display:block;text-align:center;line-height:${size - 6}px;">
            ${donor.bloodGroup}
          </span>
        </div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
      })

      const dist = userLocation
        ? ` · ${getDistance(userLocation.lat, userLocation.lng, parseFloat(donor.latitude), parseFloat(donor.longitude)).toFixed(1)} km`
        : ''

      const marker = L.marker([parseFloat(donor.latitude), parseFloat(donor.longitude)], { icon })
        .addTo(leafletRef.current)
        .bindPopup(`
          <div style="font-family:system-ui;min-width:160px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <div style="width:32px;height:32px;border-radius:8px;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:11px">
                ${donor.bloodGroup}
              </div>
              <div>
                <div style="font-weight:700;font-size:13px">${donor.name || 'Anonymous'}</div>
                <div style="font-size:11px;color:${isAvail ? '#16a34a' : '#9ca3af'};font-weight:600">
                  ${isAvail ? '● Available' : '● Unavailable'}
                </div>
              </div>
            </div>
            ${donor.phone ? `<div style="font-size:11px;color:#6b7280;margin-bottom:4px">📞 ${donor.phone}</div>` : ''}
            ${dist ? `<div style="font-size:11px;color:#6b7280">📍${dist} away</div>` : ''}
          </div>
        `, { maxWidth: 220 })

      marker.on('click', () => setSelectedDonor(donor))
      markersRef.current.push(marker)
    })
  }, [donors, activeFilter, mapReady, userLocation, searchRadius])

  // ── Focus on a donor ─────────────────────────────────────────
  const focusDonor = (donor) => {
    if (!leafletRef.current || !donor.latitude || !donor.longitude) return
    leafletRef.current.setView([parseFloat(donor.latitude), parseFloat(donor.longitude)], 14)
    setSelectedDonor(donor)
    const marker = markersRef.current.find(m => {
      const pos = m.getLatLng()
      return pos.lat === parseFloat(donor.latitude) && pos.lng === parseFloat(donor.longitude)
    })
    if (marker) marker.openPopup()
  }

  // ── Sorted/filtered donor list ───────────────────────────────
  const filteredDonors = donors
    .filter(d => activeFilter === 'ALL' || d.bloodGroup === activeFilter)
    .map(d => ({
      ...d,
      distance: userLocation && d.latitude && d.longitude
        ? getDistance(userLocation.lat, userLocation.lng, parseFloat(d.latitude), parseFloat(d.longitude))
        : Infinity,
    }))
    .filter(d => !userLocation || d.distance <= searchRadius)
    .sort((a, b) => {
      // Available first, then by distance
      if (a.availabilityStatus === 'AVAILABLE' && b.availabilityStatus !== 'AVAILABLE') return -1
      if (b.availabilityStatus === 'AVAILABLE' && a.availabilityStatus !== 'AVAILABLE') return 1
      return a.distance - b.distance
    })

  const stats = {
    total:     filteredDonors.length,
    available: filteredDonors.filter(d => d.availabilityStatus === 'AVAILABLE').length,
    withCoords: filteredDonors.filter(d => d.latitude && d.longitude).length,
  }

  return (
    <div className="flex flex-col h-full gap-4">

      {/* ── Top Controls ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl">
            <FiUser size={13} className="text-gray-400" />
            <span className="text-sm font-black text-gray-900">{stats.total}</span>
            <span className="text-xs text-gray-400">donors</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-xl">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-black text-green-700">{stats.available}</span>
            <span className="text-xs text-green-500">available</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Radius selector */}
          {userLocation && (
            <select value={searchRadius} onChange={e => setSearchRadius(Number(e.target.value))}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:border-red-400">
              {[10, 25, 50, 100, 200].map(r => (
                <option key={r} value={r}>{r} km radius</option>
              ))}
            </select>
          )}

          {/* My Location */}
          <button onClick={getUserLocation} disabled={locationLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              userLocation
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 hover:bg-blue-600'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-500'
            }`}>
            {locationLoading
              ? <div className="w-3.5 h-3.5 border-2 border-current/40 border-t-current rounded-full animate-spin" />
              : <FiNavigation size={14} />}
            {userLocation ? 'Located' : 'My Location'}
          </button>

          <button onClick={fetchDonors} disabled={refreshing}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50">
            <FiRefreshCw size={15} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button onClick={() => setSidebarOpen(v => !v)}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-all lg:hidden">
            <FiFilter size={15} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Location error */}
      {locationError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-600 shrink-0">
          <FiAlertCircle size={14} className="shrink-0" /> {locationError}
        </div>
      )}

      {/* ── Blood type filters ───────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <FiFilter size={12} className="text-gray-300 shrink-0" />
        {BLOOD_GROUPS.map(g => (
          <button key={g} onClick={() => setActiveFilter(g)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === g
                ? 'text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
            style={activeFilter === g ? { backgroundColor: g === 'ALL' ? '#ef4444' : BLOOD_COLORS[g] } : {}}>
            {g === 'ALL' ? 'All' : g}
          </button>
        ))}
      </div>

      {/* ── Map + Sidebar ────────────────────────────────────── */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* Map */}
        <div className="flex-1 relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm min-h-[400px]">
          {/* Loading overlay */}
          {(loading || !mapReady) && (
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">Loading map...</p>
              </div>
            </div>
          )}

          {/* Leaflet mount point */}
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-sm rounded-xl p-3 border border-gray-100 shadow-md">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Legend</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                Available donor
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0 opacity-50" />
                Unavailable
              </div>
              {userLocation && (
                <div className="flex items-center gap-2 text-xs text-blue-500">
                  <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm shrink-0" />
                  Your location
                </div>
              )}
            </div>
          </div>

          {/* No donors overlay */}
          {!loading && mapReady && filteredDonors.filter(d => d.latitude && d.longitude).length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] bg-white rounded-2xl p-6 shadow-xl border border-gray-100 text-center pointer-events-none">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FiDroplet className="text-2xl text-red-300" />
              </div>
              <p className="text-sm font-bold text-gray-500">No donors found</p>
              <p className="text-xs text-gray-400 mt-1">
                {userLocation ? `Try increasing the search radius` : 'Enable location to find nearby donors'}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar — donor list */}
        <div className={`w-72 shrink-0 flex flex-col gap-3 overflow-y-auto ${sidebarOpen ? 'flex' : 'hidden'} lg:flex`}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-black text-gray-900">
                {userLocation ? 'Nearest Donors' : 'All Donors'}
              </h3>
              <span className="text-xs font-bold text-gray-400">{filteredDonors.length}</span>
            </div>
            {!userLocation && (
              <p className="text-xs text-gray-400">
                Enable <span className="font-bold text-blue-500">My Location</span> to sort by distance
              </p>
            )}
          </div>

          {filteredDonors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <FiDroplet className="text-2xl text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-medium">No donors in this area</p>
            </div>
          ) : (
            filteredDonors.map(donor => (
              <DonorCard
                key={donor.id || donor.uid}
                donor={donor}
                userLocation={userLocation}
                onLocate={focusDonor}
              />
            ))
          )}
        </div>

      </div>
    </div>
  )
}

export default BloodMap