// src/Page/ProfilePage.js
import React, { useState, useCallback, useEffect } from 'react';
import {
    FaUserCircle, FaEnvelope, FaEdit, FaSave,
    FaTimes, FaSignOutAlt, FaPhoneSquareAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { CheckCircle, XCircle, Clock, Car, Bike, Truck, Bus } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from 'axios';

// --- Reusable Editable Field Component ---
const EditableField = React.memo(({ label, name, value, onChange, type = "text" }) => (
    <div className="mb-4">
        <label className="block text-gray-600 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-gray-200 text-gray-700 p-3 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] outline-none focus:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
        />
    </div>
));


const OrderHistoryCard = React.memo(({ order, onBookAgain }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case "COMPLETED":
                return "text-green-600";
            case "CANCELLED":
                return "text-red-600";
            case "EXPIRED":
                return "text-gray-600";
            default:
                return "text-yellow-600";
        }
    };


    const getVehicleIcon = (type) => {
        switch (type) {
            case "bike":
                return <Bike className="w-10 h-10 text-gray-700" />;
            case "car":
                return <Car className="w-10 h-10 text-gray-700" />;
            case "truck":
                return <Truck className="w-10 h-10 text-gray-700" />;
            case "bus":
                return <Bus className="w-10 h-10 text-gray-700" />;
            default:
                return <Car className="w-10 h-10 text-gray-700" />;
        }
    };

    const formattedDate = new Date(order.created_at).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
            {/* Top Section */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {getVehicleIcon(order.vehical_type)}
                    <div>
                        <p className="font-semibold text-gray-800">{order.problem}</p>
                        <p className="text-sm text-gray-500">{formattedDate}</p>
                    </div>
                </div>

                {order.price && (
                    <p className="text-lg font-semibold text-gray-800">₹{order.price}</p>
                )}
            </div>

            {/* Middle Section - Location / Info */}
            <div className="bg-gray-50 rounded-lg p-3 mt-4">
                <div className="flex flex-col">
                    <div className="flex items-start">
                        <div className="flex flex-col items-center mr-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <div className="h-6 w-[2px] bg-gray-300"></div>
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div>
                                <p className="font-semibold text-gray-800">Pickup</p>
                                <p className="text-sm text-gray-600">{order.location}</p>
                            </div>
                            {order.additional_details && (
                                <div>
                                    <p className="font-semibold text-gray-800">Details</p>
                                    <p className="text-sm text-gray-600 italic">{order.additional_details}</p>
                                </div>
                            )}
                            {order.cancellation_reason && (
                                <div>
                                    <p className="font-semibold text-red-700">Reason</p>
                                    <p className="text-sm text-red-600">{order.cancellation_reason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section - Status + Button */}
            <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-1">
                    {order.status === "COMPLETED" && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {order.status === "CANCELLED" && (
                        <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    {order.status === "EXPIRED" && (
                        <Clock className="w-4 h-4 text-gray-600" />
                    )}
                    <p className={`font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    </p>
                </div>

                {/* {order.status === "COMPLETED" && (
          <button
            onClick={() => onBookAgain && onBookAgain(order)}
            className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Book Again
          </button>
        )} */}
            </div>
        </div>
    );
});

const VehicleCard = React.memo(({ vehicle }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Car size={24} className="text-blue-600" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-800 tracking-tight uppercase">{vehicle.license_plate}</p>
                        <p className="text-xs text-blue-600 font-bold uppercase">{vehicle.brand_model}</p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${vehicle.is_insurance_expired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {vehicle.is_insurance_expired ? 'Insurance Expired' : 'Insurance Active'}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-gray-50 p-2 rounded-lg">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Expiry Date</p>
                    <p className="text-sm font-bold text-gray-700">{vehicle.insurance_expiry || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">RC Status</p>
                    <p className="text-sm font-bold text-green-600">{vehicle.rc_status || 'ACTIVE'}</p>
                </div>
            </div>
        </div>
    );
});
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
            } catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };

        const fetchOrderHistory = async () => {
            try {
                const historyResponse = await api.get('/Profile/UserHistory/');
                setOrderHistory(historyResponse.data);
            } catch (error) {
                console.error("Failed to fetch order history", error);
            }
        };

        const fetchMyVehicles = async () => {
            try {
                const email = localStorage.getItem('email');
                const response = await axios.get(`https://mechanic-setu-backend.vercel.app/api/vehicle/my-vehicles?email=${email}`);
                if (response.data.success) {
                    setMyVehicles(response.data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch user vehicles", error);
            }
        };

        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchUserData(), fetchOrderHistory(), fetchMyVehicles()]);
            setLoading(false);
        }

        fetchData();
    }, []);


    // User editing handlers
    const handleEdit = useCallback(() => {
        setEditedUser(user);
        setIsEditing(true);
    }, [user]);

    const handleSave = useCallback(async () => {
        if (!editedUser.first_name.trim() || !editedUser.email.trim()) {
            alert('Please fill in all fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editedUser.email)) {
            alert('Please enter a valid email address');
            return;
        }

        try {
            const response = await api.post('/Profile/EditUserProfile/', editedUser);
            setUser(response.data);
            setIsEditing(false);
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
        return <div className="min-h-screen bg-gray-300 flex items-center justify-center">Loading...</div>;
    }


    return (
        <div className="min-h-screen bg-gray-300 text-gray-700 p-4 sm:p-6 lg:p-8">
            <Navbar />
            <div className="max-w-4xl mx-auto">

                <h1 className="text-3xl font-bold mb-8 text-gray-800">My Profile</h1>

                {/* --- User Information Card --- */}
                <div className="bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        {/* UPDATED: Show profile_pic from new API response */}
                        {user.profile_pic ? (
                            <img src={user.profile_pic} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                        ) : (
                            <FaUserCircle className="text-7xl text-gray-500" />
                        )}
                        <div className="flex-grow text-center sm:text-left">
                            {isEditing ? (
                                <div className="space-y-4">
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
                                <>
                                    <h2 className="text-2xl font-bold text-gray-800">{user.first_name} {user.last_name}</h2>
                                    <p className="text-gray-600 flex items-center justify-center sm:justify-start">
                                        <FaEnvelope className="mr-2" />{user.email}
                                    </p>
                                    <p className="text-gray-600 flex items-center justify-center sm:justify-start">
                                        <FaPhoneSquareAlt className="mr-2" />{user.mobile_number}
                                    </p>
                                    {/* REMOVED: "Member since" as 'date_joined' is not in the new API response */}
                                </>
                            )}
                        </div>
                        {isEditing ? (
                            <div className="flex space-x-2 self-start sm:self-auto">
                                <button
                                    onClick={handleSave}
                                    className="p-3 bg-green-400 flex items-center gap-2 text-white rounded-full shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
                                    aria-label="Save changes"
                                >
                                    <FaSave className="text-white" /> Save
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="p-3 bg-red-400 flex items-center gap-2 text-white rounded-full shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
                                    aria-label="Cancel changes"
                                >
                                    <FaTimes className="text-white" /> Close
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleEdit}
                                className="p-3 bg-gray-300 flex items-center gap-2 text-black rounded-full shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition self-start sm:self-auto"
                                aria-label="Edit profile"
                            >
                                <FaEdit className="text-gray-600" /> Edit
                            </button>
                        )}
                    </div>
                </div>

                {/* --- Account Actions Card --- */}
                <div className="bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6 mb-8 flex flex-col justify-center">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center p-3 bg-red-400 text-white rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition font-bold"
                    >
                        <FaSignOutAlt className="mr-3" /> Logout
                    </button>
                </div>

                {/* --- My Vehicles Card --- */}
                <div className="bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">My Vehicles</h3>
                        <button
                            onClick={() => navigate('/vehicle-dashboard')}
                            className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
                        >
                            Manage All
                        </button>
                    </div>
                    <div className="space-y-4">
                        {myVehicles.length > 0 ? (
                            myVehicles.slice(0, 3).map(vehicle => (
                                <VehicleCard key={vehicle.id} vehicle={vehicle} />
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No vehicles linked to your profile.</p>
                        )}
                        {myVehicles.length > 3 && (
                            <button
                                onClick={() => navigate('/vehicle-dashboard')}
                                className="w-full py-3 bg-gray-100 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-300 transition-all hover:bg-gray-50"
                            >
                                View {myVehicles.length - 3} More Vehicles
                            </button>
                        )}
                    </div>
                </div>

                {/* --- Order History Card --- */}
                <div className="bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6 mb-8">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Order History</h3>
                    <div className="space-y-4">
                        {orderHistory.length > 0 ? (
                            orderHistory.map(order => (
                                <OrderHistoryCard key={order.id} order={order} />
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No past orders found.</p>
                        )}
                    </div>
                </div>


            </div>
        </div>
    );
};

export default ProfilePage;