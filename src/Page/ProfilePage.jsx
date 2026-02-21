// src/Page/ProfilePage.js
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
    User, Mail, Phone, Edit2, Save, X, LogOut, 
    Car, Bike, Truck, Bus, Calendar, MapPin, 
    AlertCircle, AlertTriangle, CheckCircle, Clock, ChevronRight,
    Shield, CreditCard, FileText, Loader2, XCircle, Wrench
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { toast } from 'react-hot-toast';

// --- Reusable Editable Field Component ---
const EditableField = React.memo(({ label, name, value, onChange, type = "text" }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-gray-50 text-gray-900 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
    </div>
));

const OrderHistoryCard = React.memo(({ order }) => {
    const statusStyles = {
        PENDING: "bg-amber-100 text-amber-700 border-amber-200",
        COMPLETED: "bg-green-100 text-green-700 border-green-200",
        CANCELLED: "bg-red-100 text-red-700 border-red-200",
        EXPIRED: "bg-gray-100 text-gray-700 border-gray-200",
    };

    const vehicleTypeIcon = (type) => {
        switch ((type || "").toLowerCase()) {
            case "bike":
                return <Bike className="w-5 h-5 text-gray-500" />;
            case "truck":
                return <Truck className="w-5 h-5 text-gray-500" />;
            case "bus":
                return <Bus className="w-5 h-5 text-gray-500" />;
            default:
                return <Car className="w-5 h-5 text-gray-500" />;
        }
    };

    const createdDate = new Date(order.created_at || order.updated_at || Date.now());
    const dateLabel = createdDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
    const timeLabel = createdDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const status = (order.status || "PENDING").toUpperCase();
    const vehicleId = order.vehicle_id || order.license_plate || order.vehicle_rc_id || "—";
    const serviceType = (order.service_type || "General Service").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-red-600 font-bold text-lg">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{order.problem || "Service Request"}</span>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${statusStyles[status] || statusStyles.PENDING}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                </div>
            </div>

            {/* Vehicle + Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                        {vehicleTypeIcon(order.vehicle_type || order.vehical_type)}
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Vehicle</p>
                        <p className="text-base font-bold text-gray-900">{vehicleId}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Service Type</p>
                        <p className="text-base font-bold text-gray-900">{serviceType}</p>
                    </div>
                </div>
            </div>

            {/* Location */}
            <div className="py-3 border-t border-gray-100 flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Location</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{order.location || "—"}</p>
                </div>
                <div className="hidden sm:block w-24 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                        Map preview
                    </div>
                </div>
            </div>

            {/* Created On */}
            <div className="py-3 border-t border-gray-100 flex items-center gap-3 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-500 font-semibold">Created On</span>
                <span className="font-bold text-gray-900">{dateLabel}</span>
                <span className="text-gray-300">|</span>
                <span className="font-semibold text-gray-800">{timeLabel}</span>
            </div>

            {/* Actions */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2">
                    View Details <ChevronRight size={16} />
                </button>
                <button className="w-full py-3 bg-white text-gray-800 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
                    Cancel Request
                </button>
            </div>
        </div>
    );
});

