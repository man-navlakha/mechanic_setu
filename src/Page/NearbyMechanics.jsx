import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone, MapPin, CheckCircle, XCircle, Wifi, WifiOff,
    ArrowLeft, RefreshCw, Navigation, Store, User,
    Clock, Star, Shield, ChevronRight, X, Mail,
    Zap, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const FORM_STORAGE_KEY = 'punctureRequestFormData';

export default function NearbyMechanics() {
    const navigate = useNavigate();
    const location = useLocation();

    // --- State ---
    const [mechanics, setMechanics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [searchRadius, setSearchRadius] = useState(3);
    const [totalFound, setTotalFound] = useState(0);
    const [selectedMechanic, setSelectedMechanic] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'online', 'offline'

    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const userMarkerRef = useRef(null);
    const mechanicMarkersRef = useRef([]);

    // Load user location
    useEffect(() => {
        try {
            const saved = localStorage.getItem(FORM_STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.latitude && data.longitude) {
                    setUserLocation({ lat: data.latitude, lng: data.longitude });
                    return;
                }
            }
        } catch (err) {
            console.error("Error loading location data", err);
        }

        if (location.state?.latitude && location.state?.longitude) {
            setUserLocation({ lat: location.state.latitude, lng: location.state.longitude });
            return;
        }

        // Get current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    toast.error("Could not get your location. Please enable location services.");
                    setLoading(false);
                }
            );
        }
    }, [location.state]);

    // Fetch nearby mechanics
    const fetchNearbyMechanics = async () => {
        if (!userLocation) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `https://mechanic-setu-backend.vercel.app/api/ms-mechanics/nearby?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius=${searchRadius}`
            );

            if (!response.ok) throw new Error('Failed to fetch nearby mechanics');

            const data = await response.json();

            if (data.success) {
                setMechanics(data.mechanics || []);
                setTotalFound(data.total_found || 0);
                setSearchRadius(data.search_radius_km || 10);
            } else {
                throw new Error(data.message || 'Failed to fetch mechanics');
            }
        } catch (err) {
            console.error("Error fetching mechanics:", err);
            setError(err.message);
            toast.error("Failed to load nearby mechanics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userLocation) fetchNearbyMechanics();
    }, [userLocation, searchRadius]);

    // Helper function to create circle coordinates for radius visualization
    const createCircleCoordinates = (centerLng, centerLat, radiusKm, points = 64) => {
        const coords = [];
        const earthRadius = 6371; // km

        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const latOffset = (radiusKm / earthRadius) * (180 / Math.PI);
            const lngOffset = (radiusKm / earthRadius) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);

            const lat = centerLat + latOffset * Math.sin(angle);
            const lng = centerLng + lngOffset * Math.cos(angle);
            coords.push([lng, lat]);
        }
        return coords;
    };

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || !userLocation) return;

        if (!mapInstanceRef.current) {
            const map = new maplibregl.Map({
                container: mapContainerRef.current,
                center: [userLocation.lng, userLocation.lat],
                zoom: 12,
                style: `https://api.maptiler.com/maps/019b64a4-ef96-7e83-9a23-dde0df92b2ba/style.json?key=wf1HtIzvVsvPfvNrhwPz`,
                attributionControl: false,
            });
            mapInstanceRef.current = map;

            map.on('load', () => {
                // Add radius circle to show search area
                const circleCoords = createCircleCoordinates(userLocation.lng, userLocation.lat, searchRadius);

                // Add the circle as a source
                map.addSource('radius-circle', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [circleCoords]
                        }
                    }
                });

                // Add fill layer for the circle (semi-transparent blue)
                map.addLayer({
                    id: 'radius-fill',
                    type: 'fill',
                    source: 'radius-circle',
                    paint: {
                        'fill-color': '#3b82f6',
                        'fill-opacity': 0.1
                    }
                });

                // Add stroke layer for the circle border
                map.addLayer({
                    id: 'radius-stroke',
                    type: 'line',
                    source: 'radius-circle',
                    paint: {
                        'line-color': '#3b82f6',
                        'line-width': 2,
                        'line-dasharray': [3, 2]
                    }
                });

                // Add user location marker
                const userEl = document.createElement('div');
                userEl.innerHTML = `<div style="
                    width: 24px; height: 24px; 
                    margin-left: -12px;
                    margin-top: -12px;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    border-radius: 50%; 
                    border: 3px solid white;
                    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.5);
                    animation: pulse 2s infinite;
                "></div>`;
                userMarkerRef.current = new maplibregl.Marker({ element: userEl })
                    .setLngLat([userLocation.lng, userLocation.lat])
                    .addTo(map);

                addMechanicMarkers(map);
            });
        } else {
            // Update radius circle if it exists
            const map = mapInstanceRef.current;
            if (map.getSource('radius-circle')) {
                const circleCoords = createCircleCoordinates(userLocation.lng, userLocation.lat, searchRadius);
                map.getSource('radius-circle').setData({
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [circleCoords]
                    }
                });
            }
            addMechanicMarkers(map);
        }
    }, [userLocation, mechanics, searchRadius]);

    const addMechanicMarkers = (map) => {
        // Clear existing markers
        mechanicMarkersRef.current.forEach(marker => marker.remove());
        mechanicMarkersRef.current = [];

        // Helper to calculate distance between two points (Haversine formula)
        const getDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Earth radius in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        // Add markers for ALL mechanics (both online and offline, inside and outside radius)
        mechanics.forEach((mech) => {
            const mechLocation = mech.location?.shop;
            if (!mechLocation || !mechLocation.latitude || !mechLocation.longitude) return;

            const isOnline = mech.status === 'ONLINE';
            const isVerified = mech.is_verified;

            // Calculate distance and check if inside radius
            const distance = userLocation ? getDistance(
                userLocation.lat, userLocation.lng,
                mechLocation.latitude, mechLocation.longitude
            ) : 0;
            const isInsideRadius = distance <= searchRadius;

            // Create marker container - use negative margins to center on coordinates
            const el = document.createElement('div');
            el.className = 'mechanic-marker';
            el.style.cssText = `
                position: absolute;
                width: 52px;
                height: 52px;
                margin-left: -26px;
                margin-top: -26px;
                cursor: pointer;
                transition: transform 0.2s ease;
                ${!isInsideRadius ? 'opacity: 0.7;' : ''}
            `;

            // Determine border color based on status and radius
            let borderColor = '#9ca3af'; // gray for offline
            if (isOnline && isInsideRadius) {
                borderColor = '#10b981'; // green for online inside
            } else if (isOnline && !isInsideRadius) {
                borderColor = '#f97316'; // orange for online outside
            } else if (!isOnline && !isInsideRadius) {
                borderColor = '#6b7280'; // darker gray for offline outside
            }

            // Create the marker circle with profile image
            const circle = document.createElement('div');
            circle.style.cssText = `
                width: 48px;
                height: 48px;
                border-radius: 50%;
                border: 4px solid ${borderColor};
                overflow: hidden;
                background: white;
                box-shadow: 0 4px 15px ${isOnline ? 'rgba(16, 185, 129, 0.5)' : 'rgba(0,0,0,0.2)'};
                transform-origin: center center;
                transition: transform 0.2s ease;
                ${isOnline && isInsideRadius ? 'animation: markerPulse 2s ease-in-out infinite;' : ''}
            `;

            const img = document.createElement('img');
            img.src = mech.mechanic?.profile_pic || '/ms.png';
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
            img.onerror = () => { img.src = '/ms.png'; };
            circle.appendChild(img);
            el.appendChild(circle);

            // Status indicator dot
            const statusDot = document.createElement('div');
            if (isOnline) {
                statusDot.style.cssText = `
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 14px;
                    height: 14px;
                    background: ${isInsideRadius ? '#10b981' : '#f97316'};
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 0 8px ${isInsideRadius ? 'rgba(16, 185, 129, 0.8)' : 'rgba(249, 115, 22, 0.8)'};
                    ${isInsideRadius ? 'animation: dotPulse 1.5s ease-in-out infinite;' : ''}
                `;
            } else {
                statusDot.style.cssText = `
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 14px;
                    height: 14px;
                    background: #9ca3af;
                    border-radius: 50%;
                    border: 2px solid white;
                `;
            }
            el.appendChild(statusDot);

            // Add "outside radius" badge for mechanics outside the search area
            if (!isInsideRadius) {
                const outsideBadge = document.createElement('div');
                outsideBadge.style.cssText = `
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: ${isOnline ? '#f97316' : '#6b7280'};
                    color: white;
                    font-size: 8px;
                    font-weight: bold;
                    padding: 1px 4px;
                    border-radius: 4px;
                    white-space: nowrap;
                    border: 1px solid white;
                `;
                outsideBadge.textContent = `${distance.toFixed(1)}km`;
                el.appendChild(outsideBadge);
            }

            // Verified badge
            if (isVerified && isInsideRadius) {
                const badge = document.createElement('div');
                badge.style.cssText = `
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    width: 18px;
                    height: 18px;
                    background: #3b82f6;
                    border-radius: 50%;
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                badge.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                el.appendChild(badge);
            }

            // Hover effects - use transform-origin center to prevent position shift
            el.onmouseenter = () => {
                circle.style.transform = 'scale(1.1)';
                el.style.zIndex = '1000';
            };
            el.onmouseleave = () => {
                circle.style.transform = 'scale(1)';
                el.style.zIndex = 'auto';
            };

            // Click to select mechanic
            el.onclick = () => setSelectedMechanic(mech);

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([mechLocation.longitude, mechLocation.latitude])
                .addTo(map);

            mechanicMarkersRef.current.push(marker);
        });

        // Fit bounds to show ALL markers including those outside radius
        if (mechanics.length > 0 && userLocation) {
            const bounds = new maplibregl.LngLatBounds();
            bounds.extend([userLocation.lng, userLocation.lat]);
            mechanics.forEach(mech => {
                const loc = mech.location?.shop;
                if (loc && loc.latitude && loc.longitude) {
                    bounds.extend([loc.longitude, loc.latitude]);
                }
            });
            map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 1000 });
        }
    };

    const handleCallMechanic = (phone) => {
        if (phone) window.open(`tel:${phone} `);
    };

    const handleGetDirections = (lat, lng) => {
        if (lat && lng) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        }
    };

    const handleGoBack = () => navigate('/');

    // Filter mechanics based on active tab
    const filteredMechanics = mechanics.filter(m => {
        if (activeTab === 'online') return m.status === 'ONLINE';
        if (activeTab === 'offline') return m.status !== 'ONLINE';
        return true;
    }).sort((a, b) => a.distance_km - b.distance_km);

    const onlineCount = mechanics.filter(m => m.status === 'ONLINE').length;
    const offlineCount = mechanics.filter(m => m.status !== 'ONLINE').length;

    // Mechanic Card Component
    const MechanicCard = ({ mechanic, index }) => {
        const isOnline = mechanic.status === 'ONLINE';
        const isVerified = mechanic.is_verified;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => setSelectedMechanic(mechanic)}
                className="group relative bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-5 mb-3 lg:mb-4 
                   cursor-pointer transition-all duration-300
                   shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]
                   hover:-translate-y-1 border border-gray-100/50"
            >
                {/* Online indicator glow */}
                {isOnline && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse
                          shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                )}

                <div className="flex items-start gap-3 lg:gap-4">
                    {/* Profile Picture */}
                    <div className="relative flex-shrink-0">
                        <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl overflow-hidden
            ring-2 ring-offset-2 ${isOnline ? 'ring-green-400' : 'ring-gray-200'}
            transition-all duration-300 group-hover:ring-offset-4`}>
                            <img
                                src={mechanic.mechanic?.profile_pic || '/ms.png'}
                                alt={mechanic.mechanic?.name || 'Mechanic'}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Verified badge */}
                        {isVerified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 lg:w-6 lg:h-6 bg-blue-500 rounded-full 
                              flex items-center justify-center shadow-lg">
                                <CheckCircle size={12} className="text-white" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base lg:text-lg font-bold text-gray-900 truncate">
                                {mechanic.mechanic?.name || 'Unknown'}
                            </h3>
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                            <Store size={13} className="text-gray-400 flex-shrink-0" />
                            <span className="font-medium truncate">{mechanic.shop_name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2 lg:mb-3">
                            <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{mechanic.shop_address}</span>
                        </div>

                        {/* Status & Distance Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                              ${isOnline
                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}>
                                {isOnline ? <Zap size={10} className="text-green-500" /> : <Clock size={10} />}
                                {isOnline ? 'Available' : 'Offline'}
                            </span>

                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                             bg-blue-50 text-blue-700 border border-blue-100">
                                <Navigation size={10} />
                                {mechanic.distance_text || `${mechanic.distance_km?.toFixed(2)} km`}
                            </span>

                            {isVerified && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                               bg-purple-50 text-purple-700 border border-purple-100">
                                    <Shield size={10} />
                                    Verified
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions Column */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                        {/* Call Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCallMechanic(mechanic.mechanic?.mobile);
                            }}
                            className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl 
                       flex items-center justify-center transition-all duration-300
                       ${isOnline
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }
            hover:scale-105 active:scale-95`}
                        >
                            <Phone size={18} />
                        </button>

                        {/* Direction Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const shop = mechanic.location?.shop;
                                handleGetDirections(shop?.latitude, shop?.longitude);
                            }}
                            className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl 
                       flex items-center justify-center transition-all duration-300
                       bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200
                       hover:scale-105 active:scale-95"
                        >
                            <Navigation size={18} />
                        </button>
                    </div>
                </div>

                {/* Hover chevron */}
                <ChevronRight
                    size={20}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 
                     opacity-0 group-hover:opacity-100 transition-all duration-300
                     group-hover:translate-x-1"
                />
            </motion.div>
        );
    };

    // Mechanic Detail Modal
    const MechanicModal = ({ mechanic, onClose }) => {
        if (!mechanic) return null;
        const isOnline = mechanic.status === 'ONLINE';
        const isVerified = mechanic.is_verified;

        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center p-0 lg:p-4"
                >
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full lg:max-w-lg bg-white rounded-t-3xl lg:rounded-3xl overflow-hidden
                       max-h-[90vh] lg:max-h-[85vh] overflow-y-auto"
                    >
                        {/* Header with gradient */}
                        <div className={`relative h-32 lg:h-40 ${isOnline
                            ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600'
                            : 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600'
                            }`}>

                            {/* Pattern overlay */}
                            <div className="absolute inset-0 opacity-10"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23fff" fill-opacity="1" fill-rule="evenodd"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3Ccircle cx="13" cy="13" r="3"/%3E%3C/g%3E%3C/svg%3E")' }} />

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm
                           flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {/* Status badge */}
                            <div className="absolute top-4 left-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
                                ${isOnline ? 'bg-white text-green-600' : 'bg-white/80 text-gray-600'}`}>
                                    {isOnline ? <Zap size={14} /> : <Clock size={14} />}
                                    {isOnline ? 'Available Now' : 'Currently Offline'}
                                </span>
                            </div>

                            {/* Profile Picture */}
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                                <div className={`w-24 h-24 lg:w-28 lg:h-28 rounded-2xl overflow-hidden
            ring-4 ring-white shadow-xl ${isOnline ? 'ring-green-100' : 'ring-gray-100'}`}>
                                    <img
                                        src={mechanic.mechanic?.profile_pic || '/ms.png'}
                                        alt={mechanic.mechanic?.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {isVerified && (
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-xl 
                                  flex items-center justify-center shadow-lg ring-2 ring-white">
                                        <CheckCircle size={16} className="text-white" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="pt-16 pb-6 px-5 lg:px-6">
                            {/* Name & Shop */}
                            <div className="text-center mb-6">
                                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                                    {mechanic.mechanic?.name}
                                </h2>
                                <p className="text-gray-500 flex items-center justify-center gap-1.5">
                                    <Store size={14} />
                                    {mechanic.shop_name}
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-3 text-center border border-blue-100">
                                    <Navigation size={18} className="text-blue-500 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-gray-900">{mechanic.distance_text || `${mechanic.distance_km?.toFixed(1)} km`}</p>
                                    <p className="text-xs text-gray-500">Distance</p>
                                </div>
                                <div className={`rounded-2xl p-3 text-center border ${isVerified
                                    ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100'
                                    : 'bg-gray-50 border-gray-100'
                                    }`}>
                                    <Shield size={18} className={`mx-auto mb-1 ${isVerified ? 'text-purple-500' : 'text-gray-400'}`} />
                                    <p className="text-lg font-bold text-gray-900">{isVerified ? 'Yes' : 'No'}</p>
                                    <p className="text-xs text-gray-500">Verified</p>
                                </div>
                                <div className={`rounded-2xl p-3 text-center border ${isOnline
                                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'
                                    : 'bg-gray-50 border-gray-100'
                                    }`}>
                                    {isOnline ? <Wifi size={18} className="text-green-500 mx-auto mb-1" />
                                        : <WifiOff size={18} className="text-gray-400 mx-auto mb-1" />}
                                    <p className="text-lg font-bold text-gray-900">{isOnline ? 'Online' : 'Offline'}</p>
                                    <p className="text-xs text-gray-500">Status</p>
                                </div>
                            </div>

                            {/* Details Card */}
                            <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                        <MapPin size={16} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Address</p>
                                        <p className="text-sm text-gray-700">{mechanic.shop_address}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                        <Phone size={16} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Phone</p>
                                        <p className="text-sm text-gray-700 font-medium">{mechanic.mechanic?.mobile || 'Not available'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                        <Mail size={16} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                                        <p className="text-sm text-gray-700">{mechanic.mechanic?.email || 'Not available'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Call Button */}
                            <button
                                onClick={() => handleCallMechanic(mechanic.mechanic?.mobile)}
                                disabled={!isOnline}
                                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300
                           flex items-center justify-center gap-2
                           ${isOnline
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98]'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Phone size={20} />
                                {isOnline ? `Call ${mechanic.mechanic?.name?.split(' ')[0]} ` : 'Currently Unavailable'}
                            </button>

                            {!isOnline && (
                                <p className="text-center text-sm text-gray-400 mt-3 flex items-center justify-center gap-1.5">
                                    <AlertCircle size={14} />
                                    This mechanic is currently offline
                                </p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-5">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleGoBack}
                            className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-gray-100 hover:bg-gray-200 
                         flex items-center justify-center transition-all duration-200"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>

                        <div className="flex-grow">
                            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Nearby Mechanics</h1>
                            <p className="text-sm text-gray-500">
                                {loading ? 'Searching...' : `${totalFound} mechanics within ${searchRadius} km`}
                            </p>
                        </div>

                        <button
                            onClick={fetchNearbyMechanics}
                            disabled={loading}
                            className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-blue-50 hover:bg-blue-100 
                         flex items-center justify-center transition-all duration-200
                         ${loading ? 'opacity-50' : ''}`}
                        >
                            <RefreshCw size={18} className={`text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-6">
                {/* Desktop: Side by Side Layout */}
                <div className="lg:grid lg:grid-cols-5 lg:gap-6">

                    {/* Map Section */}
                    <div className="lg:col-span-2 mb-4 lg:mb-0 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
                        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-lg overflow-hidden h-56 lg:h-full relative">
                            <div ref={mapContainerRef} className="w-full h-full" />

                            {/* Map Legend */}
                            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl p-2.5 lg:p-3 shadow-lg border border-gray-100">
                                <p className="text-[10px] lg:text-xs font-semibold text-gray-700 mb-1.5 lg:mb-2">Map Legend</p>
                                <div className="space-y-1 lg:space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-white shadow" />
                                        </div>
                                        <span className="text-[10px] lg:text-xs text-gray-600">Your Location</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 lg:w-6 lg:h-6 rounded border-2 border-dashed border-blue-400 bg-blue-100/50" />
                                        <span className="text-[10px] lg:text-xs text-gray-600">{searchRadius}km Radius</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gray-300 border-2 border-green-500 shadow" />
                                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-green-500 rounded-full border border-white" />
                                        </div>
                                        <span className="text-[10px] lg:text-xs text-gray-600">Online ({onlineCount})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gray-300 border-2 border-gray-400 shadow" />
                                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-gray-400 rounded-full border border-white" />
                                        </div>
                                        <span className="text-[10px] lg:text-xs text-gray-600">Offline ({offlineCount})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gray-300 border-2 border-orange-500 shadow opacity-70" />
                                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-orange-500 rounded-full border border-white" />
                                        </div>
                                        <span className="text-[10px] lg:text-xs text-gray-600">Outside Radius</span>
                                    </div>
                                </div>
                            </div>

                            {/* Total count badge */}
                            <div className="absolute top-3 right-3 bg-gray-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                                {totalFound} mechanics
                            </div>
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="lg:col-span-3">

                        {/* Tabs */}
                        <div className="flex gap-2 mb-4 lg:mb-6 overflow-x-auto pb-2 scrollbar-hide">
                            {[
                                { id: 'all', label: 'All', count: mechanics.length },
                                { id: 'online', label: 'Available', count: onlineCount, color: 'green' },
                                { id: 'offline', label: 'Offline', count: offlineCount, color: 'gray' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl 
                                    font-medium text-sm lg:text-base whitespace-nowrap transition-all duration-200
                                    ${activeTab === tab.id
                                            ? 'bg-gray-900 text-white shadow-lg'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                >
                                    {tab.label}
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                                  ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 lg:py-24">
                                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white shadow-lg 
                                flex items-center justify-center mb-4">
                                    <RefreshCw size={28} className="text-blue-500 animate-spin" />
                                </div>
                                <p className="text-gray-500 font-medium">Finding nearby mechanics...</p>
                            </div>
                        ) : error ? (
                            <div className="bg-white rounded-2xl lg:rounded-3xl shadow-lg p-8 lg:p-12 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                                    <XCircle size={32} className="text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
                                <p className="text-gray-500 mb-6">{error}</p>
                                <button
                                    onClick={fetchNearbyMechanics}
                                    className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold 
                             hover:bg-blue-600 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : filteredMechanics.length === 0 ? (
                            <div className="bg-white rounded-2xl lg:rounded-3xl shadow-lg p-8 lg:p-12 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <MapPin size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No mechanics found</h3>
                                <p className="text-gray-500">
                                    {activeTab === 'online'
                                        ? 'No mechanics are currently available. Try viewing offline mechanics.'
                                        : 'No mechanics found in your area.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-0">
                                {filteredMechanics.map((mech, index) => (
                                    <MechanicCard key={mech.id} mechanic={mech} index={index} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selectedMechanic && (
                <MechanicModal mechanic={selectedMechanic} onClose={() => setSelectedMechanic(null)} />
            )}

            {/* Custom Scrollbar Styles */}
            <style>{`
                .scrollbar - hide:: -webkit - scrollbar {
                display: none;
            }
        .scrollbar - hide {
            -ms - overflow - style: none;
            scrollbar - width: none;
        }
        @keyframes pulse {
            0 %, 100 % { transform: scale(1); opacity: 1; }
            50 % { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes markerPulse {
            0 %, 100 % {
                box- shadow: 0 4px 15px rgba(16, 185, 129, 0.5);
        }
        50 % {
            box- shadow: 0 4px 25px rgba(16, 185, 129, 0.8);
    }
}
@keyframes dotPulse {
    0 %, 100 % {
        transform: scale(1);
        box- shadow: 0 0 8px rgba(16, 185, 129, 0.8);
}
50 % {
    transform: scale(1.2);
    box- shadow: 0 0 15px rgba(16, 185, 129, 1);
          }
        }
`}</style>
        </div>
    );
}
