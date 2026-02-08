import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, Car, Trash2, Eye, Filter,
    RefreshCw, ChevronRight, AlertCircle,
    Calendar, User, MapPin, Shield, Plus, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/apiVercel';
import Navbar from '../../components/Navbar';
import { toast } from 'react-hot-toast';

const VehicleDashboard = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // New Vehicle Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newVehicleNumber, setNewVehicleNumber] = useState('');
    const [addingVehicle, setAddingVehicle] = useState(false);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/vehicle/saved?search=${searchTerm}`);
            if (response.data.success) {
                setVehicles(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            toast.error('Failed to load saved vehicles');
        } finally {
            setLoading(false);
        }
    };

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        const cleaned = newVehicleNumber.toUpperCase().replace(/\s/g, '');

        if (!cleaned) {
            toast.error('Please enter a vehicle number');
            return;
        }

        const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
        if (!vehicleRegex.test(cleaned)) {
            toast.error('Invalid format. Use XX00XX0000');
            return;
        }

        setAddingVehicle(true);
        try {
            const response = await api.post('/vehicle/rc-info', {
                vehicle_number: cleaned
            });

            if (response.data.success) {
                toast.success('Vehicle added and saved successfully!');
                setShowAddModal(false);
                setNewVehicleNumber('');
                fetchVehicles(); // Refresh the list
            } else {
                toast.error(response.data.message || 'Failed to fetch RC info');
            }
        } catch (error) {
            console.error('Error adding vehicle:', error);
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setAddingVehicle(false);
        }
    };

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchVehicles();
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [searchTerm]);

    const handleDelete = async (vehicleId, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this vehicle record?')) return;

        try {
            const response = await api.delete(`/vehicle/saved/${vehicleId}`);
            if (response.data.success) {
                toast.success('Vehicle deleted successfully');
                setVehicles(vehicles.filter(v => v.vehicleId !== vehicleId));
            }
        } catch (error) {
            toast.error('Failed to delete vehicle');
        }
    };

    const fetchVehicleDetails = async (identifier) => {
        if (!identifier) return;
        setDetailLoading(true);
        try {
            const response = await api.get(`/vehicle/saved/${identifier}`);
            if (response.data.success) {
                // Merge data from both top level and nested 'data' key to be consistent with RCInfo
                const combinedData = {
                    ...(response.data.data || {}),
                    ...response.data
                };
                setSelectedVehicle(combinedData);
            } else {
                toast.error(response.data.message || 'Failed to load vehicle details');
            }
        } catch (error) {
            console.error('Error fetching details:', error);
            const msg = error.response?.data?.message || 'Server error loading details';
            toast.error(msg);
        } finally {
            setDetailLoading(false);
        }
    };

    const DetailItem = ({ icon: Icon, label, value }) => (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Icon size={18} />
            </div>
            <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono">{label}</p>
                <p className="text-sm font-bold text-gray-700">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-8 pt-28">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Vehicle Dashboard</h1>
                        <p className="text-gray-500 font-medium">Manage and monitor all your saved RC information</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={20} /> Add New Vehicle
                        </button>

                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by Plate, Model or Owner..."
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all outline-none font-medium shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* List Section */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-600 flex items-center gap-2">
                                <Car size={18} /> {vehicles.length} Saved Vehicles
                            </h3>
                            <button onClick={fetchVehicles} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-400">
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {loading && vehicles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
                                <RefreshCw className="text-blue-500 animate-spin mb-4" size={40} />
                                <p className="text-gray-400 font-bold">Synchronizing Database...</p>
                            </div>
                        ) : vehicles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                <Search className="text-gray-300 mb-4" size={64} />
                                <p className="text-gray-500 font-bold text-xl">No vehicles found</p>
                                <p className="text-gray-400 text-sm">Try searching for a different registration number</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                {vehicles.map((v) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={v.id || v.vehicleId}
                                        onClick={() => fetchVehicleDetails(v.vehicleId || v.license_plate || v.id)}
                                        className={`group relative bg-white p-5 rounded-3xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-xl ${(selectedVehicle?.vehicleId === v.vehicleId || selectedVehicle?.id === v.id) ? 'border-blue-500' : 'border-white hover:border-blue-100'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-5">
                                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                                    {v.vehicle_image ? (
                                                        <img src={v.vehicle_image} className="w-full h-full object-contain p-1" />
                                                    ) : (
                                                        <Car size={32} />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-gray-900 tracking-wider uppercase">{v.vehicleId || v.license_plate}</h4>
                                                    <p className="text-sm font-bold text-blue-600">{v.brand_model}</p>
                                                    <p className="text-xs text-gray-400 font-medium">Owner: {v.owner_name}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={(e) => handleDelete(v.vehicleId || v.id, e)}
                                                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                                <div className="p-3 text-gray-300 group-hover:text-blue-500 transition-colors">
                                                    <ChevronRight size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detail Preview Section */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28">
                            <AnimatePresence mode="wait">
                                {!selectedVehicle ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="bg-gray-100 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-10 text-center"
                                    >
                                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300 shadow-sm">
                                            <Eye size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-500 mb-2">Select a Vehicle</h3>
                                        <p className="text-gray-400 text-sm">Click on any vehicle from the list to view its complete technical profile</p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden"
                                    >
                                        <div className="relative h-48 bg-gray-900">
                                            {selectedVehicle.vehicle_image ? (
                                                <img src={selectedVehicle.vehicle_image} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
                                                    <Car size={80} className="text-white/20" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                {selectedVehicle.rc_status || 'ACTIVE'}
                                            </div>
                                        </div>

                                        <div className="p-8">
                                            <div className="mb-8">
                                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">{selectedVehicle.brand_name}</p>
                                                <h2 className="text-3xl font-black text-gray-900 mb-1">{selectedVehicle.brand_model}</h2>
                                                <div className="flex items-center text-gray-400 font-mono text-lg font-bold">
                                                    <MapPin size={18} className="mr-2" /> {selectedVehicle.vehicleId || selectedVehicle.license_plate}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                <DetailItem icon={User} label="Owner Name" value={selectedVehicle.owner_name} />
                                                <DetailItem icon={Shield} label="Insurance Upto" value={selectedVehicle.insurance_expiry} />
                                                <DetailItem icon={Calendar} label="Reg. Date" value={selectedVehicle.registration_date} />
                                                <DetailItem icon={RefreshCw} label="Fuel Type" value={selectedVehicle.fuel_type} />
                                            </div>

                                            <div className="flex gap-2 mt-8">
                                                <button
                                                    onClick={() => setSelectedVehicle(null)}
                                                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                                                >
                                                    Close
                                                </button>
                                                <Link
                                                    to={`/dashboard/vehicles/${selectedVehicle.vehicleId || selectedVehicle.license_plate}`}
                                                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    Open Full Profile <ChevronRight size={18} />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                </div>
            </div>

            {/* Add New Vehicle Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
                        >
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Car size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900">Add New Vehicle</h3>
                                <p className="text-gray-500 text-sm">Enter the registration number to fetch and save RC details.</p>
                            </div>

                            <form onSubmit={handleAddVehicle}>
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Registration Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. GJ27AA3978"
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all outline-none font-black text-xl tracking-widest uppercase placeholder:text-gray-300"
                                        value={newVehicleNumber}
                                        onChange={(e) => setNewVehicleNumber(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={addingVehicle}
                                    className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all flex items-center justify-center gap-2 ${addingVehicle ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-200'
                                        }`}
                                >
                                    {addingVehicle ? (
                                        <>
                                            <RefreshCw size={20} className="animate-spin" /> Fetching Details...
                                        </>
                                    ) : (
                                        'Fetch & Save RC Information'
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="w-full mt-3 py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VehicleDashboard;
