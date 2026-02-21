// PunctureRequestFormRedesigned.jsx
import React, { useState, useEffect } from 'react'; // ✨ ADDED useEffect
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    ChevronLeft,
    Car,
    Bike,
    Truck,
    MapPin,
    Wrench,
    Check,
    Navigation,
    Loader,
    CircleHelp
} from 'lucide-react';
import api from '../utils/api';
import apiVercel from '../utils/apiVercel';
import { toast } from 'react-hot-toast';
import { Search, Info, AlertCircle } from 'lucide-react';
import PlacePickerGujarat from '../components/PlacePickerGujarat'; // Import the updated component
import Navbar from '../components/Navbar';

// --- CONSTANTS ---
// Moved outside the component so they are not re-declared on render
const vehicleTypes = [
    { id: 'bike', name: 'Bike/Scooter', icon: Bike },
    { id: 'car', name: 'Car / Sedan', icon: Car },
    { id: 'truck', name: 'Truck / SUV', icon: Truck }
];

const problems = {
    bike: [
        { name: 'Puncture Repair', icon: '🔧' },
        { name: 'Air Fill-up', icon: '💨' },
        { name: 'Chain Repair', icon: '🔗' },
        { name: 'Spark Plug Issue', icon: '⚡' },
    ],
    car: [
        { name: 'Puncture Repair', icon: '🔧' },
        { name: 'Air Fill-up', icon: '💨' },
        { name: 'Battery Jumpstart', icon: '🔋' },
        { name: 'Tire Replacement', icon: '⚙️' },
    ],
    truck: [
        { name: 'Puncture Repair', icon: '🔧' },
        { name: 'Air Fill-up', icon: '💨' },
        { name: 'Battery Jumpstart', icon: '🔋' },
        { name: 'Tire Replacement', icon: '⚙️' },
    ],
};

const inferVehicleTypeFromClass = (vehicleClassRaw) => {
    const vehicleClass = (vehicleClassRaw || '').toLowerCase();
    if (vehicleClass.includes('cycle') || vehicleClass.includes('scooter') || vehicleClass.includes('two wheeler')) {
        return 'bike';
    }
    if (vehicleClass.includes('truck') || vehicleClass.includes('heavy') || vehicleClass.includes('suv')) {
        return 'truck';
    }
    return 'car';
};

// ✨ ADDED: Key for localStorage
const FORM_STORAGE_KEY = 'punctureRequestFormData';


