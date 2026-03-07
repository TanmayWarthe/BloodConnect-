import React, { useState, useCallback, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { FiMapPin } from 'react-icons/fi'
import { apiService } from '../services/api.service'

const containerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '500px',
    borderRadius: '0.75rem' // rounded-xl
}

const defaultCenter = {
    lat: 28.6139, // New Delhi
    lng: 77.2090
}

const BloodMap = () => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    })

    const [map, setMap] = useState(null)
    const [locations, setLocations] = useState([])
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [loadError, setLoadError] = useState(null)

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                // Fetch donors and hospitals in parallel
                const [donorsRes, hospitalsRes] = await Promise.allSettled([
                    apiService.get('/donors/nearby?bloodGroup=A+&radius=50'),
                    apiService.get('/hospitals/all')
                ])

                const donors = donorsRes.status === 'fulfilled'
                    ? (donorsRes.value.data || [])
                        .filter(d => d.latitude && d.longitude)
                        .map(d => ({
                            id: `donor-${d.id}`,
                            type: 'donor',
                            name: `${d.name} (${d.bloodGroup}${d.rhFactor || ''})`,
                            lat: d.latitude,
                            lng: d.longitude,
                            bloodGroup: d.bloodGroup,
                            lastDonation: d.lastDonationDate || 'Never',
                            status: d.availabilityStatus
                        }))
                    : []

                const hospitals = hospitalsRes.status === 'fulfilled'
                    ? (hospitalsRes.value.data || [])
                        .filter(h => h.latitude && h.longitude)
                        .map(h => ({
                            id: `hospital-${h.id}`,
                            type: 'hospital',
                            name: h.hospitalName,
                            lat: h.latitude,
                            lng: h.longitude,
                            phone: h.phone,
                            address: h.address
                        }))
                    : []

                setLocations([...donors, ...hospitals])
            } catch (err) {
                console.error('Failed to load map data:', err)
                setLoadError('Could not load map data.')
            }
        }

        fetchMapData()
    }, [])

    const onLoad = useCallback(function callback(map) {
        if (locations.length > 0) {
            const bounds = new window.google.maps.LatLngBounds()
            locations.forEach(loc => bounds.extend({ lat: loc.lat, lng: loc.lng }))
            map.fitBounds(bounds)
        } else {
            map.setCenter(defaultCenter)
            map.setZoom(12)
        }
        setMap(map)
    }, [locations])

    const onUnmount = useCallback(function callback() {
        setMap(null)
    }, [])

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded-xl animate-pulse">
                <p className="text-gray-500">Loading Maps...</p>
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="flex items-center justify-center h-[500px] bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-500">{loadError}</p>
            </div>
        )
    }

    return (
        <div className="card-minimal p-4 relative">
            <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-md border border-gray-100 max-w-xs">
                <h3 className="font-display font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <FiMapPin className="text-primary" /> Blood Network
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                    View nearby hospitals and active donors.
                </p>
                <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Hospital</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Donor</span>
                </div>
            </div>

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    styles: [
                        {
                            "featureType": "poi.medical",
                            "elementType": "geometry",
                            "stylers": [{ "color": "#fbd3d3" }]
                        }
                    ],
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                }}
            >
                {locations.map(loc => (
                    <Marker
                        key={loc.id}
                        position={{ lat: loc.lat, lng: loc.lng }}
                        onClick={() => setSelectedLocation(loc)}
                        icon={loc.type === 'hospital'
                            ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                            : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'}
                    />
                ))}

                {selectedLocation && (
                    <InfoWindow
                        position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                        onCloseClick={() => setSelectedLocation(null)}
                    >
                        <div className="p-2 min-w-[200px]">
                            <h4 className="font-bold text-gray-900 mb-1">{selectedLocation.name}</h4>
                            <p className="text-xs text-gray-500 capitalize mb-2">{selectedLocation.type}</p>

                            {selectedLocation.type === 'hospital' && (
                                <div>
                                    {selectedLocation.address && (
                                        <p className="text-xs text-gray-600 mb-1">📍 {selectedLocation.address}</p>
                                    )}
                                    {selectedLocation.phone && (
                                        <p className="text-xs text-gray-600">📞 {selectedLocation.phone}</p>
                                    )}
                                </div>
                            )}

                            {selectedLocation.type === 'donor' && (
                                <div>
                                    <p className="text-xs text-gray-500">Last Donation: {selectedLocation.lastDonation}</p>
                                    {selectedLocation.status && (
                                        <p className="text-xs mt-1">
                                            Status: <span className={`font-semibold ${selectedLocation.status === 'AVAILABLE' ? 'text-green-600' : 'text-gray-500'}`}>
                                                {selectedLocation.status}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    )
}

export default React.memo(BloodMap)
