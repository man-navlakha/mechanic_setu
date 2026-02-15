import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const VehicleRC = () => {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        // Fetching from the endpoint that returns the JSON structure you provided
        const response = await api.get('/vehicle-rc');
        
        if (response.data && response.data.success) {
           // The actual vehicle data is nested inside response.data.data
           setVehicle(response.data.data);
        } else {
           setError('Failed to load vehicle data.');
        }
      } catch (err) {
        console.error("Error fetching vehicle RC:", err);
        setError('An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="animate-pulse text-lg">Loading Vehicle Details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-400">
        {error}
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        No vehicle data found.
      </div>
    );
  }

  // Access deeply nested properties safely
  const rawResult = vehicle.raw_response?.raw_response?.result || {};
  const insurance = rawResult.vehicle_insurance_details || {};
  const pucc = rawResult.vehicle_pucc_details || {};

  // Fallback values from rawResult if top-level is null
  const chassisNumber = vehicle.chassis_number || rawResult.chassis_no;
  const engineNumber = vehicle.engine_number || rawResult.engine_no;
  const color = vehicle.color || rawResult.color;

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8 text-gray-100">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
        
        {/* Header */}
        <div className="bg-gray-700 p-6 border-b border-gray-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Vehicle RC Details</h1>
            <p className="text-blue-400 font-mono mt-1 text-xl tracking-wide">{vehicle.license_plate}</p>
          </div>
          <div className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-semibold">
            {rawResult.status || 'Status Unknown'}
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <InfoCard label="Owner Name" value={vehicle.owner_name || rawResult.owner_name} />
          <InfoCard label="Model" value={vehicle.brand_model || rawResult.model} />
          <InfoCard label="Fuel Type" value={vehicle.fuel_type || rawResult.fuel_descr} />
          <InfoCard label="Vehicle Class" value={vehicle.class || rawResult.vehicle_class_desc} />
          <InfoCard label="Color" value={color} />

          <InfoCard label="Registration Date" value={vehicle.registration_date || rawResult.reg_date} />
          <InfoCard label="Fitness Valid Upto" value={rawResult.fit_upto} />
          <InfoCard label="Tax Valid Upto" value={vehicle.tax_upto || rawResult.tax_upto} />

          <InfoCard label="Engine Number" value={engineNumber} />
          <InfoCard label="Chassis Number" value={chassisNumber} />

          <InfoCard label="Insurance Company" value={insurance.insurance_company_name} />
          <InfoCard label="Insurance Policy No" value={insurance.policy_no} />
          <InfoCard label="Insurance Valid Upto" value={insurance.insurance_upto} />
          
          <InfoCard label="PUCC Valid Upto" value={pucc.pucc_upto} />
          <InfoCard label="PUCC Number" value={pucc.pucc_no} />
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ label, value }) => (
  <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-colors">
    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
    <p className="text-white font-medium break-words">{value || 'N/A'}</p>
  </div>
);

export default VehicleRC;