// --- MAIN COMPONENT ---
export default function PunctureRequestFormRedesigned() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState(1);
    const vehicleIdFromQuery = searchParams.get('vehicleId');
    const serviceFromQuery = searchParams.get('service');
    const isScheduleService = serviceFromQuery === 'schedule-service';

    // ✨ MODIFIED: Initialize state from localStorage
    const [formData, setFormData] = useState(() => {
        const defaultState = {
            vehicleType: '',
            location: '',
            latitude: null,
            longitude: null,
            problem: '',
            additionalNotes: '',
            vehicleNumber: '',
            scheduledDate: '',
            scheduledTime: '',
            fillMode: null, // 'rc' or 'manual'
            rcData: null
        };

        const savedData = localStorage.getItem(FORM_STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                return {
                    ...defaultState,
                    ...(parsed && typeof parsed === 'object' ? parsed : {}),
                };
            } catch (e) {
                console.error("Failed to parse saved form data", e);
                // If parsing fails, remove the bad data
                localStorage.removeItem(FORM_STORAGE_KEY);
            }
        }
        return defaultState;
    });

    // ✨ ADDED: useEffect to save data to localStorage on change
    useEffect(() => {
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    }, [formData]); // This runs every time the formData state changes

    useEffect(() => {
        const vehicleIdFromQuery = searchParams.get('vehicleId');
        const serviceFromQuery = searchParams.get('service');

        const serviceLabelMap = {
            'emergency-breakdown': 'Emergency Breakdown',
            'schedule-service': 'Schedule service',
            'fuel-delivery': 'Fuel delivery',
            'tow-service': 'Tow service',
        };

        const serviceLabel = serviceFromQuery
            ? (serviceLabelMap[serviceFromQuery] ||
                serviceFromQuery
                    .split('-')
                    .filter(Boolean)
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' '))
            : null;

        const fetchVehicleById = async (vehicleId) => {
            try {
                const response = await api.get('/vehicle/my-vehicle', { params: { id: vehicleId } });
                const payload = response.data;
                const vehicle =
                    payload?.data && !Array.isArray(payload.data) ? payload.data :
                        Array.isArray(payload?.data) ? payload.data[0] :
                            payload;

                if (!vehicle || typeof vehicle !== 'object') return null;
                if (payload?.success === false) return null;
                return vehicle;
            } catch (error) {
                return null;
            }
        };

        const fetchVehicleFromList = async (vehicleId) => {
            try {
                const listResponse = await api.get('/vehicle/my-vehicles');
                const payload = listResponse.data;
                const vehicleList = Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload)
                        ? payload
                        : [];

                return vehicleList.find((v) => String(v?.id) === String(vehicleId)) || null;
            } catch (error) {
                return null;
            }
        };

        const prefillFromQuery = async () => {
            if (!vehicleIdFromQuery && !serviceLabel) return;

            if (serviceLabel) {
                setFormData((prev) => ({
                    ...prev,
                    problem: serviceLabel,
                }));
            }

            if (!vehicleIdFromQuery) return;

            const vehicle =
                (await fetchVehicleById(vehicleIdFromQuery)) ||
                (await fetchVehicleFromList(vehicleIdFromQuery));

            if (!vehicle) return;

            setFormData((prev) => ({
                ...prev,
                fillMode: 'rc',
                vehicleNumber: vehicle.license_plate || vehicle.vehicle_id || prev.vehicleNumber,
                rcData: vehicle,
                vehicleType: inferVehicleTypeFromClass(vehicle.class),
            }));
        };

        prefillFromQuery();
        // Intentionally not depending on formData to avoid overwriting user edits
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Handler for location updates from PlacePickerGujarat
    const handleLocationChange = ({ address, latitude, longitude }) => {
        setFormData(prev => ({
            ...prev,
            location: address,
            latitude: latitude,
            longitude: longitude
        }));
    };

    const handleNext = () => step < 3 && setStep(step + 1);
    const handlePrev = () => {
        if (step === 1 && formData.fillMode) {
            setFormData(prev => ({ ...prev, fillMode: null, rcData: null, vehicleType: '', vehicleNumber: '' }));
        } else if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        if (!formData.latitude || !formData.longitude) {
            toast.error("Please select a valid location.");
            return;
        }

        if (isScheduleService && (!formData.scheduledDate || !formData.scheduledTime)) {
            toast.error("Please select date and time for scheduled service.");
            return;
        }

        const vehicleNumberClean = (formData.vehicleNumber || '')
            .toUpperCase()
            .replace(/\s/g, '');

        try {
            const payload = {
                latitude: formData.latitude,
                longitude: formData.longitude,
                location: formData.location,
                vehical_type: formData.vehicleType,
                problem: formData.problem,
                additional_details: formData.additionalNotes,
                vehicle_number: vehicleNumberClean,
                ...(serviceFromQuery ? { service: serviceFromQuery } : {}),
                ...(vehicleIdFromQuery ? { vehicleId: Number(vehicleIdFromQuery) } : {}),
            };

            if (isScheduleService) {
                payload.date = formData.scheduledDate;
                payload.time = formData.scheduledTime;
                payload.day = new Date(`${formData.scheduledDate}T00:00:00`).toLocaleDateString('en-US', {
                    weekday: 'long',
                });
            }

            const response = await api.post("/jobs/CreateServiceRequest/", payload);

            // API sometimes nests the created id under data; check all known shapes
            const responseData = response?.data || {};
            const nestedData = responseData.data || {};
            const requestId =
                responseData.request_id ??
                responseData.job_id ??
                responseData.id ??
                nestedData.request_id ??
                nestedData.job_id ??
                nestedData.id;

            if (response.status === 201 || response.status === 200) {
                toast('Sended Request!', {
                    icon: '👍',
                });
                localStorage.removeItem(FORM_STORAGE_KEY);
                if (requestId) {
                    navigate(`/finding/${requestId}`);
                } else {
                    toast.error("Request created, but missing request id from server.");
                }
            } else {
                toast.error("Failed to submit request. Please try again.");
            }
        } catch (error) {
            console.error("CreateServiceRequest failed:", error?.response?.data || error);
            toast.error(error?.response?.data?.message || "An error occurred. Please try again.");
        }
    };

    const canProceed = () => {
        if (step === 1) {
            if (formData.fillMode === 'manual') return !!formData.vehicleType;
            if (formData.fillMode === 'rc') return !!formData.rcData;
            return false;
        }
        if (step === 2) return formData.location.trim() !== '' && formData.location !== "Fetching address...";
        if (step === 3) {
            if (!formData.problem) return false;
            if (isScheduleService) return !!formData.scheduledDate && !!formData.scheduledTime;
            return true;
        }
        return false;
    };

    // The Step components are NO LONGER defined inside here

    return (
        <div className="min-h-screen bg-gray-300 text-gray-800 flex flex-col items-center justify-center p-4 font-sans">
            <Navbar />
            <div className="w-full max-w-2xl my-18">
                <header className="text-center mb-2">
                    <h1 className="text-3xl font-bold tracking-tight">Roadside Assistance</h1>
                    <p className="text-gray-600 mt-2">Get back on the road in minutes.</p>
                </header>

                <ProgressStepper currentStep={step} />

                <main className="mt-4 bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6 md:p-8 min-h-[450px]">
                    <AnimatePresence mode="wait">
                        {/* **FIX:** Pass state and handlers as props to the step components */}
                        {step === 1 && (
                            <Step1_Vehicle
                                formData={formData}
                                setFormData={setFormData}
                            />
                        )}
                        {step === 2 && (
                            <Step2_Location
                                formData={formData}
                                handleLocationChange={handleLocationChange}
                            />
                        )}
                        {step === 3 && (
                            <Step3_Service
                                formData={formData}
                                setFormData={setFormData}
                                isScheduleService={isScheduleService}
                            />
                        )}
                    </AnimatePresence>
                </main>

                <footer className="flex justify-between items-center mt-8">
                    <button
                        onClick={handlePrev}
                        disabled={step === 1 && !formData.fillMode}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-300 shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={18} />
                        Back
                    </button>
                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-blue-500 shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition-all disabled:opacity-50"
                        >
                            Next
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-green-500 shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition-all disabled:opacity-50"
                        >
                            <Check size={18} />
                            Submit Request
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}


