import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, UserCircle, AlertTriangle, Fuel, Truck, Calendar, ChevronDown } from 'lucide-react';
import api from '../utils/api';

export default function LeftPanel({ activeJob }) {
    const navigate = useNavigate();
    const [orderHistory, setOrderHistory] = useState([]);
    const [user, setUser] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchOrderHistory = async () => {
            try {
                const historyResponse = await api.get('/Profile/UserHistory/');
                const recentOrders = historyResponse.data.slice(-5);
                setOrderHistory(recentOrders);
            } catch (error) {
                console.error("Failed to fetch order history", error);
            }
        };

        const fetchUserData = async () => {
            try {
                const userResponse = await api.get('/Profile/UserProfile/');
                setUser(userResponse.data);
                if (userResponse.data.mobile_number === null) {
                    navigate('/form');
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };

        const fetchVehicles = async () => {
            try {
                const vehiclesResponse = await api.get('/vehicle/my-vehicles');
                const payload = vehiclesResponse.data;
                const vehicleList = Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload)
                        ? payload
                        : [];

                setVehicles(vehicleList);

                // Set the first vehicle as default selected if available
                if (vehicleList.length > 0) {
                    setSelectedVehicle(vehicleList[0]);
                } else {
                    setSelectedVehicle(null);
                }
            } catch (error) {
                console.error("Failed to fetch vehicles", error);
                setVehicles([]);
                setSelectedVehicle(null);
            }
        };

        fetchOrderHistory();
        fetchUserData();
        fetchVehicles();
    }, [navigate]);

    const handleGoToActiveJob = () => {
        if (activeJob && activeJob.request_id) {
            navigate(`/mechanic-found/${activeJob.request_id}`);
        }
    };

    const handleServiceSelect = (service) => {
        // Navigate to service request page with the selected service and vehicle
        navigate(`/request?service=${service.toLowerCase().replace(' ', '-')}&vehicleId=${selectedVehicle?.id || ''}`);
    };

    const handleVehicleSelect = (vehicle) => {
        setSelectedVehicle(vehicle);
        setIsVehicleDropdownOpen(false);
    };

    const services = [
        { name: "Emergency Breakdown", icon: AlertTriangle, color: "text-red-500", bgColor: "bg-red-50" },
        { name: "Schedule service", icon: Calendar, color: "text-blue-500", bgColor: "bg-blue-50" },
        { name: "Fuel delivery", icon: Fuel, color: "text-green-500", bgColor: "bg-green-50" },
        { name: "Tow service", icon: Truck, color: "text-purple-500", bgColor: "bg-purple-50" }
    ];

    // Get vehicle display name
    const getVehicleDisplayName = (vehicle) => {
        if (!vehicle) return "Select Vehicle";
        if (vehicle.brand_model) return vehicle.brand_model;

        const makeModel = [vehicle.make, vehicle.model].filter(Boolean).join(' ');
        if (makeModel) return makeModel;

        return vehicle.license_plate || vehicle.vehicle_id || "Select Vehicle";
    };

    return (
        <aside className="
      w-full bg-gray-300 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-4 flex flex-col items-center justify-start space-y-4
      md:static md:h-auto md:w-80
      fixed pb-8 bottom-0 left-1/2 -translate-x-1/2 z-50
      md:translate-x-0 md:bottom-auto">

            {/* User Info */}
            <div className="flex items-center w-full gap-3 p-2 bg-gray-200 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF]">
                {user?.profile_pic ? (
                    <img src={user.profile_pic} alt="User Avatar" className="w-10 h-10 rounded-full" />
                ) : (
                    <UserCircle className="w-10 h-10 text-gray-500" />
                )}
                <div className="flex-1">
                    <p className="font-bold text-gray-800">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                    onClick={() => navigate("/profile")}
                    className="p-2 bg-gray-300 rounded-full shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition">
                    <ArrowRight size={16} className="text-gray-600" />
                </button>
            </div>

            {/* Conditional Button: Active Job or Request Now */}
            {activeJob ? (
                <button
                    className="w-full bg-green-500 text-white py-3 px-4 rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] font-semibold hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition flex items-center justify-between"
                    onClick={handleGoToActiveJob}
                >
                    <span>Job in Progress</span>
                    <ArrowRight size={20} />
                </button>
            ) : (
                <button
                    className="w-full bg-blue-500 text-white py-3 rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] font-semibold hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
                    onClick={() => navigate("/request")}
                >
                    Request Now
                </button>
            )}

            {/* Past Order Card */}
            <div className="hidden md:flex w-full bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] flex-col p-4 text-gray-600 text-sm">
                <h3 className="font-bold text-xl mb-3 text-gray-800">Recent Orders</h3>
                <div className="overflow-auto max-h-[180px] space-y-3 px-3 py-1">
                    {orderHistory.length > 0 ? (
                        orderHistory.map(order => (
                            <div key={order.id} className="p-3 bg-gray-200 rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF]">
                                <p className="font-semibold text-gray-700">{order.problem}</p>
                                <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">No recent orders</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Services Section */}
            <div className="hidden md:flex w-full bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] flex-col p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-xl text-gray-800">Quick Services</h3>
                    
                    {/* Vehicle Dropdown */}
                    
                </div>
                

<div className="relative">
                        <button
                            onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
                            className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-300 px-2 py-1 rounded-full w-full h-full my-2 border-2 border-gray-500/30 transition-all"
                        >
                            <span className="truncate max-w-[100px]">
                                {selectedVehicle ? getVehicleDisplayName(selectedVehicle) : 'Select Vehicle'}
                            </span>
                            <ChevronDown size={14} className={`transition-transform ${isVehicleDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isVehicleDropdownOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsVehicleDropdownOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-gray-200 rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] py-2 z-50">
                                    {vehicles.length > 0 ? (
                                        vehicles.map((vehicle) => (
                                            <button
                                                key={vehicle.id}
                                                onClick={() => handleVehicleSelect(vehicle)}
                                                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-300 transition-colors ${
                                                    selectedVehicle?.id === vehicle.id ? 'bg-gray-300 font-semibold' : ''
                                                }`}
                                            >
                                                {getVehicleDisplayName(vehicle)}
                                                {(vehicle.license_plate || vehicle.vehicle_id || vehicle.registration_number) && (
                                                    <span className="block text-gray-500 text-[10px]">
                                                        {vehicle.license_plate || vehicle.vehicle_id || vehicle.registration_number}
                                                    </span>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-xs text-gray-500">
                                            No vehicles found
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                {/* Emergency Breakdown Highlight */}
                <div className="mb-3 p-3 bg-red-50 rounded-xl border-2 border-gray-500/30 ">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span className="font-semibold text-gray-700">Emergency Breakdown</span>
                    </div>
                </div>

                {/* Service Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {services.map((service) => (
                        <button
                            key={service.name}
                            onClick={() => handleServiceSelect(service.name)}
                            disabled={!selectedVehicle}
                            className={`p-3 bg-gray-200 rounded-xl border-2 border-gray-500/30 transition-all duration-200 ${service.bgColor} ${
                                !selectedVehicle ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <div className="flex flex-col items-center text-center gap-1">
                                <service.icon className={`w-6 h-6 ${service.color}`} />
                                <span className="text-xs font-medium text-gray-700">{service.name}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Vehicle Info Footer */}
                <div className="mt-3 pt-2 border-t border-gray-400 border-opacity-20">
                    <p className="text-xs text-gray-500 text-center">
                        {selectedVehicle 
                            ? `Selected: ${getVehicleDisplayName(selectedVehicle)}`
                            : 'Please select a vehicle to continue'
                        }
                    </p>
                </div>
            </div>

            {/* Mobile Quick Actions - Only visible on mobile */}
            <div className="md:hidden w-full pb-10 mb-4">
                {/* Mobile Vehicle Selector */}
                <div className="mb-2 relative">
                    <button
                        onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
                        className="w-full flex items-center justify-between gap-1 text-xs font-semibold text-gray-500 bg-gray-300 px-3 py-2 rounded-xl shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF]"
                    >
                        <span className="truncate">
                            {selectedVehicle ? getVehicleDisplayName(selectedVehicle) : 'Select Vehicle'}
                        </span>
                        <ChevronDown size={14} className={`transition-transform ${isVehicleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Mobile Dropdown Menu */}
                    {isVehicleDropdownOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-40"
                                onClick={() => setIsVehicleDropdownOpen(false)}
                            />
                            <div className="absolute left-0 right-0 mt-2 bg-gray-200 rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] py-2 z-50">
                                {vehicles.length > 0 ? (
                                    vehicles.map((vehicle) => (
                                        <button
                                            key={vehicle.id}
                                            onClick={() => handleVehicleSelect(vehicle)}
                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-300 transition-colors ${
                                                selectedVehicle?.id === vehicle.id ? 'bg-gray-300 font-semibold' : ''
                                            }`}
                                        >
                                            {getVehicleDisplayName(vehicle)}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-sm text-gray-500">
                                        No vehicles found
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Mobile Service Grid */}
                <div className="grid grid-cols-4 gap-2">
                    {services.map((service) => (
                        <button
                            key={service.name}
                            onClick={() => handleServiceSelect(service.name)}
                            disabled={!selectedVehicle}
                            className={`p-2 bg-gray-200 rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] active:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition ${
                                !selectedVehicle ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <service.icon className={`w-5 h-5 mx-auto ${service.color}`} />
                            <span className="text-[10px] font-medium text-gray-700 block mt-1">{service.name.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
}
