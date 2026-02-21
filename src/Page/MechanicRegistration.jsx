import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
import {
    User, Phone, Mail, Store, MapPin, Map, FileText,
    CheckCircle, Camera, CreditCard, ChevronRight, ChevronLeft,
    Upload, AlertCircle, Check, Loader, Trash2, Wrench, Car, Bike, Truck, X, Zap, Bus, Fuel, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

const CLOUDINARY_CLOUD_NAME = 'dxv7sjeto';
const CLOUDINARY_API_KEY = '628314756489181';
const CLOUDINARY_API_SECRET = 'ktyyZQdDi0_cwK_WMUP96Uhw1qg';

// --- Helper Functions ---
const generateSHA1 = async (string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const uploadToCloudinary = async (file) => {
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const paramsToSign = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = await generateSHA1(paramsToSign);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
};

// --- Reusable Components ---

const InputField = ({ label, name, type = 'text', icon: Icon, placeholder, value, onChange }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon size={18} />
            </div>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
            />
        </div>
    </div>
);

const Toggle = ({ label, name, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
        onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}
    >
        <div>
            <h4 className="font-medium text-gray-900">{label}</h4>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </div>
    </div>
);

const ImageUploadField = ({ label, name, icon: Icon, value, onChange }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadToCloudinary(file);
            onChange(url);
            toast.success(`${label} uploaded!`);
        } catch (err) {
            console.error(err);
            toast.error('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        onChange('');
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>

            {value ? (
                <div className="relative w-full h-40 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={value} alt={label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            onClick={handleRemove}
                            className="bg-white/20 hover:bg-red-500 hover:text-white text-white backdrop-blur-sm p-2 rounded-full transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                    <div className="absolute bottom-2 right-2 flex gap-1">
                        <a href={value} target="_blank" rel="noreferrer" className="bg-black/50 text-white text-[10px] px-2 py-1 rounded">View</a>
                    </div>
                </div>
            ) : (
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/50">
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={uploading}
                    />
                    <div className="text-center">
                        {uploading ? (
                            <div className="flex flex-col items-center justify-center py-2">
                                <Loader size={24} className="text-blue-500 animate-spin mb-2" />
                                <span className="text-sm text-gray-500">Uploading...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                    <Upload size={20} />
                                </div>
                                <p className="text-sm font-medium text-gray-700">Click to upload {label}</p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 5MB</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- NEW COMPONENT: VehicleMultiSelect ---
const VehicleMultiSelect = ({ label, value, onChange }) => {
    const predefinedOptions = [
        { id: 'scooter', label: 'Scooter', icon: Bike },
        { id: 'bike', label: 'Bike', icon: Bike },
        { id: 'rickshaw', label: 'Rickshaw', icon: Car },
        { id: 'car', label: 'Car', icon: Car },
        { id: 'bus', label: 'Bus', icon: Bus },
        { id: 'truck', label: 'Truck', icon: Truck },
        { id: 'jcb', label: 'JCB', icon: Truck }
    ];

    const currentValues = value ? value.split(',').map(s => s.trim().toLowerCase()) : [];
    const [customText, setCustomText] = useState('');
    const [isOtherChecked, setIsOtherChecked] = useState(false);

    useEffect(() => {
        if (value) {
            const parts = value.split(',').map(s => s.trim());
            const predefinedLabels = predefinedOptions.map(o => o.label.toLowerCase());
            const others = parts.filter(p => !predefinedLabels.includes(p.toLowerCase()));
            if (others.length > 0) {
                setIsOtherChecked(true);
                setCustomText(others.join(', '));
            }
        }
    }, []);

    const handleOptionClick = (optionLabel) => {
        const parts = value ? value.split(',').map(s => s.trim()) : [];
        const exists = parts.some(p => p.toLowerCase() === optionLabel.toLowerCase());

        let newParts;
        if (exists) {
            newParts = parts.filter(p => p.toLowerCase() !== optionLabel.toLowerCase());
        } else {
            newParts = [...parts, optionLabel];
        }
        onChange(newParts.join(', '));
    };

    const handleOtherToggle = () => {
        if (isOtherChecked) {
            setIsOtherChecked(false);
            setCustomText('');
            const parts = value ? value.split(',').map(s => s.trim()) : [];
            const knownLabels = predefinedOptions.map(o => o.label.toLowerCase());
            const newParts = parts.filter(p => knownLabels.includes(p.toLowerCase()));
            onChange(newParts.join(', '));
        } else {
            setIsOtherChecked(true);
        }
    };

    const handleCustomTextChange = (e) => {
        const text = e.target.value;
        setCustomText(text);

        const parts = value ? value.split(',').map(s => s.trim()) : [];
        const knownLabels = predefinedOptions.map(o => o.label.toLowerCase());
        const validKnown = parts.filter(p => knownLabels.includes(p.toLowerCase()));

        if (text) validKnown.push(text);
        onChange(validKnown.join(', '));
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {predefinedOptions.map((option) => {
                    const isSelected = currentValues.includes(option.label.toLowerCase());
                    const Icon = option.icon;
                    return (
                        <div
                            key={option.id}
                            onClick={() => handleOptionClick(option.label)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all duration-200 h-20
                                ${isSelected ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        >
                            <Icon size={20} className="mb-1" />
                            <span className="text-xs font-medium">{option.label}</span>
                        </div>
                    );
                })}

                <div
                    onClick={handleOtherToggle}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all duration-200 h-20
                        ${isOtherChecked ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                    <span className="text-xl font-bold mb-1">...</span>
                    <span className="text-xs font-medium">Other</span>
                </div>
            </div>

            {isOtherChecked && (
                <div className="mt-2">
                    <input
                        type="text"
                        value={customText}
                        onChange={handleCustomTextChange}
                        placeholder="Specify other types (e.g. Tractor, Crane)"
                        className="w-full px-4 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        autoFocus
                    />
                </div>
            )}
        </div>
    );
};

// --- NEW COMPONENT: FuelSelector ---
const FuelSelector = ({ value, onChange }) => {
    const options = ['Petrol', 'Diesel', 'EV Charging'];
    const currentValues = value ? value.split(',').map(s => s.trim().toLowerCase()) : [];

    const toggle = (option) => {
        let newValues;
        if (currentValues.includes(option.toLowerCase())) {
            newValues = currentValues.filter(v => v !== option.toLowerCase());
        } else {
            newValues = [...currentValues, option.toLowerCase()];
        }
        onChange(newValues.join(', '));
    };

    return (
        <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Fuel size={18} />
                </div>
                <h4 className="font-medium text-gray-900">Fuel Delivery</h4>
            </div>

            <div className="flex flex-wrap gap-3">
                {options.map(opt => {
                    const isSelected = currentValues.includes(opt.toLowerCase());
                    return (
                        <button
                            key={opt}
                            onClick={() => toggle(opt)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                                ${isSelected
                                    ? 'bg-orange-500 text-white border-orange-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-orange-50 hover:border-orange-200'}`}
                        >
                            {isSelected && <Check size={14} className="inline mr-1" />}
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// --- NEW COMPONENT: SkillsInput ---
const SkillsInput = ({ value, onChange }) => {
    const commonSkills = [
        'Puncture', 'Engine', 'Oil Change', 'Battery', 'Brakes',
        'Suspension', 'AC Repair', 'Electrical', 'Washing', 'Denting/Painting'
    ];

    const currentSkills = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

    const toggleSkill = (skill) => {
        let newSkills;
        if (currentSkills.includes(skill)) {
            newSkills = currentSkills.filter(s => s !== skill);
        } else {
            newSkills = [...currentSkills, skill];
        }
        onChange(newSkills.join(', '));
    };

    const handleChange = (e) => {
        onChange(e.target.value);
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Skills</label>
            <div className="relative mb-3">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Wrench size={18} />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    placeholder="e.g. puncture, engine (type or select below)"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                />
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2">
                {commonSkills.map(skill => {
                    const isActive = currentSkills.includes(skill);
                    return (
                        <button
                            key={skill}
                            onClick={() => toggleSkill(skill)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border
                                ${isActive
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                            {isActive ? '✓ ' : '+ '}{skill}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// --- NEW COMPONENT: LocationPicker ---
const LocationPicker = ({ label, lat, lng, onChange }) => {
    const [position, setPosition] = useState(null);

    // Initialize position from props if available
    useEffect(() => {
        if (lat && lng) {
            setPosition([lat, lng]);
        }
    }, [lat, lng]);

    const MapEvents = () => {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                setPosition([lat, lng]);
                onChange(lat, lng);
            },
        });
        return null;
    };

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setPosition([latitude, longitude]);
                    onChange(latitude, longitude);
                },
                (err) => {
                    console.error(err);
                    toast.error('Unable to retrieve your location');
                }
            );
        } else {
            toast.error('Geolocation is not supported by your browser');
        }
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                >
                    <MapPin size={14} /> Use My Current Location
                </button>
            </div>

            <div className="h-64 rounded-xl overflow-hidden border border-gray-200 z-0 relative">
                <MapContainer
                    center={position || [20.5937, 78.9629]} // Default to India center if no position
                    zoom={position ? 15 : 5}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                    key={position ? `${position[0]}-${position[1]}` : 'default'} // Force re-render on position change to re-center
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {position && <Marker position={position} />}
                    <MapEvents />
                </MapContainer>
            </div>

            {/* Manual Lat/Lng Inputs */}
            <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 block mb-1">Latitude</span>
                    <input
                        type="number"
                        value={lat || ''}
                        onChange={(e) => onChange(e.target.value, lng)}
                        placeholder="0.000000"
                        className="w-full bg-transparent font-medium text-gray-900 border-none p-0 focus:ring-0 text-sm outline-none"
                        step="any"
                    />
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 block mb-1">Longitude</span>
                    <input
                        type="number"
                        value={lng || ''}
                        onChange={(e) => onChange(lat, e.target.value)}
                        placeholder="0.000000"
                        className="w-full bg-transparent font-medium text-gray-900 border-none p-0 focus:ring-0 text-sm outline-none"
                        step="any"
                    />
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const MechanicRegistration = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID for edit mode
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        // Personal
        full_name: '',
        phone: '',
        email: '',
        notes: '',

        // Shop
        shop_name: '',
        shop_address: '',
        shop_latitude: '',
        shop_longitude: '',
        shop_google_map_link: '',
        special_skills: '',
        vehicle_type: '',
        electric: false,
        electric_vehicle_types: '',
        fuel_delivery_types: '',
        services_offered: '',
        working_hours: '',

        // Documents & Status
        user_id: '',
        profile_photo: '',
        shop_photo: '',
        KYC_document: '',
        adhar_card: '',
        is_verified: false,
        status: 'OFFLINE',
        yes_for_startup: false,
        current_latitude: '',
        current_longitude: '',
    });

    // Check for Edit Mode
    useEffect(() => {
        if (id) {
            setIsEditMode(true);
            const fetchMechanic = async () => {
                try {
                    const response = await fetch(`http://localhost:3000/api/ms-mechanics/${id}`);
                    const data = await response.json();
                    if (data.success && data.mechanic) {
                        // Merge fetched data with default state to ensure all fields exist
                        setFormData(prev => ({
                            ...prev,
                            ...data.mechanic,
                            // Ensure boolean conversions or specific field handling if API returns different types
                            shop_latitude: data.mechanic.shop_latitude || '',
                            shop_longitude: data.mechanic.shop_longitude || '',
                            current_latitude: data.mechanic.current_latitude || '',
                            current_longitude: data.mechanic.current_longitude || '',
                            electric: Boolean(data.mechanic.electric),
                            yes_for_startup: Boolean(data.mechanic.yes_for_startup),
                            is_verified: Boolean(data.mechanic.is_verified)
                        }));
                    } else {
                        toast.error('Mechanic not found');
                        navigate('/ms/list');
                    }
                } catch (error) {
                    console.error('Error fetching mechanic for edit:', error);
                    toast.error('Could not load mechanic details');
                }
            };
            fetchMechanic();
        }
    }, [id, navigate]);

    const totalSteps = 3;

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
    };

    const handlePrev = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Clean up empty fields
            const payload = { ...formData };

            // Convert numbers
            if (payload.shop_latitude) payload.shop_latitude = parseFloat(payload.shop_latitude);
            if (payload.shop_longitude) payload.shop_longitude = parseFloat(payload.shop_longitude);
            if (payload.current_latitude) payload.current_latitude = parseFloat(payload.current_latitude);
            if (payload.current_longitude) payload.current_longitude = parseFloat(payload.current_longitude);

            if (payload.current_latitude) payload.current_latitude = parseFloat(payload.current_latitude);
            if (payload.current_longitude) payload.current_longitude = parseFloat(payload.current_longitude);

            const url = isEditMode
                ? `http://localhost:3000/api/ms-mechanics/${id}`
                : 'http://localhost:3000/api/ms-mechanics';

            const method = isEditMode ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(isEditMode ? 'Mechanic updated successfully!' : 'Mechanic registered successfully!');
                if (!isEditMode) {
                    setFormData({
                        full_name: '', phone: '', email: '', notes: '',
                        shop_name: '', shop_address: '', shop_latitude: '', shop_longitude: '', shop_google_map_link: '',
                        special_skills: '', vehicle_type: '',
                        electric: false, electric_vehicle_types: '', fuel_delivery_types: '', services_offered: '', working_hours: '',
                        profile_photo: '', shop_photo: '', KYC_document: '', adhar_card: '',
                        is_verified: false, status: 'OFFLINE', yes_for_startup: false, user_id: '',
                        current_latitude: '', current_longitude: ''
                    });
                    setStep(1);
                } else {
                    // Navigate back to detail view on update
                    navigate(`/ms/view/${id}`);
                }
            } else {
                toast.error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Error registering mechanic:', error);
            toast.error('Network error or server unreachable');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">{isEditMode ? 'Update Mechanic Profile' : 'Mechanic Registration'}</h1>
                    <p className="text-gray-500 mt-2">{isEditMode ? 'Edit partner details' : 'Register a new mechanic partner with MS'}</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8 relative">
                    <div className="flex justify-between mb-2">
                        {['Personal Info', 'Shop Details', 'Documents'].map((label, idx) => (
                            <span key={idx} className={`text-xs font-semibold uppercase tracking-wider
                                ${step > idx ? 'text-blue-600' : step === idx + 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                                {label}
                            </span>
                        ))}
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="p-6 lg:p-8">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                            <User size={18} />
                                        </div>
                                        Personal Information
                                    </h2>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <InputField
                                            label="Full Name" name="full_name" icon={User} placeholder="e.g. Raju Bhai"
                                            value={formData.full_name} onChange={handleInputChange}
                                        />
                                        <InputField
                                            label="Mobile Number" name="phone" icon={Phone} placeholder="+91 9876543210"
                                            value={formData.phone} onChange={handleInputChange}
                                        />
                                    </div>
                                    <InputField
                                        label="Email Address" name="email" type="email" icon={Mail} placeholder="raju@example.com"
                                        value={formData.email} onChange={handleInputChange}
                                    />

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            placeholder="Internal notes about the mechanic..."
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Store size={18} />
                                        </div>
                                        Shop Details
                                    </h2>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <InputField
                                            label="Shop Name" name="shop_name" icon={Store} placeholder="e.g. Raju Auto Garage"
                                            value={formData.shop_name} onChange={handleInputChange}
                                        />
                                        <InputField
                                            label="Shop Address" name="shop_address" icon={MapPin} placeholder="Full address"
                                            value={formData.shop_address} onChange={handleInputChange}
                                        />
                                    </div>

                                    {/* New Vehicle Multi Selector */}
                                    <VehicleMultiSelect
                                        label="Vehicles Repaired (Normal)"
                                        value={formData.vehicle_type}
                                        onChange={(val) => setFormData(prev => ({ ...prev, vehicle_type: val }))}
                                    />

                                    <SkillsInput
                                        value={formData.special_skills}
                                        onChange={(val) => setFormData(prev => ({ ...prev, special_skills: val }))}
                                    />

                                    {/* Electric Support Section */}
                                    <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                                        <Toggle
                                            label="Electric Vehicle Support?"
                                            name="electric"
                                            description="Do you repair Electric Vehicles (EVs)?"
                                            checked={formData.electric}
                                            onChange={handleInputChange}
                                        />

                                        {formData.electric && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3"
                                            >
                                                <VehicleMultiSelect
                                                    label="EV Types Supported"
                                                    value={formData.electric_vehicle_types}
                                                    onChange={(val) => setFormData(prev => ({ ...prev, electric_vehicle_types: val }))}
                                                />
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Fuel Delivery Section */}
                                    <FuelSelector
                                        value={formData.fuel_delivery_types}
                                        onChange={(val) => setFormData(prev => ({ ...prev, fuel_delivery_types: val }))}
                                    />

                                    <LocationPicker
                                        label="Shop Location"
                                        lat={formData.shop_latitude}
                                        lng={formData.shop_longitude}
                                        onChange={(lat, lng) => setFormData(prev => ({ ...prev, shop_latitude: lat, shop_longitude: lng }))}
                                    />

                                    <InputField
                                        label="Google Map Link" name="shop_google_map_link" icon={MapPin} placeholder="https://maps.google.com/..."
                                        value={formData.shop_google_map_link} onChange={handleInputChange}
                                    />

                                    <InputField
                                        label="Working Hours" name="working_hours" icon={Clock} placeholder="e.g. Mon-Sat, 9AM - 8PM"
                                        value={formData.working_hours} onChange={handleInputChange}
                                    />

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Services Offered</label>
                                        <textarea
                                            name="services_offered"
                                            value={formData.services_offered}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            placeholder="Describe the services you offer..."
                                        />
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                        <p className="text-xs text-blue-700 font-medium mb-2">Live Tracking Coordinates (Optional)</p>
                                        <LocationPicker
                                            label="Current Live Location"
                                            lat={formData.current_latitude}
                                            lng={formData.current_longitude}
                                            onChange={(lat, lng) => setFormData(prev => ({ ...prev, current_latitude: lat, current_longitude: lng }))}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                            <FileText size={18} />
                                        </div>
                                        Documents & Verification
                                    </h2>

                                    <div className="space-y-4 mb-6">
                                        <ImageUploadField
                                            label="Profile Photo" name="profile_photo" icon={Camera}
                                            value={formData.profile_photo}
                                            onChange={(url) => setFormData(prev => ({ ...prev, profile_photo: url }))}
                                        />
                                        <ImageUploadField
                                            label="Shop Photo" name="shop_photo" icon={Camera}
                                            value={formData.shop_photo}
                                            onChange={(url) => setFormData(prev => ({ ...prev, shop_photo: url }))}
                                        />
                                        <ImageUploadField
                                            label="KYC Document (Image/PDF)" name="KYC_document" icon={FileText}
                                            value={formData.KYC_document}
                                            onChange={(url) => setFormData(prev => ({ ...prev, KYC_document: url }))}
                                        />

                                        <InputField
                                            label="Aadhaar Card Number" name="adhar_card" icon={CreditCard} placeholder="XXXX XXXX XXXX"
                                            value={formData.adhar_card} onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Toggle
                                            label="Verified Mechanic" name="is_verified" description="Mark this mechanic as trusted and verified"
                                            checked={formData.is_verified} onChange={handleInputChange}
                                        />
                                        <Toggle
                                            label="Interested in Startup Program" name="yes_for_startup" description="Is the mechanic interesting in joining the premium program?"
                                            checked={formData.yes_for_startup} onChange={handleInputChange}
                                        />

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div>
                                                <h4 className="font-medium text-gray-900">Online Status</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">Initial availability status</p>
                                            </div>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                            >
                                                <option value="ONLINE">Online</option>
                                                <option value="OFFLINE">Offline</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                            {step > 1 ? (
                                <button
                                    onClick={handlePrev}
                                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <ChevronLeft size={18} /> Back
                                </button>
                            ) : (
                                <div></div> // Spacer
                            )}

                            <button
                                onClick={step === totalSteps ? handleSubmit : handleNext}
                                disabled={loading}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200
                                    ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02] active:scale-[0.98]'}`}
                            >
                                {loading ? (
                                    <>Processing...</>
                                ) : step === totalSteps ? (
                                    <>{isEditMode ? 'Update Profile' : 'Complete Registration'} <Check size={18} /></>
                                ) : (
                                    <>Next Step <ChevronRight size={18} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MechanicRegistration;