// --- STEP COMPONENTS ---
// **FIX:** Moved outside the main component and now accept props

const Step1_Vehicle = ({ formData, setFormData }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRCSearch = async (e) => {
        e.preventDefault();
        const cleanedVehicleNumber = formData.vehicleNumber.toUpperCase().replace(/\s/g, '');

        if (!cleanedVehicleNumber) {
            setError('Please enter a vehicle number');
            return;
        }

        const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
        if (!vehicleRegex.test(cleanedVehicleNumber)) {
            setError('Invalid format. Use XX00XX0000');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await apiVercel.post('/vehicle/rc-info', {
                vehicle_number: cleanedVehicleNumber
            });

            if (response.data.success) {
                const rcData = response.data.data || response.data;

                // Try to auto-detect vehicle type
                const vehicleType = inferVehicleTypeFromClass(rcData.class);

                setFormData(prev => ({
                    ...prev,
                    rcData: rcData,
                    vehicleType: vehicleType
                }));
            } else {
                setError(response.data.message || 'Failed to fetch vehicle information');
            }
        } catch (err) {
            setError('Something went wrong. Please check number or try manual.');
        } finally {
            setLoading(false);
        }
    };

    if (!formData.fillMode) {
        return (
            <StepWrapper title="How would you like to add your vehicle?">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <button
                        onClick={() => setFormData(prev => ({ ...prev, fillMode: 'rc' }))}
                        className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition-all group"
                    >
                        <div className="p-4 bg-blue-100 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <Search className="text-blue-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Search by RC</h3>
                        <p className="text-sm text-gray-500 mt-2 text-center">Fastest way! Get vehicle details automatically.</p>
                    </button>
                    <button
                        onClick={() => setFormData(prev => ({ ...prev, fillMode: 'manual' }))}
                        className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition-all group"
                    >
                        <div className="p-4 bg-orange-100 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <Car className="text-orange-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Fill Manually</h3>
                        <p className="text-sm text-gray-500 mt-2 text-center">Select your vehicle type and details manually.</p>
                    </button>
                </div>
            </StepWrapper>
        );
    }

    if (formData.fillMode === 'rc') {
        return (
            <StepWrapper title="Enter Vehicle RC Number">
                <div className="space-y-6">
                    <form onSubmit={handleRCSearch} className="relative">
                        <input
                            type="text"
                            placeholder="e.g. GJ27AA3978"
                            className="w-full pl-4 pr-32 py-4 bg-gray-200 text-gray-800 border-2 border-transparent rounded-2xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] focus:border-blue-500 outline-none text-lg font-bold tracking-widest uppercase transition-all"
                            value={formData.vehicleNumber}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, vehicleNumber: e.target.value }));
                                setError(null);
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className={`absolute right-2 top-2 bottom-2 px-6 rounded-xl font-bold text-white shadow-lg transition-all ${loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                                }`}
                        >
                            {loading ? '...' : 'Search'}
                        </button>
                    </form>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                            <AlertCircle size={18} />
                            <p>{error}</p>
                        </div>
                    )}

                    {formData.rcData && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-gray-100 border border-gray-200 rounded-2xl shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Car className="text-blue-600" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800">{formData.rcData.brand_model || 'Vehicle Detected'}</h4>
                                    <p className="text-sm text-gray-500">{formData.rcData.license_plate}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold rounded uppercase">
                                            {formData.rcData.fuel_type}
                                        </span>
                                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold rounded uppercase">
                                            {formData.rcData.class}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setFormData(prev => ({ ...prev, fillMode: 'manual', rcData: null }))}
                            className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1"
                        >
                            <Info size={14} /> Or fill details manually
                        </button>
                    </div>
                </div>
            </StepWrapper>
        );
    }

    return (
        <StepWrapper title="Select Your Vehicle Type">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vehicleTypes.map(vehicle => (
                    <SelectableCard
                        key={vehicle.id}
                        label={vehicle.name}
                        icon={vehicle.icon}
                        isSelected={formData.vehicleType === vehicle.id}
                        onClick={() => setFormData(prev => ({ ...prev, vehicleType: vehicle.id, problem: '' }))}
                    />
                ))}
            </div>
            <div className="flex justify-center mt-6">
                <button
                    onClick={() => setFormData(prev => ({ ...prev, fillMode: 'rc', vehicleType: '' }))}
                    className="text-blue-600 text-sm font-semibold hover:underline"
                >
                    Switch to RC Search
                </button>
            </div>
        </StepWrapper>
    );
};

