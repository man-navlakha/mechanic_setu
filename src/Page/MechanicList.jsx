import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, Filter, MapPin, Phone, Clock,
    CheckCircle, XCircle, Edit, Eye, Trash2, Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const MechanicList = () => {
    const [mechanics, setMechanics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        verified: '',
        status: ''
    });

    const fetchMechanics = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.verified) queryParams.append('verified', filters.verified);
            if (filters.status) queryParams.append('status', filters.status);

            const response = await fetch(`http://localhost:3000/api/ms-mechanics?${queryParams.toString()}`);
            const data = await response.json();

            if (data.success) {
                setMechanics(data.mechanics);
            } else {
                toast.error('Failed to fetch mechanics');
            }
        } catch (error) {
            console.error('Error fetching mechanics:', error);
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMechanics();
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Mechanics Directory</h1>
                        <p className="text-gray-500 mt-1">Manage and view all registered mechanics</p>
                    </div>
                    <Link
                        to="/ms"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Register New
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Filter size={18} />
                        <span className="font-medium text-sm">Filters:</span>
                    </div>

                    <select
                        name="verified"
                        value={filters.verified}
                        onChange={handleFilterChange}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 outline-none"
                    >
                        <option value="">All Verification Status</option>
                        <option value="true">Verified</option>
                        <option value="false">Unverified</option>
                    </select>

                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 outline-none"
                    >
                        <option value="">All Online Status</option>
                        <option value="ONLINE">Online</option>
                        <option value="OFFLINE">Offline</option>
                    </select>
                </div>

                {/* List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading mechanics...</div>
                    ) : mechanics.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                <Search size={24} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No mechanics found</h3>
                            <p className="text-gray-500 mt-1">Try adjusting your filters or add a new mechanic.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                                    <tr>
                                        <th className="px-6 py-4">Mechanic / Shop</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Verification</th>
                                        <th className="px-6 py-4">Location</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {mechanics.map((mechanic) => (
                                        <tr key={mechanic.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                        {mechanic.profile_photo ? (
                                                            <img src={mechanic.profile_photo} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold text-xs">IMG</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{mechanic.shop_name || 'Generic Shop'}</div>
                                                        <div className="text-xs text-gray-500">{mechanic.full_name || 'No Name'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                                    ${mechanic.status === 'ONLINE'
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${mechanic.status === 'ONLINE' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                    {mechanic.status || 'UNKNOWN'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {mechanic.is_verified ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100">
                                                        <CheckCircle size={12} /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-orange-700 bg-orange-50 border border-orange-100">
                                                        <XCircle size={12} /> Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-gray-500" title={mechanic.shop_address}>
                                                    <MapPin size={14} className="flex-shrink-0" />
                                                    <span className="truncate max-w-[150px]">{mechanic.shop_address || 'No Address'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/ms/view/${mechanic.id}`}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    <Link
                                                        to={`/ms/edit/${mechanic.id}`}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Edit Mechanic"
                                                    >
                                                        <Edit size={18} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MechanicList;
