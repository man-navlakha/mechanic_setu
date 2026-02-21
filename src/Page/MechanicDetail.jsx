import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Clock, Mail, Phone, MapPin, Edit, ArrowLeft, Star, Heart, Share2,
    MoreVertical, CheckCircle, Store, Zap, Fuel, AlertCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MechanicDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mechanic, setMechanic] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMechanic = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/ms-mechanics/${id}`);
                const data = await response.json();
                if (data.success) {
                    setMechanic(data.mechanic);
                } else {
                    toast.error('Mechanic not found');
                    navigate('/ms/list');
                }
            } catch (error) {
                console.error('Error fetching mechanic:', error);
                toast.error('Network error');
            } finally {
                setLoading(false);
            }
        };

        fetchMechanic();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!mechanic) return null;

    const MapView = ({ lat, lng, popupText }) => {
        if (!lat || !lng) return <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">Location not available</div>;

        return (
            <div className="h-48 rounded-lg overflow-hidden border border-gray-200 z-0">
                <MapContainer
                    center={[lat, lng]}
                    zoom={15}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                    dragging={false} // Static view mostly
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <Marker position={[lat, lng]}>
                        <Popup>{popupText}</Popup>
                    </Marker>
                </MapContainer>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header / Nav */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate('/ms/list')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div className="flex items-center gap-2">
                        <Link
                            to={`/ms/edit/${id}`}
                            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                        >
                            <Edit size={16} /> Edit Profile
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 mt-8 grid lg:grid-cols-3 gap-8">

                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <div className="px-6 pb-6 -mt-16 relative">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 mx-auto">
                                <img
                                    src={mechanic.profile_photo || 'https://via.placeholder.com/150'}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="text-center mt-4">
                                <h1 className="text-xl font-bold text-gray-900">{mechanic.full_name}</h1>
                                <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
                                    <Store size={14} /> {mechanic.shop_name}
                                </p>

                                <div className="flex items-center justify-center gap-2 mt-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                        ${mechanic.status === 'ONLINE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {mechanic.status}
                                    </span>
                                    {mechanic.is_verified && (
                                        <span className="bg-blue-100 text-blue-700 p-1 rounded-full" title="Verified">
                                            <CheckCircle size={14} />
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Phone size={16} className="text-gray-400" />
                                    <span>{mechanic.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Mail size={16} className="text-gray-400" />
                                    <span className="truncate">{mechanic.email || 'No email provided'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Clock size={16} className="text-gray-400" />
                                    <span>{mechanic.working_hours || 'Not specified'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats or Badges */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2">
                                <Star size={16} />
                            </div>
                            <div className="text-sm font-medium">4.8</div>
                            <div className="text-xs text-gray-400">Rating</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-2">
                                <Zap size={16} />
                            </div>
                            <div className="text-sm font-medium">{mechanic.electric ? 'EV Support' : 'No EV'}</div>
                            <div className="text-xs text-gray-400">Capabilities</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Shop Info & Locations */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-blue-500" /> Shop Location & Details
                        </h2>

                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-1">Address</p>
                            <p className="text-gray-900 font-medium">{mechanic.shop_address}</p>
                            {mechanic.shop_google_map_link && (
                                <a
                                    href={mechanic.shop_google_map_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                >
                                    Open in Google Maps
                                </a>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Official Shop Location</p>
                                <MapView
                                    lat={mechanic.shop_latitude}
                                    lng={mechanic.shop_longitude}
                                    popupText={mechanic.shop_name}
                                />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Last Live Location</p>
                                <MapView
                                    lat={mechanic.current_latitude}
                                    lng={mechanic.current_longitude}
                                    popupText="Current Position"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Zap size={20} className="text-amber-500" /> Services & Expertise
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Vehicle Types</p>
                                <div className="flex flex-wrap gap-2">
                                    {mechanic.vehicle_type?.split(',').map((type, i) => (
                                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                                            {type.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {mechanic.electric && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Electric Vehicles Supported</p>
                                    <div className="flex flex-wrap gap-2">
                                        {mechanic.electric_vehicle_types?.split(',').map((type, i) => (
                                            <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                                                {type.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-gray-500 mb-2">Special Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {mechanic.special_skills?.split(',').map((skill, i) => (
                                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {mechanic.fuel_delivery_types && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Fuel Delivery</p>
                                    <div className="flex flex-wrap gap-2">
                                        {mechanic.fuel_delivery_types.split(',').map((fuel, i) => (
                                            <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-200 flex items-center gap-1">
                                                <Fuel size={12} /> {fuel.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertCircle size={20} className="text-purple-500" /> Documents
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Shop Photo', src: mechanic.shop_photo },
                                { label: 'KYC Document', src: mechanic.KYC_document },
                                { label: 'Aadhaar Card', src: null, placeholder: mechanic.adhar_card ? 'Stored Securely' : 'Not Added' }
                            ].map((doc, idx) => (
                                <div key={idx} className="aspect-square bg-gray-50 rounded-xl border border-gray-200 overflow-hidden relative group">
                                    {doc.src ? (
                                        <>
                                            <img src={doc.src} alt={doc.label} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <a href={doc.src} target="_blank" rel="noreferrer" className="text-white text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm hover:bg-white/40">View</a>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                                            <span className="text-xs font-medium">{doc.placeholder}</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2 text-xs font-medium text-center border-t border-gray-100">
                                        {doc.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MechanicDetail;