const Step2_Location = ({ formData, handleLocationChange }) => (
    <StepWrapper title="Confirm Your Location in Gujarat">
        <div className="space-y-4">


            <PlacePickerGujarat
                value={{
                    address: formData.location,
                    latitude: formData.latitude,
                    longitude: formData.longitude
                }}
                onChange={handleLocationChange}
            />

            {formData.latitude && formData.longitude && (
                <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
                    <p><strong>Selected Location:</strong> {formData.location}</p>
                    <p><strong>Coordinates:</strong> {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</p>
                </div>
            )}
        </div>
    </StepWrapper>
);

const Step3_Service = ({ formData, setFormData, isScheduleService }) => (
    <StepWrapper title="What Service Do You Need?">
        <div className="grid grid-cols-2 gap-4">
            {(() => {
                const list = problems[formData.vehicleType] || [];
                const selected = formData.problem;
                const selectedInList = !!selected && list.some((p) => p.name === selected);
                const finalList = !selectedInList && selected
                    ? [{ name: selected, icon: '✅' }, ...list]
                    : list;

                return finalList.map(problem => (
                <SelectableCard
                    key={problem.name}
                    label={problem.name}
                    emoji={problem.icon}
                    isSelected={formData.problem === problem.name}
                    onClick={() => setFormData(prev => ({ ...prev, problem: problem.name }))}
                />
                ));
            })()}
        </div>
        <textarea
            placeholder="Add any additional notes..."
            value={formData.additionalNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
            rows="3"
            className="w-full mt-6 p-3 bg-gray-200 text-gray-700 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] outline-none focus:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition resize-none"
        />

        {isScheduleService && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                    <input
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                        className="w-full p-3 bg-gray-200 text-gray-700 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] outline-none focus:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                    <input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                        className="w-full p-3 bg-gray-200 text-gray-700 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] outline-none focus:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
                    />
                </div>
            </div>
        )}
    </StepWrapper>
);