const VehicleCard = React.memo(({ vehicle }) => {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                        <Car size={24} className="text-blue-600" />
                    </div>
                    <div>
                        <p className="font-black text-gray-900 tracking-tight uppercase text-lg">{vehicle.license_plate}</p>
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{vehicle.brand_model}</p>
                    </div>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${vehicle.is_insurance_expired ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                    {vehicle.is_insurance_expired ? 'Expired' : 'Active'}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-50">
                <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Shield size={10} /> Insurance
                    </p>
                    <p className="text-sm font-semibold text-gray-700">{vehicle.insurance_expiry || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <CreditCard size={10} /> RC Status
                    </p>
                    <p className={`text-sm font-bold ${vehicle.rc_status === 'ACTIVE' ? 'text-green-600' : 'text-gray-700'}`}>
                        {vehicle.rc_status || 'ACTIVE'}
                    </p>
                </div>
            </div>
        </div>
    );
});

// --- Skeleton Loader ---
const ProfileSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 pt-24">
            <div className="animate-pulse space-y-8">
                {/* Profile Card Skeleton */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-28 h-28 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-4 w-full">
                        <div className="h-8 bg-gray-200 rounded-lg w-1/3 mx-auto md:mx-0"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto md:mx-0"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto md:mx-0"></div>
                        </div>
                        <div className="flex gap-3 justify-center md:justify-start pt-2">
                            <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
                            <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Vehicles Skeleton */}
                    <div className="space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-48 bg-gray-200 rounded-2xl"></div>
                        <div className="h-48 bg-gray-200 rounded-2xl"></div>
                    </div>
                    {/* History Skeleton */}
                    <div className="space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-40 bg-gray-200 rounded-2xl"></div>
                        <div className="h-40 bg-gray-200 rounded-2xl"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState(null);
    const [orderHistory, setOrderHistory] = useState([]);
    const [myVehicles, setMyVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // ✅ 2. Initialize navigate


    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userResponse = await api.get('/Profile/UserProfile/');
                setUser(userResponse.data);
                setEditedUser(userResponse.data);
                return userResponse.data;
            } catch (error) {
                console.error("Failed to fetch user data", error);
                return null;
            }
        };

        const fetchOrderHistory = async (vehicleId) => {
            try {
                const historyResponse = await api.get('/Profile/UserHistory/', {
                    params: {
                        limit: 50,
                        offset: 0,
                        status: 'PENDING',
                        ...(vehicleId ? { vehicle_id: vehicleId } : {})
                    }
                });
                const data = historyResponse.data;
                setOrderHistory(data?.data || data || []);
            } catch (error) {
                console.error("Failed to fetch order history", error);
            }
        };

        const fetchMyVehicles = async () => {
            try {
                const response = await api.get('/vehicle/my-vehicles');
                if (response.data && (response.data.success || Array.isArray(response.data.data))) {
                    const vehicles = response.data.data || response.data || [];
                    setMyVehicles(vehicles);
                    return vehicles;
                }
                return [];
            } catch (error) {
                console.error("Failed to fetch user vehicles", error);
                return [];
            }
        };

        const fetchData = async () => {
            setLoading(true);
            const [_, vehicles] = await Promise.all([fetchUserData(), fetchMyVehicles()]);
            const firstVehicleId = vehicles?.[0]?.license_plate || vehicles?.[0]?.vehicle_id;
            await fetchOrderHistory(firstVehicleId);
            setLoading(false);
        };

        fetchData();
    }, []);


    // User editing handlers
    const handleEdit = useCallback(() => {
        setEditedUser(user);
        setIsEditing(true);
    }, [user]);

    const handleSave = useCallback(async () => {
        if (!editedUser.first_name.trim() || !editedUser.email.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editedUser.email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        try {
            const response = await api.post('/Profile/EditUserProfile/', editedUser);
            setUser(response.data);
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error("Failed to save user data", error);
        }

    }, [editedUser]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
        setEditedUser(user);
    }, [user]);

    const handleUserChange = useCallback((e) => {
        const { name, value } = e.target;
        setEditedUser(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleLogout = () => {
        navigate("/logout");
    };

    if (loading || !user) {
        return <ProfileSkeleton />;
    }


    return (
        <div className="min-h-screen bg-gray-50 text-gray-700">
            <Navbar />
            
            <div className="max-w-5xl mx-auto px-4 py-8 pt-24">

                {/* --- User Information Card --- */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* UPDATED: Show profile_pic from new API response */}
                        <div className="relative group">
                            {user.profile_pic ? (
                                <img src={user.profile_pic} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-gray-50 shadow-md" />
                            ) : (
                                <div className="w-28 h-28 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border-4 border-white shadow-md">
                                    <User size={48} />
                                </div>
                            )}
                        </div>

                        <div className="flex-grow text-center md:text-left w-full">
                            {isEditing ? (
                                <div className="grid md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                                    <EditableField
                                        label="Name"
                                        name="first_name"
                                        value={editedUser.first_name}
                                        onChange={handleUserChange}
                                    />
                                    <EditableField
                                        label="Email"
                                        name="email"
                                        value={editedUser.email}
                                        onChange={handleUserChange}
                                        type="email"
                                    />
                                    {/* You can also add mobile_number here if you want it to be editable */}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold text-gray-900">{user.first_name} {user.last_name}</h2>
                                    <div className="flex flex-col md:flex-row gap-4 text-gray-500 items-center md:items-start justify-center md:justify-start">
                                        <p className="flex items-center gap-2">
                                            <Mail size={16} />{user.email}
                                    </p>
                                        <p className="flex items-center gap-2">
                                            <Phone size={16} />{user.mobile_number}
                                    </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6 justify-center md:justify-start">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200"
                                        >
                                            <Save size={18} /> Save Changes
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                                        >
                                            <X size={18} /> Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleEdit}
                                            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg shadow-gray-200"
                                        >
                                            <Edit2 size={18} /> Edit Profile
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                                        >
                                            <LogOut size={18} /> Logout
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* --- My Vehicles Card --- */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Car className="text-blue-600" /> My Vehicles
                            </h3>
                        <button
                            onClick={() => navigate('/vehicle-dashboard')}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                                Manage <ChevronRight size={16} />
                        </button>
                    </div>
                        <div className="space-y-4">
                        {myVehicles.length > 0 ? (
                            myVehicles.slice(0, 3).map(vehicle => (
                                <VehicleCard key={vehicle.id} vehicle={vehicle} />
                            ))
                        ) : (
                                <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300">
                                    <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No vehicles linked yet.</p>
                                    <button 
                                        onClick={() => navigate('/vehicle-dashboard')}
                                        className="mt-4 text-blue-600 font-semibold hover:underline"
                                    >
                                        Add your first vehicle
                                    </button>
                                </div>
                        )}
                        {myVehicles.length > 3 && (
                            <button
                                onClick={() => navigate('/vehicle-dashboard')}
                                    className="w-full py-3 bg-white rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
                            >
                                View {myVehicles.length - 3} More Vehicles
                            </button>
                        )}
                    </div>
                </div>

                {/* --- Order History Card --- */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Clock className="text-orange-600" /> Recent Activity
                            </h3>
                        </div>
                    <div className="space-y-4">
                        {orderHistory.length > 0 ? (
                            orderHistory.map(order => (
                                <OrderHistoryCard key={order.id} order={order} />
                            ))
                        ) : (
                                <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300">
                                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No past orders found.</p>
                                </div>
                        )}
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
