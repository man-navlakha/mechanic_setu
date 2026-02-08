import React, { useState } from 'react';
import { Search, Car, FileText, CheckCircle, AlertCircle, Calendar, MapPin, User, Shield, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/apiVercel';
import Navbar from '../components/Navbar';

const RCInfo = () => {
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [rcData, setRcData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        const cleanedVehicleNumber = vehicleNumber.toUpperCase().replace(/\s/g, '');

        if (!cleanedVehicleNumber) {
            setError('Please enter a vehicle number');
            return;
        }

        // Validation regex for XX00XX0000 format
        // State(2 letters) + RTO(1-2 digits) + Series(0-3 letters) + Unique(4 digits)
        const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;

        if (!vehicleRegex.test(cleanedVehicleNumber)) {
            setError('Invalid format. Please use XX00XX0000 (e.g. GJ27AA3978)');
            return;
        }

        setLoading(true);
        setError(null);
        setRcData(null);

        try {
            const response = await api.post('/vehicle/rc-info', {
                vehicle_number: cleanedVehicleNumber
            });

            if (response.data.success) {
                // Merge data from both top level and nested 'data' key to be safe
                const combinedData = {
                    ...(response.data.data || {}),
                    ...response.data
                };
                setRcData(combinedData);
            } else {
                setError(response.data.message || 'Failed to fetch RC information');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const InfoCard = ({ icon: Icon, label, value, colorClass = "blue" }) => {
        // Map color class to Tailwind classes properly instead of dynamic template strings for reliability
        const colorStyles = {
            blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
            indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
            green: { bg: 'bg-green-50', text: 'text-green-600' },
            amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
            orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
            red: { bg: 'bg-red-50', text: 'text-red-600' },
            gray: { bg: 'bg-gray-50', text: 'text-gray-600' }
        };

        const style = colorStyles[colorClass] || colorStyles.blue;

        return (
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${style.bg} ${style.text}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-bold text-gray-800 break-words">{value || 'N/A'}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-12 pt-28">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">RC Information Search</h1>
                    <p className="text-lg text-gray-600">Enter vehicle registration number to get detailed RC information</p>
                </div>

                <div className="max-w-2xl mx-auto mb-12">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="e.g. GJ27AA3978"
                            className="w-full pl-12 pr-32 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-lg font-bold tracking-widest uppercase"
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                        <button
                            type="submit"
                            disabled={loading}
                            className={`absolute right-2 top-2 bottom-2 px-6 rounded-xl font-bold text-white shadow-lg transition-all ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                                }`}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-700 mb-8">
                        <AlertCircle size={24} />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {rcData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        {/* Summary Header */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl mb-8 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                            <div className="w-full md:w-64 h-40 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner shrink-0">
                                {rcData.vehicle_image ? (
                                    <img
                                        src={rcData.vehicle_image}
                                        alt={rcData.brand_model}
                                        className="w-full h-full object-contain p-2 hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white">
                                        <Car size={64} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center">
                                        <CheckCircle size={12} className="mr-1" /> {rcData.rc_status || 'ACTIVE'}
                                    </span>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                        {rcData.class || 'N/A'}
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                                        {rcData.fuel_type || 'N/A'}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 mb-1">{rcData.license_plate || 'N/A'}</h2>
                                <p className="text-xl font-bold text-blue-600 mb-1">{rcData.brand_model || 'N/A'}</p>
                                <p className="text-gray-500 font-medium">{rcData.brand_name || 'N/A'}</p>
                            </div>
                            <div className="text-right border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8 flex flex-col items-center md:items-end">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Registration Date</p>
                                <p className="text-lg font-bold text-gray-800 mb-4">{rcData.registration_date || 'N/A'}</p>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Owner Count</p>
                                <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
                                    {rcData.owner_count || '...'}
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <InfoCard icon={User} label="Owner Name" value={rcData.owner_name} colorClass="indigo" />
                            <InfoCard icon={User} label="Father's Name" value={rcData.father_name} colorClass="indigo" />
                            <InfoCard icon={Shield} label="Insurance Expiry" value={rcData.insurance_expiry} colorClass="green" />
                            <InfoCard icon={Shield} label="Insurance Company" value={rcData.insurance_company} colorClass="green" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <InfoCard icon={Shield} label="Insurance Policy" value={rcData.insurance_policy} colorClass="green" />
                            <InfoCard icon={Calendar} label="Tax Valid Upto" value={rcData.tax_upto} colorClass="amber" />
                            <InfoCard icon={FileText} label="PUCC Valid Upto" value={rcData.pucc_upto} colorClass="purple" />
                            <InfoCard icon={FileText} label="PUCC Number" value={rcData.pucc_number} colorClass="purple" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                            <InfoCard icon={MapPin} label="Present Address" value={rcData.present_address} colorClass="red" />
                            <InfoCard icon={MapPin} label="Permanent Address" value={rcData.permanent_address} colorClass="red" />
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden mb-12">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                                <h3 className="font-bold text-gray-800 flex items-center">
                                    <Car className="mr-2" size={18} /> Additional Technical Specifications
                                </h3>
                            </div>
                            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Engine Number</p>
                                    <p className="font-mono text-sm font-bold truncate">{rcData.engine_number}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Chassis Number</p>
                                    <p className="font-mono text-sm font-bold truncate">{rcData.chassis_number}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Cubic Capacity</p>
                                    <p className="font-bold">{rcData.cubic_capacity} cc</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Norms</p>
                                    <p className="font-bold">{rcData.norms}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Seating Capacity</p>
                                    <p className="font-bold">{rcData.seating_capacity}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Vehicle Age</p>
                                    <p className="font-bold">{rcData.vehicle_age || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Is Financed</p>
                                    <p className="font-bold">{rcData.is_financed === "1" ? "YES" : "NO"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Financer</p>
                                    <p className="font-bold">{rcData.financer || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Cylinders</p>
                                    <p className="font-bold">{rcData.cylinders || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Color</p>
                                    <p className="font-bold">{rcData.color || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">NOC Details</p>
                                    <p className="font-bold">{rcData.noc_details || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Source</p>
                                    <p className="font-bold text-blue-600">{rcData.source}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default RCInfo;