// --- HELPER COMPONENTS ---
// (These were already correct)

const StepWrapper = ({ title, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
    >
        <h2 className="text-2xl font-semibold mb-6 text-center">{title}</h2>
        {children}
    </motion.div>
);

const SelectableCard = ({ label, icon: Icon, emoji, isSelected, onClick }) => (
    <button
        onClick={onClick}
        className={`relative group p-4 w-full h-32 flex flex-col items-center justify-center text-center rounded-xl transition-all duration-200
            ${isSelected
                ? 'bg-blue-100 shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF]'
                : 'bg-gray-200 shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF]'
            }`}
    >
        {Icon && <Icon className={`w-10 h-10 mb-2 transition-colors ${isSelected ? 'text-blue-500' : 'text-gray-500 group-hover:text-blue-500'}`} />}
        {emoji && <span className="text-4xl mb-2">{emoji}</span>}
        <span className="font-semibold text-sm text-gray-700">{label}</span>
        {isSelected && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                <Check size={14} className="text-white" />
            </div>
        )}
    </button>
);

const ProgressStepper = ({ currentStep }) => {
    const steps = [
        { number: 1, title: 'Vehicle', icon: Car },
        { number: 2, title: 'Location', icon: MapPin },
        { number: 3, title: 'Service', icon: Wrench },
    ];

    return (
        <div className="flex items-center justify-center">
            {steps.map((step, index) => {
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                return (
                    <React.Fragment key={step.number}>
                        <div className="flex flex-col items-center text-center">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                                    ${isCompleted ? 'bg-blue-500 text-white shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF]' : ''}
                                    ${isActive ? 'bg-blue-100 text-blue-500 shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF]' : ''}
                                    ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500 shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF]' : ''}
                                `}
                            >
                                {isCompleted ? <Check size={24} /> : <step.icon size={24} />}
                            </div>
                            <p className={`mt-2 text-xs font-semibold transition-colors ${isActive || isCompleted ? 'text-gray-800' : 'text-gray-500'}`}>
                                {step.title}
                            </p>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`flex-1 h-1 mx-4 rounded-full transition-colors duration-500 ${isCompleted ? 'bg-blue-400' : 'bg-gray-400'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const MapOverlay = ({ text, icon: Icon, spin = false }) => (
    <div className="absolute inset-0 bg-gray-200/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-gray-600">
        <Icon className={`mb-2 ${spin ? 'animate-spin' : ''}`} size={32} />
        <p>{text}</p>
    </div>
);
